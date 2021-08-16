import morgan from 'morgan'
import express from 'express'

import initRoutes from './api/routes'

export default async function init (mocks = null) {
  const app = express()
  app.use(morgan('dev'))

  initRoutes(app, express)

  app.use((err, req, res, next) => {
    const status = err.status ||
      isNaN(Number(err.message)) ? 400 : Number(err.message)
    res.status(status).send(err.message || err.toString())
    if (process.env.NODE_ENV !== 'production') {
      console.log('---------------------------------------------------------')
      console.log(err)
      console.log('---------------------------------------------------------')
    }
  })

  return app
}