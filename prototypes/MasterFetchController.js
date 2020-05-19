// @ts-check

/** @typedef {Promise<*> & {timeStamp: number, controller: AbortController, fetch?: data}} data */
/** @typedef {{ query: {}, url: string, init: RequestInit, key: string, data: data | null }} last */
/** @typedef {{url: string, query: {}, originalQuery: {}, init: {}, originalInit: {}, key: string, data: Map<string, data>, getLast: last, servedFromCache: boolean }} fetchReturn */

/* global AbortController */
/* global CustomEvent */
/* global decodeURI */
/* global fetch */
/* global HTMLElement */
/* global history */
/* global location */

// custom Map
const DataMap = class extends Map {
  /**
   * extends the Map.set with additional parameters
   *
   * @param {*} key
   * @param {*} value
   * @param {AbortController} controller
   * @param {data} fetch
   * @param {number} [timeStamp=Date.now()]
   * @return {this}
   */
  setData (key, value, controller, fetch = null, timeStamp = Date.now()) {
    return super.set(key, Object.assign(
      value,
      {
        controller,
        fetch,
        timeStamp
      }
    ))
  }
}

/**
 * MasterFetchController is a helper which sets up the basic use case of fetching data by event, fetch and answer ether by event, promise or callback
 *
 * @export
 * @function MasterShadow
 * @param {HTMLElement | *} ChosenHTMLElement
 * @attribute {mode} [mode='open']
 * @property {
  data,
  urlTemplate,
  hashTemplate,
  documentTitleTemplate,
  defaultInit,
  abort,
  cache,
  resolvesJson,
  defaultQuery,
  last,
  queryCheckFuncs,
  initCheckFuncs,
  fetch,
  loading,
  createListener,
  createListenerWithHistory,
  getLast,
  loading,
  MasterFetchController.checkObjectAndAssembleTemplateString,
  MasterFetchController.checkObject,
  MasterFetchController.assembleTemplateString,
  MasterFetchController.hashQuery
}
*/
export const MasterFetchController = (ChosenHTMLElement = HTMLElement) => class MasterFetchController extends ChosenHTMLElement {
  constructor (...args) {
    super(...args)

    /**
     * Caches Fetches
     * uses resourceString as key
     *
     * @type {DataMap}
     */
    this.data = new DataMap()
    /**
     * default fetch url (https://developer.mozilla.org/en-US/docs/Web/API/WindowOrWorkerGlobalScope/fetch)
     * This defines the url that you wish to fetch, keywords within {} (not string literal) will get replaces by query object
     * required for fetch url
     *
     * @type {string}
     */
    this.urlTemplate = ''
    /**
     * This defines the hash that you wish to control
     * required when using createListenerWithHistory
     *
     * @type {string}
     */
    this.hashTemplate = ''
    /**
     * This defines the document.title that you wish to control
     * required when using createListenerWithHistory
     *
     * @type {string}
     */
    this.documentTitleTemplate = ''
    /**
     * query object with default values
     * default query must hold all props for which queryCheckFuncs has a prop check
     *
     * @type {{}}
     */
    this.defaultQuery = {}
    /**
     * default fetch init (https://developer.mozilla.org/en-US/docs/Web/API/WindowOrWorkerGlobalScope/fetch)
     *
     * @type {*}
     */
    this.defaultInit = {}
    /**
     * check the query properties by supplied functions
     *
     * @type {{}}
     */
    this.queryCheckFuncs = {}
    /**
     * check the init properties by supplied functions
     *
     * @type {{}}
     */
    this.initCheckFuncs = {}
    /**
     * keeping last query infos
     * url gets composed by using the query object to urlTemplate
     *
     * @type {last}
     */
    this.last = { query: {}, url: '', init: {}, key: '', data: null }
    /**
     * shall after fetch the response be json parsed
     *
     * @type {boolean}
     */
    this.resolvesJson = true
    /**
     * abort true or false; if previous ongoing fetches shall be aborted before new fetch
     * this has to be true, if the last dispatched event holds the single source of truth and keeps synced
     * NOTE: if this.abort !== true, the component has to manage async resolves
     *
     * @type {boolean | 'sameKey'}
     */
    this.abort = true
    /**
     * cache true, false or ms
     *
     * @type {boolean | number}
     */
    this.cache = true
  }

  /**
   * Fetches, caches, answers with last fetch
   *
   * @param {{}} [query = Object.assign({}, this.defaultQuery, this.last.query)]
   * @param {RequestInit} [init = Object.assign({}, this.defaultInit, this.last.init)]
   * @param {boolean | 'sameKey'} [abort = this.abort] // sameKey will only take effect if cache gets cleared
   * @param {boolean | number} [cache = this.cache]
   * @param {boolean} [resolvesJson = this.resolvesJson]
   * @param {{}} [queryCheckFuncs=this.queryCheckFuncs]
   * @param {{}} [initCheckFuncs=this.initCheckFuncs]
   * @param {string} [urlTemplate=this.urlTemplate]
   * @return {fetchReturn | false}
   */
  fetch (query, init, abort = this.abort, cache = this.cache, resolvesJson = this.resolvesJson, queryCheckFuncs = this.queryCheckFuncs, initCheckFuncs = this.initCheckFuncs, urlTemplate = this.urlTemplate) {
    // clone and meld object
    query = Object.assign({}, this.defaultQuery, this.last.query, query || {}) // query is used to assemble Request URL
    init = Object.assign({}, this.defaultInit, this.last.init, init || {}) // fetch init object
    if (init.headers) init.headers = Object.assign({}, this.defaultInit.headers || {}, this.last.init.headers || {}, init.headers || {})
    // run query through queryCheckFuncs to alter query value or check if false stop fetch + assemble url by template and checked query
    const [url, checkedQuery] = MasterFetchController.checkObjectAndAssembleTemplateString(query, queryCheckFuncs, urlTemplate)
    if (!url || !checkedQuery) return false
    // run init through initCheckFuncs to alter init value or check if false stop fetch
    const checkedInit = MasterFetchController.checkObject(init, initCheckFuncs)
    if (!checkedInit) return false
    /**
     * The key is assembled by the Request URL + fetch init object to a unique request string used for data caching
     *
     * @type {string}
     */
    const key = `${url}::${JSON.stringify(checkedInit)}`
    // check caching
    let dataHasKey = this.data.has(key)
    if (dataHasKey && cache !== true && (cache === false || this.data.get(key).timeStamp + cache < Date.now())) {
      if (abort === 'sameKey') this.data.get(key).controller.abort()
      dataHasKey = false
    }
    // fetch if not found in map
    if (!dataHasKey) {
      this.loading()
      // abort previous still ongoing fetches
      if (abort === true && this.last.data) this.last.data.controller.abort()
      // set new abort controller
      const controller = new AbortController()
      this.data.setData(key, fetch(url, Object.assign({}, checkedInit, { signal: controller.signal })), controller) // eslint-disable-line
      // error handling
      this.data.get(key).catch(error => this.data.delete(key)) // eslint-disable-line
      if (resolvesJson) {
        // overwrite with json + add readonly timeStamp + controller to fetch + fetch (to track original fetch)
        this.data.setData(key, this.data.get(key).then(response => response.json()), controller, this.data.get(key))
        // escape when error/abort
        this.data.get(key).catch(error => error)
      }
    }
    this.last = { url, query: checkedQuery, init: checkedInit, key, data: this.data.get(key) }
    return { url, query: checkedQuery, originalQuery: query, init: checkedInit, originalInit: init, key, data: this.data, getLast: this.getLast.bind(this), servedFromCache: dataHasKey }
  }

  /**
   * placeholder to be overwritten by child for indicating when a load started
   *
   * @return {void}
   */
  loading () {}

  /**
   * creates a default listener which answers with func.return value by dispatching Event to ether typeArg or name if typeArg is undefined
   *
   * @param {string} name
   * @param {()=>fetchReturn | false} func
   * @param {string} [mapDetailToPropName='arg']
   * @returns {(Event)=>fetchReturn}
   */
  createListener (name, func, mapDetailToPropName = 'arg') {
    return event => {
      /** @type {[] | *} */
      const eventDetail = event && event.detail && typeof event.detail === 'object' ? event.detail : { [mapDetailToPropName]: event ? event.detail : undefined }
      // assign event: event to query, that originalQuery will hold a reference
      const detail = func.apply(this, Array.isArray(eventDetail) ? typeof eventDetail[0] === 'object' ? Object.assign(eventDetail, [Object.assign({ event: event }, eventDetail[0])]) : eventDetail : [Object.assign({ event: event }, eventDetail)])
      if (detail) this.dispatchEvent(new CustomEvent(eventDetail.typeArg ? eventDetail.typeArg : name, { detail }))
      return detail
    }
  }

  /**
   * creates a default listener which answers with func.return value by dispatching Event to ether typeArg or name if typeArg is undefined
   * and updates the history to be later consumed through: self.addEventListener('popstate', event => {
   *
   * @param {string} name
   * @param {()=>fetchReturn | false} func
   * @param {string} [mapDetailToPropName='arg']
   * @param {string} [hashTemplate=this.hashTemplate]
   * @param {string} [documentTitleTemplate=this.documentTitleTemplate]
   * @returns {(Event, boolean?)=>fetchReturn}
   */
  createListenerWithHistory (name, func, mapDetailToPropName, hashTemplate = this.hashTemplate, documentTitleTemplate = this.documentTitleTemplate) {
    const listener = this.createListener(name, func, mapDetailToPropName)
    return (event, forceHistoryUpdate = false) => {
      const detail = listener(event)
      if (detail) {
        detail.data.get(detail.key).then(response => {
          // history
          document.title = MasterFetchController.assembleTemplateString(detail.query, documentTitleTemplate)[0]
          const hash = MasterFetchController.assembleTemplateString(detail.query, hashTemplate)[0]
          const hashChanged = decodeURI(location.hash) !== `#${hash}`
          if (hashChanged || forceHistoryUpdate) {
            if (hashChanged) location.hash = hash
            history[hashChanged ? 'replaceState' : 'pushState'](detail.query, document.title, `#${hash}`)
          }
        })
      }
      return detail
    }
  }

  /**
   * get the most recent fetch parameters
   *
   * @returns {last}
   */
  getLast () {
    return this.last
  }

  /**
   * Combines checkObject (returns checkedQuery) + assembleTemplateString (returns cleanedQuery)
   * on success returns [url, cleanedQuery]
   *
   * @static
   * @param {{}} query
   * @param {{}} queryCheckFuncs
   * @param {string} urlTemplate
   * @returns {[string | false, {} | false]}
   * @memberof MasterFetchController
   */
  static checkObjectAndAssembleTemplateString (query, queryCheckFuncs, urlTemplate) {
    // assemble query by using default + last + new and checkObject by functions supplied in queryCheckFuncs
    const checkedQuery = MasterFetchController.checkObject(query, queryCheckFuncs)
    // if one function of queryCheckFuncs returns false the whole fetch will not take place
    if (checkedQuery === false) return [false, false]
    // assemble the url fetch string
    return MasterFetchController.assembleTemplateString(checkedQuery, urlTemplate)
  }

  /**
   * check and adjust object by supplied functions, if function returns false the whole object fails
   *
   * @static
   * @param {{}} obj
   * @param {{}} objCheckFuncs to map modify props or escape by returning false
   * @return {{} | false}
   * @memberof MasterFetchController
   */
  static checkObject (obj, objCheckFuncs) {
    obj = Object.assign({}, obj)
    for (const key in obj) {
      if (objCheckFuncs[key] && typeof objCheckFuncs[key] === 'function') {
        const result = objCheckFuncs[key](obj[key])
        if (result === false) return false
        obj[key] = result
      }
    }
    return obj
  }

  /**
   * assembles a string by obj to templateString and cleans the obj of unused props
   *
   * @static
   * @param {{}} obj
   * @param {string} str
   * @return {[string, {}]}
   * @memberof MasterFetchController
   */
  static assembleTemplateString (obj, str) {
    obj = Object.assign({}, obj)
    for (const key in obj) {
      if (str.includes(`{${key}}`)) {
        str = str.replace(`{${key}}`, obj[key])
      } else {
        delete obj[key]
      }
    }
    return [str, obj]
  }

  /**
   * Read a string query within the url hash
   *
   * @static
   * @readonly
   * @return {{}}
   * @memberof MasterFetchController
   */
  static get hashQuery () {
    return decodeURI(location.hash).slice(1).split('&').reduce((detail, item) => {
      const [key, value] = item.split('=')
      detail[key] = value
      return detail
    }, {})
  }
}
