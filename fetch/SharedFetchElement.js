/* global HTMLElement */
/* global fetch */
/* global window */

// lazy:boolean = (default "false")
export default class SharedFetchElement extends HTMLElement {
    // TODO: add lazy load functionality when el is in screen bounds => https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API
    constructor(){
        super()

        if (window.IntersectionObserver && this.getAttribute('lazy') === 'true'){
            this.loadCommands = []
            this._load = this.load
            this.load = (path, parse) => {
                return new Promise(resolve => {
                    this.loadCommands.push([path, parse, resolve])
                })
            }
            new IntersectionObserver(this.handleIntersect.bind(this), {
                root: null,
                rootMargin: '0px',
                threshold: 0.5
            }).observe(this)
        }
    }
    handleIntersect(entries, observer) {
        entries.forEach(entry => {
            if (entry.isIntersecting) this.loadCommands.forEach(async loadCommand => {
                    const [path, parse, resolve] = loadCommand
                    resolve(await this._load(path, parse))
                })
        })
        this.loadCommands = []
        this.load = this._load // restore normal behavior after intersected
        observer.disconnect()
    }
    async load(path, parse = 'text'){
        try {
            const response = await fetch(path)
            return await response[parse]()
        } catch (e) {
            console.warn(`${path} could not be loaded: ${e.message}`)
            return ''
        }
    }
}