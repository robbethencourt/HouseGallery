/* global localStorage, firebase */
require('./styles/main.scss')
const Elm = require('../elm/Main')
const firebaseHelper = require('./utils/firebaseHelper')
const fbLoggedIn = localStorage.getItem('fbLoggedIn')
var app = Elm.Main.embed(document.getElementById('HouseGallery'), {fbLoggedIn: fbLoggedIn})
const request = require('superagent')
const config = require('../../keys').cloudinary

// get user if one is signed in to firebaseHelper
firebase.auth().onAuthStateChanged(function (user) {
  if (user) {
    app.ports.userLoggedIn.send(JSON.stringify({
      uid: user.uid,
      fbLoggedIn: 'True'
    }))
    getUserAndGallery(user.uid)
  }
})

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
      localStorage.setItem('fbLoggedIn', 'True')
      app.ports.userSaved.send(JSON.stringify({
        uid: fbResponse.uid,
        fbLoggedIn: 'True'
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
      localStorage.setItem('fbLoggedIn', 'True')
      app.ports.userLoggedIn.send(JSON.stringify({
        uid: fbResponse.uid,
        fbLoggedIn: 'True'
      }))
    }, function (error) {
      if (error) console.log('Error: {error}')
    })
})

// Logout
app.ports.logout.subscribe(function () {
  localStorage.clear()
  window.location.reload(true)
})

// Add ArtworkPage
app.ports.addArtworkToFb.subscribe(function (elmArtworkToAdd) {
  const jsonParsedElmArtworkRecord = JSON.parse(elmArtworkToAdd)
  const el = document.getElementById('cloudinary-input')
  const imageFile = el.files[0]
  let cloudinaryImageLink = new Promise(function (resolve, reject) {
    let upload = request.post(config.CLOUDINARY_UPLOAD_URL)
      .field('upload_preset', config.CLOUDINARY_UPLOAD_PRESET)
      .field('file', imageFile)

    upload.end(function (err, response) {
      if (err) { console.log(err) }
      if (response.body.secure_url !== '') {
        resolve(response.body.secure_url)
      }
    })
  })
  cloudinaryImageLink
    .then(function (imageLink) {
      const artworkFbObject = {
        artist: jsonParsedElmArtworkRecord.artist,
        title: jsonParsedElmArtworkRecord.title,
        medium: jsonParsedElmArtworkRecord.medium,
        year: jsonParsedElmArtworkRecord.year,
        price: jsonParsedElmArtworkRecord.price,
        artworkImageFile: imageLink,
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

              // clear out the elm gallery model before calling for the artwork again
              app.ports.clearGallery.send(null)
              getUserAndGallery(jsonParsedElmArtworkRecord.uid)
            }, function (errorInner) {
              if (errorInner) console.log(`Error: {errorInner}`)
              app.ports.artworkAdded.send('Error')
            })
        }, function (error) {
          if (error) console.log('Error: {error}')
          app.ports.artworkAdded.send('Error')
        })
    })
    .catch(function (error) {
      console.log(error)
    })
})

// cloudinary
app.ports.fetchImageFile.subscribe(function (id) {
  const el = document.getElementById(id)
  const imageFile = el.files[0]
  let reader = new FileReader()
  reader.readAsDataURL(imageFile)
  reader.onload = function (e) {
    console.log(e.target.result)
    app.ports.imageFileRead.send(e.target.result)
  }
})

// gallery
// call to firebase to get list of artwork for the user's gallery
function getUserAndGallery (uid) {
  firebaseHelper.getUsersGallery(uid)
    .then(function (fbGalleryResponse) {
      const fbGalleryObject = fbGalleryResponse.val()
      const arrayOfArtworkIds =
        Object.keys(fbGalleryObject)
          .map(key => fbGalleryObject[key])

      // array of db calls to pass to Promise.all and then pass to Elm
      const arrayOfArtworkObjects =
        arrayOfArtworkIds
          .map(artwork => {
            return firebaseHelper.getArtwork(artwork)
              .then(function (fbArtworkObjResponse) {
                return {
                  artworkId: artwork,
                  artworkObj: fbArtworkObjResponse.val()}
              })
          })
      Promise.all(arrayOfArtworkObjects).then(gallery => {
        gallery
          .forEach(artwork => {
            app.ports.usersGallery.send(JSON.stringify({
              artworkId: artwork.artworkId,
              artist: artwork.artworkObj.artist,
              title: artwork.artworkObj.title,
              year: artwork.artworkObj.year,
              artworkImageFile: artwork.artworkObj.artworkImageFile
            }))
          })
      })
    })
}

// artwork and artwork Edit
app.ports.getOneArtwork.subscribe(function (artworkId) {
  firebaseHelper.getArtwork(artworkId)
    .then(function (fbArtworkResponse) {
      const fbArtworkObj = fbArtworkResponse.val()
      console.log(fbArtworkObj)
      app.ports.artworkReceived.send(JSON.stringify({
        artworkId,
        artist: fbArtworkObj.artist,
        title: fbArtworkObj.title,
        medium: fbArtworkObj.medium,
        year: fbArtworkObj.year,
        price: fbArtworkObj.price,
        artworkImageFile: fbArtworkObj.artworkImageFile
      }))
    })
})

// send artwork to component
app.ports.submitEditedArtwork.subscribe(function (artworkToEdit) {
  const jsonParsedElmArtworkToEditRecord = JSON.parse(artworkToEdit)
  const artworkId = jsonParsedElmArtworkToEditRecord.artworkId
  const artworkFbObject = {
    artist: jsonParsedElmArtworkToEditRecord.artist,
    title: jsonParsedElmArtworkToEditRecord.title,
    medium: jsonParsedElmArtworkToEditRecord.medium,
    year: jsonParsedElmArtworkToEditRecord.year,
    price: jsonParsedElmArtworkToEditRecord.price,
    artworkImageFile: jsonParsedElmArtworkToEditRecord.artworkImage,
    uid: jsonParsedElmArtworkToEditRecord.uid
  }
  firebaseHelper.editArtwork(artworkId, artworkFbObject)
    .then(function (fbEditArtworkResponse) {
      // clear out the elm gallery model before calling for the artwork again
      app.ports.clearGallery.send(null)
      getUserAndGallery(artworkFbObject.uid)
    })
})
