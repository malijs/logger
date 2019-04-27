const path = require('path')
const hl = require('highland')
const _ = require('lodash')
const Mali = require('mali')
const BB = require('bluebird')

const logger = require('../../')
const db = require('./feature_db')
const { getDistance, pointKey } = require('./route_utils')

const PROTO_PATH = path.resolve(__dirname, '../route_guide.proto')

/**
 * getFeature request handler. Gets a request with a point, and responds with a
 * feature object indicating whether there is a feature at that point.
 * @param {Object} ctx Context or point
 */
async function getFeature (ctx) {
  const point = ctx.req
  let feature = await db.checkFeature(point)
  if (!feature) {
    feature = {
      name: '',
      location: point
    }
  }

  ctx.res = feature
}

/**
 * listFeatures request handler. Gets a request with two points, and responds
 * with a stream of all features in the bounding box defined by those points.
 */
async function listFeatures (ctx) {
  const lo = ctx.req.lo
  const hi = ctx.req.hi

  const left = _.min([lo.longitude, hi.longitude])
  const right = _.max([lo.longitude, hi.longitude])
  const top = _.max([lo.latitude, hi.latitude])
  const bottom = _.min([lo.latitude, hi.latitude])

  const input = await db.getFeaturesListStream()

  const ret = hl(input).filter(feature => {
    if (feature.name === '') {
      return false
    }
    if (feature.location.longitude >= left &&
      feature.location.longitude <= right &&
      feature.location.latitude >= bottom &&
      feature.location.latitude <= top) {
      return true
    }
  })

  ctx.res = ret
}

async function statsMapper (point) {
  let feature = await db.checkFeature(point)
  if (!feature) {
    feature = {
      name: '',
      location: point
    }
  }
  return {
    point,
    feature
  }
}

// to be used because we don't have highland asyncWrapper
function statsMappedCb (point, fn) {
  BB.resolve(statsMapper(point)).asCallback(fn)
}

/**
 * recordRoute handler. Gets a stream of points, and responds with statistics
 * about the "trip": number of points, number of known features visited, total
 * distance traveled, and total time spent.
 */
async function recordRoute (ctx) {
  // TODO we need to wait for Highland flatReduce
  // to be able to use async reduce iterator
  // for now we'll just async map to get features if present
  // TODO wrapAsync is not present in highland beta.3 yet
  // So use callback style using statsMappedCb

  const iv = {
    point_count: 0,
    feature_count: 0,
    distance: 0,
    previous: null
  }

  const mapper = hl.wrapCallback(statsMappedCb)

  const startTime = process.hrtime()

  return new Promise((resolve, reject) => {
    hl(ctx.req)
      .map(mapper)
      .series()
      .reduce((memo, data) => {
        memo.point_count += 1
        if (data.feature && data.feature.name) {
          memo.feature_count += 1
        }

        if (memo.previous != null) {
          memo.distance += getDistance(memo.previous, data.point)
        }
        memo.previous = data.point
        return memo
      }, iv)
      .toCallback((err, r) => {
        if (err) {
          return reject(err)
        }

        ctx.res = {
          point_count: r.point_count,
          feature_count: r.feature_count,
          // Cast the distance to an integer
          distance: r.distance | 0,
          // End the timer
          elapsed_time: process.hrtime(startTime)[0]
        }
        resolve()
      })
  })
}

async function handleNote (ctx, note) {
  const key = pointKey(note.location)
  const existing = await db.getNote(key)
  if (!existing) {
    return db.putNote(key, note)
  }

  if (!Array.isArray(existing.value)) {
    existing.value = []
  }

  _.each(existing.value, n => ctx.res.write(n))
  return db.putNote(key, note)
}

function handleNoteCb (ctx, note, fn) {
  BB.resolve(handleNote(ctx, note)).asCallback(fn)
}

/**
 * routeChat handler. Receives a stream of message/location pairs, and responds
 * with a stream of all previous messages at each of those locations.
 */
async function routeChat (ctx) {
  // TODO since we don't have Highland.wrapAsync
  // hack and use Highland.wrapCallback
  // use map because .each() doesn't work in async series manner

  const p = _.partial(handleNoteCb, ctx)
  const handler = hl.wrapCallback(p)

  hl(ctx.req)
    .map(handler)
    .series()
    .done(() => ctx.res.end())
}

let app = new Mali(PROTO_PATH, 'RouteGuide')
let log = logger()
let log2 = logger({ fullName: true })
let logTime = logger({ timestamp: true })
let logUnix = logger({ timestamp: logger.unixTime })
let logISO = logger({ timestamp: logger.isoTime })
let logCustom = logger({ timestamp: date => `${date.toDateString()} ${date.toLocaleTimeString()}` })
let logReq = logger({ request: true })
let logRes = logger({ response: true })
let logReqResCustom = logger({
  request: req => `(${req.latitude}, ${req.longitude})`,
  response: res => `[${res.name}]`
})

app.use({
  getFeature: [log, getFeature],
  getFeatureEpoch: [logTime, getFeature],
  getFeatureUnix: [logUnix, getFeature],
  getFeatureISO: [logISO, getFeature],
  getFeatureCustom: [logCustom, getFeature],
  listFeatures: [log, listFeatures],
  recordRoute: [log, recordRoute],
  routeChat: [log2, routeChat],
  getFeatureReq: [logReq, getFeature],
  getFeatureRes: [logRes, getFeature],
  getFeatureReqResCustom: [logReqResCustom, getFeature]
})

module.exports = app
