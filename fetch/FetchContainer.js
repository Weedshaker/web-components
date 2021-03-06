/* global window */
/* global history */
/* global location */

import SharedFetch from './SharedFetch.js'
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
// useJSinShadow:boolean (default false) // this only works when useIframe="false"
// useIframe:boolean (default true)
// iframeWidth:string (default 100%)
// iframeHeight:string (default 100%)
// iframeSeamless:boolean (default true)
// iframeScrolling:string (default "no")
// iframeBorder:string (default 0)
// iframeOverflow:string (default "hidden")
// changeTitle:boolean (default false)
// history:boolean (default false)
// href:string = fetchPath
// fetchOptions: string = "{'mode': 'same-origin'}"
// lazy:boolean = (default "false")
export default class FetchContainer extends SharedFetch {
  // attributeChangedCallback - Note: only attributes listed in the observedAttributes property will receive this callback.
  static get observedAttributes () { return ['content'] }
  constructor (...args) {
    super(...args)

    this.htmlHrefSplit = '|###|'

    this.origChildNodes = Array.from(this.childNodes)
    // copy children to shadow, if shadow (this.shadow) exists
    if (this.shadow) this.shadow = __(this.shadow).$appendChildren(Array.from(this.childNodes))

    this.titleEl = document.getElementsByTagName('title')[0] && __(document.getElementsByTagName('title')[0])
    this.baseEl = document.getElementsByTagName('base')[0] && __(document.getElementsByTagName('base')[0])
    if (this.baseEl && !this.baseEl.getAttribute('orig_href')) this.baseEl.setAttribute('orig_href', this.baseEl.getAttribute('href'))

    this.iframeSize = [this.getAttribute('iframeWidth'), this.getAttribute('iframeHeight')]
    if (this.getAttribute('history') === 'true') {
      this.history = new Map()
      window.addEventListener('popstate', event => {
        if (event.state) {
          const newValue = this.history.get(event.state.timestamp)
          if (newValue) this.attributeChangedCallback('content', '', newValue, true)
        }
      })
    }
  }

  connectedCallback () {
    if (this.getAttribute('href')) this.directLoadHref(this.getAttribute('href'))
  }

  async directLoadHref (href) {
    this.setAttribute('content', `${await this.load(href, this.getAttribute('parse') || undefined)}${this.htmlHrefSplit}${this.getAttribute('href')}`)
  }

  async attributeChangedCallback (name, oldValue, newValue, notUpdateHistory = false) {
    if (name === 'content' && newValue) {
      const container = __(this.root)
      const [html, href] = newValue.split(this.htmlHrefSplit)
      // load it into an iframe (shadow dom does not sandbox js)
      if (this.getAttribute('useIframe') !== 'false' && (!html || html.includes('<script')) && href) {
        container.host.classList.add('iframe')
        container.host.classList.remove('html')
        container
          .$setInnerHTML('')
          .appendChild(__('iframe'))
          .$setSrc(href)
          .$_setAttribute('seamless', this.getAttribute('iframeSeamless') !== 'false')
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
                const tollerance = 5 // this is typically 4px, due to scrollbars thats always added when set new min-height
                const iframeDoc = receiver.contentDocument ? receiver.contentDocument : receiver.contentWindow.document
                let iframeBody
                if ((iframeBody = iframeDoc.getElementsByTagName('body')[0])) iframeBody.$appendChildren(this.origChildNodes)
                const getHeight = () => Math.max(iframeDoc.body.scrollHeight, iframeDoc.body.offsetHeight, iframeDoc.documentElement.clientHeight, iframeDoc.documentElement.scrollHeight, iframeDoc.documentElement.offsetHeight)
                const interval = setInterval(() => {
                  receiver.$getStyle((receiver, prop, style) => {
                    if ((Number(style.$getMinHeight().replace('px', '')) || 0) + tollerance < getHeight()) {
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
        container.host.classList.add('html')
        container.host.classList.remove('iframe')
        if (this.baseEl) {
          const newBaseElHref = href ? href.replace(/[^/]*?$/, '') : await __(this).$wwGetBase(null, html)
          if (newBaseElHref) this.baseEl.setAttribute('href', newBaseElHref)
        }
        container.$setInnerHTML(html)
        if (this.getAttribute('useJSinShadow') === 'true') this.activateJS(container)
        if (this.baseEl) this.baseEl.setAttribute('href', this.baseEl.getAttribute('orig_href')) // reset the base url to the original parameter
        container.$appendChildren(this.origChildNodes)
      }
      this.setAttribute(name, '') // clear the attribute after applying it to innerHTML
      let newTitleEl = ''
      if (this.titleEl && this.getAttribute('changeTitle') === 'true') {
        newTitleEl = typeof container.getElementsByTagName === 'function' && container.getElementsByTagName('title')[0] ? container.getElementsByTagName('title')[0] : await __(this).$wwGetTitle(null, html) // chrome doesn't have getElementsByTagName on shodowDom Root
        if (newTitleEl) this.titleEl.$setInnerText(newTitleEl.innerText || newTitleEl)
      }
      if (this.history && !notUpdateHistory) {
        const timestamp = Date.now()
        this.history.set(timestamp, newValue)
        history[location.hash ? 'replaceState' : 'pushState']({ timestamp }, newTitleEl.innerText || newTitleEl, location.hash)
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

  activateJS (container) {
    Array.from(container.getElementsByTagName('script')).forEach(script => {
      const newScript = document.createElement('script')
      if (script.innerHTML) newScript.innerHTML = script.innerHTML
      if (script.src) newScript.src = script.src
      script.parentNode.replaceChild(newScript, script)
    })
  }
}
