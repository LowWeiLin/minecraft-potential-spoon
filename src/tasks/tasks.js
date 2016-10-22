//@ flow

var util = require('util');
var _ = require('lodash');
var bot, mineflayer;

module.exports = function (theBot, theMineflayer) {
    bot = theBot;
    mineflayer = theMineflayer;
    return {
        sayItems,
        keepDigging,
        build,
        equipSword,
        equipDirt,
        findTargetNear,
        getPlayerByUsername,
        moveTo,
        acceptTpaRequests,
        myItems,
        tossOne,
        tossAll,
        digStairTask,
    };
};

var findTargetNear = getRandomPlayer;

function getPlayerByUsername(bot, username): ?Object {
  return bot.players[username] && bot.players[username].entity;
}

function getRandomPlayer(bot): ?Object {
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

function sleep(ms) {
  return new Promise((resolve, reject) => {
    setTimeout(function() {
      resolve();
    }, ms);
  });
}

function digTask(targetBlock) {
  return new Promise((resolve, reject) => {
      bot.dig(targetBlock, function () {
        resolve();
      });
    });
}

function dig(position) {
  position = position ? position : bot.entity.position.offset(0, -1, 0)
  if (bot.targetDigBlock) {
    bot.chat('already digging ' + bot.targetDigBlock.name);
  } else {
    var target = bot.blockAt(position);
    if (target && bot.canDigBlock(target)) {
      return digTask(target);
    } else {
      bot.chat('cannot dig');
      return Promise.resolve();
    }
  }
}

var digWallTask = function(height) {
  if (height === 0) {
    return Promise.resolve();
  } else {
    return dig(center(bot.entity.position.offset(1,height-1,0)))
              .then(()=>{return digWallTask(height-1)});
  }
}

function digStairTask(steps, height) {
  // Height of 2-5
  height = height === undefined? 2 : height;
  height = Math.min(height, 5);
  height = Math.max(height, 2);
  console.log('height' + height);
  if (steps === 0) {
    console.log('done');
    return Promise.resolve();
  } else {
    console.log('dig step ' + steps);

    // Dig down
    return dig().then(()=>{return sleep(1000)})

                // // Dig front
                // .then(()=>{return dig(center(bot.entity.position.offset(1,0,0)))})
                // // Dig front and up
                // .then(()=>{return dig(center(bot.entity.position.offset(1,1,0)))})
                .then(()=>{return digWallTask(height)})

                // Move forward
                .then(()=>{return moveTo(center(bot.entity.position.offset(1,0,0)))})
                .then(()=>{return sleep(100)})
                // Repeat
                .then(()=>{return digStairTask(steps-1, height)});
  }
}

var world = false;

function magic(promise) {
  return {
    then: function (cont) {
      return promise.then((value) => {
        if (world) {
          console.log('stop');
          return interrupt(cont, value);
        } else {
          return cont(value);
        }
      });
    },
    catch: function (cont) {
      // figure out
    }
  };
}

function interrupt(cont, value) {
  console.log('interrupted');
  return Promise.resolve();
}


function keepDigging(n) {
  if (n === 0) {
    bot.chat('finished digging');
    return Promise.resolve();
  } else {
    return dig().then(() => {return sleep(1000)})
                .then(() => {return keepDigging(n - 1);
    });
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

function navigateTo(path) {
  return new Promise((resolve, reject) => {
    bot.navigate.walk(path, function() {
        resolve();
      });
  });
}

function moveTo(goalPosition) {
  goalPosition = center(goalPosition);
  if (goalPosition.distanceTo(bot.entity.position) <= 0.1) {
    return Promise.resolve();
  }

  var result = bot.navigate.findPathSync(goalPosition, {
    timeout: 5000
  });

  console.log(util.format('status: %s, path length: %d',
    result.status, result.path.length));

  if (result.path.length <= 1) {
    return Promise.resolve();
  } else if (result.status === 'success') {
    return navigateTo(result.path);
  } else if (result.status === 'noPath') {
    return Promise.resolve();
  } else {
    return navigateTo(result.path);
  }
}

function acceptTpaRequests(bot, message) {
  if (!message.extra || message.extra.length !== 3) {
    return;
  }
  var msgExtra0 = "To teleport, type ";
  var msgExtra1 = "/tpaccept";
  if (message.extra[0].text == msgExtra0 && message.extra[1].text == msgExtra1) {
    bot.chat('/tpaccept');
  }
}

function myItems()
{
  var items={};
  bot.inventory.items().forEach(function(item) {
    if(items[item.name]===undefined) items[item.name]=0;
    items[item.name]+=item.count;
  });
  var nitems=[];
  for(var i in items)
  {
    nitems.push([i,items[i]]);
  }
  return nitems;
}

var toss = function(type, count) {
  return new Promise((resolve, reject) => {
    bot.toss(type, null, count, function() {
      resolve();
    });
  }).catch(err => {
    console.log(err.stack);
  });
}

var tossOne = function() {
  return new Promise((resolve, reject) => {
    var items = bot.inventory.items();
    if (items.length === 0) {
      bot.chat('I got no items =(');
      return Promise.resolve();
    } else {
      return toss(items[0].type, items[0].count).then(()=>{resolve()});
    }
  });
}

var tossAll = function(type, count) {
  return new Promise((resolve, reject) => {
    return tossOne().then(()=>{return sleep(500)})
                    .then(()=>{return tossAll()});
    });
}
