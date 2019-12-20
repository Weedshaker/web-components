// @ts-check
/**
 * @typedef { import("./typesCalcsDraws").ProxifyElement } ProxifyElement
 * @typedef { import("./typesCalcsDraws").ProxifyHook } ProxifyHook
 * @typedef { import("./typesCalcsDraws").Interact } Interact
 */

import { getBoundingClientRectAbsolute, drawOverlayGrid, removeOverlayGrid, getCellRect } from './typesCalcsDraws.js'

export default class Resize {
  /**
   *Creates an instance of Resize.
   * @param { ProxifyHook } proxifyHook
   * @param { Interact } interact
   * @param { HTMLElement } root
   * @param { number } [minSizeColumn = 100]
   * @param { number } [minSizeRow = 100]
   * @memberof Resize
   */
  constructor (proxifyHook, interact, root, minSizeColumn = 100, minSizeRow = 100) {
    this.proxifyHook = proxifyHook
    this.interact = interact
    this.root = root
    this.minSizeColumn = minSizeColumn
    this.minSizeRow = minSizeRow
  }

  /**
   * start with Resizing
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
    /** @type { ClientRect } */
    let initRect // resizing initial rect
    return this.interact(selector, { context: grid.__raw__ || grid })
      .resizable({
        autoScroll: true,
        edges: { left: false, right: true, bottom: true, top: false },
        inertia: true, // Inertia allows drag and resize actions to continue after the user releases the pointer at a fast enough speed. http://interactjs.io/docs/inertia/
        restrictSize: {
          min: { width: this.minSizeColumn, height: this.minSizeRow }
        }
      })
      .on('resizestart', event => {
        __(event.target)
          .$getStyle((cell, prop, style) => {
            style
              .$getTransform((style, prop, trans) => (transform = trans))
              .$setTransform('none')
              .$setTransformOrigin('top left')
            initRect = getBoundingClientRectAbsolute(cell)
            const res = drawOverlayGrid(__, body, grid, this.root, cell)
            overlayGrid = res[0]
            bodyOverflow = res[1]
          })
      })
      .on('resizemove', event => {
        __(event.target)
          .$getStyle((cell, prop, style) => {
            // @ts-ignore
            style.$setTransform(`scale(${parseFloat(event.rect.width / initRect.width).toFixed(3)}, ${parseFloat(event.rect.height / initRect.height).toFixed(3)})`)
          })
      })
      .on('resizeend', event => {
        __(event.target)
          .$getStyle((cell, prop, style) => {
            const cellRect = getBoundingClientRectAbsolute(cell)
            const singleCellRect = getCellRect(cell, initRect)
            style
              .$setGridRowEnd(`span ${Math.round(cellRect.height / singleCellRect.height)}`)
              .$setGridColumnEnd(`span ${Math.round(cellRect.width / singleCellRect.width)}`)
              .$setTransform(transform)
            cell.classList.add('resized')
            removeOverlayGrid(body, overlayGrid, bodyOverflow)
          })
      })
  }
}
