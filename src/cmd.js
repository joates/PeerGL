module.exports = {
  create: function() {
    var el  = document.createElement('input')
    el.id   = 'cmd-text-input'
    el.type = 'text'
    el.className = 'hide'
    el.hasFocus  = false
    el.onfocus = function() { this.hasFocus = true }
    el.onblur  = function() { this.hasFocus = false }
    return el
  }
}
