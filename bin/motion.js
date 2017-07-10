//*********************************************
// COPY THIS FILE TO: 
// node_modules/gcanvas/lib/
// (overwrite motion.js)
//*********************************************
module.exports = Motion;

var Point = require('./math/point')
  , Path = require('./path')
  , SubPath = require('./subpath')
  , utils = require('./utils');

function Motion(ctx) {
  this.ctx = ctx;
  this.position = new Point(0,0,0);
  this.position.a = 0;
}

Motion.prototype = {
  retract: function() {
    this.rapid({z:this.ctx.retract});
  }
, plunge: function() {
    this.rapid({z:-this.ctx.top});
  }
, zero: function(params) {
    this.ctx.driver.zero.call(this.ctx.driver, params);
  }
, rapid: function(params) {
    var newPosition = this.postProcess(params);
    if(!newPosition) return;

    this.ctx.driver.rapid.call(this.ctx.driver, params);
    this.position = newPosition;
  }
, linear: function(params) {
    var newPosition = this.postProcess(params);
    if(!newPosition) return;

    this.ctx.driver.linear.call(this.ctx.driver, params);
    this.position = newPosition;
  }
, arcCW: function(params) {
    return this.arc(params,false);
  }
, arcCCW: function(params) {
    return this.arc(params,true);
  }
, arc: function(params,ccw) {
    var newPosition = this.postProcess(params);
    var cx = this.position.x + params.i;
    var cy = this.position.y + params.j;
    var arc = utils.pointsToArc({
      x: cx,
      y: cy 
    },
    this.position, {
      x: params.x,
      y: params.y
    });

    var length = arc.radius * (arc.end-arc.start);
    var f = length/(1/this.ctx.feed);
    f = Math.round(f * 1000000) / 1000000;
    if(f) params.f = Math.abs(f);

    //always interpolate arcs!
    this.interpolate('arc',[
                     cx,
                     cy,
                     arc.radius,
                     arc.start,
                     arc.end,
                     ccw],
                     params.z||0);

    if(newPosition) {
      this.position = newPosition;
    }
  }
, postProcess: function(params) {
    if(this.ctx.driver.unit
       && this.ctx.unit != this.currentUnit) {
      this.ctx.driver.unit(this.ctx.unit);
      this.currentUnit = this.ctx.unit;
    }
    if(this.ctx.driver.meta
       && this.ctx.toolDiameter != this.currentToolDiameter) {
      this.ctx.driver.meta({
        tooldiameter: this.ctx.toolDiameter
      });
      this.currentToolDiameter = this.ctx.toolDiameter;
    }
    if(this.ctx.driver.atc
       && this.ctx.atc != this.currentAtc) {
      this.ctx.driver.atc(this.ctx.atc);
      this.currentAtc = this.ctx.atc;
    }
    if(this.ctx.driver.speed
       && this.ctx.speed != this.currentSpeed) {
      this.ctx.driver.speed(this.ctx.speed);
      this.currentSpeed = this.ctx.speed;
    }
    if(this.ctx.driver.feed
       && this.ctx.feed != this.currentFeed) {
      this.ctx.driver.send('G93');
      this.currentFeed = this.ctx.feed;
    }
    if(this.ctx.driver.coolant
       && this.ctx.coolant != this.currentCoolant) {
      this.ctx.driver.coolant(this.ctx.coolant);
      this.currentCoolant = this.ctx.coolant;
    }

    var v1 = new Point(
          params.x === undefined ? this.position.x : params.x
        , params.y === undefined ? this.position.y : params.y
        , params.z === undefined ? this.position.z : params.z
        , params.a === undefined ? this.position.a : params.a
    );
    var v2 = this.position;
    var dist = Math.sqrt(
                     Math.pow(v2.x - v1.x, 2) +
                     Math.pow(v2.y - v1.y, 2) +
                     Math.pow(v2.z - v1.z, 2));


    if(!params.f) {
      var f = dist/(1/this.ctx.feed);
      f = Math.round(f * 1000000) / 1000000;
      if(f) params.f = Math.abs(f);
    }


    if(utils.samePos(this.position, v1)) {
      return false;
    }

    this.ctx.filters.forEach(function(f) {
      var tmp = f.call(this.ctx, params);

      if(tmp) {
        for(var k in tmp) {
          params[k] = tmp[k];
        }
      }
    });

    for(var k in params) {
      if(typeof params[k] === 'number')
        params[k] = Math.round(params[k] * 100000) / 100000;
    }


    return v1;
  }

, interpolate: function(name, args, zEnd) {
    var path = new SubPath();
    path[name].apply(path, args);

    var curLen = 0;
    var totalLen = path.getLength();
    var zStart = this.position.z;

    function helix() {
      var fullDelta = zEnd - zStart;
      var ratio = (curLen / totalLen);
      var curDelta = fullDelta * ratio;
      return zStart + curDelta;
    }

    var pts = path.getPoints(40);
    for(var i=0,l=pts.length; i < l; ++i) {
      var p=pts[i];

      var xo = p.x - this.position.x;
      var yo = p.y - this.position.y;
      curLen += Math.sqrt(xo*xo + yo*yo);

      this.linear({x:p.x, y:p.y, z:helix()});
    }
  }

, followPath: function(path, zEnd) {
    if(!path) return false;

    if(path.subPaths) {
      path.subPaths.forEach(function(subPath) {
        this.followPath(subPath, zEnd);
      }, this);
      return;
    }

    var zStart = this.position.z;
    var totalLen = path.getLength();
    var curLen = 0;
    var each = {};
    var motion = this;
    var driver = this.ctx.driver;
    var ctx = this.ctx;
    var ramping = path.isClosed() && ctx.ramping != false;

    function helix() {
      if(!ramping) {
        return zEnd;
      }
      if(totalLen === 0) return 0;

      var fullDelta = zEnd - zStart;
      var ratio = (curLen / totalLen);
      var curDelta = fullDelta * ratio;

      return zStart + curDelta;
    }

    function interpolate(name, args) {
      var path = new SubPath();
      path.moveTo(motion.position.x, motion.position.y);
      path[name].apply(path, args);

      var pts = path.getPoints(40);
      for(var i=0,l=pts.length; i < l; ++i) {
        var p=pts[i];

        motion.linear({x:p.x, y:p.y, z:helix()});
      }
    }

    each[Path.actions.MOVE_TO] = function(x,y) {
      var sameXY = (utils.sameFloat(x, this.position.x) &&
           utils.sameFloat(y, this.position.y));

      if(ramping && sameXY) return;

      motion.retract();
      motion.rapid({x:x,y:y});
      motion.plunge();

      if(!ramping) {
        motion.linear({z:zEnd});
      }

      zStart = motion.position.z;

    };

    each[Path.actions.LINE_TO] = function(x,y) {
      motion.linear({x:x,y:y,z:helix()});
    };

    each[Path.actions.ELLIPSE] = function(x, y, rx, ry,
									  aStart, aEnd, ccw) {
      //always interpolate arcs!
      interpolate('ellipse', arguments);
    };

    each[Path.actions.BEZIER_CURVE_TO] = function() {
      interpolate('bezierCurveTo', arguments);
    };

    each[Path.actions.QUADRATIC_CURVE_TO] = function() {
      interpolate('quadraticCurveTo', arguments);
    };

    for(var i = 0, l = path.actions.length; i < l; ++i) {
      item = path.actions[i]

      if(i != 0) {
        var x0 = this.position.x;
        var y0 = this.position.y;
        curLen += path.getActionLength(x0, y0, i);
      }

      each[item.action].apply(this, item.args);
    }
  }

};
