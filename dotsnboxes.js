var Board = (function ($) {
    "strict";
    var events = {},
        players = [],
        currentPlayer,
        turn = 1,                    
        $board,
        $lines = [],
    
        DEFAULT_WIDTH = 4,
        DEFAULT_HEIGHT = 4,
        BOX_SIZE = 100,
        DOT_SIZE = 5,
        DOT_TEMPLATE = '<div class="dot"></div>',
        VLINE_TEMPLATE = '<div class="line vertical"></div>',
        HLINE_TEMPLATE = '<div class="line horizontal"></div>',
        BOX_TEMPLATE = '<div class="box"></div>',                    
        DOT_TEMPLATE = '<div class="dot"></div>',
        VLINE_TEMPLATE = '<div class="line vertical"></div>',
        HLINE_TEMPLATE = '<div class="line horizontal"></div>',
        BOX_TEMPLATE = '<div class="box"></div>',
        LINE_CLS = 'line',
        HLINE_CLS = 'horizontal',
        VLINE_CLS = 'vertical',
        CONNECTED_CLS = 'connected',
        CLOSED_CLS = 'closed';
        
        
    /** drawing methods */                    
    function drawLineRow(width) {
        return Array.apply(null, {
            length: width + 1
        })
        .map(function () {
            return DOT_TEMPLATE;
        })
        .join(HLINE_TEMPLATE);
    }
    
    function drawBoxRow(width) {
        return Array.apply(null, {
            length: width + 1
        })
        .map(function () {
            return VLINE_TEMPLATE;
        })
        .join(BOX_TEMPLATE);
    }             

    /**
     * while the best approach is keep track of when a player closes a box, 
     * this approach doesn't require another variable to do the job
     */
    function prevTurn() {
        turn--;
    }
    
    function nextTurn() {
        turn++;
    }
    
    
    function updateScore() {
        currentPlayer.score++;                        
        trigger('player:score', currentPlayer.className, currentPlayer.score);
    }
    
    function trigger(event) {
        if (events.hasOwnProperty(event)) {
            var args = Array.prototype.splice.call(arguments, 1);
            events[event].apply(null, args);
        }
    }                   

    function closeBox(box) {
        var $box = $lines.eq(box[box.length - 1]).next();
        
        /**
         * avoid close an already closed box again
         */
        if (!$box.hasClass(CLOSED_CLS)) {
            /**
             * close and add player to it
             */
            $box.addClass(CLOSED_CLS)
                .addClass(currentPlayer.className);

            /**
             * update score
             */
            updateScore();
             
            /**
             * go back 1 turn so the player that closed the box gain another turn
             */
            prevTurn();
        }
    }

    function findBoxLines(lineIndex, lines) {
        var box = lines.map(function (line) {
            return lineIndex + line;
        })

        /**
         * filter all boxes for lines that connect two points and index isn't negative (non-existent)
         */
        var connectedLines = box.filter(function (index) {
            return index > -1 && $lines.eq(index).hasClass(CONNECTED_CLS);
        });

        /**
         * a box need 4 lines to be connected
         */
        if (connectedLines.length == 4) {
            closeBox(box);
        }
    }

    function checkTop(lineIndex, width) {
        /**
         * 'lineIndex' of 3 (width - 1) or less means it's the first row of lines.
         * The first row has no top box.
         */
        if (lineIndex >= width) {
            /**
             * find all top box lines and check if it is clocked
             */

            findBoxLines(lineIndex, [
                - ((width * 2) + 1), // top line
                - width, // right line
                0, // bottom line
                - (width + 1) // left line
            ]);
            
        }
    }
    
    function checkBottom(lineIndex, width) {
        /**
         * 'lineIndex' of 36 (((width * 2) + 1) * width) or more means it's the last row of lines.
         * The last  row has no bottom box.
         */
        if (lineIndex < ((width * 2) + 1) * width) {
            /**
             * find all bottom box lines and check if the box is clocked
             */
            findBoxLines(lineIndex, [
                0, // top line
                width + 1, // right line
                (width * 2) + 1, // bottom line
                width // left line
            ]);
        }
    }
    
    function checkRight(lineIndex, width) {
        /**
         * The last column of lines start at index 8 (width * 2).
         * Every other lineIndex in this column is an increment by 9 ((width * 2) + 1).
         * The last column has no right box
         */
        if (lineIndex % (width * 2 + 1) !== width * 2) {
            /**
             * find all right box lines and check if the box is clocked
             */
            findBoxLines(lineIndex, [
                - width, // top line
                1, // right line
                (width + 1), // bottom line
                0 // left line
            ]);
        }
    }
    
    function checkLeft(lineIndex, width) {
        /**
         * The first column of lines start at index 4 (width).
         * Every other lineIndex in this column is an increment by 9 ((width * 2) + 1).
         * The first column has no left box
         */
        if (lineIndex % ((width * 2) + 1) !== width) {
            /**
             * find all left box lines and check if the box is clocked
             */
            findBoxLines(lineIndex, [
                - (width + 1), // top line
                0, // ) right line
                width, // bottom line
                - 1 // left line
            ]);
        }
    }
    
    function draw() {
        var lineRow = drawLineRow(this.width);
        var boxRow = drawBoxRow(this.width);

        var html = Array.apply(null, {
            length: this.height + 1
        })
        .map(function () {
            return lineRow;
        })
        .join(boxRow);

        $board.html(html)
            .width((BOX_SIZE * this.width) + (DOT_SIZE * (this.width + 1)))
            .height((BOX_SIZE * this.height) + (DOT_SIZE * (this.height + 1)))
        ;
        
        $lines = $board.find('.' + LINE_CLS);
    }
    
    function addPlayer(name) {
        players.push(new Player(name));
    }  
    
    
    function addEvents() {
        $('.' + LINE_CLS).on('click', { self: this }, function (event) {
            var self = event.data.self,
                $line = $(this);

            if (!$line.hasClass(CONNECTED_CLS)) {
                var lineIndex = $lines.index($line);
                
                currentPlayer = players[turn % players.length];

                $line.addClass(CONNECTED_CLS)
                    .addClass(currentPlayer.className);
    
                /**
                 * For horizontal lines check both top and bottom boxes
                 *  ____
                 * |    | top box
                 * |____|
                 * |    |
                 * |____| bottom box
                 *
                 * For vertical lines check both left and right boxes
                 *  ____ ____
                 * |    |    |
                 * |____|____|
                 * left  right
                 *
                 */
                
                 // horizontal lines
                if ($line.hasClass(HLINE_CLS)) {
                    checkTop(lineIndex, self.width);
                    checkBottom(lineIndex, self.width);                                
                }

                // vertical lines clicked
                if ($line.hasClass(VLINE_CLS)) {
                    checkLeft(lineIndex, self.width);
                    checkRight(lineIndex, self.width);
                }
                
                var closedBoxes = $('.' + CLOSED_CLS).size();
                
                if (closedBoxes < self.width * self.height) {
                    nextTurn();
                    
                    trigger('player:turn', currentPlayer.name);
                } else {                                
                    trigger('end');
                }
            }
        });
    }
        
    function on(event, fn) {
        events[event] = fn;
    }
    
    function init() {
        draw.bind(this).call();
        addEvents.bind(this).call();
    }
    
    function Player(name) {
        this.name = name;
        this.className = name.toLowerCase().replace(/ /g, '');
        this.score = 0;
    }

    function Board(context, width, height) {
        this.width = width || DEFAULT_WIDTH;
        this.height = height || DEFAULT_HEIGHT;
        
        $board = $(context);
    }
        
    Board.prototype.on = on;    
    Board.prototype.addPlayer = addPlayer;    
    Board.prototype.init = init;
    
    return Board;    
}(jQuery));