// @ts-check
/**
 * @typedef { import("../Helper/typesCalcs").ProxifyElement } ProxifyElement
 * @typedef { import("../Helper/typesCalcs").ProxifyHook } ProxifyHook
 * @typedef { import("../Helper/typesCalcs").Interact } Interact
 */

import { getBoundingClientRectAbsolute, getCellRect } from '../Helper/typesCalcs.js'
import { drawOverlayGrid, removeOverlayGrid } from '../Helper/overlayGrid.js'

export default class Resize {
  /**
   * Creates an instance of Resize, which interaction is used to drag and resize the cells within the grid
   * @param { ProxifyHook } proxifyHook
   * @param { Interact } interact
   * @param { number } [minSizeColumn = 100]
   * @param { number } [minSizeRow = 100]
   * @memberof Resize
   */
  constructor (proxifyHook, interact, root, minSizeColumn = 100, minSizeRow = 100) {
    this.proxifyHook = proxifyHook
    this.interact = interact
    this.minSizeColumn = minSizeColumn
    this.minSizeRow = minSizeRow
  }

  /**
   * start with Resizing
   *
   * @param { ProxifyElement } grid
   * @param { HTMLElement[] } selector
   * @param { HTMLElement } gridParent
   * @param { ProxifyElement } body
   * @returns { * }
   */
  start (grid, selector, gridParent, body) {
    const __ = this.proxifyHook
    /** @type { string } */
    let transform // keep last transform value on style
    /** @type { ProxifyElement } */
    let overlayGrid // keep last overlayGrid ProxifyElement ref
    /** @type { string } */
    let bodyOverflow // keep last overflow of body
    /** @type { ClientRect } */
    let initRect // resizing initial rect
    // the config with events for interact resize and gesture
    const config = {
      autoScroll: true,
      edges: { left: false, right: true, bottom: true, top: false },
      inertia: true, // Inertia allows drag and resize actions to continue after the user releases the pointer at a fast enough speed. http://interactjs.io/docs/inertia/
      restrictSize: {
        min: { width: this.minSizeColumn, height: this.minSizeRow }
      },
      onstart: event =>
        __(event.target)
          .$getStyle((cell, prop, style) => {
            style
              .$getTransform((style, prop, trans) => (transform = trans))
              .$setTransform('none')
              .$setTransformOrigin('top left')
            initRect = getBoundingClientRectAbsolute(cell)
            const res = drawOverlayGrid(__, body, grid, gridParent, cell)
            overlayGrid = res[0]
            bodyOverflow = res[1]
          }),
      onmove: event =>
        __(event.target)
          .$getStyle((cell, prop, style) => {
            // @ts-ignore
            style.$setTransform(`scale(${parseFloat(event.rect.width / initRect.width).toFixed(3)}, ${parseFloat(event.rect.height / initRect.height).toFixed(3)})`)
          }),
      onend: event =>
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
    }
    return this.interact(selector, { context: grid.__raw__ || grid })
      .resizable(config) // desktop
      // TODO (https://interactjs.io/docs/api/Interactable.html#gesturable + take in account touch-action: none): .gesturable(config) // touchscreen
  }
}
