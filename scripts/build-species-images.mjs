/* eslint-env node */
// Builds netlify/lib/species-images-data.js: each eBird species' lead Wikipedia photo and its credit.
//
// For every species in the eBird taxonomy, looks up the lead image of its English Wikipedia article (by common
// name, then by scientific name), keeping only free images hosted on Wikimedia Commons. Thumbnail URLs are not
// stored; they're rebuilt from the file name at a standard width (see netlify/lib/wikimediaThumb.js).
//
// Follows the Wikimedia Robot policy for the Action API (https://wikitech.wikimedia.org/wiki/Robot_policy):
// one request at a time, about one per second, 50 titles per request, an identifying User-Agent, maxlag,
// and backing off on 429 / Retry-After. A full run makes about 450 requests and takes 8-10 minutes.
//
// Run with: node scripts/build-species-images.mjs [--limit N]
// Needs EBIRD_API_KEY in the environment or in .env.

import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { commonsThumbUrl, hasStandardThumbs, THUMB_WIDTHS } from '../netlify/lib/wikimediaThumb.js'

const OUTPUT = new URL('../netlify/lib/species-images-data.js', import.meta.url)
const WIKIPEDIA_API_URL = 'https://en.wikipedia.org/w/api.php'
const USER_AGENT = 'chickadee-app/1.0 (https://github.com/davidalantodd/chickadee; species image build script)'
const BATCH_SIZE = 50
const REQUEST_INTERVAL_MS = 1000
const MAX_ARTIST_LENGTH = 120

const limitArg = process.argv.indexOf('--limit')
const limit = limitArg > -1 ? Number(process.argv[limitArg + 1]) : Infinity

const readApiKey = () => {
    if (process.env.EBIRD_API_KEY) return process.env.EBIRD_API_KEY
    const envFile = new URL('../.env', import.meta.url)
    if (!existsSync(envFile)) return null
    const line = readFileSync(envFile, 'utf8').split('\n').find(l => l.startsWith('EBIRD_API_KEY='))
    return line?.slice('EBIRD_API_KEY='.length).trim().replace(/^["']|["']$/g, '')
}

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms))
let requestCount = 0
let lastRequestAt = 0

// One Action API request, spaced at least REQUEST_INTERVAL_MS from the previous one and retried on throttling
const wikipediaQuery = async (params) => {
    const query = new URLSearchParams({ action: 'query', format: 'json', formatversion: '2', maxlag: '5', ...params })
    for (let attempt = 1; attempt <= 5; attempt++) {
        await sleep(Math.max(0, lastRequestAt + REQUEST_INTERVAL_MS - Date.now()))
        lastRequestAt = Date.now()
        requestCount++
        const response = await fetch(`${WIKIPEDIA_API_URL}?${query}`, {
            headers: { 'User-Agent': USER_AGENT, 'Accept-Encoding': 'gzip' }
        })
        const retryAfter = Number(response.headers.get('retry-after')) || 5 * attempt
        if (response.status === 429 || response.status >= 500) {
            console.warn(`HTTP ${response.status}; waiting ${retryAfter}s`)
            await sleep(retryAfter * 1000)
            continue
        }
        const data = await response.json()
        if (data.error?.code === 'maxlag') {
            console.warn(`Servers lagged; waiting ${retryAfter}s`)
            await sleep(retryAfter * 1000)
            continue
        }
        if (data.error) throw new Error(`Wikipedia API error: ${data.error.code} ${data.error.info}`)
        return data
    }
    throw new Error('Wikipedia API kept throttling; try again later')
}

const chunks = (items, size) => Array.from({ length: Math.ceil(items.length / size) }, (_, i) => items.slice(i * size, (i + 1) * size))

// Lead image file name for each title, following Wikipedia's title normalisation and redirects
const leadImagesByTitle = async (titles) => {
    const data = await wikipediaQuery({ prop: 'pageimages', piprop: 'name', pilimit: String(BATCH_SIZE), redirects: '1', titles: titles.join('|') })
    const follow = (map, title) => map.get(title) ?? title
    const normalized = new Map((data.query?.normalized ?? []).map(n => [n.from, n.to]))
    const redirects = new Map((data.query?.redirects ?? []).map(r => [r.from, r.to]))
    const imageByPage = new Map((data.query?.pages ?? []).filter(p => p.pageimage).map(p => [p.title, p.pageimage]))
    return new Map(titles.map(title => [title, imageByPage.get(follow(redirects, follow(normalized, title)))]))
}

// Wikimedia's artist field is HTML (often a link to the photographer's profile), so reduce it to plain text
const stripHtml = (html) => html?.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim()

const main = async () => {
    const apiKey = readApiKey()
    if (!apiKey) throw new Error('Set EBIRD_API_KEY (or add it to .env)')

    const taxonomyResponse = await fetch('https://api.ebird.org/v2/ref/taxonomy/ebird?fmt=json&cat=species', {
        headers: { 'X-eBirdApiToken': apiKey }
    })
    if (!taxonomyResponse.ok) throw new Error(`eBird taxonomy request failed: HTTP ${taxonomyResponse.status}`)
    const species = (await taxonomyResponse.json()).slice(0, limit)
    console.log(`${species.length} species`)

    // 1. Lead image file name per species: common name first, then scientific name for the misses
    const fileBySpecies = new Map()
    for (const [field, label] of [['comName', 'common names'], ['sciName', 'scientific names']]) {
        const remaining = species.filter(s => !fileBySpecies.has(s.speciesCode))
        const batches = chunks(remaining, BATCH_SIZE)
        for (const [i, batch] of batches.entries()) {
            const images = await leadImagesByTitle(batch.map(s => s[field]))
            for (const s of batch) if (images.get(s[field])) fileBySpecies.set(s.speciesCode, images.get(s[field]))
            if ((i + 1) % 20 === 0 || i === batches.length - 1) console.log(`  ${label}: batch ${i + 1}/${batches.length}`)
        }
    }

    // 2. Credit and licence for each file, keeping only free files hosted on Commons
    const files = [...new Set(fileBySpecies.values())].filter(hasStandardThumbs)
    const infoByFile = new Map()
    const fileBatches = chunks(files, BATCH_SIZE)
    for (const [i, batch] of fileBatches.entries()) {
        const data = await wikipediaQuery({
            prop: 'imageinfo',
            iiprop: 'extmetadata|url',
            iiurlwidth: String(THUMB_WIDTHS.list),
            iiextmetadatafilter: 'Artist|LicenseShortName|LicenseUrl|NonFree',
            titles: batch.map(f => `File:${f}`).join('|')
        })
        for (const page of data.query?.pages ?? []) {
            const info = page.imageinfo?.[0]
            if (!info || page.imagerepository !== 'shared') continue
            infoByFile.set(page.title.slice('File:'.length).replace(/ /g, '_'), info)
        }
        if ((i + 1) % 20 === 0 || i === fileBatches.length - 1) console.log(`  file credits: batch ${i + 1}/${fileBatches.length}`)
    }

    // 3. Compact records: [file name, artist, licence index], with licences listed once
    const licenses = []
    const licenseIndex = new Map()
    const images = {}
    let mismatchedUrls = 0
    for (const [speciesCode, fileName] of fileBySpecies) {
        const info = infoByFile.get(fileName)
        const metadata = info?.extmetadata ?? {}
        const license = metadata.LicenseShortName?.value
        if (!info || !license || metadata.NonFree?.value === 'true') continue
        // Check the rebuilt thumbnail URL against the one Wikimedia reports, so stored names always produce working links
        if (commonsThumbUrl(fileName, THUMB_WIDTHS.list) !== info.thumburl?.split('?')[0]) {
            mismatchedUrls++
            continue
        }
        const key = `${license}|${metadata.LicenseUrl?.value ?? ''}`
        if (!licenseIndex.has(key)) {
            licenseIndex.set(key, licenses.length)
            licenses.push([license, metadata.LicenseUrl?.value ?? null])
        }
        const artist = stripHtml(metadata.Artist?.value)?.slice(0, MAX_ARTIST_LENGTH) || null
        images[speciesCode] = [fileName, artist, licenseIndex.get(key)]
    }

    writeFileSync(OUTPUT, [
        '/* eslint-disable */',
        '// Generated by scripts/build-species-images.mjs from Wikipedia / Wikimedia Commons. Do not edit.',
        '// images: speciesCode -> [Commons file name, artist, index into licenses]; licenses: [short name, URL]',
        `export const licenses = ${JSON.stringify(licenses)}`,
        `export const images = ${JSON.stringify(images)}`,
        '',
    ].join('\n'))

    console.log(`Wrote images for ${Object.keys(images).length} of ${species.length} species ` +
        `(${fileBySpecies.size} had a lead image; ${mismatchedUrls} skipped for non-standard thumbnail URLs) ` +
        `using ${requestCount} Wikipedia requests`)
}

main().catch(error => {
    console.error(error.message)
    process.exit(1)
})
