const io = require('socket.io-client');

// host should can be changed easily
var host = 'http://localhost:8100/play';

var my_token = 'ma bao mat do server sinh random';

var socket = io.connect(host, {query: 'token=' + my_token});

var my_number = 1;
var client_board;

/*
 * updated event:
 * Received from server updated board
 * client can compare that board with client_board
 * If there is difference client can stop and report bug to TA
 */
socket.on('updated', function(data) {
    client_board = data.board;
    console.log(data.message);
});


/*
 * yourturn event:
 * Receive signal from server as long as board state
 * Indicate that this is your turn
 * You need to send back to server your move.
 */
socket.on('yourturn', function(data) {
    client_board = data.board;

    // You can check data.player is your number or not
    if (data.player != my_number)  {
        console.log('Not my turn!, I still waiting!');
        return;
    }

    // Send back to server your move
    var my_move = make_a_call_to('DeepMind', 'Suggest me the next move pls!');

    socket.emit('mymove', {
        rowIdx: my_move.Y,
        colIdx: my_move.X
    });

    // Sometimes server will send you additional message;
    if (data.message == 'invalid') {
        // If server message is invalid, it mean that your previous move is not valid,
        // Actually you don't need to do anything here
        // If you want you can do the following action
        socket.emit('stupidserver', 'My move is valid, you wrong, server!');
    }
    else {
        console.log(data.message);
    }
});


/*
 * end event:
 * When game is over, server will send you the information about winner
 */
socket.on('end', function(data) {
    var winner = data.winner
    var p1_count = data.player1;
    var p2_count = data.player2;

    if (winner != my_number)
        socket.emit('stupidserver', 'I\'m the winner, go check again, malfunction server *!@#');

    socket.disconnect(true);
});


/*
 * error event:
 * help you determine the problems
 */
socket.on('errormessage', function(data){
    console.log('Error: ' + data);
});
