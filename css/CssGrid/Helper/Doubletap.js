// @ts-check
/**
 * @typedef { import("./typesCalcsDraws").ProxifyElement } ProxifyElement
 * @typedef { import("./typesCalcsDraws").ProxifyHook } ProxifyHook
 * @typedef { import("./typesCalcsDraws").Interact } Interact
 */

export default class Doubletap {
  /**
   *Creates an instance of Doubletap.
   * @param { ProxifyHook } proxifyHook
   * @param { Interact } interact
   * @param { HTMLElement } root
   * @param { number } defaultZIndex
   * @memberof Doubletap
   */
  constructor (proxifyHook, interact, root, defaultZIndex) {
    this.proxifyHook = proxifyHook
    this.interact = interact
    this.root = root
    this.defaultZIndex = defaultZIndex
  }

  /**
   * start with Resizing
   *
   * @param { ProxifyElement } grid
   * @param { HTMLElement[] } selector
   * @returns { * }
   */
  start (grid, selector) {
    const __ = this.proxifyHook
    return this.interact(selector, { context: grid.__raw__ || grid })
      .on('doubletap', event => {
      // TODO: whole zindex stuff
      // zIndex swapping
        __(event.target)
          .$getStyle((cell, prop, style) => {
            const zIndex = Number(style.$getZIndex())
            style.$setZIndex(!zIndex || zIndex === 1 ? this.defaultZIndex - 1 : zIndex - 1)
          })
      })
  }
}
