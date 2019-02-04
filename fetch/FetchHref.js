import SharedHTMLElement from './SharedFetchElement.js'
import { ProxifyHook } from '../proxifyjs/JavaScript/Classes/Helper/ProxifyHook.js'
import { Proxify } from '../proxifyjs/JavaScript/Classes/Handler/Proxify.js'
import { Html } from '../proxifyjs/JavaScript/Classes/Traps/Dom/Html.js'
import { Events } from '../proxifyjs/JavaScript/Classes/Traps/Dom/Events.js'

const __ = new ProxifyHook(Events(Html(Proxify()))).get()

// This container grabs all its childrens href's and adds onclick behavior to it, where it pushes fetched href contents to an other element with the specified id. Useful for Singlepage Menus.
// Attributes:
// ---applies to root only---
// shadow:string = "false", "open", "closed" (default "open")
// ---applies to href el only---
// href:string = fetchPath
// ---applies to both with prio href el---
// parse:string = "text", "json", ... (default "text")
// fetchToId:string = id of the content container to push text to as "content" attribute
// autoLoad:boolean = (default "false")
// lazy:boolean = (default "false")
export default class FetchHref extends SharedHTMLElement {
  constructor () {
    super()

    const shadow = this.getAttribute('shadow') || 'open'
    if (shadow !== 'false') this.root = __(this.attachShadow({ mode: shadow })).$appendChildren(Array.from(this.childNodes))
  }
  connectedCallback () {
    if(!this.initialized){
      const container = this.root || __(this)
      this.addOnClick(__(container.childNodes))
      this.initialized = true
    }
  }
  addOnClick (childNodes) {
    Array.from(childNodes).forEach(childNode => {
      let href = ''
      if(typeof childNode.getAttribute === 'function' && (href = childNode.getAttribute('href')) && href.length !== 0){
        childNode.$onclick([
          async (event, memory, target, prop, receiver) => {
            event.preventDefault()
            if (!memory.raw) memory.raw = await this.load(href, childNode.getAttribute('parse') || this.getAttribute('parse') || undefined)
            const individuelContentEl = document.getElementById(childNode.getAttribute('fetchToId') || this.getAttribute('fetchToId') || 'container')
            if (individuelContentEl) individuelContentEl.setAttribute('content', `${memory.raw}|###|${href}`) // trigger life cycle event
          },
          {
            raw: ''
          }
        ])
        if((childNode.getAttribute('autoLoad') && childNode.getAttribute('autoLoad') === 'true') || (!childNode.getAttribute('autoLoad') && this.getAttribute('autoLoad') && this.getAttribute('autoLoad') === 'true')){
          childNode.click()
        }
      }
      this.addOnClick(childNode.childNodes) // recursive
    })
  }
}