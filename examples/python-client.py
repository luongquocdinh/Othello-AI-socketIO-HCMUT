#!/usr/bin/env python2

from socketIO_client import SocketIO

my_board = []

socketIO = None

def updateBoard(data):
    """ Server inform me that board has been updated
    """
    my_board = data['board']
    print('Board updated')

def makeAMove(data):
    """ Send to server my move
    """
    #my_board = board[:]
    print(data['message'])

    #my_move = makeACallTo('DeepMind', 'Show me the next move!')
    my_move = {'X': 0, 'Y': 0}

    socketIO.emit('mymove', {'rowIdx': my_move['Y'], 'colIdx': my_move['X']})

def end(data):
    """ Game is over!
    """
    print('Game is over !')
    print('Winner is: ' + data['winner'])
    print('Player 1 number: ' + data['player1'])
    print('Player 2 number: ' + data['player2'])

def print_error(data):
    print('Error: ' + data)


token = raw_input('Enter your token: ')

socketIO = SocketIO('localhost', 8100, params={'token': token})
#socketIO.connect('/play')
socketNS = '/play'

# Define callback to updated event
socketIO.on('updated', updateBoard, socketNS)

# Define callback to yourturn event
socketIO.on('yourturn', makeAMove, socketNS)

# Define callback to end event
socketIO.on('end', end, socketNS)

# Define callback to errormessage event
socketIO.on('errormessage', print_error, socketNS)

socketIO.wait()