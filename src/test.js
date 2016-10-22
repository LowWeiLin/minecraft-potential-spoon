// World state, changes over time

// Can be a task queue, or just some state like this
var enemiesNearby = true;

setInterval(() => enemiesNearby = !enemiesNearby, 1500);

// Simulates some async task

function task(description) {
  console.log('started', description);
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      console.log('done', description);
      resolve(description);
    }, 1000);
  });
}

// High-level API

function move(previous) {
  return task('moving');
}

function attack(previous) {
  return task('attacking');
}

function dig(previous) {
  return task('digging');
}

function checkBlocks(previous) {
  return task('checking blocks');
}

// APIs compose

function attackEnemies() {
  return move()
    .then(attack)
    .then(checkWorldState);
}

function keepDigging() {
  return move()
    .then(dig)
    .then(move)
    .then(checkBlocks)
    .then(checkWorldState);
}

// Entry point

function checkWorldState(previousTask) {
  if (previousTask) {
    console.log('checking world state after', previousTask);
  }
  if (enemiesNearby) {
    return attackEnemies();
  } else {
    return keepDigging();
  }
}

checkWorldState();