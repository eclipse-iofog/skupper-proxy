const ioFogClient = require('@iofog/nodejs-sdk')
const proxy = require('../lib/proxy').proxy
const log = require('../lib/log.js').logger()

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

  const config = await configRequest()
  const mappings = config.mappings || []
  const networkRouter = config.networkRouter || {}

  log.info('*** New Mappings: ', JSON.stringify(mappings))
  log.info('*** Current Config: ', JSON.stringify(Object.keys(currentConfig)))
  const toDelete = Object.keys(currentConfig).filter(key => !mappings.find(mapping => mapping === key))
  log.info('*** To Delete: ', JSON.stringify(toDelete))
  const toAdd = mappings.filter((key) => !currentConfig[key])
  log.info('*** To Add: ', JSON.stringify(toAdd))

  toDelete.forEach((mapping) => {
    if (currentConfig[mapping].stop) {
      log.info(`*** Closing connection for ${mapping}`)
      currentConfig[mapping].stop()
    }
    delete(currentConfig[mapping])
  })

  toAdd.forEach((mapping) => {
    log.info(`*** Creating ${mapping}`)
    currentConfig[mapping] = proxy(mapping, 'localhost', { routerHost: networkRouter.host, routerPort: networkRouter.port, saslEnabled: false })
  })
}

async function main() {
  await fetchConfig()

  ioFogClient.wsControlConnection({
    'onNewConfigSignal': async () => {
      await fetchConfig()
    },
    'onError': (error) => {
      throw new Error('There was an error with Control WebSocket connection to ioFog: ', error)
    }
  })
}

process.on('uncaughtException', (err) => {
  console.error((new Date).toUTCString() + ' Exception:', err.message)
  console.error(err.stack)
  process.exit(1)
})