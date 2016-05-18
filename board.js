var Board = function(N) {
    this.board = [];
    this.N = N;

    // Init board values
    for (var i = 0; i < N; i++) {
        this.board[i] = new Array(N).fill(-1);
    }

    var n1 = (N % 2 == 0) ? N/2 - 1 : (N - 1) / 2;
    this.board[n1][n1] = 1;
    this.board[n1+1][n1+1] = 1;
    this.board[n1][n1+1] = 2;
    this.board[n1+1][n1] = 2;
};

/*
 * Update board state base on outside board
 */
Board.prototype.update_board = function(board) {
    if (! Array.isArray(board) || board.length != this.N)
        return false;

    for (var i = 0; i < this.N; i++) {
        if (! Array.isArray(board[i]) || board[i].length != this.N)
            return false;
    }

    this.board = board;
    return true;
};

Board.prototype.check_go = function(player, row, col) {
    // Reverse Coordinate system
    var x = row, y = col;

    if (player != 1 && player != 2)
        return false;

    if (x < 0 || x >= this.N || y < 0 || y >= this.N)
        return false;

    if (this.board[x][y] != -1)
        return false;

    var state = {}

    // Check can go left
    if (y > 1 && this.oppose(player, x, y - 1)) {
        var i, j;
        var surround = false;
        for (j = y - 1; j >= 0; j--) {
            if (this.board[x][j] == -1) {
                break;
            }
            if (this.board[x][j] == player) {
                surround = true;
                break;
            }
        }

        if (surround) {
            // Can go
            state.left = true;
        }
    }

    // Check can go right
    if (y < this.N - 1 && this.oppose(player, x, y + 1)) {
        var surround = false;
        for (var j = y + 1; j < this.N; j++) {
            if (this.board[x][j] == -1)
                break;
            if (this.board[x][j] == player) {
                surround = true;
                break;
            }
        }
        if (surround) {
            // Can go
            state.right = true;
        }
    }

    // Check can go up
    if (x > 1 && this.oppose(player, x - 1, y)) {
        var surround = false;
        for (var i = x - 1; i >= 0; i--) {
            if (this.board[i][y] == -1)
                break;
            if (this.board[i][y] == player) {
                surround = true;
                break;
            }
        }
        if (surround) {
            // Can go
            state.up = true;
        }
    }

    // Check can go down
    if (x < this.N - 1 && this.oppose(player, x + 1, y)) {
        var surround = false;
        for (var i = x + 1; i < this.N; i++) {
            if (this.board[i][y] == -1) {
                break;
            }
            if (this.board[i][y] == player) {
                surround = true;
                break;
            }
        }
        if (surround) {
            // Can go
            state.down = true;
        }
    }

    // Check can go upper right
    if (x > 0 && y < this.N - 1 && this.oppose(player, x - 1, y + 1)) {
        var surround = false;
        for (var i = x - 1, j = y + 1; i >= 0 && j < this.N; i--, j++) {
            if (this.board[i][j] == -1)
                break;
            if (this.board[i][j] == player) {
                surround = true;
                break;
            }
        }
        if (surround) {
            // Can go
            state.upright = true;
        }
    }

    // Can go upper left
    if (x > 0 && y > 0 && this.oppose(player, x - 1, y - 1)) {
        var surround = false;
        for (var i = x - 1, j = y - 1; i >= 0 && j >= 0; i--, j--) {
            if (this.board[i][j] == -1)
                break;
            if (this.board[i][j] == player) {
                surround = true;
                break;
            }
        }
        if (surround) {
            // Can go
            state.upleft = true;
        }
    }

    // Check can go downer right
    if (x < this.N - 1 && y < this.N - 1 && this.oppose(player, x + 1, y + 1)) {
        var surround = false;
        for (var i = x + 1, j = y + 1; i < this.N && j < this.N; i++,j++) {
            if (this.board[i][j] == -1)
                break;
            if (this.board[i][j] == player) {
                surround = true;
                break;
            }
        }
        if (surround) {
            // Can go
            state.downright = true;
        }
    }

    // Check can go downer left
    if (x < this.N - 1 && y > 0 && this.oppose(player, x + 1, y - 1)) {
        var surround = false;
        for (var i = x + 1, j = y - 1; i < this.N && j >= 0; i++,j-- ) {
            if (this.board[i][j] == -1)
                break;
            if (this.board[i][j] == player) {
                surround = true;
                break;
            }
        }
        if (surround) {
            // Can go
            state.downleft = true;
        }
    }

    return state;
};

/*
 * Check if player can go ?
 */
Board.prototype.have_move = function(player) {
    for (var i = 0; i < this.N; i++) {
        for (var j = 0; j < this.N; j++) {
            // Just check empty hole
            if (this.board[i][j] != -1)
                continue;

            if (this.check_status(this.check_go(player, i, j)))
                return true;
        }
    }

    return false;
};

/*
 * Check wether game is over?
 * Return True if game is over
 */
Board.prototype.is_end = function() {
    return !this.have_move(1) && !this.have_move(2);
};

Board.prototype.count = function() {
    var one = 0, two = 0;
    for (var i = 0; i < this.N; i++) {
        for (var j = 0; j < this.N; j++) {
            if (this.board[i][j] == 1)
                one++;
            else if (this.board[i][j] == 2)
                two++;
        }
    }
    return {p1: one, p2: two, total: one + two};
};

/*
 * Update board base on a new move
 * Return true if move is valid
 */
Board.prototype.go = function(player, row, col) {
    // Reverse Coordinate system
    var x = row, y = col;

    var status = this.check_go(player, x, y);

    if (!status) {
        return false;
    }

    var can_go = false;

    // Check can go left
    if (status.left) {
        can_go = true;
        var j = y - 1;
        while ((this.board[x][j] != player) && j >= 0) {
            this.board[x][j] = player;
            j--;
        }
    }

    // Check can go right
    if (status.right) {
        can_go = true;
        var j = y + 1;
        while (this.board[x][j] != player && j < this.N) {
            this.board[x][j] = player;
            j++;
        }
    }

    // Check can go up
    if (status.up) {
        can_go = true;
        var i = x - 1;
        while (this.board[i][y] != player && i >= 0) {
            this.board[i][y] = player;
            i--;
        }
    }

    // Check can go down
    if (status.down) {
        can_go = true;
        var i = x + 1;
        while (this.board[i][y] != player && i < this.N) {
            this.board[i][y] = player;
            i++;
        }
    }

    // Check can go up right
    if (status.upright) {
        can_go = true;
        var i = x - 1, j = y + 1;
        while (this.board[i][j] != player && i >= 0 && j < this.N) {
            this.board[i][j] = player;
            i--;
            j++;
        }
    }

    // Check can go up left
    if (status.upleft) {
        can_go = true;
        var i = x - 1, j = y - 1;
        while (this.board[i][j] != player && i >= 0 && j >= 0) {
            this.board[i][j] = player;
            i--;
            j--;
        }
    }

    // Check can go down right
    if (status.downright) {
        can_go = true;
        var i = x + 1, j= y + 1;
        while (this.board[i][j] != player && i < this.N && j < this.N) {
            this.board[i][j] = player;
            i++;
            j++;
        }
    }

    // Check can go down left
    if (status.downleft) {
        can_go = true;
        var i = x + 1, j = y - 1;
        while (this.board[i][j] != player && i < this.N && j >= 0) {
            this.board[i][j] = player;
            i++;
            j--;
        }
    }

    if (can_go)
        this.board[x][y] = player;

    return can_go;
};

Board.prototype.check_status = function(status) {
    for (var prop in status) {
        if (status[prop] === true) {
            return true;
        }
    }
    return false;
};

Board.prototype.oppose = function(player, row, col) {
    var foe = (player == 1) ? 2 : 1;
    return this.board[row][col] == foe;
};

Board.prototype.toString = function() {
    var str = "";
    for (var i = 0; i < this.N; i++) {
        str += "| "
       for (var j = 0; j < this.N; j++) {
            if (this.board[i][j] != -1)
                str += " " + this.board[i][j] + " ";
            else
                str += "   ";

        }
        str += " |\n";
    }
    return str;
}

module.exports = Board;
