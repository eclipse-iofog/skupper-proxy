const ioFogClient = require('@iofog/nodejs-sdk')
const proxy = require('../lib/proxy').proxy

const currentConfig = {}
ioFogClient.init('iofog', 54321, null, main)

async function fetchConfig() {
  const configRequest = () => new Promise((resolve, reject) => {
    ioFogClient.getConfig({
      'onBadRequest': reject,
      'onNewConfig': resolve
    })
  })

  try {
    const config = await configRequest()
    const mappings = config.mappings || []
    const networkRouter = config.networkRouter || {}

    const toDelete = Object.keys(currentConfig).filter((key) => !mappings[key])
    const toAdd = mappings.filter((key) => !currentConfig[key])

    toDelete.forEach((mapping) => {
      currentConfig[mapping].close()
      delete(currentConfig[mapping])
    })

    toAdd.forEach((mapping) => {
      currentConfig[mapping] = proxy(mapping, 'localhost', networkRouter.host, networkRouter.port, false)
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