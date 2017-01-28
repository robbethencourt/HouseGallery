require('./styles/main.scss')
const Elm = require('../elm/Main')
const firebaseHelper = require('./utils/firebaseHelper')
const token = localStorage.getItem('token')
var app = Elm.Main.embed(document.getElementById('HouseGallery'), {token: token})

// Subscriptions from Elm

// Signup
app.ports.saveUser.subscribe(function (elmUserRecord) {
  const jsonParsedElmRecord = JSON.parse(elmUserRecord)
  const userToSave = {
    username: jsonParsedElmRecord.username,
    email: jsonParsedElmRecord.email,
    password: jsonParsedElmRecord.password
  }

  firebaseHelper.addUser(userToSave)
    .then(function (fbResponse) {
      console.log(fbResponse)
      localStorage.setItem('token', fbResponse.refreshToken)
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

  firebaseHelper.checkUser(userToCheck)
    .then(function (fbResponse) {
      console.log(fbResponse)
      localStorage.setItem('token', fbResponse.refreshToken)
      app.ports.userLoggedIn.send(fbResponse.uid)
    }, function (error) {
      if (error) console.log('Error: {error}')
    })
})
