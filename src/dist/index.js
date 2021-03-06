/* global localStorage, firebase, FileReader */
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

// Main
app.ports.fetchingUsers.subscribe(elmSearchInput => {
  firebaseHelper.fetchUser(elmSearchInput)
    .then(function (fbResponse) {
      if (fbResponse.val() === null) {
        const noUser = {
          displayName: '...searching',
          userId: ''
        }
        app.ports.noUserFetched.send(JSON.stringify(noUser))
      } else {
        app.ports.userFetched.send(JSON.stringify(fbResponse.val()))
      }
    })
})

app.ports.fetchingSearchUserGallery.subscribe(function (elmUserSearchId) {
  const jsonParsedElmUserSearchId = JSON.parse(elmUserSearchId)
  // this is the only place we pass 2 arguments as we're handling the default value to the second argument in the fun dec
  getUserAndGallery(jsonParsedElmUserSearchId.searchId, jsonParsedElmUserSearchId.userId)
})

// Signup
app.ports.saveUser.subscribe(function (elmUserRecord) {
  const jsonParsedElmRecord = JSON.parse(elmUserRecord)
  const userToSave = {
    displayName: jsonParsedElmRecord.username,
    email: jsonParsedElmRecord.email,
    password: jsonParsedElmRecord.password
  }

  firebaseHelper.addUser(userToSave)
    .then(function (fbResponse) {
      firebaseHelper.updateUser(userToSave.displayName)
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
        dimensions: jsonParsedElmArtworkRecord.dimensions,
        price: jsonParsedElmArtworkRecord.price,
        artworkImageFile: imageLink,
        createdOn: Date.now(),
        uid: jsonParsedElmArtworkRecord.uid
      }
      firebaseHelper.addArtwork(artworkFbObject)
        .then(function (fbResponse) {
          const uidAndArtworkId = {
            uid: artworkFbObject.uid,
            artworkId: fbResponse.path.o[1]
          }
          firebaseHelper.addArtworkToUserGallery(uidAndArtworkId)
            .then(function (fbResponseFromUserGallery) {
              app.ports.artworkAdded.send('all items added')

              // clear out the elm gallery model before calling for the artwork again
              const clearGalleryIds = {
                userId: uidAndArtworkId.uid,
                searchId: ''
              }
              app.ports.clearGallery.send(JSON.stringify(clearGalleryIds))
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
// AddArtwork module
app.ports.fetchImageFile.subscribe(function (id) {
  const el = document.getElementById(id)
  const imageFile = el.files[0]
  let reader = new FileReader()
  reader.readAsDataURL(imageFile)
  reader.onload = function (e) {
    app.ports.imageFileRead.send(e.target.result)
  }
})

// Artwork module
app.ports.fetchImageFileEdit.subscribe(function (id) {
  const el = document.getElementById(id)
  const imageFile = el.files[0]
  let reader = new FileReader()
  reader.readAsDataURL(imageFile)
  reader.onload = function (e) {
    app.ports.imageFileReadEdit.send(e.target.result)
  }
})

// gallery
// call to firebase to get list of artwork for the user's gallery
// only when the two arguments match is the user viewing their own gallery. Otherwise a second argument will be sent from elm and the defaul will not be needed. this way we can check the two and determine if to display editing capabilities for each artwork being displayed
function getUserAndGallery (uid, searchId = uid) {
  const clearGalleryIds = {
    userId: uid,
    searchId: searchId
  }
  app.ports.clearGallery.send(JSON.stringify(clearGalleryIds))
  firebaseHelper.getUsersGallery(uid)
    .then(function (fbGalleryResponse) {
      const fbGalleryObject = fbGalleryResponse.val()

      // sending a fake gallery item back to elm. Needs to be a better way to hanlde this, but for now...
      if (fbGalleryObject === undefined || fbGalleryObject === null) {
        app.ports.usersGallery.send(JSON.stringify({
          artworkId: '0',
          artist: '0',
          title: '0',
          medium: '0',
          year: '0',
          dimensions: '0',
          price: '0',
          artworkImageFile: '0',
          userId: '0',
          searchId: '0'
        }))
      } else {
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
                  artworkObj: fbArtworkObjResponse.val()
                }
              })
          })
        Promise.all(arrayOfArtworkObjects).then(gallery => {
          gallery
            .forEach(artwork => {
              app.ports.usersGallery.send(JSON.stringify({
                artworkId: artwork.artworkId,
                artist: artwork.artworkObj.artist,
                title: artwork.artworkObj.title,
                medium: artwork.artworkObj.medium,
                year: artwork.artworkObj.year,
                dimensions: artwork.artworkObj.dimensions,
                price: artwork.artworkObj.price,
                artworkImageFile: artwork.artworkObj.artworkImageFile,
                userId: clearGalleryIds.userId,
                searchId: clearGalleryIds.searchId
              }))
            })
        })
      }
    })
}

// artwork and artwork Edit
app.ports.getOneArtwork.subscribe(function (artworkId) {
  // Artwork module
  app.ports.fetchingArtwork.send('fetching')
  firebaseHelper.getArtwork(artworkId)
    .then(function (fbArtworkResponse) {
      const fbArtworkObj = fbArtworkResponse.val()
      app.ports.artworkReceived.send(JSON.stringify({
        artworkId,
        artist: fbArtworkObj.artist,
        title: fbArtworkObj.title,
        medium: fbArtworkObj.medium,
        year: fbArtworkObj.year,
        dimensions: fbArtworkObj.dimensions,
        price: fbArtworkObj.price,
        artworkImageFile: fbArtworkObj.artworkImageFile,
        oldArtworkImageFile: ''
      }))
    })
})

// send artwork to component
app.ports.submitEditedArtwork.subscribe(function (artworkToEdit) {
  const jsonParsedElmArtworkToEditRecord = JSON.parse(artworkToEdit)
  console.log(jsonParsedElmArtworkToEditRecord)

  // console.log(jsonParsedElmArtworkToEditRecord.oldArtworkImageFile)
  //
  // const compose = (f, g) => x => f(g(x))
  //
  // // grab the image file
  // // slice the string at the public_id and grab the second array
  // const cloudinaryUploadLink = jsonParsedElmArtworkToEditRecord.oldArtworkImageFile
  // const createArrayFromUploadLink = function (link) {
  //   return link.split('/')
  // }
  // const getCloudinaryPublicId = function (uploadArray) {
  //   return uploadArray[uploadArray.length - 1].split('.')[0]
  // }
  //
  // const imageToDeletePublicId = compose(getCloudinaryPublicId, createArrayFromUploadLink)(cloudinaryUploadLink)
  // console.log(imageToDeletePublicId)
  //
  // // delete the other artwork image file from cloudinary
  // let cloudinaryDestroy = request.post(config.CLOUDINARY_DESTROY_URL)
  //   .field('public_id', imageToDeletePublicId)
  //   .field('api_key', config.apiKey)
  //   // .field('timestamp', Date.now())
  //   // missing the signature. How am i going to create one?
  //
  // cloudinaryDestroy.end(function (err, response) {
  //   if (err) { console.log(err) }
  //   console.log(response)
  // })

  const el = document.getElementById('cloudinary-input')
  const imageFile = el.files[0]

  if (imageFile !== undefined) {
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
        const artworkId = jsonParsedElmArtworkToEditRecord.artworkId
        const artworkFbObject = {
          artist: jsonParsedElmArtworkToEditRecord.artist,
          title: jsonParsedElmArtworkToEditRecord.title,
          medium: jsonParsedElmArtworkToEditRecord.medium,
          year: jsonParsedElmArtworkToEditRecord.year,
          dimensions: jsonParsedElmArtworkToEditRecord.dimensions,
          price: jsonParsedElmArtworkToEditRecord.price,
          artworkImageFile: imageLink,
          uid: jsonParsedElmArtworkToEditRecord.uid
        }
        firebaseHelper.editArtwork(artworkId, artworkFbObject)
          .then(function (fbEditArtworkResponse) {
            // clear out the elm gallery model before calling for the artwork again
            const clearGalleryIds = {
              userId: jsonParsedElmArtworkToEditRecord.uid,
              searchId: ''
            }
            app.ports.clearGallery.send(JSON.stringify(clearGalleryIds))
            getUserAndGallery(artworkFbObject.uid)
          })
      })
  } else {
    const artworkId = jsonParsedElmArtworkToEditRecord.artworkId
    const artworkFbObject = {
      artist: jsonParsedElmArtworkToEditRecord.artist,
      title: jsonParsedElmArtworkToEditRecord.title,
      medium: jsonParsedElmArtworkToEditRecord.medium,
      year: jsonParsedElmArtworkToEditRecord.year,
      dimensions: jsonParsedElmArtworkToEditRecord.dimensions,
      price: jsonParsedElmArtworkToEditRecord.price,
      artworkImageFile: jsonParsedElmArtworkToEditRecord.artworkImage,
      uid: jsonParsedElmArtworkToEditRecord.uid
    }
    firebaseHelper.editArtwork(artworkId, artworkFbObject)
      .then(function (fbEditArtworkResponse) {
        // clear out the elm gallery model before calling for the artwork again
        const clearGalleryIds = {
          userId: jsonParsedElmArtworkToEditRecord.uid,
          searchId: ''
        }
        app.ports.clearGallery.send(JSON.stringify(clearGalleryIds))
        getUserAndGallery(artworkFbObject.uid)
      })
  }
})

app.ports.deleteArtwork.subscribe(function (elmArtworkId) {
  const user = firebase.auth().currentUser
  firebaseHelper.deleteArtworkFromFb(elmArtworkId)
    .then(function () {
      firebaseHelper.deleteArtworkFromUserGallery(user.uid, elmArtworkId)
        .then(function (response) {
          // this is where it returns to elm
          app.ports.artworkDeleted.send('artwork deleted from both')
          const clearGalleryIds = {
            userId: user.uid,
            searchId: ''
          }
          app.ports.clearGallery.send(JSON.stringify(clearGalleryIds))
          getUserAndGallery(user.uid)
        })
        .catch(function (error) {
          console.log(`Removing artwork from userGallery failed: ${error}`)
        })
    })
    .catch(function (error) {
      console.log(`Removing artwork from firebase failed: ${error}`)
    })
})

// arjs
app.ports.sendArtworkToArjs.subscribe(imageUrl => {
  console.log(imageUrl)
  // create aFrame elements
  const htmlBody = document.getElementsByTagName('body')[0]
  const arjsContent = document.createElement('arjs-content')
  const arScene = document.createElement('a-scene')
  const aImage = document.createElement('a-image')
  const aMarker = document.createElement('a-marker-camera')

  // set attributes for a-scene
  arScene.setAttribute('embedded', 'true')
  arScene.setAttribute('artoolkit', 'sourceType: webcam;')

  // set attributes on a-image
  aImage.setAttribute('src', imageUrl)
  aImage.setAttribute('width', '2')
  aImage.setAttribute('height', '2')
  aImage.setAttribute('position', {x: 0, y: 5, z: 0})
  aImage.setAttribute('scale', '1 1 1')
  aImage.setAttribute('rotation', '90 -90 90')

  // set attributes on a-marker-camera
  aMarker.setAttribute('a-marker-camera', 'hiro')

  // append the elements to the scene and then to the arjs-content div in index.html
  arScene.appendChild(aImage)
  arScene.appendChild(aMarker)
  arjsContent.appendChild(arScene)
  htmlBody.appendChild(arjsContent)
})
