var mineflayer = require('mineflayer');
var util = require('util');
var _ = require('lodash');

if (process.argv.length < 2 || process.argv.length > 5) {
  console.log('Usage : node bot.js [<host>] [<port>] [<name>]');
  process.exit(1);
}

var botUsername = process.argv[4] || 'botbot';

var bot = mineflayer.createBot({
  host: process.argv[2] || 'localhost',
  port: process.argv[3] || 25565,
  username: botUsername
});
require('mineflayer-auto-auth')(bot, 'pass123');

console.log(process.argv);

(require('mineflayer-navigate'))(mineflayer)(bot);

bot.on('chat', function(username, message) {
  if (username === bot.username) return;
  switch (message) {
    case 'list':
      sayItems();
      break;
    case 'dig':
      digDown();
      break;  
    case 'dig south':
      digSouth();
      break;
    case 'dig staircase':
      digStaircase();
      break;
    case 'build':
      build();
      break;
    case 'equip dirt':
      equipDirt();
      break;
    case 'equip sword':
      equipSword();
      break;
    case 'do':
      bot.chat('activating item');
      bot.activateItem();
      bot.deactivateItem();
      break;
    case 'attack':
      bot.chat('die');
      var target = findTargetNear(bot);
      if (target) {
        bot.attack(target);
      }
      break;
    case 'come':
      bot.chat('stop being so impatient');
      var target = findTargetNear(bot);
      if (target) {
        moveTo(bot, target.position, function() {
          bot.chat('sup');
        });
      }
      break;
    case 'stop':
      bot.navigate.stop();
      break;
  }
});

var findTargetNear = getRandomPlayer;

function getRandomPlayer(bot) {
  var name = Object.keys(bot.players).filter(function(p) {
    return p != botUsername;
  })[0];
  return bot.players[name] && bot.players[name].entity;
}

function sayItems(items) {
  items = items || bot.inventory.items();
  var output = items.map(itemToString).join(', ');
  if (output) {
    bot.chat(output);
  } else {
    bot.chat('empty');
  }
}

function digDown() {
  dig(bot.entity.position.offset(0, -1, 0));
}

function digSouth() {
  dig(bot.entity.position.offset(1, 0, 0));
}

function dig(position, callback) {
  if (!callback) {
    callback = onDiggingCompleted;
  }

  if (bot.targetDigBlock) {
    bot.chat('already digging ' + bot.targetDigBlock.name);
  } else {
    var target = bot.blockAt(position);
    if (target && bot.canDigBlock(target)) {
      bot.chat('starting to dig ' + target.name);
      bot.dig(target, callback);
    } else {

      bot.chat('cannot dig');
      callback(':(');
    }
  }

  function onDiggingCompleted(err) {
    if (err) {
      console.log(err.stack);
      return;
    }
    bot.chat('finished digging ' + target.name);
  }
}

function digStaircase() {
  var offsets = [[0, -1, 0], [1, 0, 0], [1, 1, 0], [1, 0, 0]];

  var p = Promise.resolve();
  _.times(50, () =>
    _.forEach(offsets, function(offset, index) {
      p = p.then(function() {
        return digAndMoveAsPromise( { 
          offset: offset
        } );  
      }).catch(function (err) {
        console.log("can't dig");
      });
    })
  );

  p.then(function() {
    bot.chat('finish dig');
  }).catch(function (err) {
    console.error(err.stack);
  });

  Promise.resolve(p);
}

function digAndMoveAsPromise(opt) {
  return new Promise(function(resolve, reject) {
    digAndMove(opt, function(err) {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
}

function digAndMove(opt, callback) {
  if (!opt) {
    opt = {};
  }
  var offset = opt.offset || [0, -1, 0];
  var position = bot.entity.position.offset(offset[0], offset[1], offset[2]);
  
  dig(position, moveToPosition);

  function moveToPosition(err) {
    if (err) {
      callback(err);
    }
    moveTo(bot, position, callback);
  }
}

function build() {
  var referenceBlock = bot.blockAt(bot.entity.position.offset(0, -1, 0));

  var jumpY = bot.entity.position.y + 1.0;
  bot.setControlState('jump', true);
  bot.on('move', placeIfHighEnough);

  function placeIfHighEnough() {
    if (bot.entity.position.y > jumpY) {
      bot.placeBlock(referenceBlock, mineflayer.vec3(0, 1, 0), function(err) {
        if (err) {
          bot.chat(err.message);
          return;
        }
        bot.chat('Placing a block was successful');
      });
      bot.setControlState('jump', false);
      bot.removeListener('move', placeIfHighEnough);
    }
  }
}

function equipDirt() {
  bot.equip(0x03, 'hand', function(err) {
    if (err) {
      bot.chat('unable to equip dirt: ' + err.message);
    } else {
      bot.chat('equipped dirt');
    }
  });
}

// http://www.minecraftinfo.com/idlist.htm
function equipSword() {
  bot.equip(267, 'hand', function(err) {
    if (err) {
      bot.chat('unable to equip sword: ' + err.message);
    } else {
      bot.chat('equipped sword');
    }
  });
}

function itemToString(item) {
  if (item) {
    return item.name + ' x ' + item.count;
  } else {
    return '(nothing)';
  }
}

function center(p) {
  return p.floored().offset(0.5, 0, 0.5);
}

// Taken from https://github.com/rom1504/rbot/blob/e3823d4d974a7cfdfc358a7007582c22bee1b4f6/task/moveTask.js#L80-L98
function moveTo(bot, goalPosition, done) {
  goalPosition = center(goalPosition);
  if (!(goalPosition && goalPosition.distanceTo(bot.entity.position) >= 0.2)) {
    done();
  }

  var result = bot.navigate.findPathSync(goalPosition, {
    timeout: 5000
  });

  console.log(util.format('status: %s, path length: %d',
    result.status, result.path.length));

  if (result.path.length <= 1) {
    done();
  } else if (result.status === 'success') {
    bot.navigate.walk(result.path, done);
  } else if (result.status === 'noPath') {
    done();
  } else {
    bot.navigate.walk(result.path, function() {
      moveTo(bot, goalPosition, done);
    });
  }
}