
module.exports = inject;

function inject(bot) {
  bot.nearestEntity = function(type) {
    var id, entity, dist;
    var best = null;
    var bestDistance = null;
    for(id in bot.entities) {
      entity = bot.entities[id];
      if(type && entity.type !== type) continue;
      if(entity === bot.entity) continue;
      dist = bot.entity.position.distanceTo(entity.position);
      if(!best || dist < bestDistance) {
        best = entity;
        bestDistance = dist;
      }
    }
    return best;
  }
}