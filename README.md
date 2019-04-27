
# @malijs/logger

[![npm version](https://img.shields.io/npm/v/@malijs/logger.svg?style=flat-square)](https://www.npmjs.com/package/@malijs/logger)
[![build status](https://img.shields.io/travis/malijs/logger/master.svg?style=flat-square)]

Development style logger middleware for [Mali](https://github.com/malijs/mali).

```sh
--> GetFeature unary
--> GetFeature unary
<-- GetFeature unary 22ms
<-- GetFeature unary 32ms
--> ListFeatures response_stream
<-- ListFeatures response_stream 21ms
--> RecordRoute request_stream
<-- RecordRoute request_stream 10s
--> RouteChat duplex
<-- RouteChat duplex 10ms
```

## Installation

```js
$ npm install @malijs/logger
```

## Example

```js
var logger = require('@malijs/logger')
var Mali = require('mali')

function sayHello (ctx) {
  ctx.res = { message: 'Hello ' + ctx.req.name }
}

const app = new Mali(path.resolve(__dirname, './helloworld.proto'), 'Greeter')
app.use(logger())
app.use({ sayHello })
app.start('localhost:50051')
```

## API

### logger(options)

#### options.fullName 

To log full name (`fullName`) from context, otherwise logs just the `name`. Default: `false`.

```js
app.use(logger({ fullName: true }))
```

Output:

```sh
--> /routeguide.RouteGuide/GetFeature unary
<-- /routeguide.RouteGuide/GetFeature unary 22ms
```

#### options.timestamp

Enables or disables the inclusion of a timestamp in the log message.
If a function is supplied, it is passed a `Date` timestamp and it must synchronously return the string representation to be logged.
There are predefined timestamp functions: `epochTime` (default), `unixTime`, and `isoTime`.

**Default timestamp**

```js
app.use(logger({timestamp: true}))
```

Output:

```
--> 1556325859071 GetFeature unary
<-- 1556325859071 GetFeature unary 6ms
```

**With custom predefined timestamp**

```js
app.use(logger({timestamp: logger.isoTime}))
```

Output:

```
--> 2019-04-27T00:44:19.083Z GetFeature unary
<-- 2019-04-27T00:44:19.083Z GetFeature unary 4ms
```

**With custom timestamp function**

```js
app.use(logger({ timestamp: date => `${date.toDateString()} ${date.toLocaleTimeString()}` }))
```

Output:

```
--> Fri Apr 26 2019 9:44:19 PM GetFeature unary
<-- Fri Apr 26 2019 9:44:19 PM GetFeature unary 18ms
```

#### Timestamp functions

- **logger.nullTime** - No timestamp. Used when `timestamp: false`.
- **logger.epochTime** - Milliseconds since Unix epoch. Default. Used when `timestamp: true`.
- **logger.unixTime** - Seconds since Unix epoch.
- **logger.isoTime** - Timestamp in ISO time.

## Notes

Recommended that you `.use()` this middleware near the top to "wrap" all subsequent middleware.

## License

Apache 2.0
