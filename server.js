#!/usr/bin/env node

var server = require('http').createServer(handler)
  , io = require('socket.io').listen(server)
//, ss = require('socket.io-stream')
  , fs = require('fs')
  , re = new RegExp('\.js$', 'i')

io.set('log level', 0)   // quiet mode.
server.listen(8000)     // start http service.

// process incoming requests.
function handler(req, res) {
  if (req.url == '/') req.url = '/index.html'
  else if (re.test(req.url))
    res.setHeader('Content-Type', 'application/javascript')
  var rs = fs.createReadStream(__dirname +'/public'+ req.url)
  rs.pipe(res)
}

// socket.io event handlers.
io.sockets.on('connection', function(client) {

  client.on('message', function(data) {
    var t = new Date()
    console.log('   '+ t.toUTCString() +"\n   "+ JSON.stringify(data) +"\n")
  })

  client.on('disconnect', function() {
    console.log('   end')
  })

})

