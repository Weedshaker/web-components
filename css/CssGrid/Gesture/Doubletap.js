// @ts-check
/**
 * @typedef { import("../Helper/typesCalcs").ProxifyElement } ProxifyElement
 * @typedef { import("../Helper/typesCalcs").ProxifyHook } ProxifyHook
 * @typedef { import("../Helper/typesCalcs").Interact } Interact
 */

import { calcPoint } from '../Helper/typesCalcs.js'

export default class Doubletap {
  /**
   * Creates an instance of Doubletap, which interaction is used to change the z-index
   * @param { ProxifyHook } proxifyHook
   * @param { Interact } interact
   * @param { number } defaultZIndex
   * @memberof Doubletap
   */
  constructor (proxifyHook, interact, defaultZIndex) {
    this.proxifyHook = proxifyHook
    this.interact = interact
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
      .on('doubletap', event =>
      // TODO: whole zindex stuff
      // zIndex swapping
        __(event.target)
          .$getStyle((cell, prop, style) => {
            // different cells wont work, since it works with the coordinates
            // Array.from(grid.children).forEach(child => console.log('zindex', child, calcPoint(grid, child, [event.pageX, event.pageY], 'ceil')))
            const zIndex = Number(style.$getZIndex())
            style.$setZIndex(!zIndex || zIndex === 1 ? this.defaultZIndex - 1 : zIndex - 1)
          })
      )
  }
}
