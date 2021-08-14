import fs from 'fs'
import assert from 'assert'
import chokidar from 'chokidar'
import NIA from 'node-nia-connector'

assert.ok(fs.existsSync(process.env.CONFIG_FOLDER), 'env.CONFIG_FOLDER not exist!')

const NIAConnector = new NIA({
  audience: process.env.AUDIENCE,
  private_key: fs.readFileSync(process.env.KEY_FILE).toString(),
  certificate: fs.readFileSync(process.env.CERT_FILE).toString(),
  assert_endpoint: process.env.ASSERT_ENDPOINT
})

import fs from 'fs'
import path from 'path'
import _ from 'underscore'

export default function doWatch(DATA_FOLDER) {

  const ch = chokidar.watch(CONFIG_FOLDER, {
    ignored: _.map(_.keys(SYSTEMFILES), i => `**/${i}`)
  })
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
    if (file.match('.*.scss$')) {
      console.log(filepath, 'changed, style rebuild')
      _runBuilders(STYLE, domain, DATA_FOLDER)
    } else if (file.indexOf('_service') !== 0) {
      _runBuilders(META, domain, DATA_FOLDER)
    }
  })
}