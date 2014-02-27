// by joates (06-Jan-2014)

var domready = require('domready')
  , world = require('./World.js')

function animate() {
  requestAnimationFrame(animate)
  world.update()
  world.render()
}

setTimeout(function() { domready(function() {
  world.init()
  animate()
})}, 0)
