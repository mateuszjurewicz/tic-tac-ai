# we need to import json for json.dumps
import json
from django.shortcuts import render
from django.http import HttpResponse

def play_game(request):
    """ a view-function initiating the main page """
    return render(request, 'tic_tac_AI/play_game.html', {})

def AI_moves(request):
    """ a view-function grabbing and sending ajax/json board states"""
    if request.method == 'POST':

        # grab all the ajax/json data from script.js
        # we have to use getlist instead of get with arrays->lists,
        # otherwise it just grabbed one element (last one) from the array
        received_board = request.POST.getlist('board[]')
        ai_token = request.POST.get('AI_TOKEN')
        # have to explicitly convert the string we got from ajax/json to a Python integer
        depth_now = int(request.POST.get('DEPTH_NOW'))
        game_over = request.POST.get('GAME OVER')

        # initiate a dictionary holding the json response
        response_data = {}

        # plug in AI backend
        ###############################################
        ###############################################

        # tic_tac_1.3.py
        # by Mjure
        # 2016 07 27

        # plays a perfect game of tic tac toe against a human opponent
        # inspired by http://neverstopbuilding.com/minimax (salutations to them!)

        # the AI uses a strategy called "minimax algorithm" and bears in
        # mind the number of turns left, preferring to win quick and lose late

        # define the global, recursive minimax algorithm
        def minimax(player, game):
            """ This is the minimax calculation which will be called
            by the AI player object's move() method """

            # if the game is over, return the score from AI's perspective,
            # taking number of turns already taken (aka depth) into consideration
            # end condition of the recursion
            if game.is_over():
                return game.minimax_score(player)

            # create lists holding possible moves and their scores
            scores = []
            moves = []

            # consider each possible game state within each next
            # legal move and run minimax on it
            for move in game.legal_moves():

                # create a new, potential board as a copy of the current game's board
                # the [:] is important - otherwise we won't use a copy
                # of the original game's board but the actual board
                potential_board = game.board[:]
                # add the token (X or O) of the current player onto that tile
                potential_board[move] = game.active_player.token
                # create a new game, passing it that potential board and incrementing
                # the depth by 10 to show that a turn has passed
                potential_game = Game(
                    game.player_one, game.player_two,
                    potential_board, game.depth + 10)

                # switch potential game's active player attribute to be the opposite
                # of the current game's active player (since we already took his turn for him/her)
                if game.active_player == game.player_one:
                    potential_game.active_player = potential_game.player_two
                elif game.active_player == game.player_two:
                    potential_game.active_player = potential_game.player_one
                else:
                    print("\nError while switching potential game's active player\n")
                # recursion
                # add the minimax value of that game to the scores list
                scores.append(minimax(player, potential_game))
                # add the currently considered move to the moves list,
                # at the same index as the corresponding score
                moves.append(move)

            # depending on whether it's the human or the AI making the current choice
            # of move, return the lowest or highest score from the scores list
            # store the chosen move in AI player's AI_chosen_move attribute

            # if the active player is human, choose the worst scoring move and return its score
            if game.active_player != player:
                # for the human the best option is the one with the lowest
                # score (worst choice from the perspective of the AI)
                worst_choice = min(scores)
                # find the index of that item
                worst_choice_index = scores.index(worst_choice)
                # find the corresponding move by the index
                # and assign it to the choice that AI will assume a human would make
                player.AI_chosen_move = moves[worst_choice_index]
                # return the lowest score
                return scores[worst_choice_index]

            # if the active player is the computer
            # choose the highest scoring move and return its score
            elif game.active_player == player:
                # for the AI the best option is the one with the highest score
                best_choice = max(scores)
                # find the index of the highest score
                best_choice_index = scores.index(best_choice)
                # find the highest-scoring move and assign it
                # to the AI player's AI_chosen_move attribute
                player.AI_chosen_move = moves[best_choice_index]
                # return the highest score
                return scores[best_choice_index]

        # initialize global, constant variables:
        # for tile values
        X = "X"
        O = "O"
        EMPTY = " "

        # for board size
        NUM_SQUARES = 9

        # for ways to win
        WAYS_TO_WIN = (
            (0, 1, 2),
            (3, 4, 5),
            (6, 7, 8),
            (0, 3, 6),
            (1, 4, 7),
            (2, 5, 8),
            (0, 4, 8),
            (2, 4, 6))

        # initialize an empty board
        EMPTY_BOARD = []
        for i in range(NUM_SQUARES):
            EMPTY_BOARD.append(EMPTY)

        # define player object classes
        class HumanPlayer(object):
            """ deprecated human player class"""
            def __init__(self, token):
                self.token = token

        class ComputerPlayer(object):
            """ an AI player in a game of tic-tac-toe """
            def __init__(self, token):
                self.token = token
                # in this property we'll be storing the move (0-8) aka tile number,
                # which the AI will chose via the minimax function
                self.AI_chosen_move = None

            # define the minimax calculation defining the AI's next move
            def move(self, game):
                """ use minimax function to return AI's next move (chosen tile) """
                # run the minimax calculation passing the player object and the current game
                minimax(self, game)
                # return the global variable AI_chosen_move,
                # whose value will be changed by the minimax() function
                return self.AI_chosen_move

        # define game object class
        class Game(object):
            """ a game of tic tac toe, with 2 players and a board """
            def __init__(self, player_one, player_two, board, depth):
                self.player_one = player_one
                self.player_two = player_two
                self.board = board
                # we need to be able to define the number of turns already taken (depth)
                # here because in the minimax algorithm we create potential games
                # with some moves already taken
                self.depth = depth

                # since we only play the AI turn, the computer is always the active player
                # which is always going to be player 1
                if player_one.token == X:
                    self.active_player = player_one
                elif player_two.token == X:
                    self.active_player = player_two
                else:
                    print("\nError while setting active player, when initializing the game\n")

            # define a method to check if a given player has won the game
            def has_won(self, player):
                """ Find out if the player passed as argument is the winner, return Boolean value"""
                checked_token = player.token
                for sequence in WAYS_TO_WIN:
                    if checked_token == self.board[sequence[0]] == self.board[sequence[1]] == \
                                        self.board[sequence[2]]:
                        return True
                return False

            # define a method for checking if the game is over
            # (either player wins or it's a tie)
            def is_over(self):
                """ Find out if the game is over, return True or False"""
                if self.has_won(self.player_one):
                    return True
                elif self.has_won(self.player_two):
                    return True
                elif EMPTY not in self.board:
                    return True
                else:
                    return False

            # define a method that returns a list of all available moves left
            def legal_moves(self):
                """Create a list of legal moves."""
                moves = []
                for tile in range(NUM_SQUARES):
                    if self.board[tile] == EMPTY:
                        moves.append(tile)
                return moves

            # define a method for playing one turn of the game
            # (includes switching the active player of the game)
            def play_turn(self):
                """ play the next turn by grabbing a move from the active player """
                # grab a chosen tile from active (turn-taking) player
                # for minimax purposes we have to pass the game itself
                # as argument here (only needed for AI player)
                move = self.active_player.move(self)
                # and place the active player's token on that tile
                self.board[move] = self.active_player.token
                # switch active players
                self.switch_active_player()
                # increment depth (number of turns taken, in multiples of ten
                # for aesthetic reasons - looks clearer when combined with the minimax score)
                self.depth += 10

            # define a method for switching the active (currently turn-taking) player
            def switch_active_player(self):
                """ Switch active players, with error checking """
                if self.active_player == self.player_one:
                    self.active_player = self.player_two
                elif self.active_player == self.player_two:
                    self.active_player = self.player_one
                else:
                    print("\nError while switching active players\n")

            # define a method that will return the game's minimax score
            def minimax_score(self, current_player):
                """ Find out minimax score of a board-state for a given player """
                # define the current turn-taking player and his/her opponent
                if current_player == self.player_one:
                    opponent_player = self.player_two
                else:
                    opponent_player = self.player_one

                # player 2 is always the AI, so if he/she wins, we return
                # the most desirable score of 100, adjusting for the depth
                if self.has_won(current_player):
                    return 100 - self.depth
                # else if the human player won, return the worst score of depth - 100
                elif self.has_won(opponent_player):
                    return self.depth - 100
                # if it's a tie (since we only call this function if game is over)
                # return neutral value of 0
                else:
                    return 0

        # create players and assign to them the appropriate tokens based on ajax-passed AI_TOKEN
        if ai_token == "X":
            player_1 = ComputerPlayer(X)
            player_2 = HumanPlayer(O)
        elif ai_token == "O":
            player_1 = ComputerPlayer(O)
            player_2 = HumanPlayer(X)

        # define the starting board as the board received from ajax and the depth too
        start_board = received_board[:]
        start_depth = depth_now

        # create a new game, passing both player objects and an empty board
        # as well as the starting depth of 0
        current_game = Game(player_1, player_2, start_board, start_depth)

        # check if tha game isn't over before playing a turn
        # (this will mean that the human player's last move was a winning one)
        if current_game.is_over():
            # and set the JSON variable controlling whether the game
            # is over to true if the game is really over
            game_over = True
        # else play the AI turn and after that also check if the game is over
        else:
            # switch the game's active player to be the AI
            current_game.active_player = current_game.player_one
            # play one AI turn
            current_game.play_turn()

        # check if AI won in this turn and set JSON variable to true,
        # signalling to frontend that game is over
        if current_game.is_over():
            game_over = True
        else:
            # it is crucial to return a python Boolean (false) - otherwise JSON
            # was returning a string "false", based on javaScritpt value.
            game_over = False


        # end of AI backend
        ###############################################
        ###############################################

        # set json response's values based on AI backend's values
        response_data['board[]'] = current_game.board
        # assign the game's current state of over/not over
        response_data['GAME_OVER'] = game_over

        return HttpResponse(
            json.dumps(response_data),
            content_type="application/json"
        )
    # in case of an error
    else:
        return HttpResponse(
            json.dumps({"nothing to see": "this isn't happening"}),
            content_type="application/json"
        )
