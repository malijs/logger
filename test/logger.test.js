// const test = require('ava')
const path = require('path')
const sinon = require('sinon')
const sprom = require('sprom')
const fs = require('fs')
const pify = require('pify')
const pfs = pify(fs)
const createClient = require('./grpc_client')

// test subjects
const chalk = require('chalk')
const app = require('./test_server/route_guide_server')
const { expectation } = require('sinon')
const notesPath = path.resolve(__dirname, './test_server/route_guide_db_notes.json')
let log, sandbox, client

function getRandomInt (min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function getHostport (port) {
  return '0.0.0.0:'.concat(port || getRandomInt(1000, 60000))
}

const PROTO_PATH = path.resolve(__dirname, './route_guide.proto')
const HOSTPORT = getHostport()

beforeEach((done) => {
  sandbox = sinon.createSandbox()
  log = sandbox.spy(console, 'log')
  done()
})

afterEach((done) => {
  sandbox.restore()
  done()
})

beforeAll(async (done) => {
  await pfs.truncate(notesPath, 0)
  await app.start(HOSTPORT)
  client = createClient(HOSTPORT, PROTO_PATH, 'RouteGuide', 'routeguide')
  done()
})

afterAll(async (done) => {
  await app.close()
  await pfs.truncate(notesPath, 0)
  done()
})


test('should log a simple call', (done) => {
  const point1 = {
    latitude: 409146138,
    longitude: -746188906
  }
  client.getFeature(point1, (error, response) => {
    expect(error).toBeNull()
    expect(response).toBeTruthy()
    expect(log.called).toBeTruthy()
    done()
  })
})

test('should log a simple call with correct function and type of unary', (done) => {
  const point1 = {
    latitude: 409146138,
    longitude: -746188906
  }
  client.getFeature(point1, (error, response) => {
    expect(error).toBeNull()
    expect(response).toBeDefined()
    expect(log.calledTwice).toBeTruthy()
    expect(log.calledWith('  ' + chalk.gray('-->') +
      chalk.cyan('%s') +
      ' ' + chalk.bold('%s') +
      '%s' +
      ' ' + chalk.gray('%s'),
    '',
    'GetFeature',
    '',
    'unary')).toBeTruthy()

    expect(log.calledWith('  ' + chalk.gray('<--') +
      chalk.cyan('%s') +
      ' ' + chalk.bold('%s') +
      '%s' +
      ' ' + chalk.gray('%s') +
      ' ' + chalk.green('%s'),
    '',
    'GetFeature',
    '',
    'unary',
    sinon.match.any)).toBeTruthy()
    done()
  })
})

test('should log an errorous request with correct function and type of unary', async (done) => {
  const point1 = {
    latitude: 333333,
    longitude: 333333
  }

  client.getFeature(point1, (error, response) => {
    expect(error).toBeDefined()
    expect(response).toBeUndefined()
    expect(log.calledTwice).toBeTruthy()
    expect(log.calledWith('  ' + chalk.gray('-->') +
      chalk.cyan('%s') +
      ' ' + chalk.bold('%s') +
      '%s' +
      ' ' + chalk.gray('%s'),
    '',
    'GetFeature',
    '',
    'unary')).toBeTruthy()

    expect(log.calledWith('  ' + chalk.red('<--') +
      chalk.cyan('%s') +
      ' ' + chalk.bold('%s') +
      '%s' +
      ' ' + chalk.gray('%s') +
      ' ' + chalk.red('%s'),
    '',
    'GetFeature',
    '',
    'unary',
    sinon.match.any)).toBeTruthy()
    done()
  })
})

test('should log request with correct function and type of response_stream', async (done) => {
  const rectangle = {
    lo: {
      latitude: 400000000,
      longitude: -750000000
    },
    hi: {
      latitude: 420000000,
      longitude: -730000000
    }
  }

  const stream = client.listFeatures(rectangle)
  await sprom(stream)

  expect(log.calledWith('  ' + chalk.gray('-->') +
    chalk.cyan('%s') +
    ' ' + chalk.bold('%s') +
    '%s' +
    ' ' + chalk.gray('%s'),
  '',
  'ListFeatures',
  '',
  'response_stream')).toBeTruthy()
  expect(log.calledWith('  ' + chalk.gray('<--') +
    chalk.cyan('%s') +
    ' ' + chalk.bold('%s') +
    '%s' +
    ' ' + chalk.gray('%s') +
    ' ' + chalk.green('%s'),
  '',
  'ListFeatures',
  '',
  'response_stream',
  sinon.match.any)).toBeTruthy()

  done()
})

test('should log a simple call with default timestamp', (done) => {
  const point1 = {
    latitude: 409146138,
    longitude: -746188906
  }
  client.getFeatureEpoch(point1, (error, response) => {
    expect(error).toBeFalsy()
    expect(response).toBeTruthy()
    expect(log.called).toEqual(true)
    done()
  })
})

test('should log a simple call with unix timestamp', done => {
  const point1 = {
    latitude: 409146138,
    longitude: -746188906
  }
  client.getFeatureUnix(point1, (error, response ) => {
    expect(error).toBeFalsy()
    expect(response).toBeTruthy()
    expect(log.called).toEqual(true)
    done()
  })
})

test('should log a simple call with ISO timestamp', done => {
  const point1 = {
    latitude: 409146138,
    longitude: -746188906
  }
  client.getFeatureIso(point1, (error, response) => {
    expect(error).toBeFalsy()
    expect(response).toBeTruthy()
    expect(log.called).toEqual(true)
    done()
  })
})

test('should log a simple call with custom timestamp', done => {
  const point1 = {
    latitude: 409146138,
    longitude: -746188906
  }
  client.getFeatureCustom(point1, (error, response) => {
    expect(error).toBeFalsy()
    expect(response).toBeTruthy()
    expect(log.called).toEqual(true)
    done()
  })
})

test('should log a simple call with request logging', done => {
  const point1 = {
    latitude: 409146138,
    longitude: -746188906
  }
  client.getFeatureReq(point1, (error, response) => {
    expect(error).toBeFalsy()
    expect(response).toBeTruthy()
    expect(log.called).toEqual(true)
    done()
  })
})

test('should log a simple call with response logging', done => {
  const point1 = {
    latitude: 409146138,
    longitude: -746188906
  }
  client.getFeatureRes(point1, (error, response) => {
    expect(error).toBeFalsy()
    expect(response).toBeTruthy()
    expect(log.called).toEqual(true)
    done()
  })
})

test('should log a simple call with custom request and response logging', done => {
  const point1 = {
    latitude: 409146138,
    longitude: -746188906
  }
  client.getFeatureReqResCustom(point1, (error, response) => {
    expect(error).toBeFalsy()
    expect(response).toBeTruthy()
    expect(log.called).toEqual(true)
    done()
  })
})
