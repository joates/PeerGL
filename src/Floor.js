var Hex = require('./Hex')
  , crater_perimeter_elevation

function Floor(radius, tileSize) {
  this.radius   = radius || 200
  this.tileSize = tileSize || 60
  this.tiles = []
  this.core = this.locate_core()
  crater_perimeter_elevation = this.radius * 0.05  // edge bump.
  this.init()
}

Floor.prototype.locate_core = function() {
  // we use 30-60-90 triangle to calc length of altitude side.
  var r = this.radius * 2
    , h = (Math.sqrt(3) * r) / 2
  return { radius: r, position: {x: 0, y: h, z: 0} }
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

    var length = Math.sqrt(vert.x * vert.x + vert.y * vert.y + vert.z * vert.z)

    // inverted dome.
    var origin = that.core.position
      , dx = vert.x - origin.x
      , dy = vert.y - origin.y
      , dz = vert.z - origin.z
      , distance_to_core = Math.sqrt(dx * dx + dy * dy + dz * dz)
    
    var scalar = distance_to_core - that.core.radius
    if (length <= that.radius) vert.y =  scalar + crater_perimeter_elevation

    // circular perimeter.
    if (length > that.radius) {
      verts_inside_radius--
      /**  uncomment this section to actually render the circular perimeter.
      var scalar = that.radius/length
      vert.x *= scalar
      vert.y *= scalar
      vert.z *= scalar  */
    }
  })

  // tiles with all vertices outside of perimeter are rendered solid.
  if (verts_inside_radius === 0) hex.solid = true

  this.tiles.push(hex)
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
