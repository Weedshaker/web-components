// @ts-check
/**
 * @typedef { import("./typesCalcsDraws").ProxifyElement } ProxifyElement
 * @typedef { import("./typesCalcsDraws").ProxifyHook } ProxifyHook
 * @typedef { import("./typesCalcsDraws").Interact } Interact
 * @typedef { import("./typesCalcsDraws").XY } XY
 */

import { calcPoint, drawOverlayGrid, removeOverlayGrid } from './typesCalcsDraws.js'

export default class Drag {
  /**
   *Creates an instance of Drag.
   * @param { ProxifyHook } proxifyHook
   * @param { Interact } interact
   * @param { HTMLElement } root
   * @memberof Drag
   */
  constructor (proxifyHook, interact, root) {
    this.proxifyHook = proxifyHook
    this.interact = interact
    this.root = root
  }

  /**
   * start with dragging
   *
   * @param { ProxifyElement } grid
   * @param { ProxifyElement } body
   * @param { HTMLElement[] } selector
   * @returns { * }
   */
  start (grid, body, selector) {
    const __ = this.proxifyHook
    /** @type { string } */
    let transform // keep last transform value on style
    /** @type { ProxifyElement } */
    let overlayGrid // keep last overlayGrid ProxifyElement ref
    /** @type { string } */
    let bodyOverflow // keep last overflow of body
    /** @type { XY } */
    let dragPoint = [0, 0] // [row, column] started at first click within the target cell, to figure at which fraction within the target cell got clicked, since a cell can span multiple fractions
    return this.interact(selector, { context: grid.__raw__ || grid })
      .draggable({
        autoScroll: true,
        inertia: true, // Inertia allows drag and resize actions to continue after the user releases the pointer at a fast enough speed. http://interactjs.io/docs/inertia/
        onstart: event => {
          __(event.target)
            .$getStyle((cell, prop, style) => {
              style
              // save original transform
                .$getTransform((style, prop, trans) => (transform = trans || 'none'))
                .$setTransform('none')
                // calculate the dragPoint within the cell, this is important for cells which span more than one grid fraction
              dragPoint = calcPoint(cell, cell, [event.pageX, event.pageY], 'floor')
              const res = drawOverlayGrid(__, body, grid, this.root, cell)
              overlayGrid = res[0]
              bodyOverflow = res[1]
            })
        },
        onmove: event => {
          // move cell with mouse by translate x, y
          __(event.target)
            .$getStyle((cell, prop, style) => {
              const [, x, y] = style.transform.match(/.*?\(([-0-9]*)[^0-9-]*([-0-9]*)/) || ['', 0, 0]
              style.$setTransform(`translate(${Math.round(Number(x) + event.dx)}px, ${Math.round(Number(y) + event.dy)}px)`)
            })
        },
        onend: event => {
          __(event.target)
            .$getStyle((cell, prop, style) => {
              // reset translate, otherwise cell coordinates will be off
              style.$setTransform('none')
              // calculate the dropPoint within the grid
              const dropPoint = calcPoint(grid, cell, [event.pageX, event.pageY], 'ceil')
              // set grid inline style
              style
                .$setGridRowStart(dropPoint[1] - dragPoint[1] > 0 ? dropPoint[1] - dragPoint[1] : 1)
                .$setGridColumnStart(dropPoint[0] - dragPoint[0] > 0 ? dropPoint[0] - dragPoint[0] : 1)
                .$setTransform(transform)
              cell.classList.add('dragged')
              removeOverlayGrid(body, overlayGrid, bodyOverflow)
            })
        }
      })
  }
}
