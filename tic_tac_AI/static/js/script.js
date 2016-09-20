// once the document is ready...
$(document).ready(function() {

    // Global empty tile value as constant
    EMPTY = " ";

    // Create global variables keeping track of nr of turns taken (depth/10) and AI's starting token (X or O)
    DEPTH_NOW = 0;
    AI_TOKEN = "O";
    HUMAN_TOKEN = "X";
    GAME_OVER = false;
    GAME_ALREADY_STARTED = false;

    // For displaying player's current token on hovered-over tiles
    HOVERED_VALUE = "Z";

    // A global variable making it impossible for the human to make more than one move by clicking quickly
    MOVE_MADE = false;

    // Have a 2-dimensional array for ways to win, needed for the function showVictory() that marks the winning sequence in blue
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


    // Use a function from django documentation to create a cookie for csrf safety
    // https://docs.djangoproject.com/en/dev/ref/csrf/#django.views.decorators.csrf.csrf_exempt
    function getCookie(name) {
        var cookieValue = null;
        if (document.cookie && document.cookie !== '') {
            var cookies = document.cookie.split(';');
            for (var i = 0; i < cookies.length; i++) {
                var cookie = jQuery.trim(cookies[i]);
                // Does this cookie string begin with the name we want?
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

    // Click the AI starts button to sendData() to backend and switch tokens from default (in which human starts and is X)
    $('#move_AI').click(function(event) {
        // check if a decision hasn't already been made
        if (MOVE_MADE == false && GAME_ALREADY_STARTED == false) {
            // mark the fact that AI started this game (that the game has already been started - otherwise AI could make "first" move after human made moves)
            MOVE_MADE = true;
            GAME_ALREADY_STARTED = true;
            // switch button to inactive
            $("#ai_starts").fadeTo(250, 0.30, function() {
                    $(this).attr("src", "/static/ai_starts_inactive.png");
                }).fadeTo(250, 1)
                // reset tokens
            HUMAN_TOKEN = "O";
            AI_TOKEN = "X";
            // send the game state to backend_ajax.py
            sendData();
            // this function will also mark MOVE_MADE as false (as the new one hasn't been made yet)
        }
    });

    // Handle the human hovering over (considering) a tile
    $('.tile').mouseover(function() {
        HOVERED_VALUE = $(this).text();
        // only show player's token on a previously empty tile, while the game isn't over
        // and no move is currently being processed (e.g. AI is thinking)
        if ($(this).text() == " " && GAME_OVER == false && MOVE_MADE == false) {
            $(this).text(HUMAN_TOKEN);
            // format the possibly chosen tile to distinguish it from actually chosen ones
            $(this).css({
                'color': 'gray',
            });

            // Handle the human clicking a tile
            $('.tile').click(function(event) {
                // we have to add all the conditions here because this is a separate event from its parent (mouseover)
                if ($(this).attr('clicked') != 'yes' && GAME_OVER == false && $(this).text() != AI_TOKEN) {
                    // change this tile's 'clicked' attribute to yes
                    $(this).attr('clicked', 'yes');
                    // switch back to standard formatting (css style) if the tile was chosen
                    $(this).css({
                        'color': 'black',
                    });
                    // if this is human's first move, switch ai starts button to inactive
                    if (GAME_ALREADY_STARTED == false) {
                        $("#ai_starts").fadeTo(250, 0.30, function() {
                            $(this).attr("src", "/static/ai_starts_inactive.png");
                        }).fadeTo(250, 1)
                    }
                    if (MOVE_MADE == false) {
                        // mark that the human already made this turn's decision and that the game is definitely in progress already
                        MOVE_MADE = true;
                        GAME_ALREADY_STARTED = true;
                        // grab the clicked tile's value
                        var tile_number = $(this).text();
                        // put human's token on chosen tile
                        $(this).html(HUMAN_TOKEN);
                        // increment depth (turn has passed)
                        DEPTH_NOW += 10;
                        // send the game state to backend_ajax.py
                        sendData();
                        // the function above will mark that a new move decision hasn't been made yet (MADE_MOVE = false)
                    }
                }
            });
        }
    });

    $('.tile').mouseleave(function() {
        // check if this tile hasn't been chosen (clicked), if the game isn't already over,
        // if the tile doesn't contain the AI token and if a move isn't currently being processed (e.g. AI is thinking)
        if ($(this).attr('clicked') != 'yes' && GAME_OVER == false && $(this).text() != AI_TOKEN && MOVE_MADE == false) {
            // switch value of tile to the one from before hovering
            $(this).text(HOVERED_VALUE);
            // switch back to standard formatting (css style)
            $(this).css({
                'color': 'black',
            });
        }
    });

    // Define a function for grabbing current board state
    function grab_board() {
        // create an array to hold the board
        var current_board = [];
        // loop over each tile and append its value to the current board array
        $('.tile').each(function(index, element) {
            current_board[index] = $(element).text();
        });
        // return the current board state (needed for ajax)
        return current_board;
    };

    // Grab current board state into an array
    $('#scraper').click(function(event) {
        // call the function
        scraped_board = grab_board();
        // show the result in placeholder div
        $('#placeholder').html(scraped_board);
    });

    // Define a function to change entire board based on passed array
    function fill_board(array) {
        var passed_board = array;
        // loop over each tile and change its value to corresponding item in passed_board
        $('.tile').each(function(index, element) {
            $(element).html(passed_board[index]);
        });
    };

    // Fill the board with tile values based on passed board state
    $('#clearer').click(function(event) {
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
            // switch ai starts button to active
            $("#ai_starts").fadeTo(250, 0.30, function() {
                    $(this).attr("src", "/static/ai_starts_active.png");
                }).fadeTo(250, 1)
                // loop over each tile and append switch the formatting back to default (in case someone won)
            $('.tile').each(function(index, element) {
                $(element).css({
                    'background-color': '#eeebeb',
                    'border': 'solid white 4px',
                    'width': '3em',
                    'height': '3em',
                    'text-align': 'center',
                    'font-size': '200%',
                    'border-radius': '16px',
                    '-moz-border-radius': '6px',
                    'color': 'black',
                    'font-weight': 'normal'
                });
            });
            // loop over each tile and switch it's 'clicked' attribute back to false/no
            $('.tile').each(function(index, element) {
                $(element).attr('clicked', 'no')
            });
        }
        // reset tokens, in case AI started previous game (we want X to always be the starting token)
        AI_TOKEN = "O";
        HUMAN_TOKEN = "X";
    });

    // Basic ajax function (test version)
    function sendData() {
        board_now = grab_board();
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
                // buffering animation while AI is thinking (could make the animation only appear during first move)
                $('#4').html("<img src='/static/buffering.gif' />");
            },
            success: function(response) {
                // let's log the response into the console too (this works)
                console.log(response);
                // create an array variable which will store the board with the AI move added to it by backend
                var new_board = [];
                // grab the board we got from backend via JSON - note that we need to add [] to the end of board, because its an array
                new_board = response['board[]'];
                // fill the currently displayed board with new data from backend
                fill_board(new_board);
                // increment the depth (since a turn has passed)
                DEPTH_NOW += 10;
                // and mark the game's over/not over status based on recent change
                GAME_OVER = response['GAME_OVER'];
                // mark that the human hasn't made a new decision (since the last one was already processed)
                MOVE_MADE = false;
                // if the game is won, highlight the winning tiles via formatting
                showVictory(new_board);
            }
        });
    };

    // Make a function that marks the winning sequence in a color
    function showVictory(won_board) {
        board_now = won_board;
        tiles_that_won = []
            // for every winning sequence of 3 tile indexes
        for (var i = 0; i < WAYS_TO_WIN.length; i++) {
            // if every tile in that sequence is an AI TOKEN (no need to check for human token, due to disastrous human pride)
            if (board_now[WAYS_TO_WIN[i][0]] == AI_TOKEN && board_now[WAYS_TO_WIN[i][1]] == AI_TOKEN && board_now[WAYS_TO_WIN[i][2]] == AI_TOKEN) {

                // push all winning tile indexes to a new array (works as of 2016 07 30)
                tiles_that_won.push(WAYS_TO_WIN[i][0]);
                tiles_that_won.push(WAYS_TO_WIN[i][1]);
                tiles_that_won.push(WAYS_TO_WIN[i][2]);

                // now change the color of the content of tile div's font based on their id's ("0", 1", "2" and so on)
                for (var j = 0; j < tiles_that_won.length; j++) {
                    // jS doesn't have string interpolation so I have to concatenate to create a string representing the id of the right tile div
                    tile_div_id = "#" + tiles_that_won[j].toString();
                    // change the color of that div's content to make the winning 3 tiles immediately visible
                    $(tile_div_id).css({
                        'color': 'white',
                        'font-weight': 'bold',
                        'background-color': '#313446'
                    });
                };
            };
        };
    };

    // Swap button images (used fadeTo() instead of fadeIn() and fadeOut() because that 
    // created a milisecond gap that made the img disappear and the other buttons shift to the right
    $("#ai_thoughts").click(function() {
        $("#ai_thoughts").fadeTo(250, 0.30, function() {
            $(this).attr("src", "/static/ai_thoughts_active.png");
        }).fadeTo(250, 1)
    });


});