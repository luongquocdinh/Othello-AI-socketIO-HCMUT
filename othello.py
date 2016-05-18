#!/usr/bin/env python2
from socketIO_client import SocketIO
import random
import sys

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
    #print(data['message'])
    board = data['board']
    computer = data['player']
    row, col = getComputerMove(board, computer)
    #my_move = makeACallTo('DeepMind', 'Show me the next move!')
    my_move = {'row': row, 'col': col}

    socketIO.emit('mymove', {'rowIdx': my_move['row'], 'colIdx': my_move['col']})

def end(data):
    """ Game is over!
    """
    print('Game is over !')
    print('Winner is: ' + str(data['winner']))
    print('Player 1 number: ' + str(data['player1']))
    print('Player 2 number: ' + str(data['player2']))

def print_error(data):
    print('Error: ' + str(data))

# ##################################################################
# ##################################################################

WIN = 99999
LOSE = -99999

BETA_MAX = 10000
ALPHA_MIN = -10000
DEPTH_SEARCH = 5

table = []
for i in range(8):
    table.append([False] * 8)

MAX_MOVES = 64

SQUARE_WEIGHTS = [
    [120, -20, 20, 5, 5, 20, -20, 120],
    [-20, -40,  -5,  -5,  -5,  -5, -40, -20],
    [20, -5, 15, 3, 3, 15, -5, 20],
    [5, -5, 3, 3, 3, 3, -5, 5],
    [ 5, -5, 3, 3, 3, 3, -5, 5],
    [20, -5, 15, 3, 3, 15, -5, 20],
    [-20, -40, -5, -5, -5, -5, -40, -20],
    [120, -20, 20,  5,  5, 20, -20, 120],
]

def getComputerMove(board, computerTile):
    possibleMoves = getValidMoves(board, computerTile)

    random.shuffle(possibleMoves)

    bestScore = -999
    bestMove= possibleMoves[0]
    dupeBoard = getBoardCopy(board)
    findDepth_number = findDepth(dupeBoard, computerTile)
    if findDepth_number > 20:
        bestMove=alphaBeta(5, evaluate_all, computerTile, dupeBoard)
    else:
        bestMove=alphaBeta(7, evaluate_all, computerTile, dupeBoard)
    return bestMove

def isOnCorner(x, y):
    return (x == 0 and y == 0) or (x == 7 and y == 0) or (x == 0 and y == 7) or (x == 7 and y == 7)

def getValidMoves(board, tile):
    validMoves = []
    for x in range(8):
        for y in range(8):
            if isValidMove(board, tile, x, y) != False:
                validMoves.append([x, y])
    return validMoves   

def getBoardCopy(board):
    dupeBoard = getNewBoard()
    for x in range(8):
        for y in range(8):
            dupeBoard[x][y] = board[x][y]
    return dupeBoard

def getNewBoard():
    board = []
    for i in range(8):
        board.append([-1] * 8)

    return board

def makeMove(board, tile, xstart, ystart):
    tilesToFlip = isValidMove(board, tile, xstart, ystart)

    if tilesToFlip == False:
        return False

    board[xstart][ystart] = tile
    for x, y in tilesToFlip:
        board[x][y] = tile
    return True

def findDepth(board, computerTile):
    number_square = 0
    for b in board:
        number_square += b.count(1)
        number_square += b.count(2)

    score = MAX_MOVES - number_square
    return score

def isValidMove(board, tile, xstart, ystart):
    if board[xstart][ystart] != -1 or not isOnBoard(xstart, ystart):
        return False

    board[xstart][ystart] = tile 

    if tile == 1:
        otherTile = 2
    else:
        otherTile = 1

    tilesToFlip = []
    for xdirection, ydirection in [[0, 1], [1, 1], [1, 0], [1, -1], [0, -1], [-1, -1], [-1, 0], [-1, 1]]:
        x, y = xstart, ystart
        x += xdirection 
        y += ydirection 
        if isOnBoard(x, y) and board[x][y] == otherTile:
            x += xdirection
            y += ydirection
            if not isOnBoard(x, y):
                continue
            while board[x][y] == otherTile:
                x += xdirection
                y += ydirection
                if not isOnBoard(x, y):
                    break
            if not isOnBoard(x, y):
                continue
            if board[x][y] == tile:
                while True:
                    x -= xdirection
                    y -= ydirection
                    if x == xstart and y == ystart:
                        break
                    tilesToFlip.append([x, y])

    board[xstart][ystart] = -1 # restore the empty space
    if len(tilesToFlip) == 0: # If no tiles were flipped, this is not a valid move.
        return False
    return tilesToFlip

def isOnBoard(x, y):
    return x >= 0 and x <= 7 and y >= 0 and y <=7

def opponent(player):
    return 1 if player==2 else 2


def evaluate_1(board, computerTile):
    opp = opponent(computerTile)
    total = 0

    for x in range(8):
        for y in range(8):
            if board[x][y] == computerTile:
                total += SQUARE_WEIGHTS[x][y]
            elif board[x][y]==opp:
                total-=SQUARE_WEIGHTS[x][y]
    return total


def evaluate_2(board, computerTile, depth, subScore):
    if depth>2:
        return 0 
    opp = opponent(computerTile) 
    countForfeit_lan1 = 0
    possibleOpp = getValidMoves(board, opp) 
    if possibleOpp==[]:
        countForfeit_lan1=1
        possibleMyTurn = getValidMoves(board, computerTile)
        if possibleMyTurn==[]: 
            if subScore>0:
                return WIN 
            else:
                return LOSE 
        else:
            for [x,y] in possibleMyTurn:
                tempBoard = getBoardCopy(board)
                makeMove(tempBoard, computerTile, x, y)
                subSocreLan2= evaluate_3(tempBoard, computerTile)
                countForfeit_lan2 = evaluate_2(tempBoard, computerTile, depth+1, subSocreLan2)
                return (countForfeit_lan1+countForfeit_lan2)
    else:
        return 0

def evaluate_3(board, computerTile):
    xscore = 0
    oscore = 0
    for x in range(8):
        for y in range(8):
            if board[x][y] == 1:
                xscore += 1
            if board[x][y] == 2:
                oscore += 1
    score = xscore - oscore

    return score if computerTile==1 else (-score)

def evaluate_all(dupeBoard, computerTile):
    subScore=evaluate_3(dupeBoard, computerTile) 
    weightTable = evaluate_1(dupeBoard, computerTile) 
    take_turn=evaluate_2(dupeBoard, computerTile, 1, subScore)

    score_evaluate= 35*take_turn + 0.5*subScore+ weightTable
    return score_evaluate

def final_value(player, board):
    result = evaluate_3(board, player)
    if result < 0:
        return LOSE
    elif result > 0:
        return WIN
    return result

def bestMove(player, board, alpha, beta, depth, evaluate_all):
    if depth == 0:
        return evaluate_all(board, player), None
    def value(board, alpha, beta):
        return -bestMove(opponent(player), board, -beta, -alpha, depth-1, evaluate_all)[0]
    
    moves = getValidMoves(board, player)
    if moves==[]:
        moves_opp = getValidMoves(board, opponent(player))
        if moves_opp==[]:
            return final_value(player, board), None
        return value(board, alpha, beta), None
    
    best_move = moves[0]
    for [x,y] in moves:
        if alpha >= beta:
            break
        dupeBoard= getBoardCopy(board)
        makeMove(dupeBoard, player, x, y)
        val = value(dupeBoard, alpha, beta)
        if val > alpha:
            alpha = val
            best_move = (x,y)
    return alpha, best_move

def alphaBeta(depth, evaluate_all, player, board):
    return bestMove(player, board, ALPHA_MIN, BETA_MAX, depth, evaluate_all)[1]

# ##################################################################
token = raw_input('Enter your token: ')

socketIO = SocketIO('localhost', 8100, params={'token': token})

# Define callback to updated event
socketIO.on('updated', updateBoard)

# Define callback to yourturn event
socketIO.on('yourturn', makeAMove)

# Define callback to end event
socketIO.on('end', end)

#Define callback to errormessage event
socketIO.on('errormessage', print_error)

socketIO.wait()

# token = raw_input('Enter your token: ')

# socketIO = SocketIO('localhost', 8100, params={'token': token})
# #socketIO.connect('/play')
# socketNS = '/play'

# # Define callback to updated event
# socketIO.on('updated', updateBoard, socketNS)

# # Define callback to yourturn event
# socketIO.on('yourturn', makeAMove, socketNS)

# # Define callback to end event
# socketIO.on('end', end, socketNS)

# # Define callback to errormessage event
# socketIO.on('errormessage', print_error, socketNS)

# socketIO.wait()    
