var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

var util = require('util');
var randomstring = require('randomstring');
var Timer = require('timer.js')

var Board = require('./board.js')

html_dir = '/public'

http.listen(8100);

app.use(express.static('public'));

app.get('/', function (req, res) {
    res.sendFile('public/index.html', {root: __dirname});
});

app.get('/spectator', function(req, res) {
    res.sendFile('public/spectator.html', {root: __dirname});
});

/*
 * Initialize resources
 */
var pOneToken = randomstring.generate(8);
var pTwoToken = randomstring.generate(8);

console.log('Player one token: ' + pOneToken);
console.log('Player two token: ' + pTwoToken);

var pOne = false;
var pTwo = false;

var pOneTimer = new Timer();
var pTwoTimer = new Timer();

const N = 8;
const minutes = 2;

var board = new Board(N);

/*
 * Define some utilites
 */
function startTimer(player) {
    if (player != 1 && player != 2)
        return;

    var my_timer = (player == 1) ? pOneTimer : pTwoTimer;

    if (my_timer.getStatus() == 'initialized')
        my_timer.start(minutes * 60);
    else if (my_timer.getStatus() == 'paused')
        my_timer.start();

    return my_timer;
}

function pauseTimer(player) {
    if (player != 1 && player != 2)
        return;

    var my_timer = (player == 1) ? pOneTimer : pTwoTimer;

    my_timer.pause();

    return my_timer;
}

function getRemainTime(player) {
    if (player != 1 && player != 2)
        return;
    var my_timer = (player == 1) ? pOneTimer : pTwoTimer;

    if (my_timer.getStatus() == 'initialized')
        return minutes * 60 * 1000;

    return my_timer.getDuration();
}

function sendGameInfo(socket) {
    var count = board.count();
    socket.emit('updated', {board: board.board, player: turn, player1: count.p1, player2: count.p2});
}

function endGame(winner) {
    result = board.count();
    var my_winner;

    if (typeof winner === 'undefined') {
        if (result.p1 == result.p2)
            my_winner = 0;
        else if (result.p1 > result.p2)
            my_winner = 1;
        else
            my_winner = 2;
    }
    else {
        my_winner = winner;
        result.p1 = -1;
        result.p2 = -1;
    }

    io.of('/play').emit('updated', {board: board.board, player: -1, player1: result.p1, player2: result.p2});
    io.of('/spectator').emit('updated', {board: board.board, player: -1, player1: result.p1, player2: result.p2});

    io.of('/play').emit('end', {winner: my_winner, player1: result.p1, player2: result.p2});
    io.of('/spectator').emit('end', {winner: my_winner, player1: result.p1, player2: result.p2});

    console.log(util.format("\nThe winner is player %d \nplayer 1: %d - player 2: %d\n", my_winner, result.p1, result.p2));
    console.log(board)
}

var game = io.of('/play');

// Set authentication
game.use(function(socket, next) {
    var query = socket.handshake.query;

    if (pOne == false && query.token === pOneToken) {
        console.log('Player One authenticated');
        pOne = socket.id;
        next();
    }
    else if (pTwo == false && query.token === pTwoToken) {
        console.log('Player Two authenticated');
        pTwo = socket.id;
        next();
    }
    else {
        console.log('Authenticate Failed!');
        next(new Error('not authorized'));
    }

});

// On connection logic
var turn = 1;
game.on('connection', function (socket) {
    var player, foe, receiveId;

    if (socket.id === pOne) {
        // Player one logic
        player = 1;
        foe = 2;

        socket.emit('yourrole', 1);

        if (pTwo) {
            var toId = (turn == 1) ? pOne : pTwo;
            game.to(toId).emit('yourturn', {player: turn, board: board.board, time: getRemainTime(turn), message: 'init'});

            startTimer(turn);
        }
    }
    if (socket.id === pTwo) {
        // Player two logic
        player = 2;
        foe = 1;

        socket.emit('yourrole', 2);

        if (pOne) {
            var toId = (turn == 1) ? pOne : pTwo;
            game.to(toId).emit('yourturn', {player: turn, board: board.board, time: getRemainTime(turn), message: 'init'});

            startTimer(turn);
        }
    }

    socket.emit('updated', {player: turn, board: board.board, message: 'update'});

    socket.on('mymove', function(data){
        if (!pOne || !pTwo) {
            socket.emit('errormessage', 'waiting for compponent!');
            return;
        }

        if (player != turn) {
            socket.emit('errormessage', 'not your turn!');
            return;
        }

        pauseTimer(player);

        var y = parseInt(data.rowIdx);
        var x = parseInt(data.colIdx);

        var result = !isNaN(x) && !isNaN(y) && board.go(player, y, x);

        if (result) {
            // Check wether opponent can move
            var foe_can_move = board.have_move(foe);

            // Check wether player can move
            var player_can_move = board.have_move(player);

            if (!foe_can_move && !player_can_move) {
                // No one can move, game is over
                // End and start new match
                turn = -1;
                endGame();

                // TODO: start new match?
            }
            else if (foe_can_move) {
                // Change turn to other player
                turn = foe;

                var receiveId = (player == 1) ? pTwo : pOne;

                game.to(receiveId).emit('yourturn', {player: foe, board: board.board, time: getRemainTime(foe)});
                startTimer(foe);

                socket.emit('updated',{player: foe, board: board.board, message: 'valid', yourtime: getRemainTime(player)});

                // Broadcast to spectators
                sendGameInfo(io.of('/spectator'));
            }
            else {
                // Opponent can't move, player continue to play
                socket.emit('yourturn', {player: player, board: board.board, time: getRemainTime(player)});
                startTimer(player);

                // Send updated board to the other
                var receiveId = (player == 1) ? pTwo : pOne;
                game.to(receiveId).emit('updated', {player: player, board: board.board, message: 'valid', yourtime: getRemainTime(foe)});

                // Broadcast to spectators
                sendGameInfo(io.of('/spectator'));
            }
        }
        else {
            // Invalid move
            socket.emit('yourturn', {player: player, board: board.board, time: getRemainTime(player), message: 'invalid'});
            startTimer(player);
        }
    });

    socket.on('disconnect', function(){
        if (socket.id === pOne) {
            pOne = false;
            console.log('Lost connection to Player 1!');
        }
        if (socket.id === pTwo) {
            pTwo = false;
            console.log('Lost connection to Player 2!');
        }
    });

});

pOneTimer.on('end', function() {
    endGame(2);
});

pTwoTimer.on('end', function() {
    endGame(1);
});

var spectator = io.of('/spectator');

spectator.on('connection', function(socket) {
    sendGameInfo(socket);
});
