var rhit = rhit || {};

rhit.FB_COLLECTION_PHOTOS = "PhotoBucket";
rhit.FB_KEY_DESCRIPTION = "description";
rhit.FB_KEY_PHOTOURL = "url";
rhit.FB_KEY_LAST_TOUCHED = "lastTouched";
rhit.FB_KEY_AUTHOR = "author";
rhit.fbPhotosManager = null;
rhit.fbSinglePhotoManager = null;
rhit.fbAuthManager = null;

function htmlToElement(html) {
	var template = document.createElement("template");
	html = html.trim();
	template.innerHTML = html;
	return template.content.firstChild;
}

rhit.ListPageController = class {
	constructor() {
		document.querySelector("#menuShowAllPhotos").onclick = (event) => {
			window.location.href = "/list.html";
		};

		document.querySelector("#menuShowMyPhotos").onclick = (event) => {
			window.location.href = `/list.html?uid=${rhit.fbAuthManager.uid}`;
		};
		document.querySelector("#menuSignOut").onclick = (event) => {
			rhit.fbAuthManager.signOut();
		};


		document.querySelector("#submitAddPhoto").onclick = (event) => {
			const photoURL = document.querySelector("#inputPhoto").value;
			const description = document.querySelector("#inputDescription").value;
			rhit.fbPhotosManager.add(photoURL, description);
		};

		$("#addPhotoDialog").on("show.bs.modal", (event) => {
			// Pre Animation
			document.querySelector("#inputPhoto").value = "";
			document.querySelector("#inputDescription").value = "";
		});

		$("#addPhotoDialog").on("shown.bs.modal", (event) => {
			// Post Animation
			document.querySelector("#inputPhoto").focus();
		});

		rhit.fbPhotosManager.beginListening(this.updateList.bind(this));

	}

	updateList() {

		// Make a new photoListContainer
		const newList = htmlToElement('<div id="photoListContainer"></div>');
		// Fill the photoListContainer with the photo cards using a loop
		for (let i = 0; i < rhit.fbPhotosManager.length; i++) {
			const photo = rhit.fbPhotosManager.getPhotoAtIndex(i);
			const newCard = this._createCard(photo);

			newCard.onclick = (event) => {
				window.location.href = `/photo.html?id=${photo.id}`;
			}
			newList.appendChild(newCard);
		}

		// Remove the old photoListContainer
		const oldList = document.querySelector("#photoListContainer");
		oldList.removeAttribute("id");
		oldList.hidden = true;
		// Put in the new photoListContainer
		oldList.parentElement.appendChild(newList);
	}

	_createCard(photo) {
		console.log("card created");
		return htmlToElement(
			`<div id="photoListContainer">
			<div class="card">
			<div class="card-body">
				<img src="${photo.url}">
				<p class="card-text">${photo.description}</p>
			</div>
			</div>   
		 </div>`);
	}

}

rhit.Photo = class {
	constructor(id, url, description) {
		this.id = id;
		this.url = url;
		this.description = description;
	}

}


rhit.FbPhotosManager = class {
	constructor(uid) {
		this._uid = uid;
		this._documentSnapshots = [];
		this._ref = firebase.firestore().collection(rhit.FB_COLLECTION_PHOTOS);
		console.log("Created photos manager");
		this._unsubscribe = null;
	}
	add(photoUrl, description) {
		// Add a new document with a generated ID.
		this._ref.add({
			[rhit.FB_KEY_PHOTOURL]: photoUrl,
			[rhit.FB_KEY_DESCRIPTION]: description,
			[rhit.FB_KEY_AUTHOR]: rhit.fbAuthManager.uid,
			[rhit.FB_KEY_LAST_TOUCHED]: firebase.firestore.Timestamp.now()
		})
		.then(function(docref) {
			console.log("Document written with ID: ", docref.id);
		})
		.catch(function (error) {	
			console.log("Error adding document: ", error);
		});

	}
	beginListening(changeListener) {

		let query = this._ref.orderBy(rhit.FB_KEY_LAST_TOUCHED, "desc").limit(50);
		console.log(rhit.FB_KEY_AUTHOR);
		if (this._uid) {
			query = query.where(rhit.FB_KEY_AUTHOR, "==", this._uid);
		}

		this._unsubscribe = query.onSnapshot((querySnapshot) => {
			console.log("Updated photos");
			this._documentSnapshots = querySnapshot.docs;
			changeListener();
		});

	}

	stopListening() {
		this._unsubscribe();
	}

	get length() {
			return this._documentSnapshots.length;
	}

	getPhotoAtIndex(index) {
		const docSnapshot = this._documentSnapshots[index];
		const photo = new rhit.Photo(docSnapshot.id, docSnapshot.get(rhit.FB_KEY_PHOTOURL), docSnapshot.get(rhit.FB_KEY_DESCRIPTION));
		return photo;
	}
}

rhit.DetailPageController = class {
	constructor() {
		document.querySelector("#menuSignOut").addEventListener("click", (event) => {
			rhit.fbAuthManager.signOut();
		});

		document.querySelector("#submitEditPhoto").addEventListener("click", (event) => {
			const photoUrl = document.querySelector("#inputPhoto").value;
			const description = document.querySelector("#inputDescription").value;
			rhit.fbSinglePhotoManager.update(photoUrl, description);
		});

		$("#editPhotoDialog").on("show.bs.modal", (event) => {
			// Pre Animation
			document.querySelector("#inputPhoto").value = rhit.fbSinglePhotoManager.photo;
			document.querySelector("#inputDescription").value = rhit.fbSinglePhotoManager.description;
		});

		$("#editPhotoDialog").on("shown.bs.modal", (event) => {
			// Post Animation
			document.querySelector("#inputPhoto").focus();
		});

		document.querySelector("#submitDeletePhoto").addEventListener("click", (event) => {
			rhit.fbSinglePhotoManager.delete().then(function() {
				console.log("Document successfully deleted");
				window.location.href = "/list.html";
			}).catch(function (error) {
				console.error("Error removing the document: ", error);
			});
		});

		rhit.fbSinglePhotoManager.beginListening(this.updateView.bind(this));
	}
	updateView() {
		document.querySelector("#cardPhoto").innerHTML = `<img src="${rhit.fbSinglePhotoManager.photo}">`;
		document.querySelector("#cardDescription").innerHTML = rhit.fbSinglePhotoManager.description;
		if (rhit.fbSinglePhotoManager.author == rhit.fbAuthManager.uid) {
			document.querySelector("#menuEdit").style.display = "flex";
			document.querySelector("#menuDelete").style.display = "flex";
		}
	}
}

rhit.FbSinglePhotoManager = class {
	constructor(photoId) {
		this._documentSnapshot = {};
		this._unsubscribe = null;
		this._ref = firebase.firestore().collection(rhit.FB_COLLECTION_PHOTOS).doc(photoId);
	}

	beginListening(changeListener) {
		this._unsubscribe = this._ref.onSnapshot((doc) => {
			if (doc.exists) {
				console.log("Document data: ", doc.data());
				this._documentSnapshot = doc;
				changeListener();
			} else {
				console.log("No such document");
			}
		});
	};

	stopListening() {
		this.unsubscribe();
	};

	update(photo, description) {

		this._ref.update({
			[rhit.FB_KEY_PHOTOURL]: photo,
			[rhit.FB_KEY_DESCRIPTION]: description,
			[rhit.FB_KEY_LAST_TOUCHED]: firebase.firestore.Timestamp.now(),
		})
			.then(() => {
				console.log("Document succesfully updated");
			})
			.catch(function (error) {
				// Document probably doesn't exist
				console.log("Error updating document: ", error);
			})

	};

	delete() {
		return this._ref.delete();
	};

	get photo() {
		return this._documentSnapshot.get(rhit.FB_KEY_PHOTOURL);
	};

	get description() {
		return this._documentSnapshot.get(rhit.FB_KEY_DESCRIPTION);
	};
	get author() {
		return this._documentSnapshot.get(rhit.FB_KEY_AUTHOR);
	};
}

rhit.LoginPageController = class {
	constructor() {
		document.querySelector("#roseFireButton").onclick = (event) => {
			rhit.fbAuthManager.signIn();
		};
		rhit.startFirebaseUI();
	}
}

rhit.FbAuthManager = class {
	constructor() {
		this._user = null;
	}

	beginListening(changeListener) {
		firebase.auth().onAuthStateChanged((user) => {
			this._user = user;
			changeListener();
		});
	}
	
	signIn() {
		Rosefire.signIn("ad75508c-bf66-4f3d-b3fc-5e33cbb422e0", (err, rfUser) => {
			if (err) {
				console.log("Rosefire error!", err);
				return;
			}
			console.log("Rosefire success!", rfUser);

			firebase.auth().signInWithCustomToken(rfUser.token).catch((error) => {
				const errorCode = error.code;
				const errorMessage = error.message;
				if (errorCode === 'auth/invalid-custom-token') {
					alert('The token you provided is not valid');
				} else {
					console.error("Custom auth error", errorCode, errorMessage);
				}
			});
		});
	}

	signOut() {
		firebase.auth().signOut().catch(function (error) {
			console.log("Sign out error");
		});
	}

	get isSignedIn() {
		return !!this._user;
	}

	get uid() {
		return this._user.uid;
	}
}

rhit.checkForRedirects = function () {
	if (document.querySelector("#loginPage") && rhit.fbAuthManager.isSignedIn) {
		window.location.href = "/list.html";
	}
	if (!document.querySelector("#loginPage") && !rhit.fbAuthManager.isSignedIn) {
		window.location.href = "/";
	}
};

rhit.initializePage = function () {
	const urlParams = new URLSearchParams(window.location.search);
	if (document.querySelector("#listPage")) {
		console.log("You are on the list page");
		const uid = urlParams.get("uid");
		console.log("Got url param = ", uid);
		rhit.fbPhotosManager = new rhit.FbPhotosManager(uid);
		new rhit.ListPageController();
	}

	if (document.querySelector("#detailPage")) {
		console.log("You are on the detail page");
		const photoId = urlParams.get("id");

		if (!photoId) {
			window.location.href = "/";
		}
		rhit.fbSinglePhotoManager = new rhit.FbSinglePhotoManager(photoId);
		new rhit.DetailPageController();
	}

	if (document.querySelector("#loginPage")) {
		console.log("You are on the login page");
		new rhit.LoginPageController();
	}
};


rhit.main = function () {
	console.log("Ready!");

	rhit.fbAuthManager = new this.FbAuthManager();

	rhit.fbAuthManager.beginListening(() => {

		rhit.checkForRedirects();
		rhit.initializePage();

	});
};

rhit.startFirebaseUI = function() {
	var uiConfig = {
		signinSuccessUrl: '/',
		signInOptions: [
			firebase.auth.GoogleAuthProvider.PROVIDER_ID,
			firebase.auth.EmailAuthProvider.PROVIDER_ID,
			firebase.auth.PhoneAuthProvider.PROVIDER_ID,
			firebaseui.auth.AnonymousAuthProvider.PROVIDER_ID
		],
	};
	// Initialize the FirebaseUI Widget using Firebase.
	const ui = new firebaseui.auth.AuthUI(firebase.auth());
	// The start method will wait until the DOM is loaded.
	ui.start('#firebaseui-auth-container', uiConfig);
};

rhit.main();
