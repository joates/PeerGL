#!/usr/bin/env node

var https       = require('https')
  , http        = require('http')
  , fs          = require('fs')
  , join        = require('path').join
  , route       = require('tiny-route')
  , ecstatic    = require('ecstatic')
  , stack       = require('stack')

  , config      = require('./config')
  , api         = require('./api')
  , views       = require('./views')
  , autoApi     = require('./lib/auto-api')
  , redirect    = require('./lib/https-redirect')

var app = stack(
  //route('/badge/', bar),
  autoApi(api, views),
  ecstatic(join(__dirname, 'static'))
)

var secure = process.getuid() === 0

if(secure) {

  https.createServer({
   cert: fs.readFileSync(config.cert),
   key : fs.readFileSync(config.key)
  }, app).listen(443)

  http.createServer(redirect()).listen(80)

  process.on('uncaughtException', function (err) {
    console.log('*****************************')
    console.error('Error at:', new Date)
    console.error(err.stack)
    console.log('*****************************')
  })

} else {
  http.createServer(app).listen(config.port)
}
