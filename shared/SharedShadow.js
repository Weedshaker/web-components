/* global HTMLElement */

export const SharedShadow = (ChoosenHTMLElement = HTMLElement) => class SharedShadow extends ChoosenHTMLElement {
  constructor (...args) {
    super(...args)

    const shadow = this.getAttribute('shadow') || 'open'
    if (shadow !== 'false') this.shadow = this.attachShadow({ mode: shadow })
  }
  get root () {
    return this.shadow || this
  }
}
