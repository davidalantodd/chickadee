import { createHash } from 'node:crypto'

// Wikimedia only serves directly linked thumbnails at these standard widths (others are rejected):
// https://www.mediawiki.org/wiki/Common_thumbnail_sizes
export const THUMB_WIDTHS = { list: 120, popup: 250, modalSmall: 500, modal: 960 }

// Extensions whose thumbnails keep the file's own format. SVG thumbnails are rendered as PNG.
const RASTER_EXTENSIONS = new Set(['jpg', 'jpeg', 'png', 'gif', 'webp'])

// Whether a Commons file's thumbnails follow the layout commonsThumbUrl builds
export const hasStandardThumbs = (fileName) => {
    const extension = fileName.split('.').pop().toLowerCase()
    return RASTER_EXTENSIONS.has(extension) || extension === 'svg'
}

// Percent-encoding as Wikimedia does it, which also escapes the characters encodeURIComponent leaves alone
const encodeFileName = (name) => encodeURIComponent(name).replace(/[!'()*]/g, (char) => `%${char.charCodeAt(0).toString(16).toUpperCase()}`)

// Thumbnail URL for a Wikimedia Commons file, in the form the imageinfo API returns (without its tracking query):
//   https://thumb.wikimedia.org/wikipedia/commons/thumb/<h>/<hh>/<File>/<width>px-<File>
// where <h>/<hh> are the first one and two hex digits of the MD5 of the file name (spaces as underscores)
export const commonsThumbUrl = (fileName, width) => {
    const name = fileName.replace(/ /g, '_')
    const hash = createHash('md5').update(name).digest('hex')
    const encoded = encodeFileName(name)
    const thumbName = name.toLowerCase().endsWith('.svg') ? `${encoded}.png` : encoded
    return `https://thumb.wikimedia.org/wikipedia/commons/thumb/${hash[0]}/${hash.slice(0, 2)}/${encoded}/${width}px-${thumbName}`
}

export const commonsFilePageUrl = (fileName) =>
    `https://commons.wikimedia.org/wiki/File:${encodeFileName(fileName.replace(/ /g, '_'))}`
