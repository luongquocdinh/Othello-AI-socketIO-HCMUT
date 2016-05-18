#!/usr/bin/env python2

from socketIO_client import SocketIO, BaseNamespace

class PlayReversi(object):
    def __init__(self):
        self.board = []

    def make_a_move(self, updated_board):
        self.board = updated_board
        return {'X': 0, 'Y': 0}

    def update_board(self, updated_board):
        self.board = updated_board

class ReversiNamespace(BaseNamespace):

    def on_updated(self, data):
        """ Response to updated event
        """
        print('updated triggered')
        board = data['board']
        play_reversi.update_board(board)

    def on_yourturn(self, data):
        """ Response to yourturn event
        """
        print('yourturn triggered')
        board = data['board']
        move = play_reversi.make_a_move(board)
        self.emit('mymove', {'rowIdx': move['Y'], 'colIdx': move['X']})

    def on_errormessage(self, data):
        """ Response to errormessage event
        """
        print(data)

    def on_end(self, data):
        """ Response to end event
        """
        print('The winner is ' + data['winner'])
        print('P1 count: ' + data['player1'])
        print('P2 count: ' + data['player2'])

global play_reversi
play_reversi = PlayReversi()

token = raw_input('Enter your token: ')

# Use socketio with defined Namespace
#socketIO = SocketIO('localhost', 8100, ReversiNamespace, params={'token': token})
socketIO = SocketIO('localhost', 8100, params = {'token' : token})

gameplay = socketIO.define(ReversiNamespace, '/play')

socketIO.wait()