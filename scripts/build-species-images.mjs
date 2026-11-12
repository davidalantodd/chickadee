/* eslint-env node */
// Builds netlify/lib/species-images-data.js: each eBird species' lead Wikipedia photo and its credit.
//
// For every species in the eBird taxonomy, finds its English Wikipedia article and that article's lead image,
// keeping only free images hosted on Wikimedia Commons. Thumbnail URLs are not stored; they're rebuilt from the
// file name at a standard width (see netlify/lib/wikimediaThumb.js).
//
// Some common names belong to other articles ("Redhead" redirects to Red hair, not the duck), so each species is
// looked up by both its common and scientific name. When the two agree, that article is used. Otherwise, in order:
//   1. the common-name article, if it's titled with the common name and its intro mentions the eBird genus
//      (Wikipedia sometimes splits a species eBird keeps whole, so the scientific name leads to a lesser-known relative)
//   2. an article whose intro names the scientific name
//   3. an article whose intro describes a bird or species
// Disambiguation pages never count. If nothing checks out, the species gets no photo and its Wikipedia link
// becomes a search for the scientific name.
//
// Follows the Wikimedia Robot policy for the Action API (https://wikitech.wikimedia.org/wiki/Robot_policy):
// one request at a time, about one per second, batched titles, an identifying User-Agent, maxlag,
// and backing off on 429 / Retry-After. A full run makes about 750 requests and takes 13-15 minutes.
//
// Run with: node scripts/build-species-images.mjs [--limit N] [--only speciesCode,speciesCode]
// (--limit and --only are for testing; they write a partial data file, so finish with a full run)
// Needs EBIRD_API_KEY in the environment or in .env.

import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { commonsThumbUrl, hasStandardThumbs, THUMB_WIDTHS } from '../netlify/lib/wikimediaThumb.js'

const OUTPUT = new URL('../netlify/lib/species-images-data.js', import.meta.url)
// Species whose common name led to a different article than the one used, for review after a run
const REPORT = new URL('./species-images-report.txt', import.meta.url)
const WIKIPEDIA_API_URL = 'https://en.wikipedia.org/w/api.php'
const USER_AGENT = 'chickadee-app/1.0 (https://github.com/davidalantodd/chickadee; species image build script)'
const BATCH_SIZE = 50
const EXTRACT_BATCH_SIZE = 20 // the extracts API returns at most 20 intros per request
const REQUEST_INTERVAL_MS = 1000
const MAX_ARTIST_LENGTH = 120

const limitArg = process.argv.indexOf('--limit')
const limit = limitArg > -1 ? Number(process.argv[limitArg + 1]) : Infinity
const onlyArg = process.argv.indexOf('--only')
const onlyCodes = onlyArg > -1 ? new Set(process.argv[onlyArg + 1].split(',')) : null

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

// The article each title leads to, as { title, image, disambiguation }, following Wikipedia's title
// normalisation and redirects. Titles with no article map to null.
const resolveArticles = async (titles) => {
    const data = await wikipediaQuery({
        prop: 'pageimages|pageprops', piprop: 'name', pilimit: String(BATCH_SIZE), ppprop: 'disambiguation',
        redirects: '1', titles: titles.join('|')
    })
    const follow = (map, title) => map.get(title) ?? title
    const normalized = new Map((data.query?.normalized ?? []).map(n => [n.from, n.to]))
    const redirects = new Map((data.query?.redirects ?? []).map(r => [r.from, r.to]))
    const pages = new Map((data.query?.pages ?? []).filter(p => !p.missing && !p.invalid).map(p => [p.title, {
        title: p.title,
        image: p.pageimage ?? null,
        disambiguation: p.pageprops?.disambiguation !== undefined,
    }]))
    return new Map(titles.map(title => [title, pages.get(follow(redirects, follow(normalized, title))) ?? null]))
}

// Plain-text opening paragraph of each article title
const fetchIntros = async (titles) => {
    const data = await wikipediaQuery({ prop: 'extracts', exintro: '1', explaintext: '1', exlimit: String(EXTRACT_BATCH_SIZE), titles: titles.join('|') })
    return new Map((data.query?.pages ?? []).map(p => [p.title, p.extract ?? '']))
}

// Looks up every species by one name field, BATCH_SIZE titles per request
const resolveAll = async (species, field, label) => {
    const result = new Map()
    const batches = chunks(species, BATCH_SIZE)
    for (const [i, batch] of batches.entries()) {
        const articles = await resolveArticles(batch.map(s => s[field]))
        for (const s of batch) result.set(s.speciesCode, articles.get(s[field]))
        if ((i + 1) % 20 === 0 || i === batches.length - 1) console.log(`  ${label}: batch ${i + 1}/${batches.length}`)
    }
    return result
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
    const species = (await taxonomyResponse.json()).filter(s => !onlyCodes || onlyCodes.has(s.speciesCode)).slice(0, limit)
    console.log(`${species.length} species`)

    // 1. The article each species' common name and scientific name lead to
    const byCommonName = await resolveAll(species, 'comName', 'common names')
    const byScientificName = await resolveAll(species, 'sciName', 'scientific names')

    // 2. Where the two disagree (or only one exists), read the candidates' opening paragraphs to pick the bird
    const unsure = species.filter(s => {
        const common = byCommonName.get(s.speciesCode)
        const scientific = byScientificName.get(s.speciesCode)
        return (common || scientific) && common?.title !== scientific?.title
    })
    const titlesToCheck = [...new Set(unsure.flatMap(s => [byCommonName.get(s.speciesCode)?.title, byScientificName.get(s.speciesCode)?.title]).filter(Boolean))]
    const intros = new Map()
    const introBatches = chunks(titlesToCheck, EXTRACT_BATCH_SIZE)
    for (const [i, batch] of introBatches.entries()) {
        for (const [title, intro] of await fetchIntros(batch)) intros.set(title, intro)
        if ((i + 1) % 20 === 0 || i === introBatches.length - 1) console.log(`  checking articles: batch ${i + 1}/${introBatches.length}`)
    }

    const intro = (article) => (article && !article.disambiguation && intros.get(article.title)) || ''
    const sameTitle = (a, b) => a.replace(/_/g, ' ').toLowerCase() === b.replace(/_/g, ' ').toLowerCase()
    const namesScientificName = (article, s) => intro(article).toLowerCase().includes(s.sciName.toLowerCase())
    const namesGenus = (article, s) => new RegExp(`\\b${s.sciName.split(' ')[0]}\\b`).test(intro(article))
    const describesBird = (article) => /\b(birds?|species|subspecies)\b/i.test(intro(article))
    const articleBySpecies = new Map() // speciesCode -> { title, image }, or null when no article checked out
    for (const s of species) {
        const common = byCommonName.get(s.speciesCode)
        const scientific = byScientificName.get(s.speciesCode)
        if (common && common.title === scientific?.title) {
            articleBySpecies.set(s.speciesCode, common)
            continue
        }
        const chosen = (common && sameTitle(common.title, s.comName) && namesGenus(common, s) ? common : null)
            ?? [common, scientific].find(a => a && namesScientificName(a, s))
            ?? [common, scientific].find(a => a && describesBird(a))
            ?? null
        articleBySpecies.set(s.speciesCode, chosen)
    }

    const fileBySpecies = new Map()
    for (const [speciesCode, article] of articleBySpecies) if (article?.image) fileBySpecies.set(speciesCode, article.image)

    // 3. Credit and licence for each file, keeping only free files hosted on Commons
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

    // 4. Compact records: [file name, artist, licence index], with licences listed once
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

    // 5. Wikipedia link targets that differ from the common name: an article title, or a search when unverified
    const articles = {}
    const searches = {}
    for (const s of species) {
        const article = articleBySpecies.get(s.speciesCode)
        if (!article) searches[s.speciesCode] = s.sciName
        else if (!sameTitle(article.title, s.comName)) articles[s.speciesCode] = article.title
    }

    writeFileSync(OUTPUT, [
        '/* eslint-disable */',
        '// Generated by scripts/build-species-images.mjs from Wikipedia / Wikimedia Commons. Do not edit.',
        '// images: speciesCode -> [Commons file name, artist, index into licenses]; licenses: [short name, URL]',
        '// articles: speciesCode -> Wikipedia article title, when it differs from the common name',
        '// searches: speciesCode -> scientific name to search for, when no article could be confirmed',
        `export const licenses = ${JSON.stringify(licenses)}`,
        `export const images = ${JSON.stringify(images)}`,
        `export const articles = ${JSON.stringify(articles)}`,
        `export const searches = ${JSON.stringify(searches)}`,
        '',
    ].join('\n'))

    // Report: species whose common name led somewhere other than the article used
    const redirected = species.filter(s => {
        const common = byCommonName.get(s.speciesCode)
        return common && common.title !== articleBySpecies.get(s.speciesCode)?.title
    })
    writeFileSync(REPORT, [
        `Species whose common name leads to a different Wikipedia article than the one used (${redirected.length})`,
        '',
        ...redirected.map(s => `${s.comName} (${s.sciName}): "${byCommonName.get(s.speciesCode).title}" -> ` +
            (articleBySpecies.get(s.speciesCode) ? `"${articleBySpecies.get(s.speciesCode).title}"` : 'search for scientific name')),
        '',
        `Species with no confirmed article (Wikipedia link is a search): ${Object.keys(searches).length}`,
        '',
    ].join('\n'))
    console.log(`Report: ${REPORT.pathname} (${redirected.length} species redirected away from their common-name article)`)

    console.log(`Wrote images for ${Object.keys(images).length} of ${species.length} species ` +
        `(${fileBySpecies.size} had a lead image; ${mismatchedUrls} skipped for non-standard thumbnail URLs) ` +
        `using ${requestCount} Wikipedia requests`)
}

main().catch(error => {
    console.error(error.message)
    process.exit(1)
})
