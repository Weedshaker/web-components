// @ts-check
/** @typedef {{ __raw__: HTMLElement, style: * }} ProxifyElement */

/* global self */

/**
 * calculates the point of [column, row] within the grid
 *
 * @param { HTMLElement | ProxifyElement } grid
 * @param { HTMLElement } cell
 * @param { [number, number] } cors
 * @param {string} [mathFunc='ceil']
 * @returns { [number, number] }
 */
export const calcPoint = (grid, cell, cors, mathFunc = 'ceil') => {
  const gridRect = getBoundingClientRectAbsolute(grid)
  const cellRect = getCellRect(cell)
  const [x, y] = [cors[0] - gridRect.left, cors[1] - gridRect.top]
  return [Math[mathFunc](x / cellRect.width), Math[mathFunc](y / cellRect.height)]
}

/**
 * calculates the bounding rectangle of one cell within the grid (takes in account when an item spans multiple cells)
 *
 * @param { ProxifyElement } cell
 * @param {*} [rect=undefined]
 * @returns
 */
export const getCellRect = (cell, rect = undefined) => {
  const regex = /span\s*/
  const cellRect = rect || getBoundingClientRectAbsolute(cell)
  cell.style
    .$getGridRowEnd((cell, prop, end = '1') => {
      const rows = Number(end.replace(regex, '')) || 1
      cellRect.bottom = (cellRect.bottom - cellRect.top) / rows + cellRect.top
      cellRect.height = cellRect.height / rows
    })
    .$getGridColumnEnd((cell, prop, end = '1') => {
      const columns = Number(end.replace(regex, '')) || 1
      cellRect.right = (cellRect.right - cellRect.left) / columns + cellRect.left
      cellRect.width = cellRect.width / columns
    })
  return cellRect
}

// getBoundingClientRect with adjusted coordinates according to window scroll cors
export const getBoundingClientRectAbsolute = (node) => {
  const rect = node.getBoundingClientRect().toJSON()
  return Object.assign(rect, { top: rect.top + self.scrollY, right: rect.right + self.scrollX, bottom: rect.bottom + self.scrollY, left: rect.left + self.scrollX })
}

// draw grid lines
export const drawOverlayGrid = (__, body, grid, container, cell, bodyOverflow) => {
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
  return [__(container)
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

export const removeOverlayGrid = (body, overlayGrid, bodyOverflow) => {
  if (overlayGrid) overlayGrid.remove()
  // reset overflow to its original value
  body
    .$getStyle((cell, prop, style) => {
      style
        .$setOverflow(bodyOverflow || 'auto')
    })
}
