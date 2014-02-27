// World.js (v0.01)
// by joates (6-Jan-2014)
;;

var offsetZ = 80  // distance from screen to camera.

var particleSystem,
    PS_Radius    = 500,
    PS_Diameter  = PS_Radius * 2,
    PS_MAX = PS_Radius * 3,
    coreBoundary = PS_Radius / 4

var density = 50000  /** lower numbers increase density !! **/
  , surfaceArea = Math.floor(4 * Math.PI * Math.pow(PS_Radius, 2))
  , maxParticles = Math.floor(surfaceArea / density)

var dpr = 1
  , effectFXAA = new THREE.ShaderPass(THREE.FXAAShader)
  , paused = true
  , numSpinning = maxParticles
  , mouse = { x: 0, y: 0 }
  , clickTargets = []

var socket = io.connect('http://localhost:8000')
  , seq = 0
  , VSO = {}

function startSockets() {
  socket.on('image', function (data) {
    // loop setting is ignored because its streamed !!
  	//VSO.video.loop = true
  	VSO.video.autoplay = true
  	VSO.video.src = src
  	VSO.video.load()  // must call after setting/changing source
  })
}

function buildParticle() {
  var g = new THREE.CubeGeometry(80, 45, 1)
    , m = new THREE.MeshBasicMaterial()
    , obj = new THREE.Mesh(g, m)
  //obj.frustumCulled = false

  return obj
}

function getVideoScreen(src) {
 	VSO.video = document.createElement('video')

  if (src === 'webcam') {
    VSO.video.style.display = 'none'
  	VSO.video.autoplay = true
		document.body.appendChild(VSO.video)
    navigator.getUserMedia = navigator.getUserMedia ||
                             navigator.webkitGetUserMedia ||
                             navigator.mozGetUserMedia ||
                             navigator.msGetUserMedia

    if (navigator.getUserMedia) {
      navigator.getUserMedia({ video: true }, function(stream) {
          VSO.video.src = window.URL.createObjectURL(stream)
        }, function() { console.error('getUserMedia is not supported')
      })
    }
  } else {
    // request a streaming video file.
    socket.emit('message', { id: ++seq })
  }

  VSO.texture = new THREE.Texture(VSO.video)
	VSO.texture.minFilter = THREE.LinearFilter
 	VSO.texture.magFilter = THREE.LinearFilter
  VSO.texture.format = THREE.RGBFormat
	VSO.texture.generateMipmaps = false

 	var videoMaterial = new THREE.MeshBasicMaterial({ map: VSO.texture, overdraw: true, side:THREE.DoubleSide })
 	  , videoGeometry = new THREE.PlaneGeometry(160, 90, 4, 4)
 	  , vs = new THREE.Mesh(videoGeometry, videoMaterial)

  /**
  if (src === 'webcam') {
   	vs.rotation.x = Math.PI / 30
   	vs.rotation.y = Math.PI / 2.2 - mirrorMode
  } else {
   	vs.rotation.x = Math.PI / 30
   	vs.rotation.y = -Math.PI / 2.2
  }
  */

  VSO.vs = vs
  return VSO
}

function clear_wireframes() {
  var set = World.scene.children[0].children
  for (var i=0, l=set.length; i<l; i++) {
    set[i].material.wireframe = false
    set[i].material.needsUpdate = true
  }
}

function onKeyDown (event) {
  if (event.keyCode == 32) //paused = !paused
    if (VSO.video)
      //console.dir(VSO.video)
      VSO.video.paused = ! VSO.video.paused

  if (event.keyCode == 27) //escape
    clear_wireframes()
}

function onMouseWheel(event) {
  World.selectedObj = undefined
}

function onMouseClick(event) {
	event.preventDefault()
  var camera = World.camera
    , projector = World.projector

  World.selectedObj = undefined

	mouse.x =  (event.clientX / window.innerWidth)  * 2 - 1
	mouse.y = -(event.clientY / window.innerHeight) * 2 + 1

	// create a Ray with origin at the mouse position
	//   and direction into the scene (camera direction)
	var vector = new THREE.Vector3(mouse.x, mouse.y, 1)
	projector.unprojectVector(vector, camera)
	var ray = new THREE.Raycaster(camera.position, vector.sub(camera.position).normalize())

	// create an array containing all objects in the scene with which the ray intersects
	var intersects = ray.intersectObjects(clickTargets)

	// if there is one (or more) intersections
	if (intersects.length > 0) {

  	if (intersects[0].object.material.wireframe == true) {

      // demote transparent targets so that far objects can
      // be selected when some or all of the closer objects
      // are transparent.

      var tmp = []
      while (intersects.length > 1 &&
             intersects[0].object.material.wireframe == true) {
        tmp.push(intersects.shift())
      }
      intersects = intersects.concat(tmp)
      delete tmp
    }

    var obj = intersects[0].object.material
    obj.wireframe = !obj.wireframe
    obj.needsUpdate = true

    if (obj.wireframe != true) {
      // move the camera.
      moveCamera(intersects[0].object)
    }
	}
}

function moveCamera(obj) {
  var camera = World.camera
    , scene  = World.scene

  // Calculate camera offset.
  var matrix = new THREE.Matrix4().copy(obj.matrix)
  matrix.setPosition(obj.position)
  var offset1 = new THREE.Vector3(0, 0,  offsetZ)
    , offset2 = new THREE.Vector3(0, 0, -offsetZ)
    , cameraOffset1 = offset1.applyMatrix4(matrix)
    , cameraOffset2 = offset2.applyMatrix4(matrix)
    , cameraOffset
    , length1 = camera.position.distanceTo(cameraOffset1)
    , length2 = camera.position.distanceTo(cameraOffset2)

  // target near side of object.
  if (length1 < length2) {
    obj.offsetZ = offsetZ
    cameraOffset = cameraOffset1
  } else {
    obj.offsetZ = -offsetZ
    cameraOffset = cameraOffset2
  }

  // Create a smooth camera transition.
  new TWEEN.Tween(camera.position).to({
    x: cameraOffset.x,
    y: cameraOffset.y,
    z: cameraOffset.z }, 1234)
  .interpolation(TWEEN.Interpolation.Bezier)
  .easing(TWEEN.Easing.Sinusoidal.InOut).start()
  .onUpdate(function () {

      // should update .to({x,y,z}) values here
      // since targeted object could be in motion !!
      // (this will enable to implement smoother transitions)

      camera.lookAt(obj)

    })
  .onComplete(function() { World.selectedObj = obj.id })

  // Set camera rotation.
  //camera.lookAt(obj)

  // Set orbit control target.
  camera.controls.target.copy(obj.position)

  clear_wireframes()
}

function onWindowResize() {
  var width  = World.viewport.width
    , height = World.viewport.height
    , camera = World.camera
    , renderer = World.renderer
    , composer = World.composer

  width  = window.innerWidth
  height = window.innerHeight
  camera.aspect = width / height
  camera.updateProjectionMatrix()
  renderer.setSize(width, height)

  effectFXAA.uniforms['resolution'].value.set(1 / (width * dpr), 1 / (height * dpr))
  composer.setSize(width * dpr, height * dpr)
}

World = {

  init: function() {
    this.viewport = { width: window.innerWidth, height: window.innerHeight }
    this.scene = new THREE.Scene()

    var width  = this.viewport.width
      , height = this.viewport.height
      , scene  = this.scene

    this.renderer = new THREE.WebGLRenderer({ antialias: false })
    this.renderer.setSize(width, height)
    this.renderer.setClearColor(0x000000, 1)
    document.body.appendChild(this.renderer.domElement)

    this.stats = new Stats()
  	this.stats.domElement.style.position = 'absolute'
		this.stats.domElement.style.top = '0px'
		this.stats.domElement.style.left = '0px'
		document.body.appendChild(this.stats.domElement)

    this.camera = new THREE.PerspectiveCamera(40, width/height, 0.1, 10000)
    this.camera.position.z = 80

    this.camera.controls = new THREE.OrbitControls(this.camera)
    //this.camera.controls.noZoom = false
    this.camera.controls.zoomSpeed = 2.5
    this.camera.controls.noPan  = true
    this.camera.controls.noKeys = true
    this.camera.controls.minPolarAngle = Math.PI / 2
    this.camera.controls.maxPolarAngle = Math.PI / 2
    this.projector = new THREE.Projector()

    // create a container for the particle system.
    particleSystem = new THREE.Object3D()

    // create a master object.
    var master = new buildParticle()
    //, mRadius = master.geometry.boundingSphere.radius
      , mRadius = 25

    for (var i=0; i<maxParticles; i++) {

      // fill the container with cloned objects.
      var obj = master.clone()
      obj.material = new THREE.MeshLambertMaterial({
        color: 0xff9000, shading: THREE.FlatShading
      })

      // alter scale.
      var scale = Math.random() * 2.5 + 0.5
      obj.scale.multiplyScalar(scale)

      // add physics properties.
      obj.velocity = new THREE.Vector3(0, 0, 0)
      obj.force = new THREE.Vector3(0, 0, 0)
      obj.drag = 1.0 - (0.4 / 60 * (mRadius * scale))
      obj.spin = 0

      // distribute around the origin (but not too close).
      while (obj.position.length() < coreBoundary) {
        obj.position.x = Math.random() * PS_Diameter - PS_Radius
        //obj.position.y = Math.random() * PS_Diameter - PS_Radius
        obj.position.y = -10
        obj.position.z = Math.random() * PS_Diameter - PS_Radius
      }

      // initial random rotations in local coordinate system.
      // (prevents all objects from facing the same direction !!)
      obj.rotation.y = Math.random() * Math.PI * 2 - Math.PI

      // initial spin velocity.
      var spinVelocity = Math.random() * 0.5 + 0.33
      switch (Math.floor(Math.random() * 2)) {
        case 0: obj.spin += spinVelocity; break
        case 1: obj.spin -= spinVelocity; break
      }

      obj.matrixAutoUpdate = false
      obj.updateMatrix()

      particleSystem.add(obj)
      clickTargets.push(obj)
    }

    scene.add(particleSystem)  /** IMPORTANT: 1st child of the scene graph */

    //this.movieScreen = getVideoScreen('webcam')
    //this.movieScreen = getVideoScreen()
    //this.movieScreen.vs.position.z = -80
  	//scene.add(this.movieScreen.vs)

    this.light = new THREE.PointLight(0xffffff, 2, 3000)
    scene.add(this.light)
    scene.add(new THREE.AmbientLight(0x202020))

    this.selectedObj = undefined

    if (window.devicePixelRatio !== undefined) {
      dpr = window.devicePixelRatio
    }

    // postprocessing
    this.renderer.autoClear = false

    var width  = window.innerWidth
      , height = window.innerHeight
      , renderTargetParameters = {
          minFilter: THREE.LinearFilter,
          magFilter: THREE.LinearFilter,
          format: THREE.RGBFormat,
          stencilBuffer: false }

    var renderTarget = new THREE.WebGLRenderTarget(width, height, renderTargetParameters)
      , effectSave  = new THREE.SavePass(new THREE.WebGLRenderTarget(width, height, renderTargetParameters))
    //, effectEdge  = new THREE.ShaderPass(THREE.EdgeShader2)
      , effectBlend = new THREE.ShaderPass(THREE.BlendShader, 'tDiffuse1')
    //, hblur = new THREE.ShaderPass(THREE.HorizontalTiltShiftShader)
    //, bluriness = 2

    effectBlend.uniforms['tDiffuse2'].value = effectSave.renderTarget
    effectBlend.uniforms['mixRatio'].value = 0.66
    //hblur.uniforms['h'].value = bluriness / width
    effectFXAA.uniforms['resolution'].value.set( 1 / (width * dpr), 1 / (height * dpr))
    effectFXAA.renderToScreen = true

    this.composer = new THREE.EffectComposer(this.renderer, renderTarget)
    this.composer.setSize(width * dpr, height * dpr)
    this.composer.addPass(new THREE.RenderPass(this.scene, this.camera))
    //this.composer.addPass(effectEdge)
    this.composer.addPass(effectBlend)
    this.composer.addPass(effectSave)
    //this.composer.addPass(hblur)
    this.composer.addPass(effectFXAA)

    // initialize websockets.
    startSockets()

    document.addEventListener('keydown', onKeyDown, false)
    document.addEventListener('mousedown', onMouseClick, false)
    document.addEventListener('mousewheel', onMouseWheel, false)
    window.addEventListener('resize', onWindowResize, false)
  },

  update: function() {

    // evenly distribute the particles.
    var particles = particleSystem.children
      , repelForce = new THREE.Vector3(0,0,0)
      , mag
      , repelStrength

    for (i=0; i<particles.length; i++) {
      var p1 = particles[i]

      if (p1.drag > 0) {
        // added by joates (9-Jan-2014)
        if (p1.position.length() < coreBoundary * 2) {
          p1.position.normalize()
          p1.position.multiplyScalar(coreBoundary * 2)
        }

        repelForce.copy(p1.position)
        mag = repelForce.length()
        repelStrength = (mag - p1.position.length()) *-1

        if (mag > 0) {
          repelForce.multiplyScalar(repelStrength/mag)
          p1.position.add(repelForce)
        }

        if (i >= particles.length - 1) continue

        for(j=i+1; j<particles.length; j++) {
          var p2 = particles[j]

          // added by joates (9-Jan-2014)
          if (p2.position.length() < coreBoundary * 2) {
            p2.position.normalize()
            p2.position.multiplyScalar(coreBoundary * 2)
          }

          repelForce.copy(p2.position)
          repelForce.sub(p1.position)
          mag = repelForce.length()
          repelStrength = PS_Radius - mag

          if ((repelStrength > 0) && (mag > 0)) {
            //repelForce.multiplyScalar(repelStrength*0.0035 / mag)
            //repelForce.multiplyScalar(repelStrength*0.0055 / mag)
            //repelForce.multiplyScalar(repelStrength*0.0075 / mag)
            repelForce.multiplyScalar(repelStrength*0.0095 / mag)

            p1.force.sub(repelForce)
            p2.force.add(repelForce)
          }
        }
      }
    }

    // iteratate through each particle
    // and update it's position within the particle system.
    for (i=0; i<particles.length; i++){
      var p = particles[i]

      if (p.spin != 0) {
        // apply spin rotation.
        p.rotation.y += p.spin

        p.spin *= 0.98  // gradually reduce spin, until..
        if (Math.abs(p.spin) < 0.001) {
          p.spin = 0  // not spinning.
          numSpinning--
        }
      }

      if (p.drag > 0) {
        p.velocity.add(p.force)
        p.velocity.multiplyScalar(p.drag)

        p.position.add(p.velocity)
        p.position.y = -1

        /**
        if (p.position.length() > PS_MAX) {
          p.drag *= 0.96  // slow down, until..
          if (p.drag < 0.001) {
            p.drag = 0  // position locked
            //console.log('particle #' + i + ' is stationary')
          }
        }
        */

        p.force.set(0, 0, 0)
        p.updateMatrix()
      }
    }

    // rotate the particle system.
    //if (!paused) particleSystem.rotation.y += 0.01

    if (numSpinning == 0) {
      numSpinning = -1
      console.log('Ready. (' + maxParticles + ' objects)')
    }

    if (this.selectedObj != undefined) {
      // follow a selected object if/when it moves.
      var obj = this.scene.children[0].getObjectById(this.selectedObj)
        , camera = this.camera

      if (obj != undefined) {
        // Calculate camera offset.
        var matrix = new THREE.Matrix4().copy(obj.matrix)
        matrix.setPosition(obj.position)
        var offset = new THREE.Vector3(0, 0, obj.offsetZ)
          , cameraOffset = offset.applyMatrix4(matrix)
        camera.position.copy(cameraOffset)
        camera.controls.target.copy(obj.position)
        camera.lookAt(obj)
      }
    }

    TWEEN.update()
    this.camera.controls.update()
    this.light.position = this.camera.position
    this.stats.update()
  },

  render: function() {
  	//if (this.movieScreen.video.readyState === this.movieScreen.video.HAVE_ENOUGH_DATA) {
  	//	if (this.movieScreen.texture) this.movieScreen.texture.needsUpdate = true
  	//}

    //this.renderer.render(this.scene, this.camera)
    this.composer.render()
  }
}

module.exports = World
