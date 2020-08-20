/* global localStorage */

import { SharedShadow } from '../shared/SharedShadow.js'

// This container displays a MenuIcon
// querySelector:string (default undefined) -> the target of this query will receive open and close class synchronasly
// width:string (default 35px)
// height:string (default 5px)
// openClass:string (default open) -> the class which gets assigned when opened (click)
// transition:string (default 0.4s)
// color:string (default #333)
// barClass:string (default bar)
export default class MenuIcon extends SharedShadow() {
  constructor (...args) {
    super(...args)

    this.querySelected = document.querySelector(this.getAttribute('querySelector'))
    this.width = this.getAttribute('width') ? this.getAttribute('width') : '35px'
    this.height = this.getAttribute('height') ? this.getAttribute('height') : '5px'
    this.openClass = this.getAttribute('openClass') ? this.getAttribute('openClass') : 'open'
    this.barClass = this.getAttribute('barClass') ? this.getAttribute('barClass') : 'bar'
    this.transition = this.getAttribute('transition') ? this.getAttribute('transition') : '0.2s'
    this.root.innerHTML = `
    <style>
      :host {
        display: inline-block;
        cursor: pointer;
        transition: ${this.transition};
        padding-left: calc(${this.width} / 4) !important;
      }
      :host(.${this.openClass}) {
        padding-right: calc(${this.width} / 4) !important;
        padding-left: 0 !important;
      }
      .${this.barClass}1, .${this.barClass}2, .${this.barClass}3 {
        width: ${this.width};
        height: ${this.height};
        background-color: ${this.getAttribute('color') ? this.getAttribute('color') : 'var(--color-font1, #333)'};
        margin: 0;
        transition: ${this.transition};
      }
      .${this.barClass}2 {
        margin: ${this.height} 0;
        transition: ${this.transition} / 2;
      }
      /* Rotate first ${this.barClass} */
      :host(.${this.openClass}) .${this.barClass}1, :host(.${this.openClass}) .${this.barClass}2 {
        transform: rotate(-45deg) translateY(calc(${this.height} * 5.5 / 2));
      }
      /* Fade out the second ${this.barClass} */
      :host(.${this.openClass}) .${this.barClass}2 {
        opacity: 0;
      }
      /* Rotate last ${this.barClass} */
      :host(.${this.openClass}) .${this.barClass}3 {
        transform: rotate(45deg) translateY(calc(-${this.height} * 5.5 / 2));
      }
    </style>
    <div class="${this.barClass}1"></div>
    <div class="${this.barClass}2"></div>
    <div class="${this.barClass}3"></div>
    `
    this.addEventListener('click', this.toggleAnimationClass.bind(this))
    let lastHash = location.hash
    window.addEventListener('hashchange', () => {
      if (lastHash !== location.hash) {
        this.toggleAnimationClass('remove')
      } else {
        this.toggleAnimationClass(localStorage.getItem(`MenuIcon_${this.openClass}`) === 'true' ? 'add' : 'remove')
      }
      lastHash = location.hash
    })
  }

  toggleAnimationClass (command = 'toggle') {
    this.classList[command](this.openClass)
    if (this.querySelected) this.querySelected.classList[this.classList.contains(this.openClass) ? 'add' : 'remove'](this.openClass)
    localStorage.setItem(`MenuIcon_${this.openClass}`, `${this.classList.contains(this.openClass)}`)
  }
}
