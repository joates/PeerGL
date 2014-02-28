var api = exports

api.test = function(str, cb) {
  //cb('oops, it failed')
  cb(null, str + ' completed ok')
}
