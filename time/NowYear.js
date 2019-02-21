import { SharedShadow } from '../shared/SharedShadow.js'

// This container displays the actual year
export default class NowYear extends SharedShadow() {
  constructor (...args) {
    super(...args)

    this.root.innerHTML = (new Date()).getFullYear()
  }
}
