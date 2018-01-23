
# mali-logger

[![Greenkeeper badge](https://badges.greenkeeper.io/malijs/logger.svg)](https://greenkeeper.io/)

[![npm version](https://img.shields.io/npm/v/mali-logger.svg?style=flat-square)](https://www.npmjs.com/package/mali-logger)
[![build status](https://img.shields.io/travis/malijs/logger/master.svg?style=flat-square)](https://travis-ci.org/malijs/logger)

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
$ npm install mali-logger
```

## Example

```js
var logger = require('mali-logger')
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

## Notes

Recommended that you `.use()` this middleware near the top
to "wrap" all subsequent middleware.

## License

Apache 2.0
