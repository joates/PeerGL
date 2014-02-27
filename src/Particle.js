var Particle = {

  get: function(radius) {

    // Particle object.
    var particle = new THREE.Object3D()

    particle.radius = radius || 25

    // add physics properties.
    particle.velocity = new THREE.Vector3(0, 0, 0)
    particle.force    = new THREE.Vector3(0, 0, 0)
    particle.drag     = 0.77
    particle.spin     = 0

    return particle
  }
}

module.exports = Particle
