const express = require('express')
const cors = require('cors')
const bodyParser = require('body-parser')
const logger = require('morgan')

const app = express()
app.use(cors())

// PORT
var PORT = process.env.PORT || 3000

// Run Morgan for Logging
app.use(logger('dev'))
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended: true}))
app.use(bodyParser.text())
app.use(bodyParser.json({type: 'application/vnd.api+json'}))

// Routes
require('./routes/api-routes.js')(app)

// Listener
app.listen(PORT, function () {
  console.log('App listening on Port: ' + PORT)
})
