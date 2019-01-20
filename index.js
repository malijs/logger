const humanize = require('humanize-number')
const chalk = require('chalk')
const isStream = require('is-stream')

/**
 * Development style logger middleware for Mali.
 * @module @malijs/logger
 *
 * @param  {Object} options Options
 * @param  {Boolean} options.fullName To log full name from context, otherwise logs just the name.
 *                                    Default: <code>false</code>
 *
 * @example
 * const logger = require('@malijs/logger')
 * app.use(logger())
 */
module.exports = function dev (options = {}) {
  if (typeof options.fullName !== 'boolean') {
    options.fullName = false
  }

  return function logger (ctx, next) {
    const start = new Date()
    console.log('  ' + chalk.gray('-->') +
      ' ' + chalk.bold('%s') +
      ' ' + chalk.gray('%s'),
    options.fullName ? ctx.fullName : ctx.name,
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

function log (options, ctx, start, err, event) {
  const color = err ? 'red' : 'green'

  const upstream = err ? chalk.red('<--')
    : event === 'close' ? chalk.yellow('-x-')
      : chalk.gray('<--')

  console.log('  ' + upstream +
    ' ' + chalk.bold('%s') +
    ' ' + chalk.gray('%s') +
    ' ' + chalk[color]('%s'),
  options.fullName ? ctx.fullName : ctx.name,
  ctx.type,
  time(start))
}

function time (start) {
  const delta = new Date() - start
  return humanize(delta < 10000
    ? delta + 'ms'
    : Math.round(delta / 1000) + 's')
}
