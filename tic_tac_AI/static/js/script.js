// once the document is ready...
$(document).ready(function() {

	// INITIAL VARIABLES ==============================================================================================

    // Initialize variables without "var" keyword
    // so that they have global scope
    // making sure there are no conflicts with window variables

    // Empty tile value
    EMPTY = " ";

    // Keeping track of nr of turns taken (depth/10) and players' starting tokens (X and O)
    DEPTH_NOW = 0;
    AI_TOKEN = "O";
    HUMAN_TOKEN = "X";

    // Variables representing current game state
    GAME_OVER = false;
    GAME_ALREADY_STARTED = false;

    // Variables for tracking AI's perceived boards (what-AI-thought feature)
    WHAT_AI_THOUGHT = [];
    AI_THOUGHTS_VISIBLE = false;

    // For displaying player's current token on hovered-over tiles
    HOVERED_VALUE = " ";

    // Variable making it impossible for the human to make more than one move by clicking quickly
    MOVE_MADE = false;

    // 2-dimensional array for ways to win, needed for the function showVictory()
    // that marks the winning sequence on the board after game is over
    WAYS_TO_WIN = [
        [0, 1, 2],
        [3, 4, 5],
        [6, 7, 8],
        [0, 3, 6],
        [1, 4, 7],
        [2, 5, 8],
        [0, 4, 8],
        [2, 4, 6]
    ]

    // CROSS-SITE REQUEST FORGERY PROTECTION ==============================================================================

    // Use a function from django documentation to create a cookie for CSRF safety
    // https://docs.djangoproject.com/en/dev/ref/csrf/#django.views.decorators.csrf.csrf_exempt
    function getCookie(name) {
        var cookieValue = null;
        if (document.cookie && document.cookie !== '') {
            var cookies = document.cookie.split(';');
            for (var i = 0; i < cookies.length; i++) {
                var cookie = jQuery.trim(cookies[i]);
                if (cookie.substring(0, name.length + 1) === (name + '=')) {
                    cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                    break;
                }
            }
        }
        return cookieValue;
    }

    // Create a csrf cookie and store it in a variable
    var csrftoken = getCookie('csrftoken');

    // Define a function for methods that don't require a csrf token
    function csrfSafeMethod(method) {
        // these HTTP methods do not require CSRF protection
        return (/^(GET|HEAD|OPTIONS|TRACE)$/.test(method));
    }

    // CLICK EVENTS HANDLING ===============================================================================================

    // 1. Clicking the "ai starts" button

    // sendData() to backend and switch tokens from default (in which human starts and has the X token)
    $('#ai_move_button').click(function(event) {
        // check if a decision hasn't already been made
        if (MOVE_MADE == false && GAME_ALREADY_STARTED == false) {
            // mark the fact that AI started this game (that the game has already been started - otherwise AI could make "first" move after human made moves)
            MOVE_MADE = true;
            GAME_ALREADY_STARTED = true;
            // switch button to inactive (via css properties)
            $('#ai_move_button').css({
                'background': '#b4b4b4',
                'cursor': 'auto'
            });
            // switch button to inactive (via property) - to work with jquery mouseenter
            $('#ai_move_button').attr('active', 'no');
            // reset tokens
            HUMAN_TOKEN = "O";
            AI_TOKEN = "X";
            // send the game state to backend_ajax.py
            // sendData() will also mark MOVE_MADE as false (as the new one hasn't been made yet)
            sendData();
        }
    });

    // 2. Clicking the "restart" button

    // Reset the game/board to its default state
    $('#restart_button').click(function(event) {
        if (MOVE_MADE == false) {
            fill_board([' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ']);
            // restart depth to 0
            DEPTH_NOW = 0;
            // mark that a new game hasn't been started yet (needed for the AI's first move)
            GAME_ALREADY_STARTED = false;
            // mark that new game isn't over yet (like the old one)
            GAME_OVER = false;
            // mark that a new move hasn't been made yet (in the new game)
            MOVE_MADE = false;
            // switch ai_move_button to active via css properties
            $('#ai_move_button').css({
                'background-color': '#FFCD4C',
                'cursor': 'pointer'
            });
            // switch ai_move_button to active (via property) - to work with jquery mouseenter
            $('#ai_move_button').attr('active', 'yes');
            // switch ai_thought_button to inactive via css properties
            $('#ai_thought_button').css({
                'background-color': '#b4b4b4',
                'cursor': 'auto'
            });
            // switch ai_thought_button to inactive (via property) - to work with jquery mouseenter
            $('#ai_thought_button').attr('active', 'no');
            // loop over each tile and append switch the formatting back to default (in case someone won)
            $('.tile').each(function(index, element) {
                $(element).css({
                    'background-color': '#eeebeb',
                    'border': 'solid white 4px',
                    'width': '3.5em',
                    'height': '3.5em',
                    'text-align': 'center',
                    'font-size': '200%',
                    'border-radius': '16px',
                    '-moz-border-radius': '6px',
                    'color': 'black',
                    'font-weight': 'normal',
                    'font-family': 'Segoe UI',
                    'font-weight': 'lighter'
                });
            });
            // loop over each tile and switch it's 'clicked' attribute back to false/no
            $('.tile').each(function(index, element) {
                $(element).attr('clicked', 'no')
            });
            // reset tokens, in case AI started previous game (we want X to always be the starting token)
            AI_TOKEN = "O";
            HUMAN_TOKEN = "X";
            // in case user chose to view the what-ai-thought feature
            // clear the div holding the ai-perceived boards
            $('#perceptions').empty();
            // and reset the 2d array holding the perceived boards
            WHAT_AI_THOUGHT = [];
            // and mark that the ai thoughts are not visible
            // to avoid displaying them twice
            AI_THOUGHTS_VISIBLE = false;
        };
    });

    // 3. Clicking the "what-ai-thought" button

    // After a game, show what the AI was thinking about each board state
    $('#ai_thought_button').click(function(event) {
    	// If the game is over and the AI-perceived board aren't already displayed... 
        if (GAME_OVER == true && AI_THOUGHTS_VISIBLE == false) {
        	// Mark that the AI-perceived boards are already displayed
            AI_THOUGHTS_VISIBLE = true;
            // Grab the div which will hold the displayed boards
            var container = $('#perceptions');
            // Grab the number of board-states considered by the AI
            var nr_of_turns = WHAT_AI_THOUGHT.length;
            // Tor every state, add the board html used in the game,
            // filling it in with values from each of the AI's turns'
            for (var i = 0; i < nr_of_turns; i++) {
                container.append('<div class="row">' +
                    '<div class="col-sm-10 col-sm-offset-1 hid">' +
                    '<div class="row">' +
                    '<div class="col-sm-6 col-sm-offset-3 text-center">' +
                    '<h4 align="center" style="font-weight: lighter;">' +
                    '<span style="color: gray;">ai</span> turn #' + (i + 1) + '<span style="font-weight: normal;"> (' + AI_TOKEN + ')' + '</span>' +
                    '</h4>' +
                    '<table style="margin: auto;">' +
                    '<tr>' +
                    '<td class="ai_thought">' + WHAT_AI_THOUGHT[i][0] + '</td>' +
                    '<td class="ai_thought">' + WHAT_AI_THOUGHT[i][1] + '</td>' +
                    '<td class="ai_thought">' + WHAT_AI_THOUGHT[i][2] + '</td>' +
                    '</tr>' +
                    '<tr>' +
                    '<td class="ai_thought">' + WHAT_AI_THOUGHT[i][3] + '</td>' +
                    '<td class="ai_thought">' + WHAT_AI_THOUGHT[i][4] + '</td>' +
                    '<td class="ai_thought">' + WHAT_AI_THOUGHT[i][5] + '</td>' +
                    '</tr>' +
                    '<tr>' +
                    '<td class="ai_thought">' + WHAT_AI_THOUGHT[i][6] + '</td>' +
                    '<td class="ai_thought">' + WHAT_AI_THOUGHT[i][7] + '</td>' +
                    '<td class="ai_thought">' + WHAT_AI_THOUGHT[i][8] + '</td>' +
                    '</tr>' +
                    '</table>' +
                    '</div>' +
                    '</div>' +
                    '</div></div>');
            }
            // Loop over all ai-perceived tiles and mark them based on value
            // to make good and bad options immediately visible
            $('.ai_thought').each(function(index, element) {
                // Tirst we'll need to convert the content of the tile to a number
                // so we check if the tile in question doesn't contain a token
                if ($(element).text() != "O" && $(element).text() != "X") {
                    // Then we convert the strings to numbers
                    if (Number($(element).text()) < 0) {
                        // and switch the negative ones' color to red
                        $(element).css({
                            'color': 'red',
                        });
                    }
                    // The positive numbers get a good color
                    if (Number($(element).text()) > 0) {
                        $(element).css({
                            'color': '#128ed8',
                            'font-weight': 'normal'
                        });
                    }
                    // Ties are gray
                    if (Number($(element).text()) == 0) {
                        $(element).css({
                            'color': 'gray',
                        });
                    }
                }
            });
            // Switch ai_thought_button to active (via property) - to work with jquery mouseenter
            $('#ai_thought_button').attr('active', 'no');
            // switch ai_thought_button to active via css properties
            $('#ai_thought_button').css({
                'background-color': '#b4b4b4',
                'cursor': 'auto'
            });
            // Scroll to the explanatory paragraph and the ai-perceived boards
            $('html, body').animate({
                scrollTop: $("#ai_thought_explanation").offset().top
            }, 1500);
        };
    });

	// 4. Clicking and hovering over tiles (as human player) - only works in browsers, not smart-phones

    // Handle the human hovering over (considering) a tile
    $('.tile').mouseover(function() {
    	// Store the current value of the tile over which we're hovering
        HOVERED_VALUE = $(this).text();
        // Only show player's token on a previously empty tile, while the game isn't over
        // and no move is currently being processed (e.g. AI is thinking)
        if ($(this).text() == " " && GAME_OVER == false && MOVE_MADE == false) {
        	// Switch the value of the hovered over empty tile to be the human token
            $(this).text(HUMAN_TOKEN);
            // Format the possibly chosen tile to distinguish it from actually chosen ones
            $(this).css({
            	// Slightly lighter gray tint
                'color': '#b4b4b4',
            });

            // Handle the human clicking a tile
            $('.tile').click(function(event) {
                // We have to add all the conditions here because this is a separate event from its parent (mouseover)
                if ($(this).attr('clicked') != 'yes' && GAME_OVER == false && $(this).text() != AI_TOKEN) {
                    // Change this tile's 'clicked' attribute to yes
                    $(this).attr('clicked', 'yes');
                    // Switch back to standard formatting (css style) if the tile was chosen
                    $(this).css({
                        'color': 'black',
                    });
                    // If this is human's first move, switch ai starts button to inactive
                    // switch button to inactive (via css properties)
                    $('#ai_move_button').css({
                        'background': '#b4b4b4',
                        'cursor': 'auto'
                    });
                    // Switch button to inactive (via property) - to work with jquery mouseenter
                    $('#ai_move_button').attr('active', 'no');
                    // Only process the choice if another decision isn't already being processed
                    if (MOVE_MADE == false) {
                        // Mark that the human already made this turn's decision and that the game is definitely in progress already
                        MOVE_MADE = true;
                        GAME_ALREADY_STARTED = true;
                        // Grab the clicked tile's value
                        var tile_number = $(this).text();
                        // Put human's token on chosen tile
                        $(this).html(HUMAN_TOKEN);
                        // Increment depth (turn has passed)
                        DEPTH_NOW += 10;
                        // Send the game state to backend_ajax.py
                        sendData();
                        // The function above will mark that a new move decision hasn't been made yet (MADE_MOVE = false)
                    }
                }
            });
        }
    });

    // Handle the human hovering away from a tile
    $('.tile').mouseleave(function() {
        // Check if this tile hasn't been chosen (clicked), if the game isn't already over,
        // if the tile doesn't contain the AI token and if a move isn't currently being processed (e.g. AI is thinking)
        if ($(this).attr('clicked') != 'yes' && GAME_OVER == false && $(this).text() != AI_TOKEN && MOVE_MADE == false) {
            // Switch value of tile to the one from before hovering
            $(this).text(HOVERED_VALUE);
            // Switch back to standard formatting (css style)
            $(this).css({
                'color': 'black',
            });
        }
    });

    // CSS STYLE EVENTS HANDLING ===========================================================================================

    // 1. Hovering over the three main navigation buttons

    // Handle hovering over active and inactive ai_move_button
    $("#ai_move_button").on({
        mouseenter: function() {
            if ($(this).attr('active') == 'yes') {
                $(this).css({
                    'background-color': '#3d91b8',
                    'cursor': 'pointer'
                });
            };
        },
        mouseleave: function() {
            if ($(this).attr('active') == 'yes') {
                $(this).css({
                    'background-color': '#FFCD4C',
                    'cursor': 'pointer'
                });
            };
        }
    });

    // Handle hovering over active and inactive ai_thought_button
    $("#ai_thought_button").on({
        mouseenter: function() {
            if ($(this).attr('active') == 'yes') {
                $(this).css({
                    'background-color': '#3d91b8',
                    'cursor': 'pointer'
                });
            };
        },
        mouseleave: function() {
            if ($(this).attr('active') == 'yes') {
                $(this).css({
                    'background-color': '#FFCD4C',
                    'cursor': 'pointer'
                });
            };
        }
    });

    // Handle hovering over active and inactive restart_button
    $("#restart_button").on({
        mouseenter: function() {
            // If the button is active (it always is) and a move isn't being processed
            // switch button color to the active one (e.g. blue) and the cursor to pointer
            // indicating that it can be clicked
            if ($(this).attr('active') == 'yes' && MOVE_MADE == false) {
                $(this).css({
                    'background-color': '#3d91b8',
                    'cursor': 'pointer'
                });
            };
            // otherwise if a decision is being processed (e.g. ai's first move)
            // then don't change the color to the active one and cursor shouldn't
            // indicate that it's clickable - but the original yellow will show
            // that it's an option (after the buffering gif is done)
            if ($(this).attr('active') == 'yes' && MOVE_MADE == true) {
                $(this).css({
                    'cursor': 'auto'
                });
            };
        },
        // in other cases switch the color back to yellow (active, no focus)
        // when no decision is being processed
        mouseleave: function() {
            if ($(this).attr('active') == 'yes' && MOVE_MADE == false) {
                $(this).css({
                    'background-color': '#FFCD4C',
                    'cursor': 'pointer'
                });
            };
        }
    });

    // HELPER FUNCTIONS ====================================================================================================

    // 1. Main AJAX/JSON function for handling requests to backend

    // Send a JSON object via AJAX
    function sendData() {
    	// Grab current board
        board_now = grab_board();
        // Send the request to our AI_moves view (Django)
        $.ajax({
            url: "AI_moves/",
            type: "POST",
            dataType: "json",
            data: {
                board: board_now,
                AI_TOKEN: AI_TOKEN,
                DEPTH_NOW: DEPTH_NOW,
                GAME_OVER: GAME_OVER
            },
            beforeSend: function(xhr, settings) {
                // CSRF protection
                if (!csrfSafeMethod(settings.type) && !this.crossDomain) {
                    xhr.setRequestHeader("X-CSRFToken", csrftoken);
                }
                // Buffering animation while AI is thinking
                $('#4').html("<img src='/static/buffering2.gif' />");
            },
            success: function(response) {
                // Let's log the response into the console
                console.log(response);
                // create an array variable which will store the board with the AI move added to it by backend
                var new_board = [];
                // grab the board we got from backend via JSON - note that we need to add [] to the end of board, because it's an array
                new_board = response['board[]'];
                // fill the currently displayed board with new data from backend
                fill_board(new_board);
                // increment the depth (since a turn has passed)
                DEPTH_NOW += 10;
                // mark that the human hasn't made a new decision (since the last one was already processed)
                MOVE_MADE = false;
                // if the game is won, highlight the winning tiles via formatting
                showVictory(new_board);
                // if the game isn't over (by victory or tie - hence depth condition)
                // add the AI's perceived board to the 2-dimensional array of perceived boards
                if (GAME_OVER == false && DEPTH_NOW < 100) {
                    WHAT_AI_THOUGHT.push(response['considered_board']);
                }
                // and mark the game's over/not over status based on recent change
                GAME_OVER = response['GAME_OVER'];
                // set the ai_thought_button to active if the ai-perceived boards aren't already visible
                if (GAME_OVER == true && AI_THOUGHTS_VISIBLE == false) {
                    // switch ai_thought_button to active (via property) - to work with jquery mouseenter
                    $('#ai_thought_button').attr('active', 'yes');
                    // switch ai_thought_button to active via css properties
                    $('#ai_thought_button').css({
                        'background-color': '#FFCD4C',
                        'cursor': 'pointer'
                    });
                };
            }
        });
    };

    // 2. Function for getting current board state

    // Loop over each tile and store content in an array (3 possible values)
    function grab_board() {
        // Create an array to hold the board
        var current_board = [];
        // Loop over each tile and append its value to the current board array
        $('.tile').each(function(index, element) {
            current_board[index] = $(element).text();
        });
        // Return the current board state (needed for ajax)
        return current_board;
    };

    // 3. Function for filling the board with new tile values

    // Define a function to change entire board based on passed array
    function fill_board(array) {
        var passed_board = array;
        // loop over each tile and change its value to corresponding item in passed_board
        $('.tile').each(function(index, element) {
            $(element).html(passed_board[index]);
        });
    };

    // 4. Function for highlighting the winning tiles

    // Loop over all ways to win checking it against current tile values
    function showVictory(won_board) {
        board_now = won_board;
        tiles_that_won = []
            // For every winning sequence of 3 tile indexes
        for (var i = 0; i < WAYS_TO_WIN.length; i++) {
            // if every tile in that sequence is an AI TOKEN (no need to check for human token, due to disastrous human pride)
            if (board_now[WAYS_TO_WIN[i][0]] == AI_TOKEN && board_now[WAYS_TO_WIN[i][1]] == AI_TOKEN && board_now[WAYS_TO_WIN[i][2]] == AI_TOKEN) {

                // Push all winning tile indexes to a new array (works as of 2016 07 30)
                tiles_that_won.push(WAYS_TO_WIN[i][0]);
                tiles_that_won.push(WAYS_TO_WIN[i][1]);
                tiles_that_won.push(WAYS_TO_WIN[i][2]);

                // Now change the color of the content of tile div's font based on their id's ("0", 1", "2" and so on)
                for (var j = 0; j < tiles_that_won.length; j++) {
                    // jS doesn't have string interpolation so I have to concatenate to create a string representing the id of the right tile div
                    tile_div_id = "#" + tiles_that_won[j].toString();
                    // Change the color of that div's content to make the winning 3 tiles immediately visible
                    $(tile_div_id).css({
                        'color': 'white',
                        'font-weight': 'normal',
                        'background-color': '#3d91b8'
                    });
                };
            };
        };
    };

});