import NIA from 'node-nia-connector'
import NIAConnMan from './nia_conn_man'

export default function (app, express) {
  app.use(express.urlencoded({ extended: true }))
  NIAConnMan.init()

  app.get('/login', _loadConfig, function (req, res, next) {
    const opts = {
      attrs: [
        { name: NIA.PROFILEATTRS.PERSON_IDENTIFIER, required: true },
        { name: NIA.PROFILEATTRS.GIVEN_NAME, required: true },
        { name: NIA.PROFILEATTRS.FAMILY_NAME, required: false },
        { name: NIA.PROFILEATTRS.CURRENT_ADDRESS, required: true },
        { name: NIA.PROFILEATTRS.CZMORIS_TR_ADRESA_ID, required: true },
        { name: NIA.PROFILEATTRS.DATE_OF_BIRTH, required: true },
        { name: NIA.PROFILEATTRS.EMAIL, required: false },
        { name: NIA.PROFILEATTRS.CZMORIS_PHONE_NUMBER, required: true },
        { name: NIA.PROFILEATTRS.CZMORIS_ID_TYPE, required: true },
        { name: NIA.PROFILEATTRS.CZMORIS_ID_NUMBER, required: true }
      ],
      level: NIA.LOA.SUBSTANTIAL
    }

    req.NIAConnector.createAuthRequestUrl(opts).then(loginUrl => {
      res.redirect(loginUrl)
    }).catch(next)
  })

  app.post('/LoginAssert', _loadConfig, function (req, res, next) {
    req.NIAConnector.postAssert(req.body).then(samlResponse => {
      req.session.user = samlResponse
      res.redirect(process.env.AFTERLOGIN_URL)
    }).catch(next)
  })

  app.get('/logout', _loadConfig, (req, res, next) => {
    const nameId = req.user.NameID
    const sessionIndex = req.user.SessionIndex
    req.NIAConnector.createLogoutRequestUrl(nameId, sessionIndex)
      .then(logoutUrl => { res.redirect(logoutUrl) })
      .catch(next)
  })

  app.post('/LogoutAssert', _loadConfig, (req, res, next) => {
    try {
      const samlResponse = req.NIAConnector.logoutAssert(req.body)
      res.json(samlResponse)
    } catch (err) {
      next(err)
    }
  })

  function _loadConfig (req, res, next) {
    req.NIAConnector = NIAConnMan.get(req.hostname)
    console.log('nia-auth: domain: ', req.hostname)
    return req.NIAConnector ? next() : next(404)
  }
}
