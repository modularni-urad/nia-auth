import NIA from 'node-nia-connector'
import { getToken, createUser, destroySessionCookie } from './session'

export default function (ctx, app) {
  const { auth, express } = ctx
  const bodyParser = express.urlencoded({ extended: true })

  app.get('/login', function (req, res, next) {
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

  app.post('/login_assert', bodyParser, async function (req, res, next) {
    try {
      const samlResponse = await req.NIAConnector.postAssert(req.body)
      const token = await getToken(createUser(samlResponse))
      const url = req.tenantcfg.nia.login_redirect_url.replace('{{TOKEN}}', token)
      res.redirect(url)
    } catch(err) {
      next(err)
    }
  })

  app.get('/logout', auth.session, auth.required, (req, res, next) => {
    const nameId = req.user.meta.NameID
    const sessionIndex = req.user.meta.SessionIndex
    req.NIAConnector.createLogoutRequestUrl(nameId, sessionIndex)
      .then(logoutUrl => {
        res.send(logoutUrl)
      })
      .catch(next)
  })

  app.post('/logout_assert', bodyParser, (req, res, next) => {
    try {
      const samlResponse = req.NIAConnector.logoutAssert(req.body)
      destroySessionCookie(res)
      res.redirect(req.tenantcfg.nia.redirect_url)
    } catch (err) {
      next(err)
    }
  })
}
