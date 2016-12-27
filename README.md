
# mali-logger

Development style logger middleware for [Mali](https://github.com/malijs/mali).

```
--> getFeature unary
--> getFeature unary
<-- getFeature unary 22ms
<-- getFeature unary 32ms
--> listFeatures response_stream
<-- listFeatures response_stream 21ms
--> recordRoute request_stream
<-- recordRoute request_stream 10s
--> routeChat duplex
<-- routeChat duplex 10ms
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

## Notes

Recommended that you `.use()` this middleware near the top
to "wrap" all subsequent middleware.

## License

MIT
