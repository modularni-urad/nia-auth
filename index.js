import NIA from 'node-nia-connector'
import initRoutes from './api/routes'

export default async function init (ctx) {
  const { express, ErrorClass } = ctx
  const api = express()

  function loadConfig (req, res, next) {
    const url = process.env.AUDIENCE_URL.replace('{{TENANTID}}', req.tenantid)
    const audience = `${url}/login_assert`
    req.NIAConnector = req.tenantcfg
      && req.tenantcfg.nia.private_key
      && req.tenantcfg.nia.certificate 
      && new NIA({
        audience,
        private_key: req.tenantcfg.nia.private_key,
        certificate: req.tenantcfg.nia.certificate,
        assert_endpoint: audience
      }, req.tenantcfg.nia.debug)
    return req.NIAConnector ? next() : next(new ErrorClass(404, 'unknown tenant'))
  }

  api.use(loadConfig)
  initRoutes(ctx, api)
  return api
}