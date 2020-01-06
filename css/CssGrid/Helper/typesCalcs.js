// @ts-check
/**
 * @typedef { { __raw__: HTMLElement, style: *, $getStyle: *, $setClassName: * } & HTMLElement } ProxifyElement
 * @typedef { (HTMLElement)=>ProxifyElement } ProxifyHook
 * @typedef { ([], {context})=>* & { version: string} } Interact
 * @typedef { [number, number] } XY
 */

/* global self */

/**
 * calculates the point of [column, row] within the grid
 *
 * @param { HTMLElement } grid
 * @param { ProxifyElement } cell
 * @param { XY } cors
 * @param { string } [mathFunc='ceil']
 * @returns { XY }
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
 * @param { ClientRect } [rect=undefined]
 * @returns { ClientRect }
 */
export const getCellRect = (cell, rect = undefined) => {
  const regex = /span\s*/
  /** @type { * } */
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

/**
 * calculates the bounding rectangle (takes scrollX + scrollY in account)
 *
 * @param { HTMLElement } node
 * @returns { ClientRect }
 */
export const getBoundingClientRectAbsolute = (node) => {
  // @ts-ignore
  const rect = node.getBoundingClientRect().toJSON()
  return Object.assign(rect, { top: rect.top + self.scrollY, right: rect.right + self.scrollX, bottom: rect.bottom + self.scrollY, left: rect.left + self.scrollX })
}
