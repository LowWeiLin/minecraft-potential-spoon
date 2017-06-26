
module.exports = inject;

function inject(bot) {
  bot.findTree = function(){
    bot.findBlock({
      point: bot.entity.position,
      matching: 17,
      maxDistance: 64,
      count: 1,
    }, function(err, blocks) {
      if (err) {
        return bot.chat('Error trying to find tree: ' + err);
        return;
      }
      if (blocks.length) {
        bot.chat('I found '+ blocks.length + ' blocks.');
        bot.chat('First block at ' + blocks[0].position + '.');
        return;
      } else {
        bot.chat("I couldn't find blocks.");
        return;
      }
    });
  }
}