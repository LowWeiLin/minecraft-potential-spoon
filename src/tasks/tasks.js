// @flow
'use strict';

var _ = require('lodash');
var util = require('util');

var bot, botUsername, mineflayer;

type Bot = Object;
type Block = Object;

// http://www.minecraftinfo.com/idlist.htm
const AIR = 0;
const DIRT = 3;
const GRAVEL = 13;
const SWORD = 267;
const STONE_SHOVEL = 273;


module.exports = function (theBot: Bot, theBotUsername: string, theMineflayer: Object) {
    bot = theBot;
    botUsername = theBotUsername;
    mineflayer = theMineflayer;
    face('N');
    return {
        face,
        sayItems,
        keepDigging,
        buildUnder,
        equipItem,
        findTargetNear,
        getPlayerByUsername,
        moveTo,
        acceptTpaRequests,
        myItems,
        tossOne,
        tossAll,
        digStairTask,
        digForwardTask,
        blockUnderneath,
        grindGravel,
        repeat,
        DIRT, GRAVEL, SWORD, // TODO do something more exhaustive
    };
};

function face(direction: string) {
  switch(direction) {
    case 'N':
      bot.facing = mineflayer.vec3(0,0,-1);
      break;
    case 'S':
      bot.facing = mineflayer.vec3(0,0,1);
      break;
    case 'E':
      bot.facing = mineflayer.vec3(1,0,0);
      break;
    case 'W':
      bot.facing = mineflayer.vec3(-1,0,0);
      break;
  }
}

function facingOffset() {
  return bot.entity.position.offset(bot.facing.x,bot.facing.y,bot.facing.z);
}

var findTargetNear = getRandomPlayer;

function getPlayerByUsername(bot: Bot, username: string): ?Object {
  return bot.players[username] && bot.players[username].entity;
}

function getRandomPlayer(bot: Bot): ?Object {
  var name = Object.keys(bot.players).filter(function(p) {
    return p != botUsername;
  })[0];
  return bot.players[name] && bot.players[name].entity;
}

function sayItems(items?: Object[]) {
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

function isSafe(block) {
  return !bot.navigate.blocksToAvoid[block.type];
}

function findSafeStandingBlockForward(): ?Block {
  for (var i=0 ; i<3 ; i++) {
    var block = bot.blockAt(facingOffset().offset(0, -i, 0));
    if (isSafe(block) && block.type !== AIR) {
      return block;
    }
  }
  return null;
}

function blockUnderneath(): Block {
  return bot.blockAt(bot.entity.position.offset(0, -1, 0));
}

function digTask(targetBlock) {
  return new Promise((resolve, reject) => {
    bot.dig(targetBlock, function () {
      resolve();
    });
  });
}

function adjacentPositions(position: Object): Array<Object> {
  var adj = [];
  adj.push(position.offset(1, 0, 0));
  adj.push(position.offset(-1, 0, 0));
  adj.push(position.offset(0, 1, 0));
  adj.push(position.offset(0, -1, 0));
  adj.push(position.offset(0, 0, 1));
  adj.push(position.offset(0, 0, -1));
  return adj;
}

function safeDig(position?: Object) {
  position = position ? position : facingOffset().offset(0, -1, 0)
  // Check blocks adjacent to target before digging.
  var adjPositions = adjacentPositions(position);
  for (var i=0 ; i<adjPositions.length ; i++) {
    var block = bot.blockAt(adjPositions[i]);
    if (!isSafe(block)) {
      bot.chat("It's not safe to dig any further! " + "There is " + block.type);
      return Promise.resolve();
    }
  }
  return dig(position);
}

function dig(position?: Object): Promise<void> {
  position = position ? position : bot.entity.position.offset(0, -1, 0)
  if (bot.targetDigBlock) {
    bot.chat('already digging ' + bot.targetDigBlock.name);
    return Promise.resolve();
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

function digWallTask(height: number): Promise<void> {
  if (height === 0) {
    return Promise.resolve();
  } else {
    return safeDig(center(facingOffset().offset(0,height-1,0)))
              .then(() => digWallTask(height-1));
  }
}

function digForwardTask(steps:number, height?: number): Promise<void> {
  // Height of 2-5
  var h = height || 2;
  h = Math.min(h, 5);
  h = Math.max(h, 2);
  if (steps === 0) {
    bot.chat("I'm done digging forward!");
    return Promise.resolve();
  } else {
    var nextBlock = findSafeStandingBlockForward();
    var nextPosition = bot.entity.position;
    if (nextBlock) {
      nextPosition = center(nextBlock.position.offset(0,1,0));
      return digWallTask(h).then(() => moveTo(nextPosition))
                           .then(() => sleep(500))
                           .then(() => digForwardTask(steps-1, h));
    } else {
      return digWallTask(h).then(()=>{
        bot.chat("Its not safe to go any further!");
        return Promise.resolve();
      });
    }
  }
}

function digStairTask(steps: number, height?: number): Promise<void> {
  // Height of 2-5
  var h = height || 2;
  h = Math.min(h, 5);
  h = Math.max(h, 2);
  if (steps === 0) {
    return Promise.resolve();
  } else {
    var nextBlock = findSafeStandingBlockForward();
    var nextPosition = bot.entity.position;
    if (nextBlock != null) {
      nextPosition = center(nextBlock.position.offset(0,1,0));
      return safeDig().then(() => sleep(1000))
                  .then(() => digWallTask(h))
                  .then(() => moveTo(nextPosition))
                  .then(() => sleep(100))
                  .then(() => digStairTask(steps-1, h));
    } else {
      return digWallTask(h).then(()=>{
        bot.chat("Its not safe to go any further!");
        return Promise.resolve();
      });
    }
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


function keepDigging(n: number): Promise<void> {
  if (n === 0) {
    // bot.chat('finished digging');
    return Promise.resolve();
  } else {
    return dig().then(() => sleep(1000))
                .then(() => keepDigging(n - 1));
  }
}

function buildUnder(): Promise<void> {
  return new Promise((resolve, reject) => {
    var referenceBlock = blockUnderneath();

    var jumpY = bot.entity.position.y + 1.0;
    bot.setControlState('jump', true);
    bot.on('move', placeIfHighEnough);

    function placeIfHighEnough() {
      if (bot.entity.position.y > jumpY) {
        bot.placeBlock(referenceBlock, mineflayer.vec3(0, 1, 0), function(err) {
          if (err) {
            reject(err);
          } else {
            // bot.chat('Placing a block was successful');
            resolve();
            bot.setControlState('jump', false);
            bot.removeListener('move', placeIfHighEnough);
          }
        });
      }
    }
  }).then(() => sleep(200));
}

function equipItem(id: number): Promise<void> {
  return new Promise((resolve, reject) => {
    bot.equip(id, 'hand', function(err) {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  }).then(() => sleep(200));
};

function itemToString(item): string {
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

function moveTo(goalPosition: Object): Promise<void> {
  goalPosition = center(goalPosition);
  if (goalPosition.distanceTo(bot.entity.position) <= 0.1) {
    return Promise.resolve();
  }

  var result = bot.navigate.findPathSync(goalPosition, {
    timeout: 1000
  });

  console.log(util.format('status: %s, path length: %d',
    result.status, result.path.length));

  if (result.path.length < 1) {
    return Promise.resolve();
  } else if (result.status === 'success') {
    return navigateTo(result.path);
  } else if (result.status === 'noPath') {
    return Promise.resolve();
  } else {
    return navigateTo(result.path);
  }
}

function acceptTpaRequests(bot: Bot, message: Object) {
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

var tossAll = function() {
  return new Promise((resolve, reject) => {
    return tossOne().then(() => sleep(500))
                    .then(() => tossAll());
    });
}

function getInventoryCountOf(id: number): number {
  var slotsOfId = _.filter(bot.inventory.slots, i => i && i.type === id);
  return _.sumBy(slotsOfId, i => i.count);
}

function repeat<T>(n: number, action: () => Promise<T>): Promise<T[]> {
  if (n === 0) {
    return Promise.resolve([]);
  } else {
    return action().then(result =>
      repeat(n - 1, action).then(rest =>
        [result].concat(rest)));
  }
}

function grindGravel(): Promise<void> {
  const BUILD = true;
  const DIG = false;

  function aux(state: boolean, flipflops: number): Promise<void> {

    // flipflops only increments beyond this point when there is no
    // gravel in the bot's inventory and no gravel to mine, i.e. we
    // should stop. It's a bit ugly so hopefully we can find a nicer
    // alternative.

    if (flipflops > 5) {
      bot.chat('done grinding gravel');
      return Promise.resolve();
    } else if (state === BUILD) {
      if (getInventoryCountOf(GRAVEL) > 0) {
        return equipItem(GRAVEL)
          .then(() => buildUnder(GRAVEL))
          .catch(err => {
            // It's possible this happens due to races on the inventory state.
            // Currently we sleep to mitigate this, but if that fails... try
            // digging instead...?
            console.log('could not place block', err);
            return aux(DIG, 0);
          })
          .then(() => aux(BUILD, 0))
      } else {
        return aux(DIG, flipflops + 1);
      }
    } else if (state === DIG) {
      if (blockUnderneath().type === GRAVEL) {
        return equipItem(STONE_SHOVEL)
          .catch(() => {
            bot.chat("my shovel is gone BUT I MUST DIG");
            return Promise.resolve();
          })
          .then(() => keepDigging(1))
          .then(() => aux(DIG, 0))
          .catch(err => {
            console.log('error while digging', err, err.stack);
            return aux(BUILD, 0);
          });
      } else {
        return aux(BUILD, flipflops + 1);
      }
    } else {
      console.log('invalid state', state);
      return Promise.resolve();
    }
  }
  return aux(BUILD, 0);
}