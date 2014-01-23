var join = require('path').join

var home = process.env.SUDO_USER
           ? join('/home', process.env.SUDO_USER)
           : process.env.HOME || '/root'

module.exports = require('rc')('peergl', {
  key: '8cd3a42a398cdc7483c33fc250f1e932',
  //cert: join(home, '.feedopensource', 'server-cert.pem'),
  //key : join(home, '.feedopensource', 'server-key.pem'),
  host: 'localhost',
  port: 8000 //development (non-secure) port
})
