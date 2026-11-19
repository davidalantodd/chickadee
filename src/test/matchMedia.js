// Controllable window.matchMedia for tests: setMedia('(prefers-color-scheme: dark)', true) changes the answer and
// notifies listeners, as the browser does when the system setting changes
const DEFAULTS = { '(prefers-color-scheme: dark)': false, '(pointer: fine)': true }
let state = { ...DEFAULTS }
let listeners = []

export function installMatchMedia() {
    window.matchMedia = (query) => ({
        media: query,
        get matches() { return Boolean(state[query]) },
        addEventListener: (type, fn) => listeners.push({ query, fn }),
        removeEventListener: (type, fn) => { listeners = listeners.filter(l => l.fn !== fn) },
    })
}

export function setMedia(query, matches) {
    state[query] = matches
    listeners.filter(l => l.query === query).forEach(l => l.fn({ matches }))
}

export function resetMatchMedia() {
    state = { ...DEFAULTS }
    listeners = []
}
