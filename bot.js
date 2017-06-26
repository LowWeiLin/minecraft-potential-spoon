var mineflayer = require('mineflayer');
var blockFinderPlugin = require('mineflayer-blockfinder')(mineflayer);
var bot = mineflayer.createBot({
  host: "139.162.13.18",
  port: 25565,
  username: 'bot0',
});
(require('mineflayer-navigate'))(mineflayer)(bot);

bot.on('login', function() {
  require('mineflayer-auto-auth')(bot, {
    logging: true,
    password: 'botbot',
    ignoreRepeat: true,
  });
  blockFinderPlugin(bot);
  require('./treeFinder.js')(bot);
  require('./nearestEntity.js')(bot);
  require('./rayCast.js')(bot);
});

bot.on('serverAuth', function() {
  bot.chat("I'm ready!");
});


bot.on('chat', function(username, message) {
  // navigate to whoever talks
  if (username === bot.username) return;
  var target = bot.players[username].entity;
  if (message === 'come') {
    bot.navigate.to(target.position);
  } else if (message === 'stop') {
    bot.navigate.stop();
  } else if (message === 'tree') {
    bot.findTree();
  } else if (message === 'look') {
    var entity = bot.nearestEntity('player');
    if (entity) {
      var entityLookAtPos = bot.rayCastYawPitch(entity.position.offset(0, entity.height, 0), entity.yaw, entity.pitch, 64*3);
      if (entityLookAtPos) {
        bot.chat("Look at " + entityLookAtPos + " !");
        bot.lookAt(entityLookAtPos);
      } else {
        bot.chat("Look at... ?");
        bot.look(entity.yaw, entity.pitch);
      }
    }
  } else if (message === 'go') {
    var entity = bot.players[username].entity;
    if (entity) {
      console.log(entity.yaw + " " +  entity.pitch);
      var entityLookAtPos = bot.rayCastYawPitch(entity.position.offset(0, 1.62, 0), entity.yaw, entity.pitch, 64*3);
      if (entityLookAtPos !== false) {
        bot.chat("Going to " + entityLookAtPos.offset(0, 1, 0) + " !");
        bot.navigate.to(entityLookAtPos.offset(0, 1, 0));
      } else {
        bot.chat("Go to... ?");
      }
    }
  }
});

bot.navigate.on('pathFound', function (path) {
  bot.chat("found path. I can get there in " + path.length + " moves.");
});
bot.navigate.on('cannotFind', function (closestPath) {
  bot.chat("unable to find path. getting as close as possible");
  bot.navigate.walk(closestPath);
});
bot.navigate.on('arrived', function () {
  bot.chat("I have arrived");
});
bot.navigate.on('interrupted', function() {
  bot.chat("stopping");
});