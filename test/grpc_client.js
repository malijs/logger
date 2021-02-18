const grpc = require('@grpc/grpc-js')
const loader = require('@grpc/proto-loader')
const defaults = {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
}

module.exports = function createClient(host, fileName, className, root) {
  const modules = grpc.loadPackageDefinition(loader.loadSync(fileName, defaults))

  if (!modules[root][className]) {
    throw new Error(`${className} not found on protobuf definition ${fileName}`)
  }
  return new modules[root][className](host, grpc.credentials.createInsecure())
}