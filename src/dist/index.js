require('./styles/main.scss')
var Elm = require('../elm/Main')
const config = require('../../keys')

var app = Elm.Main.embed(document.getElementById('HouseGallery'))

console.log(app)

// Initialize Firebase
var fbApp = firebase.initializeApp(config)
var database = fbApp.database()

app.ports.sendUser.subscribe(function (elmUserRecord) {
  console.log(elmUserRecord)
  const jsonParsedElmRecord = JSON.parse(elmUserRecord)
  const userToSave = {
    username: jsonParsedElmRecord.username,
    email: jsonParsedElmRecord.email,
    password: jsonParsedElmRecord.password,
    gallery: []
  }
  addName(userToSave)
    .then(function (fbResponse) {
      console.log('saved')
      app.ports.userSaved.send(fbResponse.key)
    }, function (error) {
      console.log('error: ' + error)
    })
})

function addName (nameToAdd) {
  var promise = database
    .ref('users')
    .push(nameToAdd)
  return promise
}
