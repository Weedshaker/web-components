// @ts-check

/* global IntersectionObserver */

import { MasterShadow } from './MasterShadow.js'

/**
 * MasterIntersectionObserver is a helper which sets up a new IntersectionObserver in the context of a web component
 * NOTE: MasterIntersectionObserver comes with event queues, which use can be overwritten by intersectionCallback if not needed. A full queue web component would make sense with ES6 Proxies aka. Proxify.js to queue not only events but any attribute and function.
 *
 * @export
 * @function MasterIntersectionObserver
 * @param {Function | *} ChosenClass
 * @attribute {'string'} [intersectionObserverInit=`{
      'root': undefined
      'rootMargin': '200px 0px 200px 0px',
      'threshold': 0
    }`]
 * @requires {
      MasterShadow: {
        connectedCallback,
        disconnectedCallback,
        getCustomEvent,
        parseAttribute
      }
    }
 * @property {
      addCustomEventListener
      dispatchCustomEvent
      intersectionCallback,
      isIntersectionObserverActive,
      isIntersectionObserverIntersecting,
      intersectionObserveStart,
      intersectionObserveStop,
      customEventsToDispatchQueue,
      customEventsToListenQueue,
      intersectionEventListeners
    }
 */
export const MasterIntersectionObserver = (ChosenClass = MasterShadow()) => class MasterIntersectionObserver extends ChosenClass {
  /**
   * Creates an instance of MasterIntersectionObserver. The constructor will be called for every custom element using this class when initially created.
   *
   * @param {{intersectionObserverInit: IntersectionObserverInit | undefined}} [masterArgs = {intersectionObserverInit: undefined}]
   * @param {*} args
   */
  constructor (masterArgs = { intersectionObserverInit: undefined }, ...args) {
    super(masterArgs, ...args)

    /**
     * Digest attribute to have IntersectionObservers or not
     * this will trigger this.intersectionCallback, which will work through this.customEventsToDispatchQueue, this.customEventsToListenQueue & this.intersectionEventListeners, which gets filled by this.dispatchCustomEvent & this.addCustomEventListener for lazy event reactions as well as it can be extended
     * see => https://developer.mozilla.org/en-US/docs/Web/API/IntersectionObserver/IntersectionObserver Properties
     *
     * @type {IntersectionObserverInit}
     */
    let intersectionObserverInit = typeof masterArgs.intersectionObserverInit === 'object' ? masterArgs.intersectionObserverInit : MasterIntersectionObserver.parseAttribute(this.getAttribute('intersectionObserverInit'))
    /** @type {true | false | 'notInitialized'} */
    this.isIntersectionObserverActive = 'notInitialized'
    /** @type {true | false | 'notInitialized'} */
    this.isIntersectionObserverIntersecting = 'notInitialized'
    if (intersectionObserverInit) {
      // add default IntersectionObserverInit Props
      intersectionObserverInit = Object.assign({
        root: undefined,
        rootMargin: '200px 0px 200px 0px',
        threshold: 0
      }, intersectionObserverInit)
      /** @type {IntersectionObserver} */
      const intersectionObserver = new IntersectionObserver(this.intersectionCallback.bind(this), intersectionObserverInit)
      /** @return {void} */
      this.intersectionObserveStart = () => {
        this.isIntersectionObserverActive = true
        this.isIntersectionObserverIntersecting = false
        // @ts-ignore
        intersectionObserver.observe(this)
      }
      /** @return {void} */
      this.intersectionObserveStop = () => {
        intersectionObserver.disconnect()
        this.isIntersectionObserverActive = false
        this.isIntersectionObserverIntersecting = false
      }
      /** @type {Map<CustomEvent, ShadowRoot | HTMLElement | Element>} */
      this.customEventsToDispatchQueue = new Map()
      /**
       * Can also be used to push functions which shall be executed on intersection and then cleared
       *
       * @type {Map<CustomEvent | Event | string, (any)=>void | EventListener>}
       */
      this.customEventsToListenQueue = new Map()
      /**
       * Is used to push functions which shall be always executed on intersection
       *
       * @type {function[]}
       */
      this.intersectionEventListeners = []
    } else {
      /** @return {void} */
      this.intersectionObserveStart = () => {}
      /** @return {void} */
      this.intersectionObserveStop = () => {}
      console.warn('MasterIntersectionObserver got not started, due to missing masterArgs.intersectionObserverInit')
    }
  }

  /**
   * Lifecycle callback, triggered when node is attached to the dom
   *
   * @return {void}
   */
  connectedCallback () {
    super.connectedCallback()
    this.intersectionObserveStart()
  }

  /**
   * Lifecycle callback, triggered when node is detached from the dom
   *
   * @return {void}
   */
  disconnectedCallback () {
    super.disconnectedCallback()
    this.intersectionObserveStop()
  }

  /**
   * observes intersection with its intersectionObserverInit.root (dom viewport)
   *
   * @param {IntersectionObserverEntry[]} entries
   * @param {IntersectionObserver} observer
   * @return {true | false | 'notInitialized'}
   */
  intersectionCallback (entries, observer) {
    entries.forEach(entry => {
      this.isIntersectionObserverIntersecting = entry.isIntersecting
      if (entry.isIntersecting) {
        this.customEventsToDispatchQueue.forEach((element, event) => this.dispatchCustomEvent(event, element, true))
        this.customEventsToDispatchQueue.clear()
        this.customEventsToListenQueue.forEach((listener, event) => listener(event))
        this.customEventsToListenQueue.clear()
        this.intersectionEventListeners.forEach(listener => listener())
      }
    })
    return this.isIntersectionObserverIntersecting
  }

  /**
   * listens to custom events when intersectionObserver is not active or is intersecting. otherwise it stores it in a queue to be listened to the event later when intersecting
   *
   * @param {HTMLElement | Element} [target]
   * @param {string} type
   * @param {EventListener} listener
   * @param {EventListenerOptions | {}} [options = {capture: false, once: false, passive: false}]
   * @return {void}
   */
  addCustomEventListener (target, type, listener, options) {
    target.addEventListener(type, event => {
      if (this.isIntersectionObserverActive === false || this.isIntersectionObserverIntersecting === true) return listener(event)
      this.customEventsToListenQueue.set(event, listener)
    }, options)
  }

  /**
   * dispatches custom events when intersectionObserver is not active or is intersecting. otherwise stores it in a queue to be dispatched later when intersecting
   *
   * @param {CustomEvent} event
   * @param {ShadowRoot | HTMLElement | Element} [element = this.root]
   * @param {boolean} [force = false]
   * @return {boolean}
   */
  dispatchCustomEvent (event, element = this.root, force = false) {
    if (this.isIntersectionObserverActive === false || this.isIntersectionObserverIntersecting === true || force) {
      element.dispatchEvent(event)
      return true
    }
    this.customEventsToDispatchQueue.set(event, element)
    return false
  }

  /**
   * Register functions to be executed at intersection
   *
   * @param {(any?)=>void} listener
   * @param {boolean} [once=false]
   * @return {boolean}
   */
  addIntersectionEventListener (listener, once = false) {
    if (once) {
      // immediately execute when already intersecting
      if (this.isIntersectionObserverIntersecting === true) {
        listener()
        return true
      }
      if (this.customEventsToListenQueue) {
        // use the events queue, since this will be cleared after execution
        this.customEventsToListenQueue.set('once', listener)
        return true
      }
    } else {
      // immediately execute when already intersecting
      if (this.isIntersectionObserverIntersecting === true) listener()
      if (this.intersectionEventListeners) {
        this.intersectionEventListeners.push(listener)
        return true
      }
    }
    // execute when it could not be registered and it wasn't executed immediately
    if (this.isIntersectionObserverIntersecting === false) listener()
    return false
  }
}
