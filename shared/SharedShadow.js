/* global HTMLElement */

export const SharedShadow = (ChoosenHTMLElement = HTMLElement) => class SharedShadow extends ChoosenHTMLElement {
  constructor (...args) {
    super(...args)

    const shadow = this.getAttribute('shadow') || 'open'
    if (shadow !== 'false') this.root = this.attachShadow({ mode: shadow })
  }
  get container () {
    return this.root || this
  }
}
