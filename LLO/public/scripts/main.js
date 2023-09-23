
var rhit = rhit || {};

rhit.PageController = class {   

	constructor() {
        this.game = new rhit.Game();

        const buttons = document.querySelectorAll("#button");

        for (const button of buttons) {
            button.onclick = (event) => {
                const buttonIndex = parseInt(button.dataset.buttonIndex);
                this.game.pressedButtonAtIndex(buttonIndex);
                this.updateView();
            }

        }

        document.querySelector("#newGame").onclick = (event) => {
			this.game = new rhit.Game();
			this.updateView();
		};

        this.updateView();

	}

	updateView() {
        const buttons = document.querySelectorAll("[id='button']") 

        buttons.forEach((button, index) => {
            button.innerHTML = this.game.getButtonMark(index);
            if (button.innerHTML == "1") {
                button.style.backgroundColor = "yellow";
            } else {
                button.style.backgroundColor = "lightgray";
            }
        });
	}
}

rhit.Game = class {   
    
    static Mark = {
        state0: "0",
        state1: "1"
    }  

	constructor() {
        this.turns = 0;
        this.beginning = "Make the buttons match.";
        this.win =  `You won in ${this.turns} moves!`;
        this.middle = `You have taken ${this.turns} moves so far.`;
        document.querySelector("#gameStateText").innerHTML = this.beginning;
        this.state = this.beginning;
        this.board = [];
        this.winCon0 = ["0", "0", "0", "0", "0", "0", "0"];
        this.winCon1 = ["1", "1", "1", "1", "1", "1", "1"];

        for (let i = 0; i < 7; i++) {
            this.board.push(this.getRandomMark());
        }
	}

    pressedButtonAtIndex (buttonIndex) {
        this.turns++;

        if (this.state == this.win) {
            return;
        }

        if (buttonIndex == 0) {
            if (this.board[buttonIndex] == rhit.Game.Mark.state0)  {
                this.board[buttonIndex] = rhit.Game.Mark.state1;
            } else {
                this.board[buttonIndex] = rhit.Game.Mark.state0;
            }
            if (this.board[buttonIndex + 1] == rhit.Game.Mark.state0)  {
                this.board[buttonIndex + 1] = rhit.Game.Mark.state1;
            } else {
                this.board[buttonIndex + 1] = rhit.Game.Mark.state0;
            }
        } else if (buttonIndex == 6) {
            if (this.board[buttonIndex] == rhit.Game.Mark.state0)  {
                this.board[buttonIndex] = rhit.Game.Mark.state1;
            } else {
                this.board[buttonIndex] = rhit.Game.Mark.state0;
            }
            if (this.board[buttonIndex - 1] == rhit.Game.Mark.state0)  {
                this.board[buttonIndex - 1] = rhit.Game.Mark.state1;
            } else {
                this.board[buttonIndex - 1] = rhit.Game.Mark.state0;
            }
        } else  {
            if (this.board[buttonIndex] == rhit.Game.Mark.state0)  {
                this.board[buttonIndex] = rhit.Game.Mark.state1;
            } else {
                this.board[buttonIndex] = rhit.Game.Mark.state0;
            }

            if (this.board[buttonIndex - 1] == rhit.Game.Mark.state0)  {
                this.board[buttonIndex - 1] = rhit.Game.Mark.state1;
            } else {
                this.board[buttonIndex - 1] = rhit.Game.Mark.state0;
            } 
            
            if (this.board[buttonIndex + 1] == rhit.Game.Mark.state0)  {
                this.board[buttonIndex + 1] = rhit.Game.Mark.state1;
            } else {
                this.board[buttonIndex + 1] = rhit.Game.Mark.state0;
            }
        } 
        this._checkGameState();
    }

    getButtonMark(index) {
        return this.board[index];
    }

    getRandomMark() {
        if (Math.floor(Math.random() * 2) == 0) {
            return rhit.Game.Mark.state0;
        } else {
            return rhit.Game.Mark.state1;
        }
    }

    _checkGameState() {
        if (this.turns == 0) {
            this.state = this.beginning;
            document.querySelector("#gameStateText").innerHTML = "Make the buttons match.";
        } else if (this.turns > 0 && !this.compareArrays(this.board, this.winCon0) && !this.compareArrays(this.board, this.winCon1)) {
            this.state = this.middle;
            document.querySelector("#gameStateText").innerHTML =`You have taken ${this.turns} moves so far.`;
        } else if (this.compareArrays(this.board, this.winCon0) || this.compareArrays(this.board, this.winCon1)) {
            this.state = this.win;
            document.querySelector("#gameStateText").innerHTML = `You won in ${this.turns} moves!`;
        }
    }

    compareArrays(a, b) {
        if (a.length == b.length && a.every((element, index) => element === b[index])) {
            return true;
        } else {
            return false;
        }
    }

}

rhit.main = function () {
    new rhit.PageController();
};

rhit.main();




