
require('html-element')
var h = require('hyperscript')


function a(href, linked, classes) {
  return h('a'+(classes || ''), {href: href}, linked)
}

function img(src, width, classes) {
  return h('img'+(classes || ''), {src: src, width: width ? width+'px' : null})
}

module.exports = function (movie) {
  return h('div',
    h('h1',
      a(
        'http://www.imdb.com/title/' + movie.imdb_id,
        h('span', movie.title)
      )
    ),

    h('div',
      h('dl',
        Object.keys(movie).map(function (key) {
          return h('dt', key, h('dd', movie[key]))
        })
      )
    )
  )
}
