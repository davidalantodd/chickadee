// @vitest-environment node
import { createHash } from 'node:crypto'
import { describe, expect, it } from 'vitest'
import { photoCredit, speciesImage, wikipediaUrl } from './speciesImages.js'
import { commonsFilePageUrl, commonsThumbUrl, hasStandardThumbs, THUMB_WIDTHS } from './wikimediaThumb.js'

describe('commonsThumbUrl', () => {
    it('builds the thumbnail path from the MD5 of the file name', () => {
        const name = 'Carolina_Chickadee1_by_Dan_Pancamo.jpg'
        const hash = createHash('md5').update(name).digest('hex')
        expect(commonsThumbUrl(name, 250)).toBe(
            `https://thumb.wikimedia.org/wikipedia/commons/thumb/${hash[0]}/${hash.slice(0, 2)}/${name}/250px-${name}`)
    })

    it('treats spaces as underscores, as Commons does', () => {
        expect(commonsThumbUrl('Blue Jay.jpg', 120)).toBe(commonsThumbUrl('Blue_Jay.jpg', 120))
        expect(commonsThumbUrl('Blue Jay.jpg', 120)).not.toContain(' ')
    })

    it('escapes characters encodeURIComponent leaves alone, like Wikimedia does', () => {
        const url = commonsThumbUrl("Bird_(male)_'n'_friend!*.jpg", 120)
        expect(url).toContain('Bird_%28male%29_%27n%27_friend%21%2A.jpg')
        expect(url).not.toMatch(/[()'!*]/)
    })

    it('encodes non-ASCII file names', () => {
        expect(commonsThumbUrl('Mésange.jpg', 120)).toContain('M%C3%A9sange.jpg')
    })

    it('serves SVG thumbnails as PNG', () => {
        expect(commonsThumbUrl('Map.svg', 250)).toMatch(/\/250px-Map\.svg\.png$/)
        expect(commonsThumbUrl('Map.SVG', 250)).toMatch(/\/250px-Map\.SVG\.png$/)
    })
})

describe('commonsFilePageUrl', () => {
    it('links to the file page with the same encoding', () => {
        expect(commonsFilePageUrl('Blue Jay (1).jpg')).toBe('https://commons.wikimedia.org/wiki/File:Blue_Jay_%281%29.jpg')
    })
})

describe('hasStandardThumbs', () => {
    it.each(['a.jpg', 'a.JPEG', 'a.png', 'a.gif', 'a.webp', 'a.svg', 'a.b.Jpg'])('accepts %s', (name) => {
        expect(hasStandardThumbs(name)).toBe(true)
    })
    it.each(['a.tif', 'a.ogg', 'a.pdf', 'noextension'])('rejects %s', (name) => {
        expect(hasStandardThumbs(name)).toBe(false)
    })
})

describe('speciesImage', () => {
    it('returns a URL for every standard width, with the credit details', () => {
        const image = speciesImage('carchi')
        expect(Object.keys(image.urls)).toEqual(Object.keys(THUMB_WIDTHS))
        for (const [size, width] of Object.entries(THUMB_WIDTHS)) expect(image.urls[size]).toContain(`/${width}px-`)
        expect(image).toMatchObject({
            artist: 'Dan Pancamo',
            license: 'CC BY-SA 2.0',
            licenseUrl: 'https://creativecommons.org/licenses/by-sa/2.0',
            filePageUrl: expect.stringMatching(/^https:\/\/commons\.wikimedia\.org\/wiki\/File:/),
        })
    })

    it('keeps a missing artist and licence URL as null', () => {
        expect(speciesImage('lesnot1').artist).toBeNull()
        expect(speciesImage('ostric3').licenseUrl).toBeNull()
    })

    it.each(['nosuchbird', '', undefined, '__proto__', 'constructor'])('returns null for %j', (code) => {
        expect(speciesImage(code)).toBeNull()
    })
})

describe('wikipediaUrl', () => {
    it('links to a confirmed article whose title differs from the common name', () => {
        expect(wikipediaUrl('lesrhe2')).toBe("https://en.wikipedia.org/wiki/Darwin's_rhea")
    })

    it('searches for the scientific name when no article was confirmed', () => {
        expect(wikipediaUrl('willet3')).toBe('https://en.wikipedia.org/w/index.php?search=Tringa%20inornata')
    })

    it('returns null when the article is titled with the common name', () => {
        expect(wikipediaUrl('ostric2')).toBeNull()
        expect(wikipediaUrl('nosuchbird')).toBeNull()
    })

    it.each(['constructor', 'tostring', '__proto__'])('returns null for %j rather than a built-in property', (code) => {
        expect(wikipediaUrl(code)).toBeNull()
    })
})

describe('photoCredit', () => {
    it.each([
        [{ artist: 'Jane Doe', license: 'CC BY 4.0' }, 'Photo: Jane Doe / CC BY 4.0'],
        [{ artist: null, license: 'CC0' }, 'Photo: Unknown author / CC0'],
        [{ artist: 'Jane Doe', license: null }, 'Photo: Jane Doe'],
        [{}, 'Photo: Unknown author'],
    ])('%j -> %s', (image, expected) => expect(photoCredit(image)).toBe(expected))
})
