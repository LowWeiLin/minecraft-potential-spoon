var vec3 = require('vec3');
var Vec3 = vec3.Vec3;

module.exports = inject;

function inject(bot) {
  
  function blockIsNotEmpty(pos) {
    var block = bot.blockAt(pos);
    return block!==null && block.boundingBox!=="empty";
  }

  yawPitchToVec = function(yaw, pitch) {
    var z = - Math.cos(yaw);
    var y = Math.sin(pitch);
    var x = Math.sin(-yaw);
    return new Vec3(x,y,z);
  }

  rayCast = function(from, to) {
    var v=to.minus(from);
    var t=Math.sqrt(v.x*v.x+v.y*v.y+v.z*v.z);
    v=v.scaled(1/t);
    v=v.scaled(1/5);
    var u=t*5;
    var na;
    for(var i=1;i<u;i+=0.1) {
      na=from.plus(v);
      // check that blocks don't inhabit the same position
      if(!na.floored().equals(from.floored())) {
        // check block is not transparent
        if(blockIsNotEmpty(na)) return na;
      }
      from=na;
    }
    return false;
  }

  bot.rayCastYawPitch = function(pos, yaw, pitch, dist) {
    var unitVec = yawPitchToVec(yaw, pitch);
    var v = unitVec.scaled(dist);
    return rayCast(pos, pos.plus(v));
  }
}