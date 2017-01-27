const config = require('../../../keys')
var fbApp = firebase.initializeApp(config)
const fbAuth = firebase.auth()

const firebaseHelper = {
  addUser: function (usersDataToSave) {
    return fbAuth.createUserWithEmailAndPassword(usersDataToSave.email, usersDataToSave.password)
      .catch(function (error) {
        var errorCode = error.code
        var errorMessage = error.message
        if (error) `Error Code: {errorCode} | Error Message: {errorMessage}`
      })
  }, // end addUser()
  checkUser: function (userToCheck) {
    return fbAuth.signInWithEmailAndPassword(userToCheck.email, userToCheck.password)
      .catch(function (error) {
        var errorCode = error.code
        var errorMessage = error.message
        if (error) `Error Code: {errorCode} | Error Message: {errorMessage}`
      })
  } // end checkUser
}

module.exports = firebaseHelper
