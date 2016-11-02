# tic-tac-ai
Django web app via which you can play tic tac toe vs an artificial intelligence and see what it was thinking.
http://tictacai.pythonanywhere.com/

You can read a step-by-step walkthrough of this project on my website:
https://mateuszjurewicz.wordpress.com/

2016 10 06
<h3>Description</h3>
Play around with a perfect opponent in a game of online tic tac toe. The simple (weak) AI uses a strategy called the minimax algorithm<sup>1</sup>,
it uses recursion to look through the entire tree of possible game states and chooses its best move assuming that it's playing against
a perfect opponent. Key improvement included taking into consideration the number of turns left (it prefers to win quick and lose late).<br>
* Additional feature allows you to see visualisations of the board at each AI turn, showing what the machine was thinking.

<h3>Acknowledgments</h3>
Inspired by Michael Dawson's "Python Programming for the Absolute Beginner"<sup>2</sup> , Brett Slatkin's "Effective Python: 59 Specific Ways to
Write Better Python"<sup>3</sup> and most importantly a Ruby version of a similar concept by NeverStopBuilding<sup>4</sup>. Kudos to you all, thanks for
the opportunity to learn from you.

<h3>Technologies</h3>
I've decided to use the Django 1.10 framework due to the fact that it was recommended to me based on my background in Python 3.5.1.
Code adheres to PEP-8 and was tested via PyLint (scored 7.05/10).
On the front-end the simple choice was javaScript + jQuery. I aimed for cross-browser compatibility (tested primarily on Mozilla and
Chrome) as well as decent RWD features. 

<h3>Possible improvements</h3>
I would love it if other people took my work and created something better by building on it. I have thought about interesting projects
that could stem from my tic-tac-ai and below is a list of such possibilities:

* improve the runtime (analysis with cProfile showed that the has_won() function eats up a lot of time)<br>
* create a game of tic tac toe with a bigger board than 3x3 and define more ways to win<br>
* randomize the tiles chosen by AI if all are given the same value by the algorithm (increases re-playability)

<sup>1</sup> More on the minimax algorithm at https://www.encyclopediaofmath.org/index.php/Minimax_principle<br>
<sup>2</sup> Available at http://www.goodreads.com/book/show/80443.Python_Programming_for_the_Absolute_Beginner<br>
<sup>3</sup> Available at https://books.google.pl/books/about/Effective_Python.html?id=bTUFCAAAQBAJ&redir_esc=y<br>
<sup>4</sup> Article at http://neverstopbuilding.com/minimax and heroku implementation at http://perfecttictactoe.herokuapp.com/
