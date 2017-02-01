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
      app.ports.userSaved.send(JSON.stringify({
        uid: fbResponse.uid,
        token: fbResponse.refreshToken
      }))
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
      app.ports.userLoggedIn.send(JSON.stringify({
        uid: fbResponse.uid,
        token: fbResponse.refreshToken
      }))
    }, function (error) {
      if (error) console.log('Error: {error}')
    })
})

// Logout
app.ports.logout.subscribe(function () {
  localStorage.clear()
})

// Add ArtworkPage
app.ports.addArtworkToFb.subscribe(function (elmArtworkToAdd) {
  const jsonParsedElmArtworkRecord = JSON.parse(elmArtworkToAdd)
  const artworkFbObject = {
    artist: jsonParsedElmArtworkRecord.artist,
    title: jsonParsedElmArtworkRecord.title,
    medium: jsonParsedElmArtworkRecord.medium,
    year: jsonParsedElmArtworkRecord.year,
    price: jsonParsedElmArtworkRecord.price,
    artworkImageFile: jsonParsedElmArtworkRecord.artworkImage,
    createdOn: Date.now(),
    uid: jsonParsedElmArtworkRecord.uid
  }
  firebaseHelper.addArtwork(artworkFbObject)
    .then(function (fbResponse) {
      console.log(fbResponse)
      const uidAndArtworkId = {
        uid: artworkFbObject.uid,
        artworkId: fbResponse.path.o[1]
      }
      firebaseHelper.addArtworkToUserGallery(uidAndArtworkId)
        .then(function (fbResponseFromUserGallery) {
          console.log(fbResponseFromUserGallery)
          app.ports.artworkAdded.send('all items added')
        }, function (errorInner) {
          if (errorInner) console.log(`Error: {errorInner}`)
          app.ports.artworkAdded.send('Error')
        })
    }, function (error) {
      if (error) console.log('Error: {error}')
      app.ports.artworkAdded.send('Error')
    })
})
