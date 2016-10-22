// @flow
'use strict';

var _ = require('lodash');
var mineflayer = require('mineflayer');
var repl = require('repl');

if (process.argv.length < 2 || process.argv.length > 5) {
  console.log('Usage : node bot.js [<host>] [<port>] [<name>]');
  process.exit(1);
}

var botUsername = process.argv[4] || 'botbot';

var bot = mineflayer.createBot({
  host: process.argv[2] || 'localhost',
  port: +process.argv[3] || 25565,
  username: botUsername
});

require('mineflayer-auto-auth')(bot, 'pass123');

var tasks = require('./tasks/tasks')(bot, mineflayer);

console.log(process.argv);

(require('mineflayer-navigate'))(mineflayer)(bot);

// http://www.minecraftinfo.com/idlist.htm
const DIRT = 3;
const GRAVEL = 13;
const SWORD = 267;

bot.on('message', function(message) {
  tasks.acceptTpaRequests(bot, message);
});

bot.on('chat', function(username, message) {
  if (username === bot.username) return;
  if (!_.startsWith(message, bot.username + ' ')) return;
  message = _.replace(message, bot.username + ' ', '');
  switch (message) {
    case 'list':
      tasks.sayItems();
      break;
    case 'dig':
      tasks.keepDigging(10);
      break;
    case 'build':
      tasks.build();
      break;
    case 'digStair':
      tasks.digStairTask(10);
      break;
    case 'listItems':
      var output=tasks.myItems().map(function(a){return a[0]+":"+a[1];}).join(", ");
      bot.chat(output);
      break;
    case 'toss':
      bot.look(0,0,true);
      tasks.tossOne();
      break;
    case 'tossAll':
      bot.look(0,0,true);
      tasks.tossAll();
      break;
    case 'equip dirt':
      tasks.equipItem(DIRT);
      break;
    case 'equip sword':
      tasks.equipItem(SWORD);
      break;
    case 'equip gravel':
      tasks.equipItem(GRAVEL);
      break;
    case 'do':
      bot.chat('activating item');
      bot.activateItem();
      bot.deactivateItem();
      break;
    case 'attack':
      bot.chat('die');
      var target = tasks.findTargetNear(bot);
      if (target) {
        bot.attack(target);
      }
      break;
    case 'jump':
      bot.setControlState('jump', true);
      bot.setControlState('jump', false);
      break;
    case 'come':
      bot.chat('stop being so impatient');
      var target = tasks.getPlayerByUsername(bot, username);
      if (target) {
        tasks.moveTo(target.position, 10).then(() => {
          bot.chat('sup, im at ' + bot.entity.position.toString());
        });
      }
      break;
    case 'stop':
      bot.navigate.stop();
      break;
  }
});

console.log("\nType 'help()' to see exposed functions");
var repl = repl.start('> ');

repl.context.help = () => {
  for (let p in tasks) {
    console.log(p);
  }
};
repl.context.bot = bot;
repl.context.mineflayer = mineflayer;
for (let p in tasks) {
  if (tasks.hasOwnProperty(p)) {
    if (repl.context[p]) {
      console.warn('Warning: REPL object already has property', p);
    } else {
      repl.context[p] = tasks[p];
    }
  }
}

repl.on('exit', () => {
  bot.quit();
  process.exit();
});
