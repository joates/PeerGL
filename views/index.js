
var views = exports
var layout = require('./layout')

views.movie = layout(require('./movie'))

if(!module.parent) {
  var method = process.argv[2]
  var data = ''
  process.stdin.on('data', function (d) {
    data += d
  })
  .on('end', function () {
    console.log(views[method](JSON.parse(data)))
  })
}
