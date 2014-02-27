
require('html-element')
var h = require('hyperscript')
var join = require('path').join

function a(href, linked, classes) {
  return h('a'+(classes || ''), {href: href}, linked)
}

function img(src, width, classes) {
  return h('img'+(classes || ''), {src: src, width: width ? width+'px' : null})
}

module.exports = function (movies) {
  return h('div',

    h('h1', 'Now Playing:'
      //a(
      //  'http://www.imdb.com/title/' + movie.imdb_id,
      //  h('span', movie.title)
      //)
    ),

    h('div',
        movies.map(function(movie) {
          if (movie.backdrop_path) {
            return h('div#img-container',
              h('h3', movie.title),
              img(
                'http://image.tmdb.org/t/p/w300' + movie.backdrop_path,
                300
              )

            )
          }
        })
    )

  )
}
