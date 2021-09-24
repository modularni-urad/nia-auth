import fs from 'fs'
import assert from 'assert'
import chokidar from 'chokidar'
import path from 'path'
import _ from 'underscore'
import NIA from 'node-nia-connector'

assert.ok(fs.existsSync(process.env.CONF_FOLDER), 'env.CONF_FOLDER not exist!')

function createConnection (confPath, domain) {
  const audience = `https://${domain}/api/nia/login_assert` // TODO: env.var?
  return new NIA({
    audience,
    private_key: fs.readFileSync(path.join(confPath, 'private.key')).toString(),
    certificate: fs.readFileSync(path.join(confPath, 'certificate.crt')).toString(),
    assert_endpoint: audience
  })
}

const connections = {} 

export default {
  get: function (domain) {
    return connections[domain]
  },
  init: function () {
    const r = /\/(?<domain>[^\/]*)\/(?<file>.*)$/
    function _getInfo (filepath) {
      return filepath.substring(process.env.CONF_FOLDER.length).match(r).groups
    }
    
    chokidar.watch(`${process.env.CONF_FOLDER}/**/nia`)
      .on('addDir', (filepath, stats) => {
        const info = _getInfo(filepath)
        console.log(info)
        try {
          connections[info.domain] = createConnection(filepath, info.domain)
        } catch (err) {
          console.error(err)
        }
      })
      .on('unlinkDir', path => {
        const info = _getInfo(filepath)
        console.log(info)
        delete connections[info.domain]
      })

    // ch.on('change', (filepath, stats) => {
    //   console.log(filepath)
    //   //TODO: load new certs. Create separate watcher for dedicated files? 
    // })
  }
}