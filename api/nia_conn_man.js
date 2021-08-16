import fs from 'fs'
import assert from 'assert'
import chokidar from 'chokidar'
import path from 'path'
import _ from 'underscore'
import NIA from 'node-nia-connector'

assert.ok(fs.existsSync(process.env.CONFIG_FOLDER), 'env.CONFIG_FOLDER not exist!')
const PUBLIC_ADDR = process.env.PUBLIC_ADDR

function createConnection (confPath, domain) {
  const audience = `https://${domain}/LoginAssert`
  return new NIA({
    audience,
    private_key: fs.readFileSync(path.join(confPath, 'private.key')).toString(),
    certificate: fs.readFileSync(path.join(confPath, 'certificate.crt')).toString(),
    assert_endpoint: audience
  })
}

const connections = {}
const _watchGlob = `${process.env.CONFIG_FOLDER}/**/nia`

export default {
  get: function (domain) {
    return connections[domain]
  },
  init: function () {
    const ch = chokidar.watch(_watchGlob)
    const r = /\/(?<domain>[^\/]*)\/(?<file>.*)$/
    function _getInfo (filepath) {
      return filepath.substring(process.env.CONFIG_FOLDER.length).match(r).groups
    }
    
    ch.on('addDir', (filepath, stats) => {
      const info = _getInfo(filepath)
      console.log(info)
      try {
        connections[info.domain] = createConnection(filepath, info.domain)
      } catch (err) {
        console.error(err)
      }
    })
    ch.on('unlinkDir', path => {
      const info = _getInfo(filepath)
      console.log(info)
      delete connections[info.domain]
    })

    ch.on('change', (filepath, stats) => {
      console.log(filepath)
      //TODO: load new certs. Create separate watcher for dedicated files? 
    })
  }
}