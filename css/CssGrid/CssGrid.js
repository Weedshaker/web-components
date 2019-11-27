// @ts-check

/* global self */
/* global MutationObserver */

import { SharedShadow } from '../../shared/SharedShadow.js'
import { ProxifyHook } from '../../proxifyjs/JavaScript/Classes/Helper/ProxifyHook.js'
import { Proxify } from '../../proxifyjs/JavaScript/Classes/Handler/Proxify.js'
import { Chain } from '../../proxifyjs/JavaScript/Classes/Traps/Misc/Chain.js'
import { Html } from '../../proxifyjs/JavaScript/Classes/Traps/Dom/Html.js'

// @ts-ignore
const __ = new ProxifyHook(Html(Chain(Proxify()))).get()

/**
 * This container becomes a css grid and lets its children be aligned and stretched within its grid layout
 *
 * @export
 * @class CssGrid
 * @attribute {'false' | 'open' | 'closed'} [shadow = 'open']
 * @attribute {string} [style = '...']
 * @attribute {number} [minSize = 100]
 */
export default class CssGrid extends SharedShadow() {
  // attributeChangedCallback - Note: only attributes listed in the observedAttributes property will receive this callback.
  static get observedAttributes () { return ['active'] }

  // TODO: optional styles being spliced out when interactjs is deactivated
  constructor (...args) {
    console.log('constructor')
    super(...args)

    // load interact.js
    const interactLoaded = error => {
      // @ts-ignore
      if (!error && typeof self.interact === 'function' && self.interact.version) {
        // @ts-ignore
        this.interact = self.interact
      } else {
        console.error('SST: Can\'t find interact at global scope!!!', error)
      }
    }
    // @ts-ignore
    if (!self.interact) {
      this.interact = import('../../node_modules/interactjs/dist/interact.js').then(module => interactLoaded()).catch(error => interactLoaded(error))
    } else {
      interactLoaded()
    }

    // callbacks
    this.observer = new MutationObserver(this.mutationCallback)
    // https://developer.mozilla.org/en-US/docs/Web/API/MutationObserverInit
    this.observerConfig = {
      attributes: false, // already observed at attributeChangedCallback
      childList: true,
      subtree: false
    }

    // css
    const host = this.shadow ? ':host' : this.nodeName // host: only works if shadow active
    this.minSize = this.getAttribute('minSize') || 100
    const style = __('style').$setTextContent((this.getAttribute('style') ||
      // optional styles
      `
        ${host} {
          --overlay-grid-border: 1px dashed rgba(148, 0, 255, .6);
        }
        ${host} > section.grid > * {
          background-color: rgba(166, 211, 225, .6);
          box-shadow: -1px -1px rgba(9, 9, 246, .3) inset;
          z-index: 100;
        }
        ${host} > section.grid > *.dragged{
          background-color: rgba(218, 248, 218, .6);
        }
      `) +
      // must have styles
      `
        ${host} > section.grid {
          display: grid;
          grid-auto-columns: minmax(${this.minSize}px, 1fr);
          grid-auto-flow: dense;
          grid-auto-rows: minmax(${this.minSize}px, 1fr);
          grid-gap: unset;
        }
        ${host} > section.grid > * {
          box-sizing: border-box;
          touch-action: none;
          user-select: none;
        }
      `
    )

    // grid
    this.grid = __('section').$setClassName('grid')

    // move children to grid
    __(this.grid).$appendChildren(Array.from(this.childNodes))
    __(this.root).$appendChildren([style, this.grid])
  }

  connectedCallback () {
    console.log('connected')
    this.observer.observe(this.root, this.observerConfig)
    // check if this.interact is a promise
    if ('then' in this.interact) {
      this.interact.then(() => this.interactStart())
    } else {
      this.interactStart()
    }
  }

  disconnectedCallback () {
    console.log('disconnected')
    this.observer.disconnect()
  }

  attributeChangedCallback (name, oldValue, newValue) {
    console.log('attributeChanged', name, oldValue, newValue)
  }

  mutationCallback (mutationsList, observer) {
    console.log('mutation', mutationsList, observer)
  }

  // interact.js
  interactStart (grid = __(this.grid)) {
      const body = __(document.body)
      let transform // keep last transform value on style
      let dragPoint = [0, 0] // [row, column] started at first click within the target cell, to figure at which cell within the target got clicked, since this can span multiple cells
      let initRect // resizing initial rect
      const selector = Array.from(grid.children).reduce((acc, child) => child.tagName && !acc.includes(child.tagName) ? acc.concat([child.tagName]) : acc, []).join(',') || '*'
      this.interact(selector, { context: grid.__raw__ })
        .draggable({
          autoScroll: true,
          inertia: true, // Inertia allows drag and resize actions to continue after the user releases the pointer at a fast enough speed. http://interactjs.io/docs/inertia/
          onstart: event => {
            __(event.target)
              .$getStyle((cell, prop, style) => {
                style
                  // save original transform
                  .$getTransform((style, prop, trans) => transform = trans || 'none')
                  .$setTransform('none')
                // calculate the dragPoint within the cell, this is important for cells which span more than one grid fraction
                dragPoint = this.calcPoint(cell, cell, [event.pageX, event.pageY], 'floor')
                this.drawOverlayGrid(body, grid, cell)
              })
          },
          onmove: event => {
            // move cell with mouse by translate x, y
            __(event.target)
              .$getStyle((cell, prop, style) => {
                const [str, x, y] = style.transform.match(/.*?\(([-0-9]*)[^0-9-]*([-0-9]*)/) || ['', 0, 0]
                style.$setTransform(`translate(${Math.round(Number(x) + event.dx)}px, ${Math.round(Number(y) + event.dy)}px)`)
              })
          },
          onend: event => {
            __(event.target)
              .$getStyle((cell, prop, style) => {
                // reset translate, otherwise cell coordinates will be off
                style.$setTransform('none')
                // calculate the dropPoint within the grid
                const dropPoint = this.calcPoint(grid, cell, [event.pageX, event.pageY], 'ceil')
                // set grid inline style
                style
                  .$setGridRowStart(dropPoint[1] - dragPoint[1] > 0 ? dropPoint[1] - dragPoint[1] : 1)
                  .$setGridColumnStart(dropPoint[0] - dragPoint[0] > 0 ? dropPoint[0] - dragPoint[0] : 1)
                  .$setTransform(transform)
                cell.classList.add('dragged')
                this.removeOverlayGrid(body)
              })
          }
        })
        .resizable({
          autoScroll: true,
          edges: { left: false, right: true, bottom: true, top: false },
          inertia: true, // Inertia allows drag and resize actions to continue after the user releases the pointer at a fast enough speed. http://interactjs.io/docs/inertia/
          restrictSize: {
            min: { width: this.minSize, height: this.minSize },
          }
        })
        .on('resizestart', event => {
          __(event.target)
            .$getStyle((cell, prop, style) => {
              style
                .$getTransform((style, prop, trans) => transform = trans)
                .$setTransform('none')
                .$setTransformOrigin(`top left`)
              initRect = this.getBoundingClientRectAbsolute(cell)
              this.drawOverlayGrid(body, grid, cell)
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
              const cellRect = this.getBoundingClientRectAbsolute(cell)
              const singleCellRect = this.getCellRect(cell, initRect)
              style
                .$setGridRowEnd(`span ${Math.round(cellRect.height / singleCellRect.height)}`)
                .$setGridColumnEnd(`span ${Math.round(cellRect.width / singleCellRect.width)}`)
                .$setTransform(transform)
              cell.classList.add('resized')
              this.removeOverlayGrid(body)
            })
        })
        .on('doubletap', event => {
          // TODO: whole zindex stuff
          // zIndex swapping
          __(event.target)
            .$getStyle((cell, prop, style) => {
              const zIndex = Number(style.$getZIndex())
              style.$setZIndex(!zIndex || zIndex === 1 ? defaultZIndex - 1 : zIndex - 1)
            })
        })
  }

  // calculates the point of [column, row] within the grid
  calcPoint(grid, cell, cors, mathFunc = 'ceil') {
    const gridRect = this.getBoundingClientRectAbsolute(grid)
    const cellRect = this.getCellRect(cell)
    const [x, y] = [cors[0] - gridRect.left, cors[1] - gridRect.top]
    return [Math[mathFunc](x / cellRect.width), Math[mathFunc](y / cellRect.height)]
  }

  // calculates the bounding rectangle of one cell within the grid (takes in account when an item spans multiple cells)
  getCellRect(cell, rect = undefined) {
    const regex = /span\s*/
    const cellRect = rect ? rect : this.getBoundingClientRectAbsolute(cell)
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
  getBoundingClientRectAbsolute(node) {
    const rect = node.getBoundingClientRect().toJSON()
    return Object.assign(rect, { top: rect.top + window.scrollY, right: rect.right + window.scrollX, bottom: rect.bottom + window.scrollY, left: rect.left + window.scrollX })
  }

  // draw grid lines
  drawOverlayGrid(body, grid, cell) {
    // set overflow scroll, so that calculations are with the correct vw and not unpredictably modified by scrollbars
    body
      .$getStyle((cell, prop, style) => {
        style
          // save original overflow
          .$getOverflow((style, prop, overflow) => this.bodyOverflow = overflow || 'auto')
          .$setOverflow('scroll')
      })
    const gridRect = this.getBoundingClientRectAbsolute(grid)
    const cellRect = this.getCellRect(cell)
    const rows = Math.round(gridRect.height / cellRect.height)
    const columns = Math.round(gridRect.width / cellRect.width)
    const additional = 3
    return (this.overlayGrid = __(this.root)
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
                ${!lastRow ? `border-bottom: var(--overlay-grid-border);` : ''}
                ${!lastColumn ? `border-right: var(--overlay-grid-border);` : ''}
                height: ${cellRect.height}px;
                left: ${cellRect.width * j}px;
                position: absolute;
                top: ${cellRect.height * i}px;
                width: ${cellRect.width}px;
              `)
          }
        }     
      })
    )
  }
  removeOverlayGrid (body) {
    if (this.overlayGrid) this.overlayGrid.remove()
    // reset overflow to its original value
    body
      .$getStyle((cell, prop, style) => {
        style
          .$setOverflow(this.bodyOverflow)
      })
  }
}
