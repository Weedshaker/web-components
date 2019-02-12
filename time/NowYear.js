import { SharedShadow } from '../shared/SharedShadow.js'

// This container displays the actual year
export default class NowYear extends SharedShadow() {
  constructor (...args) {
    super(...args)

    this.container.innerHTML = (new Date()).getFullYear()
  }
}
