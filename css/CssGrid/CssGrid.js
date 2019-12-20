// @ts-nocheck

/* global self */
/* global MutationObserver */

import { SharedShadow } from '../../shared/SharedShadow.js'
import { ProxifyHook } from '../../proxifyjs/JavaScript/Classes/Helper/ProxifyHook.js'
import { Proxify } from '../../proxifyjs/JavaScript/Classes/Handler/Proxify.js'
import { Chain } from '../../proxifyjs/JavaScript/Classes/Traps/Misc/Chain.js'
import { Html } from '../../proxifyjs/JavaScript/Classes/Traps/Dom/Html.js'
import Drag from './Helper/Drag.js'
import Resize from './Helper/Resize.js'
import Doubletap from './Helper/Doubletap.js'

// @ts-ignore
const __ = new ProxifyHook(Html(Chain(Proxify()))).get()

/**
 * This container becomes a css grid and lets its children be aligned and stretched within its grid layout
 *
 * @export
 * @class CssGrid
 * @attribute { 'false' | 'open' | 'closed' } [shadow = 'open']
 * @attribute { string } [customStyle = `
    ${host} {
      --overlay-grid-border: 1px dashed rgba(148, 0, 255, .6);
    }
    ${host} > section.grid > * {
      background-color: rgba(166, 211, 225, .6);
      box-shadow: -1px -1px rgba(9, 9, 246, .3) inset;
    }
    ${host} > section.grid > *.dragged{
      background-color: rgba(218, 248, 218, .6);
    }
   `]
 * @attribute { number } [minSizeColumn = 100]
 * @attribute { number } [minSizeRow = 100]
 */
export default class CssGrid extends SharedShadow() {
  // attributeChangedCallback - Note: only attributes listed in the observedAttributes property will receive this callback.
  static get observedAttributes () { return ['active'] }

  constructor (...args) {
    console.log('constructor')
    super(...args)

    // load interact.js
    const interactLoaded = error => {
      // @ts-ignore
      if (!error && typeof self.interact === 'function' && self.interact.version) {
        // @ts-ignore
        this.interact = self.interact
        // init all needed functionality
        this.drag = new Drag(__, this.interact, this.root)
        this.resize = new Resize(__, this.interact, this.root, this.minSizeColumn, this.minSizeRow)
        this.doubletap = new Doubletap(__, this.interact, this.root, this.defaultZIndex)
      } else {
        console.error('SST: Can\'t find interact at global scope!!!', error)
      }
    }
    // @ts-ignore
    if (!self.interact) {
      // interact.js has no transpiled release/dist version in the repo but typescript. This makes it unsuitable to use it as a submodule, hence using jsdelivr
      this.interact = import('https://cdn.jsdelivr.net/npm/interactjs@1.7.2/dist/interact.min.js').then(module => interactLoaded()).catch(error => interactLoaded(error))
    } else {
      interactLoaded()
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
    this.defaultZIndex = 100
    const host = this.shadow ? ':host' : this.nodeName // host: only works if shadow active
    this.minSizeColumn = Number(this.getAttribute('minSizeColumn')) || 100
    this.minSizeRow = Number(this.getAttribute('minSizeRow')) || 100
    const customStyle = __('style').$setTextContent((this.getAttribute('customStyle') || '').replace(/\${host}/g, host) ||
      // optional styles
      `
        ${host} {
          --overlay-grid-border: 1px dashed rgba(148, 0, 255, .6);
        }
        ${host} > section.grid > * {
          background-color: rgba(166, 211, 225, .6);
          box-shadow: -1px -1px rgba(9, 9, 246, .3) inset;
        }
        ${host} > section.grid > *.dragged{
          background-color: rgba(218, 248, 218, .6);
        }
      `
    ).$setClassName('customStyle')
    const mandatoryStyle = __('style').$setTextContent(
      // must have styles
      `
        ${host} > section.grid {
          display: grid;
          grid-auto-columns: minmax(${this.minSizeColumn}px, 1fr);
          grid-auto-flow: dense;
          grid-auto-rows: minmax(${this.minSizeRow}px, 1fr);
          grid-gap: unset;
        }
        ${host} > section.grid > * {
          box-sizing: border-box;
          touch-action: none;
          user-select: none;
          z-index: ${this.defaultZIndex};
        }
      `
    ).$setClassName('mandatoryStyle')

    // grid
    this.grid = __('section').$setClassName('grid')
    // body
    this.body = __(document.body)

    // move children to grid
    __(this.grid).$appendChildren(Array.from(this.childNodes))
    __(this.root).$appendChildren([customStyle, mandatoryStyle, this.grid])
  }

  connectedCallback () {
    console.log('connected')
    this.observer.observe(this.root, this.observerConfig)
    // check if this.interact is a promise
    if ('then' in this.interact) {
      this.interact.then(() => {
        this.drag.start(this.grid, this.body, this.gridChildTypes)
        this.resize.start(this.grid, this.body, this.gridChildTypes)
        this.doubletap.start(this.grid, this.gridChildTypes)
      })
    } else {
      this.drag.start(this.grid, this.body, this.gridChildTypes)
      this.resize.start(this.grid, this.body, this.gridChildTypes)
      this.doubletap.start(this.grid, this.gridChildTypes)
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

  /**
   * gives an array of HTMLElements back
   *
   * @readonly
   * @returns { HTMLElement[] }
   */
  get gridChildTypes () {
    return Array.from(this.grid.children).reduce((acc, child) => child.tagName && !acc.includes(child.tagName) ? acc.concat([child.tagName]) : acc, []).join(',') || '*'
  }
}
