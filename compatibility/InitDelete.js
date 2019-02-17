import { SharedShadow } from '../shared/SharedShadow.js'

// This container deletes its content, useful to check compatibility
export default class InitDelete extends SharedShadow() {
  constructor (...args) {
    super(...args)

    this.container.innerHTML = ''
  }
}
