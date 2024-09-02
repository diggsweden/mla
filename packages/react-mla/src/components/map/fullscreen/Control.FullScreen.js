// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: CC0-1.0

/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint no-undef: "off" */
import L from 'leaflet';

(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    // define an AMD module that requires 'leaflet'
    // and resolve to an object containing leaflet
    define('leafletFullScreen', ['leaflet'], factory)
  } else if (typeof module === 'object' && module.exports) {
    // define a CommonJS module that requires 'leaflet'
    module.exports = factory(require('leaflet'))
  } else {
    // Assume 'leaflet' are loaded into global variable already
    factory(root.L)
  }
  }(typeof self !== 'undefined' ? self : this, function (leaflet) {

  if (typeof document === 'undefined') {
    console.warn('"window.document" is undefined; leaflet.fullscreen requires this object to access the DOM')
    return false
  }

  const nativeAPI = (() => {
    const methodMap = [
      // Standard
      [
        'requestFullscreen',
        'exitFullscreen',
        'fullscreenElement',
        'fullscreenEnabled',
        'fullscreenchange',
        'fullscreenerror'
      ],
      // New WebKit
      [
        'webkitRequestFullscreen',
        'webkitExitFullscreen',
        'webkitFullscreenElement',
        'webkitFullscreenEnabled',
        'webkitfullscreenchange',
        'webkitfullscreenerror'
      ]
    ]

    const baseList = methodMap[0]
    const ret = {}

    for (const methodList of methodMap) {
      if (methodList[1] in document) {
        for (let i = 0; i < methodList.length; i++) {
          ret[baseList[i]] = methodList[i]
        }
        return ret
      }
    }

    return false
  })()

  const eventNameMap = {
    change: nativeAPI.fullscreenchange,
    error: nativeAPI.fullscreenerror
  }

  const fullscreenAPI = {
    request: async function (element, options) {
      return await new Promise(function (resolve) {
        const onFullScreenEntered = function () {
          this.off('change', onFullScreenEntered)
          resolve()
        }.bind(this)

        this.on('change', onFullScreenEntered)
        element = element ?? document.documentElement
        const returnPromise = element[nativeAPI.requestFullscreen](options)
        if (returnPromise instanceof Promise) {
          returnPromise.then(() => {
            resolve(onFullScreenEntered)
          }).catch(() => { console.error('Error opening fullscreen') })
        }
      }.bind(this))
    },
    exit: async function () {
      return await new Promise(function (resolve) {
        if (!this.isFullscreen) {
          resolve()
          return
        }

        const onFullScreenExit = function () {
          this.off('change', onFullScreenExit)
          resolve()
        }.bind(this)

        this.on('change', onFullScreenExit)
        const returnPromise = document[nativeAPI.exitFullscreen]()
        if (returnPromise instanceof Promise) {
          returnPromise.then(() => {
            resolve(onFullScreenExit)
          }).catch(() => { console.error('Error closing fullscreen') })
        }
      }.bind(this))
    },
    on: function (event, callback) {
      const eventName = eventNameMap[event]
      if (eventName) {
        document.addEventListener(eventName, callback, false)
      }
    },
    off: function (event, callback) {
      const eventName = eventNameMap[event]
      if (eventName) {
        document.removeEventListener(eventName, callback, false)
      }
    },
    nativeAPI
  }

  Object.defineProperties(fullscreenAPI, {
    isFullscreen: {
      get: function () {
        return Boolean(document[nativeAPI.fullscreenElement])
      }
    },
    isEnabled: {
      enumerable: true,
      get: function () {
        // Coerce to boolean in case of old WebKit
        return Boolean(document[nativeAPI.fullscreenEnabled])
      }
    }
  })

  leaflet.Control.FullScreen = leaflet.Control.extend({
    options: {
      position: 'topleft',
      title: 'Full Screen',
      titleCancel: 'Exit Full Screen',
      forceSeparateButton: false,
      forcePseudoFullscreen: false,
      fullscreenElement: false
    },

    _screenfull: fullscreenAPI,

    onAdd: function (map) {
      let className = 'leaflet-control-zoom-fullscreen'; let container; let content = ''

      if (map.zoomControl && !this.options.forceSeparateButton) {
        container = map.zoomControl._container
      } else {
        container = leaflet.DomUtil.create('div', 'leaflet-bar')
      }

      if (this.options.content) {
        content = this.options.content
      } else {
        className += ' fullscreen-icon'
      }

      this._createButton(this.options.title, className, content, container, this.toggleFullScreen, this)
      this._map.fullscreenControl = this

      this._map.on('enterFullscreen exitFullscreen', this._toggleState, this)

      return container
    },

    onRemove: function () {
      leaflet.DomEvent
        .off(this.link, 'click', leaflet.DomEvent.stop)
        .off(this.link, 'click', this.toggleFullScreen, this)

      if (this._screenfull.isEnabled) {
        leaflet.DomEvent
          .off(this._container, this._screenfull.nativeAPI.fullscreenchange, leaflet.DomEvent.stop)
          .off(this._container, this._screenfull.nativeAPI.fullscreenchange, this._handleFullscreenChange, this)

        leaflet.DomEvent
          .off(document, this._screenfull.nativeAPI.fullscreenchange, leaflet.DomEvent.stop)
          .off(document, this._screenfull.nativeAPI.fullscreenchange, this._handleFullscreenChange, this)
      }
    },

    _createButton: function (title, className, content, container, fn, context) {
      this.link = leaflet.DomUtil.create('a', className, container)
      this.link.href = '#'
      this.link.title = title
      this.link.innerHTML = content

      this.link.setAttribute('role', 'button')
      this.link.setAttribute('aria-label', title)

      L.DomEvent.disableClickPropagation(container)

      leaflet.DomEvent
        .on(this.link, 'click', leaflet.DomEvent.stop)
        .on(this.link, 'click', fn, context)

      if (this._screenfull.isEnabled) {
        leaflet.DomEvent
          .on(container, this._screenfull.nativeAPI.fullscreenchange, leaflet.DomEvent.stop)
          .on(container, this._screenfull.nativeAPI.fullscreenchange, this._handleFullscreenChange, context)

        leaflet.DomEvent
          .on(document, this._screenfull.nativeAPI.fullscreenchange, leaflet.DomEvent.stop)
          .on(document, this._screenfull.nativeAPI.fullscreenchange, this._handleFullscreenChange, context)
      }

      return this.link
    },

    toggleFullScreen: function () {
      const map = this._map
      map._exitFired = false
      if (map._isFullscreen) {
        if (this._screenfull.isEnabled && !this.options.forcePseudoFullscreen) {
          this._screenfull.exit()
        } else {
          leaflet.DomUtil.removeClass(this.options.fullscreenElement ? this.options.fullscreenElement : map._container, 'leaflet-pseudo-fullscreen')
          map.invalidateSize()
        }
        map.fire('exitFullscreen')
        map._exitFired = true
        map._isFullscreen = false
      } else {
        if (this._screenfull.isEnabled && !this.options.forcePseudoFullscreen) {
          this._screenfull.request(this.options.fullscreenElement ? this.options.fullscreenElement : map._container)
        } else {
          leaflet.DomUtil.addClass(this.options.fullscreenElement ? this.options.fullscreenElement : map._container, 'leaflet-pseudo-fullscreen')
          map.invalidateSize()
        }
        map.fire('enterFullscreen')
        map._isFullscreen = true
      }
    },

    _toggleState: function () {
      this.link.title = this._map._isFullscreen ? this.options.title : this.options.titleCancel
      this._map._isFullscreen ? L.DomUtil.removeClass(this.link, 'leaflet-fullscreen-on') : L.DomUtil.addClass(this.link, 'leaflet-fullscreen-on')
    },

    _handleFullscreenChange: function (ev) {
      const map = this._map
      if (ev.target === map.getContainer() && !this._screenfull.isFullscreen && !map._exitFired) {
        map.invalidateSize()
        map.fire('exitFullscreen')
        map._exitFired = true
        map._isFullscreen = false
      }
    }
  })

  leaflet.Map.include({
    toggleFullscreen: function () {
      this.fullscreenControl.toggleFullScreen()
    }
  })

  leaflet.Map.addInitHook(function () {
    if (this.options.fullscreenControl) {
      this.addControl(leaflet.control.fullscreen(this.options.fullscreenControlOptions))
    }
  })

  leaflet.control.fullscreen = function (options) {
    return new leaflet.Control.FullScreen(options)
  }

  return { leaflet }
}))
