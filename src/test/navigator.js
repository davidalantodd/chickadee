// Adds or replaces navigator properties for one test, e.g. stubNavigator({ geolocation: undefined }).
// They're set on the real navigator object, so everything else on it (userAgent and so on) keeps working.
// The test setup removes them after each test.
let stubbed = []

export function stubNavigator(properties) {
    for (const [key, value] of Object.entries(properties)) {
        stubbed.push([key, Object.getOwnPropertyDescriptor(navigator, key)])
        Object.defineProperty(navigator, key, { configurable: true, value })
    }
}

export function restoreNavigator() {
    for (const [key, descriptor] of stubbed.reverse()) {
        if (descriptor) Object.defineProperty(navigator, key, descriptor)
        else delete navigator[key]
    }
    stubbed = []
}
