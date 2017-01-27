require('./styles/main.scss')
import Elm from '../elm/Main'
const config = require('../../keys')
import { addUser, checkUser } from './utils/firebaseHelper'
var app = Elm.Main.embed(document.getElementById('HouseGallery'))

console.log(app)

// Initialize Firebase
var fbApp = firebase.initializeApp(config)
var database = fbApp.database()

// Subscriptions from Elm

// Signup
app.ports.saveUser.subscribe(function (elmUserRecord) {
  const jsonParsedElmRecord = JSON.parse(elmUserRecord)
  const userToSave = {
    username: jsonParsedElmRecord.username,
    email: jsonParsedElmRecord.email,
    password: jsonParsedElmRecord.password
  }

  addUser(userToSave)
    .then(function (fbResponse) {
      console.log(fbResponse)
      app.ports.userSaved.send(fbResponse.uid)
    }, function (error) {
      if (error) console.log('Error: {error}')
    })
})

// Login
app.ports.fetchingUser.subscribe(function (elmLoginRecord) {
  const jsonParsedElmLoginRecord = JSON.parse(elmLoginRecord)
  const userToCheck = {
    email: jsonParsedElmLoginRecord.email,
    password: jsonParsedElmLoginRecord.password
  }

  checkUser(userToCheck)
    .then(function (fbResponse) {
      console.log(fbResponse)
      app.ports.userLoggedIn.send(fbResponse.uid)
    }, function (error) {
      if (error) console.log('Error: {error}')
    })
})
