// @ts-check
/* global self */

import { SharedShadow } from '../../shared/SharedShadow.js'
import { ProxifyHook } from '../../proxifyjs/JavaScript/Classes/Helper/ProxifyHook.js'
import { Proxify } from '../../proxifyjs/JavaScript/Classes/Handler/Proxify.js'
import { Chain } from '../../proxifyjs/JavaScript/Classes/Traps/Misc/Chain.js'
import { WebWorkers } from '../../proxifyjs/JavaScript/Classes/Traps/Misc/WebWorkers.js'
import { Html } from '../../proxifyjs/JavaScript/Classes/Traps/Dom/Html.js'
import '../../node_modules/interactjs/dist/interact.js'
// @ts-ignore
const __ = new ProxifyHook(Html(WebWorkers(Chain(Proxify())))).get()

/**
 * This container becomes a css grid and lets its children be aligned and stretched within its grid layout
 *
 * @export
 * @class CssGrid
 * @attribute {'false' | 'open' | 'closed'} [shadow = 'open']
 * @attribute {string} [style = '...']
 * @attribute {number} [minSize = 100]
 */
export default class CssGrid extends SharedShadow() {
  constructor (...args) {
    super(...args)

    if (window.interact) {
      this.interact = self.interact
    } else {
      console.error('SST: Can\'t find interact at global scope!!!')
    }
    
    // css
    const minSize = this.getAttribute('minSize') || 100
    const style = document.createElement('style')
    style.textContent = (this.getAttribute('style') ||
    // optional styles
    `
      :host > * {
        background-color: rgba(166, 211, 225, .6);
        box-shadow: -1px -1px rgba(9, 9, 246, .3) inset;
        z-index: 100; /* TODO: z-index stuff */
      }
      :host > *.dragged{
        background-color: rgba(218, 248, 218, .6);
      }
    `) + 
    // must have styles
    `
      :host {
        display: grid;
        grid-auto-columns: minmax(${minSize}px, 1fr);
        grid-auto-flow: dense;
        grid-auto-rows: minmax(${minSize}px, 1fr);
        grid-gap: unset;
      }
    `

    // copy children to shadow, if shadow (this.shadow) exists
    if (this.shadow) this.shadow = __(this.shadow).$appendChildren([style, ...Array.from(this.childNodes)])
  }

  connectedCallback () {
    console.log('connected');
  }

  disconnectedCallback () {
    console.log('disconnected');
  }

  attributeChangedCallback () {
    console.log('attributeChanged');
  }
}
