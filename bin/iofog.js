const ioFogClient = require('@iofog/nodejs-sdk')
const proxy = require('../lib/proxy').proxy

const currentConfig = {}
ioFogClient.init('localhost', 54321, null, main)

async function fetchConfig() {
  const configRequest = () => new Promise((resolve, reject) => {
    ioFogClient.getConfig({
      'onBadRequest': reject,
      'onError': reject,
      'onNewConfig': resolve
    })
  })

  try {
    const config = await configRequest()
    const mappings = config.mappings || []
    const networkRouter = config.networkRouter || {}

    console.log('*** New Mappings: ', JSON.stringify(mappings))
    console.log('*** Current Config: ', JSON.stringify(Object.keys(currentConfig)))
    const toDelete = Object.keys(currentConfig).filter(key => !mappings.find(mapping => mapping === key))
    console.log('*** To Delete: ', JSON.stringify(toDelete))
    const toAdd = mappings.filter((key) => !currentConfig[key])
    console.log('*** To Add: ', JSON.stringify(toAdd))

    toDelete.forEach((mapping) => {
      if (currentConfig[mapping].stop) {
        console.log(`*** Closing connection for ${mapping}`)
        currentConfig[mapping].stop()
      }
      delete(currentConfig[mapping])
    })

    toAdd.forEach((mapping) => {
      console.log(`*** Creating ${mapping}`)
      currentConfig[mapping] = proxy(mapping, 'localhost', { routerHost: networkRouter.host, routerPort: networkRouter.port, saslEnabled: false })
    })
  } catch (e) {
    console.error(e)
    process.exit(1)
  }

}

async function main() {
  await fetchConfig()

  ioFogClient.wsControlConnection({
    'onNewConfigSignal': async () => {
      await fetchConfig()
    },
    'onError': (error) => {
      console.error('There was an error with Control WebSocket connection to ioFog: ', error)
      process.exit(1)
    }
  })
}