var domready = require('domready')
  ,      raf = require('raf')
  ,      cmd = require('./cmd_ui').create()

  , width     = window.innerWidth
  , height    = window.innerHeight

  , scene     = new THREE.Scene()
  , light     = new THREE.PointLight(0xffffff, 0.88, 3000)
  , camera    = new THREE.PerspectiveCamera(40, width / height, 0.1, 10000)
  , controls  = new THREE.OrbitControls(camera)
  , box       = new THREE.Mesh(
                  new THREE.CubeGeometry(20, 40, 20)
                , new THREE.MeshLambertMaterial({ color: 0xffff00 })
                )
  , stage     = new THREE.Mesh(
                  new THREE.CylinderGeometry(40, 40, 4, 60)
                , new THREE.MeshLambertMaterial({ color: 0x60b0f0, transparent: true, opacity: 0.5 })
                )
  , dpr = 1
  , effectFXAA = new THREE.ShaderPass(THREE.FXAAShader)

  , sio = io.connect('http://localhost:8000')

function delayed_hide() {
  setTimeout(function(){cmd.className='hide';setTimeout(function(){cmd.value=''}, 10)}, 2200)
}

function init_sockets() {
  sio.on('response', function(msg) {
    cmd.value = msg
    cmd.disabled = true
    cmd.className = 'show'
    cmd.classList.add('cmd_ok')
    cmd.classList.remove('cmd_warn', 'cmd_fail')
    delayed_hide()
  })
  sio.on('warn', function(data) {
    cmd.value = data
    cmd.disabled = true
    cmd.className = 'show'
    cmd.classList.add('cmd_warn')
    delayed_hide()
  })
  sio.on('fail', function(data) {
    cmd.value = data
    cmd.disabled = true
    cmd.className = 'show'
    cmd.classList.add('cmd_fail')
    delayed_hide()
  })
}

module.exports = {

  renderer:   new THREE.WebGLRenderer({ antialias: false })

  , init:     function(cb) {
                var self = this
                process.nextTick(function() {
                  domready(function() {
                    scene.add(box)
                    stage.position.y -= 10
                    scene.add(stage)
                    scene.add(light)
                    scene.add(new THREE.AmbientLight(0x202020))
                    camera.position.z = 100
                    camera.lookAt(0, 0, 0)

                    self.renderer.setSize(width, height)
                    document.body.appendChild(self.renderer.domElement)

                    document.body.appendChild(cmd)

                    self.stats = new Stats()
                  	self.stats.domElement.style.position = 'absolute'
                		self.stats.domElement.style.top = '0px'
                		self.stats.domElement.style.left = '0px'
                		document.body.appendChild(self.stats.domElement)

                    init_sockets()

                    window.addEventListener('resize', self.resize.bind(self), false)
                    document.addEventListener('keydown', self.onkeydown.bind(self), false)
                    document.addEventListener('mousedown', self.onmousedown.bind(self), false)
                    document.addEventListener('mouseup', self.onmouseup.bind(self), false)

                    if (window.devicePixelRatio !== undefined) {
                      dpr = window.devicePixelRatio
                    }

                    // postprocessing
                    self.renderer.autoClear = false

                    var renderTargetParameters = {
                      minFilter: THREE.LinearFilter,
                      magFilter: THREE.LinearFilter,
                      format: THREE.RGBFormat,
                      stencilBuffer: false }

                    var renderTarget = new THREE.WebGLRenderTarget(width, height, renderTargetParameters)
                      , effectSave   = new THREE.SavePass(new THREE.WebGLRenderTarget(width, height, renderTargetParameters))
                    //, effectEdge   = new THREE.ShaderPass(THREE.EdgeShader2)
                      , effectBlend  = new THREE.ShaderPass(THREE.BlendShader, 'tDiffuse1')
                    //, hblur = new THREE.ShaderPass(THREE.HorizontalTiltShiftShader)
                    //, bluriness = 2

                    effectBlend.uniforms['tDiffuse2'].value = effectSave.renderTarget
                    effectBlend.uniforms['mixRatio'].value = 0.66
                    //hblur.uniforms['h'].value = bluriness / width
                    effectFXAA.uniforms['resolution'].value.set( 1 / (width * dpr), 1 / (height * dpr))
                    effectFXAA.renderToScreen = true

                    self.composer = new THREE.EffectComposer(self.renderer, renderTarget)
                    self.composer.setSize(width * dpr, height * dpr)
                    self.composer.addPass(new THREE.RenderPass(scene, camera))
                    //self.composer.addPass(effectEdge)
                    self.composer.addPass(effectBlend)
                    self.composer.addPass(effectSave)
                    //self.composer.addPass(hblur)
                    self.composer.addPass(effectFXAA)

                    // animation.
                    raf(self.renderer.domElement).on('data', function(dt) {
                      self.update(dt)
                      self.render()
                    })

                    // async response.
                    cb(!scene instanceof THREE.Scene, scene)
                  })
                })
              }

  , update:   function(t) {  // (Note: delta time is not used !!)

                /**
                // move the camera.
                var x, y, z, speed = 0.002
                x = camera.position.x
                y = camera.position.y
                z = camera.position.z
                camera.position.x = x * Math.cos(speed) - z * Math.sin(speed)
                camera.position.z = z * Math.cos(speed) + x * Math.sin(speed)
                camera.lookAt(scene.position)
                */

                controls.update()
                light.position = camera.position
                this.stats.update()
              }

  , render:   function() {
                //this.renderer.render(scene, camera)
                this.composer.render()
              }

  , resize:   function() {
                width  = window.innerWidth
                height = window.innerHeight
                this.renderer.setSize(width, height)
                camera.aspect = width / height
                camera.updateProjectionMatrix()
              }

  , onkeydown: function(event) {
                switch(event.which || event.keyCode) {

                  case 190:  /*dot*/
                    if (!cmd.hasFocus)
                        cmd.disabled = false; cmd.className='show'; cmd.focus(); break

                  case 13:   /*enter*/
                    if (cmd.hasFocus && cmd.value.substr(0,1) === '.' && cmd.value.length > 1) {
                      sio.emit('message', {cmd:cmd.value.replace(/^(\s|\.)*/, '')}); cmd.value=''; break }
                    else {   cmd.disabled = false; cmd.className='show'; cmd.focus(); break }

                  case 27:  /*esc*/
                    cmd.className='hide';cmd.value='';cmd.blur();break
                }
              }

  , onmousedown: function(event) {
                if (event.ctrlKey) {
                  //sio.emit('message', { camera: camera.position })
                }
              }

  , onmouseup: function(event) {
                if (event.ctrlKey) {
                  //sio.emit('message', { camera: camera.position })
                }
              }

}
