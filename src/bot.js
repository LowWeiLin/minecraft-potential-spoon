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

var tasks = require('./tasks/tasks')(bot, botUsername, mineflayer);

console.log(process.argv);

(require('mineflayer-navigate'))(mineflayer)(bot);

bot.on('message', function(message) {
  var chatPattern = /\[(.+?)?\] (.+): (.*)$/
  var match;
  var stringMsg = message.toString();
  if(match = stringMsg.match(chatPattern)) {
    var tag = match[1];
    var username = match[2];
    var msg = match[3];
    bot.emit('chat', username, msg, null, {text: stringMsg}, match)
    return;
  }

  tasks.acceptTpaRequests(bot, message);
});

bot.on('chat', function(username, message) {
  if (username === bot.username) return;
  var splitMessage = message.split(' ');
  try {
    if (!(new RegExp('^' + splitMessage[0]).test(bot.username))) return;
  } catch (err) {
    return;
  }
  var messageTo = [];
  var botIndex = 0;
  for (var k in bot.players){
    if (new RegExp('^' + splitMessage[0]).test(k)) {
      messageTo.push(k);
    }
  }
  messageTo.sort();
  botIndex = messageTo.indexOf(bot.username);

  message = splitMessage.slice(1).join(' ').trim();

  var commandGiverEntity = bot.players[username] ? bot.players[username].entity : undefined;
  if (commandGiverEntity !== undefined) {
    var headYaw = commandGiverEntity.headYaw % (2.0*Math.PI);
    var facing = Math.floor((headYaw + Math.PI/4.0) / (Math.PI/2.0)) % 4;
    facing = ['N', 'W', 'S', 'E'][facing];
    tasks.face(facing);
  }

  switch (message) {
    case 'face N':
    case 'face S':
    case 'face E':
    case 'face W':
      tasks.face(message.split(' ')[1]);
      break;
    case 'list':
      tasks.sayItems();
      break;
    case 'dig':
      tasks.keepDigging(10);
      break;
    case 'build':
      tasks.buildUnder();
      break;
    case 'digStair':
      tasks.digStairTask(10);
      break;
    case 'digForward':
      tasks.digForwardTask(10);
      break;
    case 'list':
      var output=tasks.myItems().map(function(a){return a[0]+":"+a[1];}).join(", ");
      bot.chat(output);
      break;
    case 'toss':
      bot.look(0,0,true);
      tasks.tossAll();
      break;
    case 'equip dirt':
      tasks.equipItem(tasks.DIRT);
      break;
    case 'equip sword':
      tasks.equipItem(tasks.SWORD);
      break;
    case 'equip gravel':
      tasks.equipItem(tasks.GRAVEL);
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
      bot.chat('On the way boss');
      var target = tasks.getPlayerByUsername(bot, username);
      if (target) {
        tasks.moveTo(target.position, 10).then(() => {
          bot.chat('Hey im at ' + bot.entity.position.toString());
        });
      } else {
        bot.chat('/tpa ' + username);
      }
      break;
    case 'line1':
    case 'line2':
      var n = parseInt(message[4]);
      bot.chat('On the way boss');
      var target = tasks.getPlayerByUsername(bot, username);
      var position = target?target.position:mineflayer.vec3(0,0,0);
      
      for (var i=0 ; i<botIndex*n ; i++) {
        position = position.offset(bot.facing.x,bot.facing.y,bot.facing.z);
      }
      if (target) {
        tasks.moveTo(position).then(() => {
          bot.chat('Hey im at ' + bot.entity.position.toString());
        });
      } else {
        bot.chat('/tpa ' + username);
      }
      break;
    case 'stop':
      bot.navigate.stop();
      break;
    case 'grind gravel':
      tasks.grindGravel();
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
repl.context.ld = _;
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
