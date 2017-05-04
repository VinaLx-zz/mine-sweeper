function ErrorPrompt(message) {
    let elem = document.createElement("p");
    elem.className = "error-prompt";
    elem.textContent = message;
    return elem;
}

function ClearError(elem) {
    if (elem.nextElementSibling) {
        elem.nextElementSibling.remove();
    }
}

function AppendError(elem, message) {
    ClearError(elem);
    elem.parentElement.appendChild(ErrorPrompt(message));
}

function ExtractIntAndShowError(input_elem) {
    let num = parseInt(input_elem.value.trim())
    if (num) {
        if (input_elem.nextElementSibling) {
            input_elem.nextElementSibling.remove();
        }
        return num;
    }

    AppendError(input_elem, "require integer!");
    return NaN;
}

function isValidInput(
    width, height, mines, width_input, height_input, mines_input) {
    if (!(width && height && mines)) {
        return false;
    }
    if (width >= 200) {
        AppendError(width_input, "number too large!");
        return false;
    }
    if (height >= 200) {
        AppendError(height_input, "number too large!");
        return false;
    }
    if (mines >= width * height) {
        AppendError(mines_input, "too much mines!");
        return false;
    }
    return true;
}

var board, mines_board;
var game_is_over;
var mines = 20,
    height = 10,
    width = 10;
var flipped, flagged, flagged_wrong;

const EMPTY = 0,
    FLIPPED = 1,
    FLAGGED = 2,
    MINE = 3,
    WRONG = 4;

function OutOfRange(x, y) {
    if (x < 0 || y < 0 || x >= height || y >= width) {
        return true;
    }
    return false;
}

function AroundPoint(x, y, f) {
    for (let dx of [-1, 0, 1]) {
        for (let dy of [-1, 0, 1]) {
            if (dx === 0 && dy === 0) {
                continue;
            }
            let [new_x, new_y] = [x + dx, y + dy];
            if (OutOfRange(new_x, new_y)) {
                continue;
            }
            f(new_x, new_y);
        }
    }
}

function ForEach(f) {
    for (let i = 0; i < height; ++i) {
        for (let j = 0; j < width; ++j) {
            f(i, j);
        }
    }
}

function ClearNode(board) {
    if (!board) {
        return;
    }
    for (; board.hasChildNodes();) {
        board.removeChild(board.lastChild);
    }
}

function CreateCellElements() {
    let board = document.getElementById("board");
    board.style.display = "block";
    let board_array = Array(height);
    ClearNode(board);
    for (let i = 0; i < height; ++i) {
        let row = document.createElement("div");
        row.className = "board-row";
        board_array[i] = Array(width);
        for (let j = 0; j < width; ++j) {
            let cell = document.createElement("button");
            cell.className = "board-cell";
            cell.id = "empty";
            board_array[i][j] = cell;
            row.appendChild(cell);
        }
        board.appendChild(row);
    }
    return board_array;
}

function shuffle(arr) {
    for (let i = arr.length; i > 0; --i) {
        let j = Math.floor(Math.random() * i);
        [arr[i - 1], arr[j]] = [arr[j], arr[i - 1]];
    }
}

function iota(s) {
    let ret = Array(s);
    for (let i = 0; i < s; ++i) {
        ret[i] = i;
    }
    return ret;
}

function InitIntMatrix(height, width) {
    let ret = Array(height);
    for (let i = 0; i < height; ++i) {
        ret[i] = Array(width);
        for (let j = 0; j < width; ++j) {
            ret[i][j] = 0;
        }
    }
    return ret;
}

function Count(row, col) {
    let count = 0;
    AroundPoint(row, col, function (x, y) {
        if (mines_board[x][y] === -1) {
            ++count;
        }
    });
    return count;
}

function FillNumbers() {
    ForEach((i, j) => {
        if (mines_board[i][j] === -1) return;
        mines_board[i][j] = Count(i, j);
    });
}

function FillMines() {
    let places = iota(width * height);
    shuffle(places);
    for (let i = 0; i < mines; ++i) {
        let idx = places[i];
        mines_board[Math.floor(idx / width)][idx % width] = -1;
    }
    FillNumbers();
}

function GetState(x, y) {
    switch (board[x][y].id) {
        case "flipped":
            return FLIPPED;
        case "flagged":
            return FLAGGED;
        case "empty":
            return EMPTY;
        case "mine":
            return MINE;
        case "flagged-wrong":
            return WRONG;
    }
}

function SetState(x, y, state) {
    let cell = board[x][y];
    if (state === FLAGGED) {
        cell.id = "flagged";
    } else if (state === FLIPPED) {
        cell.id = "flipped";
    } else if (state === EMPTY) {
        cell.id = "empty";
    } else if (state === MINE) {
        cell.id = "mine";
    } else if (state === WRONG) {
        cell.id = "flagged-wrong";
    }
}

function FlagAllMines() {
    ForEach((i, j) => {
        if (mines_board[i][j] === -1) Flag(i, j);
        if (mines_board[i][j] !== -1 && GetState(i, j) === FLAGGED) {
            SetState(i, j, EMPTY);
        }
    });
}

function ShowRestMines() {
    ForEach((i, j) => {
        if (mines_board[i][j] !== -1 && GetState(i, j) === FLAGGED) {
            SetState(i, j, WRONG);
        }
        if (mines_board[i][j] === -1 && GetState(i, j) !== FLAGGED) {
            SetState(i, j, MINE);
        }
    })
}

function Lose() {
    game_is_over = true;
    ShowRestMines();
    game_result = document.getElementById("game-result");
    game_over = document.createElement("p");
    game_over.textContent = "GameOver!";
    game_result.appendChild(game_over);
}

function Win() {
    game_is_over = true;
    FlagAllMines();
    game_result = document.getElementById("game-result");
    win = document.createElement("p");
    win.textContent = "You Win!";
    game_result.appendChild(win);
}

function CheckGameOver() {
    let total_cell = height * width;
    if (flipped + mines === total_cell ||
        flagged === mines && flagged_wrong === 0) {
        Win();
    } else if (game_is_over) {
        Lose();
    }
}

function Flip(x, y) {
    ++flipped;
    SetState(x, y, FLIPPED);
    let mine = mines_board[x][y];
    let button = board[x][y];

    if (mine > 0) {
        button.textContent = mines_board[x][y];
    }
    if (mine === 0) {
        AroundPoint(x, y, function (x, y) {
            CellOnLeftClick(x, y);
        });
    }
}


function CellOnLeftClick(x, y) {
    if (GetState(x, y) !== EMPTY) return;
    let mine = mines_board[x][y];
    if (mine === -1) {
        game_is_over = true;
    } else {
        Flip(x, y);
    }
}

function Flag(x, y) {
    SetState(x, y, FLAGGED);
}

function Deflag(x, y) {
    if (GetState(x, y) !== FLAGGED) {
        return;
    }
    SetState(x, y, EMPTY);
}

function CellOnRightClick(x, y) {
    let state = GetState(x, y);
    let mine = mines_board[x][y];
    if (state === FLIPPED) return;
    if (state === FLAGGED) {
        mine === -1 ? --flagged : --flagged_wrong;
        Deflag(x, y);
    }
    if (state === EMPTY) {
        mine === -1 ? ++flagged : ++flagged_wrong;
        Flag(x, y);
    }
}

function CellOnMiddleClick(x, y) {
    let state = GetState(x, y);
    let mine = mines_board[x][y];
    if (state !== FLIPPED || mine === 0) return;
    let flagged_around = 0
    AroundPoint(x, y, function (x, y) {
        if (GetState(x, y) === FLAGGED) ++flagged_around;
    });
    if (mine === flagged_around) {
        AroundPoint(x, y, function (x, y) {
            if (GetState(x, y) === EMPTY) CellOnLeftClick(x, y);
        });
    }
}

function CellOnClick(x, y) {
    return () => {
        if (game_is_over) return;
        CellOnLeftClick(x, y);
        UpdateGameStatus();
        CheckGameOver();
    }
}

function CellOnMouseDown(x, y) {
    return function (event) {
        if (game_is_over) {
            return;
        }
        if (event.buttons === 2) {
            CellOnRightClick(x, y);
        } else if (event.buttons === 4) {
            CellOnMiddleClick(x, y);
        }
        UpdateGameStatus();
        CheckGameOver();
    }
}


function BoardSetOnClick() {
    for (let x = 0; x < board.length; ++x) {
        for (let y = 0; y < board[0].length; ++y) {
            let elem = board[x][y];
            elem.onmousedown = CellOnMouseDown(x, y);
            elem.onclick = CellOnClick(x, y);
        }
    }
}

function GenerateBoard() {
    board = CreateCellElements();
    mines_board = InitIntMatrix(height, width);
    FillMines();
    //    for (let i = 0; i < mines_board.length; ++i) {
    //        console.log(...mines_board[i]);
    //    }
    BoardSetOnClick();
}

function ResetState() {
    flipped = 0;
    flagged = 0;
    flagged_wrong = 0;
    game_is_over = false;
}

function UpdateGameStatus() {
    let [mines_left_elem, cells_left_elem, time_elapse_elem] = [".mines-left", ".cells-left", ".time-elapse"].map(
        (s) => document.querySelector(s + " .status-data"));
    let total_flagged = flagged + flagged_wrong;
    let mines_left = mines - total_flagged;
    mines_left_elem.textContent = mines_left;
    cells_left_elem.textContent = width * height - flipped - mines;
}

function ShowGameStatus() {
    let game_status = document.getElementById("game-status");
    game_status.style.visibility = "visible";
    UpdateGameStatus();
}

function DoReset() {
    console.log(
        "reset game with width: " + width + " height: " + height +
        " and " + mines + " mines");
    ResetState();
    ClearNode(document.getElementById("game-result"));
    GenerateBoard();
    ShowGameStatus();
}

function InitEvent() {
    window.oncontextmenu = () => false;
    document.body.onmousedown = (e) => {
        if (e.button === 1) return false;
    }
}



function ResetGame() {
    let input_fields = ["board-width", "board-height", "num-of-mines"]
        .map(document.getElementById, document);
    input_fields.map(ClearError);
    input_fields[0].value = width;
    input_fields[1].value = height;
    input_fields[2].value = mines;
    DoReset();
}

function SetResetOnclick() {
    let reset_game = document.getElementById("reset-game");
    reset_game.onclick = ResetGame;
}

function ShowGameOption() {
    let options = document.getElementById("option-items");
    options.style.display = "block";
}

function SetGameOptionOnClick() {
    let game_option_button = document.getElementById("game-option");
    game_option_button.onclick = ShowGameOption;
}

function OkOnClick() {
    let input_fields = ["board-width", "board-height", "num-of-mines"]
        .map(document.getElementById, document);
    let input_value = input_fields.map(ExtractIntAndShowError);
    if (!isValidInput(...input_value, ...input_fields)) {
        return;
    }
    let [new_width, new_height, new_mines] = input_value;
    document.getElementById("option-items").style.display = "none";
    if (new_width === width && new_height === height && new_mines === mines) {
        return;
    }
    [width, height, mines] = input_value;
    DoReset();
}

function SetOkOnClick() {
    document.getElementById("ok").onclick = OkOnClick;
}

function InitButtonsOnClick() {
    SetResetOnclick();
    SetGameOptionOnClick();
    SetOkOnClick();
}

InitEvent();
InitButtonsOnClick();
DoReset();
