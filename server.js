// Include Server Dependencies
const express = require('express')
const bodyParser = require('body-parser')
const logger = require('morgan')

// Create Instance of Express
const app = express()
const PORT = process.env.PORT || 3000

// Run Morgan for Logging
app.use(logger('dev'))
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended: true}))
app.use(bodyParser.text())
app.use(bodyParser.json({type: 'application/vnd.api+json'}))

app.use(express.static('./App/Public'))

// Routes
// -------------------------------------------------

// require('./Controller/html-routes.js')(app)

// Listener
// -------------------------------------------------

app.listen(PORT, function () {
  console.log('App listening on PORT: ' + PORT)
})
