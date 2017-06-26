var mineflayer = require('mineflayer');
var bot = mineflayer.createBot({
  host: "139.162.13.18",
  port: 25565,
  username: 'bot0',
});

bot.on('login', function() {
  require('mineflayer-auto-auth')(bot, {
    logging: true,
    password: 'botbot',
    ignoreRepeat: true,
  });
});

bot.on('serverAuth', function() {
  // Here bot should be already authorized
  bot.chat("I'm ready!");
});

bot.on('chat', function(username, message) {
  if(username === bot.username) return;
  bot.chat(message);
});

// bot.on('message', function(jsonMessage) {
//   console.log(JSON.stringify(jsonMessage));
// });
