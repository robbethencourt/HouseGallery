require('./styles/main.scss')
var Elm = require('../elm/Main')
const config = require('../../keys')

var app = Elm.Main.embed(document.getElementById('HouseGallery'))

console.log(app)

// Initialize Firebase
var fbApp = firebase.initializeApp(config)
var database = fbApp.database()
console.log(database)

app.ports.sendUser.subscribe(function (elmUserRecord) {
  console.log(elmUserRecord)
  const jsonParsedElmRecord = JSON.parse(elmUserRecord)
  const userToSave = {
    username: jsonParsedElmRecord.username,
    email: jsonParsedElmRecord.email,
    password: jsonParsedElmRecord.password,
    gallery: []
  }
  addUser(userToSave)
    .then(function (fbResponse) {
      console.log('saved')
      app.ports.userSaved.send(fbResponse.key)
    }, function (error) {
      console.log('error: ' + error)
    })
})

function addUser (userToAdd) {
  var promise = database
    .ref('users')
    .push(userToAdd)
  return promise
}
