const fbAuth = firebase.auth()

export function addUser (usersDataToSave) {
  return fbAuth.createUserWithEmailAndPassword(usersDataToSave.email, usersDataToSave.password)
    .catch(function (error) {
      var errorCode = error.code
      var errorMessage = error.message
      if (error) `Error Code: {errorCode} | Error Message: {errorMessage}`
    })
}

export function checkUser (userToCheck) {
  return fbAuth.signInWithEmailAndPassword(userToCheck.email, userToCheck.password)
    .catch(function (error) {
      var errorCode = error.code
      var errorMessage = error.message
      if (error) `Error Code: {errorCode} | Error Message: {errorMessage}`
    })
}
