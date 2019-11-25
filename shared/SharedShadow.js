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

  jsonParseAttribute (name) {
    const attribute = this.getAttribute(name)
    if (!attribute || typeof attribute !== 'string') return undefined
    try {
      return JSON.parse(attribute.replace(/\'/g, '"')) || undefined
    } catch (e) {
      return undefined
    }
  }
}
