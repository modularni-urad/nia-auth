import fs from 'fs'
import assert from 'assert'
import chokidar from 'chokidar'
import path from 'path'
import _ from 'underscore'
import NIA from 'node-nia-connector'

assert.ok(fs.existsSync(process.env.CONFIG_FOLDER), 'env.CONFIG_FOLDER not exist!')
const PUBLIC_ADDR = process.env.PUBLIC_ADDR

function createConnection (confPath) {
  return new NIA({
    audience: PUBLIC_ADDR,
    private_key: fs.readFileSync(path.join(confPath, 'private.key')).toString(),
    certificate: fs.readFileSync(path.join(confPath, 'certificate.key')).toString(),
    assert_endpoint: `${PUBLIC_ADDR}/LoginAssert`
  })
}

const connections = {}
const _watchGlob = `${DATA_FOLDER}/**/nia`

export default {
  get: function (domain) {
    return connections[domain]
  },
  init: function (DATA_FOLDER) {

    const ch = chokidar.watch(_watchGlob)
    const r = /\/(?<domain>[^\/]*)\/(?<file>.*)$/
    function _getInfo (filepath) {
      return filepath.substring(DATA_FOLDER.length).match(r).groups
    }
    
    ch.on('add', async (filepath, stats) => {
      const { domain, file } = _getInfo(filepath)
      if (file.indexOf('_service') !== 0) {
        _runBuilders(_.omit(SYSTEMFILES, '_service/style.css'), domain, DATA_FOLDER)
      }
    })

    ch.on('change', async (filepath, stats) => {
      const { domain, file } = _getInfo(filepath)
    })
  }
}