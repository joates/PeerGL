var range = require('./range')(0, Math.PI * 2, Math.PI / 3)
  , SIN_30 = Math.sin(Math.PI / 6)
  , COS_30 = Math.cos(Math.PI / 6)
  , SQRT_3 = Math.sqrt(3)
  , gutter = true
  , gutterWidth = gutter ? (1 + 20 / 100) : 1  // gutter width increased by 20%

range.pop()  // discard final value (because 360deg === 0deg)

function Hex(q, r, size) {
  this.column   = q || 0
  this.row      = r || 0
  this.diameter = size || 20
  this.radius   = this.diameter * 0.5
  this.position = this.getPosition()
  this.verts    = this.getVerts()
  return this
}

Hex.prototype.getPosition = function() {
  var pos = {}
  pos.x = (this.radius * SQRT_3 * (this.column + this.row / 2)) * gutterWidth
  pos.y = 0
  pos.z = (this.radius * (3 / 2) * this.row) * gutterWidth
  return pos
}

Hex.prototype.getVerts = function() {
  var verts, x, y = 0, z

  verts = range.map(function(angle, i) {
    x = this.position.x + ((this.radius / COS_30) * Math.cos(angle + Math.PI/6))
    z = this.position.z + ((this.radius / COS_30) * Math.sin(angle + Math.PI/6))
    return {x: x, y: y, z: z}
  }, this)

  return verts
}

Hex.prototype.getNeighbor = function(edge_index) {
  // in a pointy-top axial grid this returns the coordinates
  // of the connected cell at a specified edge (0-5).
  var idx = edge_index || 0
    , r = []
    , neighbors = [ [+1, 0], [+1, -1], [0, -1], [-1, 0], [-1, +1], [0, +1] ]

  for (var i=0, l=neighbors.length; i<l; i++) {
    var d = neighbors[i]
    r.push(new Array(this.column + d[0], this.row + d[1]))
  }

  return r[idx]
}

module.exports = Hex
