var Hex = require('./Hex')

function Floor(radius, tileSize) {
  this.radius   = radius || 200
  this.tileSize = tileSize || 60
  this.tiles = []
  this.core = this.locate_core()
  this.init()
}

Floor.prototype.locate_core = function() {
  // we assume a 30-60-90 triangle to calc altitude-side length.
  var h = Math.sqrt(3) * this.radius / 2
    , r = this.radius * 2
  return {radius: r, position: {x:0, y:h, z:0}}
}

Floor.prototype.init = function() {
  this.addTile(0, 0)
  this.spiral(1, 12)
}

Floor.prototype.addTile = function(q, r) {
  var hex = new Hex(q, r, this.tileSize)
    , verts_inside_radius = 6
    , that = this

  hex.verts.forEach(function(vert, i) {

    // circular perimeter.
    var length = Math.sqrt(vert.x * vert.x + vert.y * vert.y + vert.z * vert.z)
    if (length > that.radius) {
      verts_inside_radius--
      /**  uncomment this section for a circular perimeter.
      var scalar = that.radius/length
      vert.x *= scalar
      vert.y *= scalar
      vert.z *= scalar  */
    }

    // inverted dome.
    var origin = that.core.position
      , dx = vert.x - origin.x
      , dy = vert.y - origin.y
      , dz = vert.z - origin.z
      , distance_to_core = Math.sqrt(dx * dx + dy * dy + dz * dz)
    
    var scalar = that.core.radius - distance_to_core
    if (length <= that.radius) vert.y = 200 - scalar / 2
  })

  // when at least 1 of a tiles vertices falls inside the
  // perimeter radius the full tile is rendered.
  // (but tiles with all vertices external to perimeter are culled)
  if (verts_inside_radius > 0) {
    this.tiles.push(hex)
  } else {
    hex.solid = true
    this.tiles.push(hex)
  }

  return hex
}

Floor.prototype.ring = function(scale) {
  var hex
    , q = 1-scale
    , r = scale-1

  for (var i=0; i<6; i++) {
    for (var j=1; j<scale; j++) {
      hex = this.addTile(q, r)
      var h = hex.getNeighbor(i)
      q = h[0]
      r = h[1]
    }
  }
}

Floor.prototype.spiral = function(min, max) {
  min = Math.min(min, 1)
  max = max > min ? max : min
  for (var i=min; i<=max; i++) {
    this.ring(i)
  }
}

module.exports = Floor
