/* global fetch */
/* global window */
/* global IntersectionObserver */

import { SharedShadow } from '../shared/SharedShadow.js'

// fetchOptions: string = "{'mode': 'same-origin'}"
// lazy:boolean = (default "false")
export default class SharedFetch extends SharedShadow() {
  constructor (...args) {
    super(...args)

    if (window.IntersectionObserver && this.getAttribute('lazy') === 'true') {
      this.loadCommands = []
      this._load = this.load
      this.load = (path, parse) => {
        return new Promise(resolve => {
          this.loadCommands.push([path, parse, resolve])
        })
      }
      new IntersectionObserver(this.handleIntersect.bind(this), {
        root: null,
        rootMargin: '0px',
        threshold: 0.5
      }).observe(this)
    }
  }
  handleIntersect (entries, observer) {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        this.loadCommands.forEach(async loadCommand => {
          const [path, parse, resolve] = loadCommand
          resolve(await this._load(path, parse))
        })
      }
    })
    this.loadCommands = []
    this.load = this._load // restore normal behavior after intersected
    observer.disconnect()
  }
  async load (path, parse = 'text') {
    try {
      const response = await fetch(path, this.jsonParseAttribute('fetchOptions'))
      return await response[parse]()
    } catch (e) {
      console.warn(`${path} could not be loaded: ${e.message}`)
      return ''
    }
  }
}
