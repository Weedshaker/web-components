/* global HTMLElement */

// This container deletes its content, useful to check compatibility
export default class InitDelete extends HTMLElement {
  constructor (...args) {
    super(...args)

    this.remove()
  }
}
