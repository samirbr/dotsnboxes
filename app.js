$(function () {        
    var board = new Board('#board', 4, 4);            
    board.addPlayer('Player 1');
    board.addPlayer('Player 2');
    board.on('player:score', function (className, score) {
        $('#score .' + className + ' .score').text(score);
    });
    board.on('player:turn', function (name) {
        $('#turn').text(name);
    });
    board.on('end', function (result) {
        alert('GAME END');
    });
    board.init();
    
});