var webgl = require('./webgl')

webgl.init(function(err, data) { 
  if (err) console.error(err)
  console.log('ready', data)
})
