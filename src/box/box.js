import { scrollTargetBehavior } from '../scroll-target-behavior'
import { scrollEffectBehavior } from '../scroll-effect-behavior'
import { handler } from 'dom-factory'

// SCROLL EFFECTS
import { SCROLL_EFFECTS } from '../scroll-effects'

const MODULE = 'mdk-box'
const BG = `.${ MODULE }__bg`
const FRONT_LAYER = `${ BG }-front`
const REAR_LAYER = `${ BG }-rear`

/**
 * A container element for generic content with visual effects based on scroll position
 * @param  {HTMLElement} element
 * @return {Object}
 */
export const boxComponent = (element) => ({

  /**
   * Public properties.
   * @type {Object}
   */
  properties: {

    /**
     * Disables effects
     */
    disabled: {
      type: Boolean,
      reflectToAttribute: true
    }
  },

  /**
   * Event listeners.
   * @type {Array}
   */
  listeners: [
    'window._debounceResize(resize)'
  ],

  /**
   * Compose mixins
   * @type {Array}
   */
  mixins: [
    scrollTargetBehavior(element),
    scrollEffectBehavior(element)
  ],

  // The current scroll progress
  _progress: 0,

  /**
   * Returns true if the element is visible in the current viewport.
   * @return {Boolean}
   */
  isOnScreen () {
    return this._elementTop < this._scrollTop + this._scrollTargetHeight && 
      this._elementTop + this._elementHeight > this._scrollTop
  },

  /**
   * Returns an object containing the progress value of the scroll effects.
   * @return {Object}
   */
  getScrollState () {
    return {
      progress: this._progress
    }
  },

  _setupBackgrounds () {
    let bgNode = document.createElement('DIV')
    this.element.insertBefore(bgNode, this.element.childNodes[0])
    bgNode.classList.add(BG.substr(1))

    const bgLayerClassNames = [FRONT_LAYER.substr(1), REAR_LAYER.substr(1)]
    bgLayerClassNames.map(className => {
      let bgNodeLayer = document.createElement('DIV')
      bgNode.appendChild(bgNodeLayer)
      bgNodeLayer.classList.add(className)
    })
  },

  _resetLayout () {
    if (this.element.offsetWidth === 0 && this.element.offsetHeight === 0) {
      return
    }

    let scrollTop = this._clampedScrollTop
    this._elementTop = this._getElementTop()
    this._elementHeight = this.element.offsetHeight
    
    let viewportTop = this._elementTop - scrollTop
    this._progressTarget = Math.min(this._scrollTargetHeight, viewportTop + this._elementHeight)

    this._setUpEffects()
    this._updateScrollState(scrollTop)
  },

  _getElementTop () {
    let currentNode = this.element
    let top = 0

    while (currentNode && currentNode !== this.scrollTarget) {
      top += currentNode.offsetTop
      currentNode = currentNode.offsetParent
    }
    return top
  },

  /**
   * Updates the scroll state.
   * @param  {number} scrollTop
   */
  _updateScrollState (scrollTop) {
    if (this.disabled) {
      return
    }

    if (this.isOnScreen()) {
      let viewportTop = this._elementTop - scrollTop
      let progress = 1 - (viewportTop + this._elementHeight) / this._progressTarget

      this._progress = progress
      this._runEffects(this._progress, scrollTop)
    }
  },

  /**
   * Handle the resize event every 50ms
   */
  _debounceResize () {
    clearTimeout(this._onResizeTimeout)
    if (this._resizeWidth !== window.innerWidth) {
      this._onResizeTimeout = setTimeout(() => {
        this._resizeWidth = window.innerWidth
        this._resetLayout()
      }, 50)
    }
  },

  /**
   * Initialize component
   */
  init () {
    this._resizeWidth = window.innerWidth

    this.attachToScrollTarget()
    this._setupBackgrounds()
    this._resetLayout()

    SCROLL_EFFECTS.map(effect => this.registerEffect(effect.name, effect))
  },

  /**
   * Destroy component
   */
  destroy () {
    clearTimeout(this._onResizeTimeout)
    this.detachFromScrollTarget()
  }
})

handler.register(MODULE, boxComponent)