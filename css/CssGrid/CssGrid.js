// @ts-check
/* global self */

import { SharedShadow } from '../../shared/SharedShadow.js'
import { ProxifyHook } from '../../proxifyjs/JavaScript/Classes/Helper/ProxifyHook.js'
import { Proxify } from '../../proxifyjs/JavaScript/Classes/Handler/Proxify.js'
import { Chain } from '../../proxifyjs/JavaScript/Classes/Traps/Misc/Chain.js'
import { WebWorkers } from '../../proxifyjs/JavaScript/Classes/Traps/Misc/WebWorkers.js'
import { Html } from '../../proxifyjs/JavaScript/Classes/Traps/Dom/Html.js'

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
  // attributeChangedCallback - Note: only attributes listed in the observedAttributes property will receive this callback.
  static get observedAttributes () { return ['active'] }

  constructor (...args) {
    console.log('constructor')
    super(...args)

    // interact.js
    const interactErrorMsg = 'SST: Can\'t find interact at global scope!!!'
    if (!self.interact) {
      this.interact = import('../../node_modules/interactjs/dist/interact.js').then(module => {
        if (module && self.interact) {
          this.interact = self.interact
        } else {
          console.error(interactErrorMsg)
        }
      })
    } else if (typeof this.interact === 'function') {
      this.interact = self.interact
    } else {
      console.error(interactErrorMsg)
    }

    // callbacks
    this.observer = new MutationObserver(this.mutationCallback)
    // https://developer.mozilla.org/en-US/docs/Web/API/MutationObserverInit
    this.observerConfig = {
      attributes: false, // already observed at attributeChangedCallback
      childList: true,
      subtree: false
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

    // paste style to root
    if (this.shadow) {
      // + move children to shadow, if shadow (this.shadow) exists
      __(this.root).$appendChildren([style, ...Array.from(this.childNodes)])
    } else {
      // + replace css :host with nodeName, if shadow (this.shadow) NOT exists
      style.textContent = style.textContent.replace(/:host/g, this.nodeName)
      __(this.root).$appendChildren([style])
    }
  }

  connectedCallback () {
    console.log('connected')
    this.observer.observe(this.root, this.observerConfig)
    // check if this.interact is a promise
    if ('then' in this.interact) {
      this.interact.then(() => console.log('promise start interact'))
    } else if (typeof this.interact === 'function') {
      console.log('direct start interact')
    } else {
      console.error('SST: Can\'t start interactJS!!!')
    }
  }
  
  disconnectedCallback () {
    console.log('disconnected')
    this.observer.disconnect()
  }

  attributeChangedCallback (name, oldValue, newValue) {
    console.log('attributeChanged', name, oldValue, newValue)
  }

  mutationCallback (mutationsList, observer) {
    console.log('mutation', mutationsList, observer)
  }
}
