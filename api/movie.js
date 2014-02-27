var config = require('../config')
  , tmdb   = require('moviedb')(config.key)

module.exports = function (movie) {
  tmdb.miscNowPlayingMovies(function(err, res) {
    if (err) return err
    console.error(res.results)
    //return res.results
  })
}
