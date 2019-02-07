/* global HTMLElement */

// This container displays the actual year
export default class NowYear extends HTMLElement {
  constructor () {
    super()

    const shadow = this.getAttribute('shadow') || 'open'
    if (shadow !== 'false') this.root = this.attachShadow({ mode: shadow })

    const container = this.root || this
    container.innerHTML = (new Date()).getFullYear()
  }
}
