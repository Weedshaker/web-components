/* global location */
/* global CustomEvent */

import SharedFetch from './SharedFetch.js'
import { ProxifyHook } from '../proxifyjs/JavaScript/Classes/Helper/ProxifyHook.js'
import { Proxify } from '../proxifyjs/JavaScript/Classes/Handler/Proxify.js'
import { Html } from '../proxifyjs/JavaScript/Classes/Traps/Dom/Html.js'
import { Events } from '../proxifyjs/JavaScript/Classes/Traps/Dom/Events.js'

const __ = new ProxifyHook(Events(Html(Proxify()))).get()

// This container grabs all its childrens href's and adds onclick behavior to it, where it pushes fetched href contents to an other element with the specified id. Useful for Singlepage Menus.
// Attributes:
// ---applies to root only---
// shadow:string = "false", "open", "closed" (default "open")
// setHash:boolean = (default "false")
// ---applies to href el only---
// href:string = fetchPath
// ---applies to both with prio href el---
// parse:string = "text", "json", ... (default "text")
// fetchToId:string = id of the content container to push text to as "content" attribute, if not set El will dispatch an event, listen eg. document.getElementsByTagName('body')[0].addEventListener('FetchHref_content', e => console.log(e));
// autoLoad:boolean = (default "false")
// fetchOptions: string = "{'mode': 'same-origin'}"
// lazy:boolean = (default "false")
export default class FetchHref extends SharedFetch {
  constructor (...args) {
    super(...args)

    // copy children to shadow, if shadow (this.shadow) exists
    if (this.shadow) this.shadow = __(this.shadow).$appendChildren(Array.from(this.childNodes))

    this.allLinks = []

    if (this.getAttribute('setHash') === 'true') {
      window.addEventListener('hashchange', event => {
        this.allLinks.forEach(link => link.classList[this.compareHashStrings(location.hash, link.innerHTML) ? 'add' : 'remove']('active'))
      })
    }
  }

  connectedCallback () {
    if (!this.initialized) {
      const container = __(this.root)
      this.addOnClick(container.childNodes)
      this.initialized = true
    }
  }

  addOnClick (childNodes) {
    Array.from(childNodes).forEach(childNode => {
      let href = ''
      if (typeof childNode.getAttribute === 'function' && !childNode.getAttribute('rel') && (href = childNode.getAttribute('href')) && href.length !== 0) {
        this.allLinks.push(childNode.$onclick([
          (event, memory, target, prop, receiver) => {
            event.preventDefault()
            if (this.getAttribute('setHash') === 'true') location.hash = `#${childNode.innerHTML}`
            this.applyContent(childNode, href, memory).then(() => {
              this.allLinks.forEach(link => link.classList[childNode === link ? 'add' : 'remove']('active'))
            })
          },
          {
            raw: ''
          }
        ]))
        if (this.compareHashStrings(location.hash, childNode.innerHTML) || (!location.hash && (childNode.getAttribute('autoLoad') === 'true' || this.getAttribute('autoLoad') === 'true'))) {
          childNode.click()
        }
      }
      this.addOnClick(childNode.childNodes) // recursive
    })
  }

  async applyContent (childNode, href, memory) {
    if (!memory.raw) memory.raw = await this.load(href, childNode.getAttribute('parse') || this.getAttribute('parse') || undefined)
    const content = `${memory.raw}|###|${href}`
    const individuelContentEl = document.getElementById(childNode.getAttribute('fetchToId') || this.getAttribute('fetchToId'))
    if (individuelContentEl) {
      individuelContentEl.setAttribute('content', content) // trigger life cycle event
    } else {
      this.dispatchEvent(new CustomEvent('FetchHref_content', {
        bubbles: true,
        detail: {
          content,
          childNode
        }
      }))
    }
  }

  compareHashStrings (string1, string2) {
    return string1.replace('#', '').replace(/%20/g, ' ') === string2.replace('#', '').replace(/%20/g, ' ')
  }
}
