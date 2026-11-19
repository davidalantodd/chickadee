// Runs before every test file
import { afterEach } from 'vitest'

if (typeof window !== 'undefined') {
    await import('@testing-library/jest-dom/vitest')
    const { cleanup } = await import('@testing-library/react')
    const { installMatchMedia, resetMatchMedia } = await import('./matchMedia')
    const { restoreNavigator } = await import('./navigator')

    // Browser features jsdom leaves out
    installMatchMedia()
    window.scrollTo = () => {}
    window.ResizeObserver = class {
        observe() {}
        unobserve() {}
        disconnect() {}
    }
    // react-bootstrap times its fade animations from the CSS transition duration and delay, which are blank without
    // Bootstrap's stylesheet (and makes Node warn about a NaN timeout)
    const style = document.createElement('style')
    style.textContent = '* { transition-duration: 0s; transition-delay: 0s; }'
    document.head.append(style)
    // Leaflet sizes the map from its container, which jsdom lays out at 0×0
    Object.defineProperty(HTMLElement.prototype, 'clientWidth', { configurable: true, get: () => 800 })
    Object.defineProperty(HTMLElement.prototype, 'clientHeight', { configurable: true, get: () => 600 })
    // The map draws circles on a canvas, which jsdom can't render: a context whose every method does nothing
    HTMLCanvasElement.prototype.getContext = function () {
        return new Proxy({ canvas: this }, {
            get: (target, key) => (key in target ? target[key] : () => {}),
            set: () => true,
        })
    }

    // Leaflet queues canvas redraws for the next animation frame. When a test ends and the map is removed first,
    // the queued redraw finds no canvas and throws; browsers cancel it, jsdom doesn't. Skip redraws once removed.
    const { default: L } = await import('leaflet')
    const redraw = L.Canvas.prototype._redraw
    L.Canvas.prototype._redraw = function () {
        if (this._ctx) redraw.call(this)
    }

    afterEach(() => {
        cleanup()
        restoreNavigator()
        resetMatchMedia()
        localStorage.clear()
        document.documentElement.removeAttribute('data-bs-theme')
        window.history.replaceState(null, '', '/')
    })
}
