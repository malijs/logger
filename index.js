const { humanizeNumber } = require('./helpers')
const chalk = require('chalk')
const isStream = require('is-stream')

/**
 * Development style logger middleware for Mali.
 * @module @malijs/logger
 *
 * @param  {Object} options Options
 * @param  {Boolean} options.fullName To log full name from context, otherwise logs just the name.
 *                                    Default: <code>false</code>
 * @param  {Boolean | Function} options.timestamp Enables or disables the inclusion of a timestamp in the log message.
 *                                                If a function is supplied, it is passed a `Date` timestamp and it must synchronously return the string representation to be logged.
 *                                                There are predefined timestamp functions: `epochTime` (default), `epochTime`, and `isoTime`.
 * @param  {Boolean | Function} options.request Enables or disables the inclusion of request in the log message.
 *                                              By default `JSON.stringify` is used. If a function is supplied it is passed the request from the context.
 * @param  {Boolean | Function} options.response Enables or disables the inclusion of response in the log message.
 *                                               By default `JSON.stringify` is used. If a function is supplied it is passed the response from the context.
 *
 * @example
 * const logger = require('@malijs/logger')
 * app.use(logger())
 *
 * @example <caption>With timestamp</catoin>
 * const logger = require('@malijs/logger')
 * app.use(logger({timestamp: true}))
 *
 * @example <caption>With custom predefined timestamp</catoin>
 * const logger = require('@malijs/logger')
 * app.use(logger({timestamp: logger.isoTime}))
 *
 * @example <caption>With custom timestamp function</catoin>
 * const logger = require('@malijs/logger')
 * app.use(logger({ timestamp: date => `${date.toDateString()} ${date.toLocaleTimeString()}` }))
 */
function logger (options = {}) {
  if (typeof options.fullName !== 'boolean') {
    options.fullName = false
  }

  if (options.timestamp === true) {
    options.timestamp = epochTime
  } else if (typeof options.timestamp !== 'function') {
    options.timestamp = false
  }

  if (options.request === true) {
    options.request = JSON.stringify
  } else if (typeof options.request !== 'function') {
    options.request = false
  }

  if (options.response === true) {
    options.response = JSON.stringify
  } else if (typeof options.response !== 'function') {
    options.response = false
  }

  return function logger (ctx, next) {
    const start = new Date()

    const timestamp = options.timestamp ? options.timestamp(start) : ''

    const request = options.request ? options.request(ctx.req) : ''

    console.log(
      '  ' + chalk.gray('-->') +
      chalk.cyan('%s') +
      ' ' + chalk.bold('%s') +
      '%s' +
      ' ' + chalk.gray('%s'),
      timestamp ? ` ${timestamp}` : '',
      options.fullName ? ctx.fullName : ctx.name,
      request ? ` ${request}` : '',
      ctx.type)

    return next().then(() => {
      if (!isStream(ctx.res) || (ctx.type !== 'response_stream' && ctx.type !== 'duplex')) {
        return log(options, ctx, start, null, null)
      }

      const res = ctx.res
      const onfinish = done.bind(null, 'finish')
      const onclose = done.bind(null, 'close')
      const onend = done.bind(null, 'end')

      res.once('finish', onfinish)
      res.once('close', onclose)
      res.once('end', onend)

      function done (event) {
        res.removeListener('finish', onfinish)
        res.removeListener('close', onclose)
        res.removeListener('end', onend)
        log(options, ctx, start, null, event)
      }
    }, (err) => {
      log(options, ctx, start, err)
      throw err
    })
  }
}

/**
 * Milliseconds since Unix epoch (Default)
 */
const epochTime = date => `${date.getTime()}`

/**
 * Seconds since Unix epoch
 */
const unixTime = date => `${Math.round(date.getTime() / 1000.0)}`

/**
 * Timestamp in ISO time.
 */
const isoTime = date => `${date.toISOString()}`

logger.epochTime = epochTime
logger.unixTime = unixTime
logger.isoTime = isoTime

function log (options, ctx, start, err, event) {
  const color = err ? 'red' : 'green'

  const timestamp = options.timestamp ? options.timestamp(start) : ''

  const response = options.response ? options.response(ctx.res) : ''

  const upstream = err ? chalk.red('<--')
    : event === 'close' ? chalk.yellow('-x-')
      : chalk.gray('<--')

  console.log('  ' + upstream +
    chalk.cyan('%s') +
    ' ' + chalk.bold('%s') +
    '%s' +
    ' ' + chalk.gray('%s') +
    ' ' + chalk[color]('%s'),
  timestamp ? ` ${timestamp}` : '',
  options.fullName ? ctx.fullName : ctx.name,
  response ? ` ${response}` : '',
  ctx.type,
  time(start))
}

function time (start) {
  const delta = new Date() - start
  return humanizeNumber(delta < 10000
    ? delta + 'ms'
    : Math.round(delta / 1000) + 's')
}

module.exports = logger
