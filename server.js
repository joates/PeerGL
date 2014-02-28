#!/usr/bin/env node

var server = require('http').createServer(handler)
  , io  = require('socket.io').listen(server)
//, ss  = require('socket.io-stream')
  , api = require('./lib/cmd_api')
  , fs  = require('fs')
  , re  = new RegExp('\.js$', 'i')

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

  client.on('message', function(msg) {
    if (msg.cmd) {
      var args = msg.cmd.split(/\s+/)
        , name = args.shift()
        , method = api[name]

      if (method) {
        if (method.length - 1 !== args.length) {
          var num_args = method.length - 1
          var warn = JSON.stringify(name) +' command expects ' + num_args + ' argument' + (num_args === 1 ? '' : 's')
          client.emit('warn', warn)
          return
        }

        method.apply(null, args.concat(function (err, data) {
          if (err) {client.emit('fail', err);return}
          client.emit('response', data)
        }))
      } else {
        client.emit('warn', JSON.stringify(name) +' is not a valid command' )
      }
    }
  })

  client.on('disconnect', function() {
    console.log('   end')
  })

})

