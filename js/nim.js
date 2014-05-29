/*----------------------------------------------------------------------------*
 * Title:          nim.js                                                     *
 * Author:         Roberto Gomez                                              *
 * Date:           1/2/14                                                     *
 * Description:    A self-contained module that implements the Game of Nim.   *
 *                 Token objects are dynamically created using a constructor  *
 *                 that defines their properties (position, HTML element      *
 *                 type, and relative placement) and their methods            *
 *                 (highlight, unHighlight, and remove). The only public      *
 *                 method is init(), which is used for starting the           *
 *                 game. It in turn calls startGame(), which creates the      *
 *                 token objects and stores them in a two-dimensional array.  *
 *                 When the player clicks on a token, the startCompTurn()     *
 *                 function is called. It uses a simple algorithm for         *
 *                 determining the best selection to win the game. When the   *
 *                 game is over, it calls the scoreboard() function, which    *
 *                 shows the number of games won and prompts the user to play *
 *                 again.                                                     *
 * Usage:          Load the script and call Nim.init()                        *
 *----------------------------------------------------------------------------*/

var Nim = (function () {
    var maxHeaps = 5,                               // Maximum number of heaps possible
        maxTokens = 5,                              // Maximum number of tokens possible per heap
        dx = 400 / maxHeaps,                        // Column and row sizes in pixels
        dy = 350 / maxTokens,                       // Used for calculating position of Token objects
        playerScore = 0,                            // Number of wins for player
        compScore = 0,                              // Number of wins for computer
        tokens,                                     // Array for storing Token objects
        compsTurn = false;                          // we need to track if the computer is having ist turn 
                                                    // Player starts.
    
    // Create a reference variable for accessing the game's boundaries
    var playArea = document.getElementById("play-area");

    /*----------------------------------------------------------------------------*
     * Token() constructor                                                        *
     *                                                                            *
     * Constructor for creating the Token objects. Heap and order are             *
     * sub-properties of the element property because they need to be             *
     * accessible using the "this" keyword when the event listeners are added in  *
     * startGame().                                                               *
     *----------------------------------------------------------------------------*/

    var Token = function (pos_x, pos_y, heap, order) {
        this.pos_x = pos_x;                                 // X position for CSS left property
        this.pos_y = pos_y;                                 // Y position for CSS top property
        this.element = document.createElement("div");       // HTML element placed in DOM
        this.element.heap = heap;                           // Index values that correspond to the
        this.element.order = order;                         // tokens array, eg tokens[heap][order]

        /*
         * highlight() method
         *
         * Changes the background-color style property of the selected token as
         * well as the tokens above it. The if statement is necessary for
         * preventing access outside of the tokens array.
         */

        this.highlight = function(event) {
            this.element.style.backgroundColor = "green";

            // Call highlight() of the next Token, but not if it is the last one in the heap
            if (this.element.order+1 !== tokens[this.element.heap].length)
                tokens[this.element.heap][this.element.order+1].highlight();
        };

        /*
         * unHighlight() method
         *
         * Restores the color of tokens modified by the hightlight() method. The
         * two beginning checks are necessary to prevent referencing invalid
         * tokens array indices that were removed with the remove() method.
         */

        this.unHighlight = function(event) {
            if (typeof tokens[this.element.heap] !== "undefined") {
                if (typeof tokens[this.element.heap][this.element.order] !== "undefined") {
                    this.element.style.backgroundColor = "black";

                    if (this.element.order+1 !== tokens[this.element.heap].length)
                        tokens[this.element.heap][this.element.order+1].unHighlight();
                }
            }
        };

        /*
         * remove() method
         *
         * Removes token elements from the DOM and Token objects from the
         * tokens array. Performs the removals iteratively, starting from the
         * last token in the heap down to the selected token. Also checks if the
         * heap is depleted of tokens, and if so, decrements the heap properties
         * of all the tokens after it and removes it from the tokens array.
         */

        this.remove = function(event) {
            console.log("[" + this.element.heap + "][" + this.element.order + "]");

            // Remove the element and the object
            for (var j=tokens[this.element.heap].length-1; j>=this.element.order; j--) {
                tokens[this.element.heap][j].element.parentNode.
                    removeChild(tokens[this.element.heap][j].element);
                tokens[this.element.heap].pop();
            }

            // Check if the heap is empty
            if (tokens[this.element.heap].length === 0) {
                for (var i=this.element.heap+1; i<tokens.length; i++)
                    for (j=0; j<tokens[i].length; j++)
                        tokens[i][j].element.heap--;
                tokens.splice(this.element.heap, 1);
            }
            
            // If the game is about to be won by either Player or Computer in this turn, we score and stop.
            if (gameWon())
            {
                console.log("compsTurn: " + compsTurn);
                
                stopGame();
            }
        };

        // Register the methods to fire on the appropriate UI events
        // The value of "this" needs to be corrected using the bind() method
        this.element.addEventListener("mouseover", this.highlight.bind(this), false);
        this.element.addEventListener("mouseout", this.unHighlight.bind(this), false);
        this.element.addEventListener("click", this.remove.bind(this), false);
        this.element.addEventListener("click", delayCompTurn, false);
    };

    /*----------------------------------------------------------------------------*
     * startGame() function                                                       *
     *                                                                            *
     * Sets up a round of Nim by generating a random array of Token objects. Also *
     * assigns the coordinates of the tokens within playArea. Called by the init  *
     * method.                                                                    *
     *----------------------------------------------------------------------------*/

    var startGame = function() {
        var numOfHeaps = getRandomInt(2, maxHeaps);         // Number of heaps in this round     

        document.getElementById("play-button").style.display = "none";      // Hide the play button

        // Create a random 2D array for storing the Token objects
        // First index represents the heap, second index represents the Token in each heap
        tokens = Array(numOfHeaps);
        for (var i=0; i<numOfHeaps; i++)
            tokens[i] = Array(getRandomInt(2, maxTokens));

        // Populate playArea with tokens
        for (i=0; i<tokens.length; i++) {
            for (var j=0; j<tokens[i].length; j++) {
                tokens[i][j] = new Token(((20 + i * dx)), (400 - (dy + j * dy)), i, j);
                playArea.appendChild(tokens[i][j].element);
                tokens[i][j].element.classList.add("token");

                // Specify location of each token
                tokens[i][j].element.style.left = tokens[i][j].pos_x + "px";
                tokens[i][j].element.style.top = tokens[i][j].pos_y + "px";
            }
        }
    };

    /*----------------------------------------------------------------------------*
     * getRandomInt() function                                                    *
     *                                                                            *
     * Returns a random integer between min and max                               *
     * Using Math.round() will give you a non-uniform distribution!               *
     *----------------------------------------------------------------------------*/
 
    var getRandomInt = function(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    };

    /*----------------------------------------------------------------------------*
     * delayCompTurn() function                                                   *
     *                                                                            *
     * Function used to call startCompTurn() after 2 seconds. The function        *
     * creates a pause after the player's turn so that the computer does not act  *
     * immediately after.                                                         *
     *----------------------------------------------------------------------------*/

    var delayCompTurn = function() {
        window.setTimeout(startCompTurn, 2000);
    };

    /*----------------------------------------------------------------------------*
     * startCompTurn() function                                                   *
     *                                                                            *
     * Responsible for starting the computer's turn at selecting tokens. Checks   *
     * the length of the tokens array to see if there are tokens still remaining. *
     * Calculates nim-sums to determine the best possible selection to ensure its *
     * victory. If the value of nimSumAll is zero, the computer can not gaurantee *
     * victory, in which case it picks randomly. The nim-sum of two or more       *
     * numbers is merely the XOR between them ie nim-sum = x₁ ⊕ x₂ ⊕ ... ⊕ xₙ.    *
     * Heap size refers to the number of tokens in the heap.                      *
     *----------------------------------------------------------------------------*/

    var startCompTurn = function() {
        var nimSumAll = 0,                          // Nim-sum of all the heap sizes
            nimSumEach = Array(tokens.length),      // Nim-sum of each heap size with nimSumAll
            selectedCol, selectedTok;               // Indices of the computer's selected token
        
        compsTurn = true;                           // now the computer is playing. If it should win..
        
        if(tokens[0] != null)                            // Calculate nim-sum of all the heap sizes
        {
            nimSumAll = tokens[0].length;               
        }
        for (var i=1; i<tokens.length; i++)
            nimSumAll ^= tokens[i].length;

        // If nimSumAll is zero, computer is in a losing situation, so pick randomly
        if (nimSumAll === 0) {
            selectedCol = getRandomInt(0, tokens.length-1);
            selectedTok = getRandomInt(0, tokens[selectedCol].length-1);
        }
        else {                                      // otherwise follow the optimal strategy
            // Calculate the nim-sum of heap sizes and nimSumAll
            for (i=0; i<tokens.length; i++)
                nimSumEach[i] = tokens[i].length ^ nimSumAll;

            // Find a heap in which nimSumEach is less than the heap size
            // The nimSumEach value for that heap is the number of tokens
            // that the heap should be reduced to
            for (i=0; i<tokens.length; i++) {
                if (nimSumEach[i] < tokens[i].length) {
                    selectedCol = i;
                    selectedTok = nimSumEach[i];
                    break;
                }
            }
        }

        tokens[selectedCol][selectedTok].highlight();   // Highlight computer's selection

        // Remove the computer's selection imediately. 
        // Waiting for callbacks confuses the state of turns, and there by who is winning
        tokens[selectedCol][selectedTok].remove();

        // no longer Computers turn
        compsTurn = false;
    };
    
     /*----------------------------------------------------------------------------*
     * stopGame() function                                                        *
     *                                                                            *
     * Ends the game, and show the scoreboard, by calling scoreboard()            *
     *----------------------------------------------------------------------------*/
    var stopGame = function()
    {
        var winner;
        if (compsTurn)
        {
            winner = "Computer";
            compScore++;
        }
        else
        {
            winner = "Player";
            playerScore++;
        }
        //scoreboard();
        alert(winner + " won\n\n" + "Computer " + compScore + " wins\n" + "Player " + playerScore + " wins");
        startGame();
    }
    
    /*----------------------------------------------------------------------------*
     * gameWon() function                                                         *
     *                                                                            *
     * Function used to determin if the game is won yet.                          *
     * When exactly one token is left to be taken, you are winning the game,      *
     * since you are taking the last one. In this variant, that is.               *
     *----------------------------------------------------------------------------*/
    var gameWon = function()
    {
        var tokensLeft = 0;
        for (i=0; i<tokens.length; i++)
        {
            if (tokens[i] != null)
            {
                tokensLeft += tokens[i].length;
            }
        }
        return tokensLeft == 0;
    }

    return {
        init: function() {      // Public method used to begin the game
            startGame();
        }
    };
})();

