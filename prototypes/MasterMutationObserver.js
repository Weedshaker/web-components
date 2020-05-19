// @ts-check

/* global MutationObserver */

import { MasterShadow } from './/MasterShadow.js'

/**
 * MasterMutationObserver is a helper which sets up a new MutationObserver in the context of a web component
 *
 * @export
 * @function MasterMutationObserver
 * @param {Function | *} ChosenClass
 * @attribute {'string'} [mutationObserverInit=`{
      'attributeFilter': undefined
      'attributes': false,
      'attributeOldValue': true,
      'characterData': false,
      'characterDataOldValue': true,
      'childList': false,
      'subtree': false
    }`]
 * @requires {
      MasterShadow: {
        connectedCallback,
        disconnectedCallback,
        hasShadow,
        parseAttribute,
        root,
        shadow
      }
    }
 * @property {
      mutationCallback,
      mutationObserveStart,
      mutationObserveStop
    }
 */
export const MasterMutationObserver = (ChosenClass = MasterShadow()) => class MasterMutationObserver extends ChosenClass {
  /**
   * Creates an instance of MasterMutationObserver. The constructor will be called for every custom element using this class when initially created.
   *
   * @param {{mutationObserverInit: MutationObserverInit | undefined}} [masterArgs = {mutationObserverInit: undefined}]
   * @param {*} args
   */
  constructor (masterArgs = { mutationObserverInit: undefined }, ...args) {
    super(masterArgs, ...args)

    /**
     * Digest attribute to have MutationObservers or not
     * this will trigger this.mutationCallback and can be extended
     * see => https://developer.mozilla.org/en-US/docs/Web/API/MutationObserverInit Properties
     *
     * @type {MutationObserverInit}
     */
    let mutationObserverInit = typeof masterArgs.mutationObserverInit === 'object' ? masterArgs.mutationObserverInit : MasterMutationObserver.parseAttribute(this.getAttribute('mutationObserverInit'))
    if (mutationObserverInit && (mutationObserverInit.attributes || mutationObserverInit.characterData || mutationObserverInit.childList)) {
      /** @type {MutationObserver} */
      const mutationObserver = new MutationObserver(this.mutationCallback.bind(this))
      // add default MutationObserverInit Props
      mutationObserverInit = Object.assign({
        attributeFilter: undefined,
        attributes: false,
        attributeOldValue: mutationObserverInit.attributes === true,
        characterData: false,
        characterDataOldValue: mutationObserverInit.characterData === true,
        childList: false,
        subtree: false
      }, mutationObserverInit)
      // attributes can not be observed on shadow, so we split this observation
      if (this.hasShadow && mutationObserverInit.attributes) {
        const { attributeFilter, attributes, attributeOldValue, ...restObserverInit } = mutationObserverInit
        /** @return {void} */
        this.mutationObserveStart = () => {
          // @ts-ignore
          mutationObserver.observe(this.shadow, restObserverInit)
          // @ts-ignore
          mutationObserver.observe(this, { attributeFilter, attributes, attributeOldValue })
        }
      } else {
        /** @return {void} */
        this.mutationObserveStart = () => {
          // @ts-ignore
          mutationObserver.observe(this.root, mutationObserverInit)
        }
      }
      /** @return {void} */
      this.mutationObserveStop = () => mutationObserver.disconnect()
    } else {
      /** @return {void} */
      this.mutationObserveStart = () => {}
      /** @return {void} */
      this.mutationObserveStop = () => {}
      console.warn('MasterMutationObserver got not started, due to missing masterArgs.mutationObserverInit')
    }
  }

  /**
   * Lifecycle callback, triggered when node is attached to the dom
   *
   * @return {void}
   */
  connectedCallback () {
    super.connectedCallback()
    this.mutationObserveStart()
  }

  /**
   * Lifecycle callback, triggered when node is detached from the dom
   *
   * @return {void}
   */
  disconnectedCallback () {
    super.disconnectedCallback()
    this.mutationObserveStop()
  }

  /**
   * observes mutations on this + children changes
   *
   * @param {MutationRecord[]} mutationList
   * @param {MutationObserver} observer
   * @return {void}
   */
  mutationCallback (mutationList, observer) {}
}
