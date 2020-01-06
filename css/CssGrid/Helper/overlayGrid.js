// @ts-check
/**
 * @typedef { import("./typesCalcs").ProxifyElement } ProxifyElement
 * @typedef { import("./typesCalcs").ProxifyHook } ProxifyHook
 */

import { getBoundingClientRectAbsolute, getCellRect } from './typesCalcs.js'

/**
 * draw grid lines
 *
 * @param { ProxifyHook } __
 * @param { ProxifyElement } body
 * @param { HTMLElement } grid
 * @param { HTMLElement } container
 * @param { ProxifyElement } cell
 * @returns { [ProxifyElement, string] }
 */
export const drawOverlayGrid = (__, body, grid, container, cell) => {
  /** @type { string } */
  let bodyOverflow // keep last overflow of body
  // set overflow scroll, so that calculations are with the correct vw and not unpredictably modified by scrollbars
  body
    .$getStyle((cell, prop, style) => {
      style
        // save original overflow
        .$getOverflow((style, prop, overflow) => (bodyOverflow = overflow || 'auto'))
        .$setOverflow('scroll')
    })
  const gridRect = getBoundingClientRectAbsolute(grid)
  const cellRect = getCellRect(cell)
  const rows = Math.round(gridRect.height / cellRect.height)
  const columns = Math.round(gridRect.width / cellRect.width)
  const additional = 3
  return [
    __(container)
      .appendChild(__('section'))
      .$setClassName('overlayGrid')
      .$setStyle(`
        background: none;
        box-shadow: none;
        height: ${gridRect.height}px;
        left: ${gridRect.left}px;
        position: absolute;
        top: ${gridRect.top}px;
        width: ${gridRect.width}px;
      `)
      .$func(overlayGrid => {
        for (let i = 0; i < rows + additional; i++) {
          const lastRow = i === rows + additional - 1
          for (let j = 0; j < columns + additional; j++) {
            const lastColumn = j === columns + additional - 1
            overlayGrid
              .appendChild(__('div'))
              .$setStyle(`
                ${!lastRow ? 'border-bottom: var(--overlay-grid-border);' : ''}
                ${!lastColumn ? 'border-right: var(--overlay-grid-border);' : ''}
                height: ${cellRect.height}px;
                left: ${cellRect.width * j}px;
                position: absolute;
                top: ${cellRect.height * i}px;
                width: ${cellRect.width}px;
              `)
          }
        }
      }),
    bodyOverflow
  ]
}

/**
 * erase grid lines
 *
 * @param { ProxifyElement } body
 * @param { HTMLElement } overlayGrid
 * @param { string } bodyOverflow
 * @returns { void }
 */
export const removeOverlayGrid = (body, overlayGrid, bodyOverflow) => {
  if (overlayGrid) overlayGrid.remove()
  // reset overflow to its original value
  body
    .$getStyle((cell, prop, style) => {
      style
        .$setOverflow(bodyOverflow || 'auto')
    })
}
