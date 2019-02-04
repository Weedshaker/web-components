/* global window */

import SharedHTMLElement from './SharedFetchElement.js'
import { ProxifyHook } from '../proxifyjs/JavaScript/Classes/Helper/ProxifyHook.js'
import { Proxify } from '../proxifyjs/JavaScript/Classes/Handler/Proxify.js'
import { Chain } from '../proxifyjs/JavaScript/Classes/Traps/Misc/Chain.js'
import { WebWorkers } from '../proxifyjs/JavaScript/Classes/Traps/Misc/WebWorkers.js'
import { Html } from '../proxifyjs/JavaScript/Classes/Traps/Dom/Html.js'
import { Events } from '../proxifyjs/JavaScript/Classes/Traps/Dom/Events.js'

const __ = new ProxifyHook(Events(Html(WebWorkers(Chain(Proxify()))))).get()

// This container fetches its content by the href set to it or receives content by the content attribute. It will sandbox css in the ShadowDom and js in an iframe.
// Attributes:
// ---applies to root only---
// shadow:string = "false", "open", "closed" (default "open")
// iframeWidth:string (default 100%)
// iframeHeight:string (default 100%)
// iframeSeamless:boolean (default true)
// iframeScrolling:string (default "no")
// iframeBorder:string (default 0)
// iframeOverflow:string (default "hidden")
// changeTitle:boolean (default false)
// history:boolean (default false)
// href:string = fetchPath
// lazy:boolean = (default "false")
export default class FetchContainer extends SharedHTMLElement {
  static get observedAttributes () { return ['content'] }
  constructor () {
    super()

    this.htmlHrefSplit = '|###|'

    const shadow = this.getAttribute('shadow') || 'open'
    if (shadow !== 'false') this.root = __(this.attachShadow({ mode: shadow }))

    this.titleEl = __(document.getElementsByTagName('title')[0])
    this.baseEl = __(document.getElementsByTagName('base')[0])
    if (this.baseEl) this.baseEl.setAttribute('orig_href', this.baseEl.getAttribute('href'))

    this.iframeSize = [this.getAttribute('iframeWidth'), this.getAttribute('iframeHeight')]
    if (this.getAttribute('href')) this.directLoadHref(this.getAttribute('href'))
    if(this.getAttribute('history') === 'true'){
      this.history = new Map()
      window.addEventListener('popstate', event => {
        if(event.state){
          const newValue = this.history.get(event.state.timestamp)
          if (newValue) this.attributeChangedCallback('content', '', newValue, true)
        }
      })
    }
  }
  async directLoadHref(href){
    this.setAttribute('content', `${await this.load(href, this.getAttribute('parse') || undefined)}${this.htmlHrefSplit}${this.getAttribute('href')}`)
  }
  async attributeChangedCallback (name, oldValue, newValue, notUpdateHistory = false) {
    if (name === 'content' && newValue) {
      const container = this.root || __(this)
      const [html, href] = newValue.split(this.htmlHrefSplit)
      // load it into an iframe (shadow dom does not sandbox js)
      if ((!html || html.includes('<script')) && href) {
        container
          .$setInnerHTML('')
          .appendChild(__('iframe'))
          .$setSrc(href)
          .$_setAttribute('seamless', (this.getAttribute('iframeSeamless') && this.getAttribute('iframeSeamless') === 'true') || true)
          .$_setAttribute('scrolling', this.getAttribute('iframeScrolling') || 'no')
          .$getStyle((receiver, prop, style) => {
            style
              .$setBorder(this.getAttribute('iframeBorder') || 0)
              .$setHeight(this.iframeSize[1] || '100%')
              .$setOverflow(this.getAttribute('iframeOverflow') || 'hidden')
              .$setWidth(this.iframeSize[0] || '100%')
          })
          .$func((receiver) => {
            if (!this.iframeSize[1]) {
              receiver.$onload((event, memory, target, prop, receiver) => {
                const iframeDoc = receiver.contentDocument ? receiver.contentDocument : receiver.contentWindow.document
                const getHeight = () => Math.max(iframeDoc.body.scrollHeight, iframeDoc.body.offsetHeight, iframeDoc.documentElement.clientHeight, iframeDoc.documentElement.scrollHeight, iframeDoc.documentElement.offsetHeight)
                const interval = setInterval(() => {
                  receiver.$getStyle((receiver, prop, style) => {
                    if (style.$getMinHeight() !== `${getHeight()}px`) {
                      style.$setMinHeight(`${getHeight()}px`)
                    } else {
                      clearInterval(interval)
                    }
                  })
                }, 100)
              })
            }
          })
      // load it straight into the shadow dom
      } else if (html) {
        if (this.baseEl) {
          const newBaseElHref = href ? href.replace(/[^/]*?$/, '') : await __(this).$wwGetBase(null, html)
          if (newBaseElHref) this.baseEl.setAttribute('href', newBaseElHref)
        }
        container.$setInnerHTML(html)
        if (this.baseEl) this.baseEl.setAttribute('href', this.baseEl.getAttribute('orig_href')) // reset the base url to the original parameter
      }
      this.setAttribute(name, '') // clear the attribute after applying it to innerHTML
      let newTitleEl = ''
      if (this.titleEl && this.getAttribute('changeTitle') === 'true') {
        newTitleEl = container.getElementsByTagName('title')[0] || await __(this).$wwGetTitle(null, html)
        if (newTitleEl) this.titleEl.$setInnerText(newTitleEl.innerText || newTitleEl)
      }
      if (this.history && !notUpdateHistory) {
        const timestamp = Date.now()
        this.history.set(timestamp, newValue)
        history.pushState({ timestamp }, newTitleEl.innerText || newTitleEl, '')
      }
    }
  }
  getBase (text) {
    try {
      return /.*<base.*?href="(.*?)".*?>/mgi.exec(text)[1]
    } catch (e) {
      return ''
    }
  }
  getTitle (text) {
    try {
      return /.*<title>(.*?)<\/title>/mgi.exec(text)[1]
    } catch (e) {
      return ''
    }
  }
}