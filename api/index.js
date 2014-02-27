var get        = require('../lib/get')
  , resolve    = require('url').resolve
  , join       = require('path').join
  , config     = require('../config')
//, funders    = require('./funders')
//, iterations = require('./iterations')
//, iteration  = require('./iteration')
//, movie      = require('./movie')
  , tmdb   = require('moviedb')(config.key)

/**
var auth = (
  config.id && config.secret ?
  '?client_id='+config.id+'&client_secret='+config.secret
  : ''
)
*/

function tmdbApi() {
  return resolve('https://api.themoviedb.org/3/', join.apply(null, arguments)) + '?api_key=' + config.key
}

function omdbApi() {
  return resolve('http://www.omdbapi.com/?', join.apply(null, arguments))
}

/**
function bcApi() {
  return resolve('https://blockchain.info', join.apply(null, arguments) + '?format=json')
}
*/

var api = exports

api.movie = function(id, cb) {
  tmdb.miscNowPlayingMovies(function(err, res) {
    if (err) return err
    //console.error(res.results)
    cb(null, res.results)
  })
}

/**
api.movie = function(id, cb) {
  get.all([
    tmdbApi('movie', id)
  ], function(err, args) {
    if (err) return cb(err)
    cb(null, movie.apply(null, args))
  })
}
*/

/**
api.funders = function (user, repo, issue, wallet, cb) {
  get.all([
    ghApi('repos', user, repo, 'issues', issue, 'comments'),
    bcApi('address', wallet)
  ], function (err, args) {
    if(err) return cb(err)
    cb(null, funders.apply(null, args))
  })
}

api.iterations = function (user, repo, cb) {
  get.all([
    ghApi('repos', user, repo, 'issues'),
    ghApi('repos', user, repo, 'collaborators')
  ], function (err, data) {
    if(err) return cb(err)
    cb(null, iterations(data[0], data[1], user, repo))
  })
}

api.iteration = function (user, repo, wallet, cb) {
  api.iterations(user, repo, function (err, data) {
    if(err) return cb(err)
    for(var i in data) {
      if(data[i].wallet === wallet) {
        var iter = data[i]
        return api.funders(user, repo, ''+iter.number, wallet, function (err, funders) {
          if(err) return cb(err)
          return cb(null, iteration(iter, funders))
        })
      }
    }
    cb(new Error('could not find iteration'))
  })
}
*/

if(!module.parent) {
  var args = process.argv.slice(2)
  var method = args.shift()
  var p = console.error
  if(!api[method]) {
    p('expected one of:', Object.keys(api).join(', '))
    p()
    p('try:')
    p('node ./api/index.js funders dominictarr feedopensource 4 1PTAwipYpP63uNrcxfm5FewxRdZyar6ceu')
    p('node ./api/index.js iterations dominictarr feedopensource')
    p('node ./api/index.js iteration dominictarr feedopensource 1PTAwipYpP63uNrcxfm5FewxRdZyar6ceu')
    return
  } else if(api[method].length - 1 !== args.length) {
    p(JSON.stringify(method) +' command takes ' + (api[method].length - 1) + ' arguments')
    return
  }

  api[method].apply(null, args.concat(function (err, data) {
    if(err) throw err
    console.log(JSON.stringify(data, null, 2))
    process.exit()
  }))

}
