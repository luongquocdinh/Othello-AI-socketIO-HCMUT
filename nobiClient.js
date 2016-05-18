const io = require('socket.io-client');
const Board = require('./board.js');

var host = 'http://localhost:8100/play';

if (process.argv.length < 3) {
    console.log("Usage: node nobiClient.js <your_token_id>");
    process.exit(1);
}

var token = process.argv[2];
console.log("Your token:", token);

/*
 * Generate posible move
 */
var gen_moves = function(board, player) {
    var moves = [];
    for (var i = 0; i < board.N; i++) {
        for (var j = 0; j < board.N; j++) {
            if (board.board[i][j] != -1)
                continue;

            if (board.check_status(board.check_go(player, i, j)))
                moves.push([i, j])
        }
    }

    return moves;
};

/*
 * Generate board
 */
var board = new Board(8);

/*
 * Connect to Server using socket.io
 */
var socket = io.connect(host, {query: 'token=' + token});

socket.on('updated', function(data) {
    board.update_board(data.board);
});

socket.on('yourturn', function(data) {
    board.update_board(data.board);
    var moves = gen_moves(board, data.player);
    var rand = Math.floor(Math.random() * moves.length);
    var chosen_move = moves[rand];

    socket.emit('mymove', {
        rowIdx: chosen_move[0],
        colIdx: chosen_move[1]
    });
});

socket.on('end', function(data) {
    console.log(data);

    socket.disconnect(true);

    console.log('End game!');
    process.exit(0);
});

socket.on('errormessage', function(data) {
    console.log('Error:', data);
});
