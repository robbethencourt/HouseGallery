/* global firebase */
const config = require('../../../keys').firebase
var fbApp = firebase.initializeApp(config)
const fbAuth = firebase.auth()
const database = fbApp.database()

const firebaseHelper = {
  fetchUser: function (userToFetch) {
    return database.ref('/userDisplayNames/' + userToFetch.toLowerCase()).once('value')
  },
  addUser: function (usersDataToSave) {
    return fbAuth.createUserWithEmailAndPassword(usersDataToSave.email, usersDataToSave.password)
      .catch(function (error) {
        var errorCode = error.code
        var errorMessage = error.message
        if (error) `Error Code: ${errorCode} | Error Message: ${errorMessage}`
      })
  }, // end addUser()
  updateUser: function (displayNameToSave) {
    var user = firebase.auth().currentUser
    user.updateProfile({
      displayName: displayNameToSave
    })
      .then(function () {
        fbApp.database()
          .ref('userDisplayNames/' + displayNameToSave.toLowerCase())
          .set({
            displayName: displayNameToSave,
            userId: user.uid
          })
      }, function (error) {
        console.log(`woops, display name not saved: ${error}`)
      })
  }, // end updateUser()
  checkUser: function (userToCheck) {
    return fbAuth.signInWithEmailAndPassword(userToCheck.email, userToCheck.password)
      .catch(function (error) {
        var errorCode = error.code
        var errorMessage = error.message
        if (error) `Error Code: ${errorCode} | Error Message: ${errorMessage}`
      })
  }, // end checkUser
  addArtwork: function (artworkToAdd) {
    return fbApp.database()
      .ref('artwork')
      .push(artworkToAdd)
  }, // end addArtwork()
  addArtworkToUserGallery: function (uidAndArtworkId) {
    return fbApp.database()
      .ref('userGalleries')
      .child(uidAndArtworkId.uid)
      .push(uidAndArtworkId.artworkId)
  }, // end addArtworkToUserGallery()
  getUsersGallery: function (uidToQuery) {
    return database.ref('/userGalleries/' + uidToQuery).once('value')
  }, // end getUsersGallery()
  getArtwork: function (artworkToQuery) {
    return database.ref('/artwork/' + artworkToQuery).once('value')
  }, // end getArtwork()
  editArtwork: function (artworkId, artworkToEdit) {
    return database.ref('/artwork/' + artworkId).update(artworkToEdit)
  }, // end editArtwork()
  deleteArtworkFromFb: function (artworkId) {
    return database.ref('/artwork/' + artworkId).remove()
  }, // deleteArtworkFromFb()
  deleteArtworkFromUserGallery: function (userId, artworkId) {
    return database.ref('/userGalleries/' + userId)
      .once('value', function (snapshot) {
        const fbSnapshot = snapshot.val()
        const artworkIdToDelete =
        Object.keys(fbSnapshot)
          .filter(function (arrayOfKeys) {
            console.log(arrayOfKeys)
            console.log(artworkId)
            return fbSnapshot[arrayOfKeys] === artworkId
          })
        return database.ref('/userGalleries/' + userId + '/' + artworkIdToDelete[0]).remove()
      })
  } // end deleteArtworkFromUserGallery()
}

module.exports = firebaseHelper
