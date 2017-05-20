/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;
/******/
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	/* global localStorage, firebase, FileReader */
	__webpack_require__(5)
	const Elm = __webpack_require__(4)
	const firebaseHelper = __webpack_require__(12)
	const fbLoggedIn = localStorage.getItem('fbLoggedIn')
	var app = Elm.Main.embed(document.getElementById('HouseGallery'), {fbLoggedIn: fbLoggedIn})
	const request = __webpack_require__(6)
	const config = __webpack_require__(2).cloudinary
	
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
	      console.log(fbResponse.val())
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
	  console.log(jsonParsedElmUserSearchId)
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
	      console.log(fbResponse)
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
	        dimensions: jsonParsedElmArtworkRecord.dimensions,
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
	    console.log(e.target.result)
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
	
	  console.log(imageFile)
	
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
	    console.log(artworkFbObject)
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
	        .then(function () {
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


/***/ },
/* 1 */
/***/ function(module, exports) {

	/**
	 * Check if `obj` is an object.
	 *
	 * @param {Object} obj
	 * @return {Boolean}
	 * @api private
	 */
	
	function isObject(obj) {
	  return null !== obj && 'object' === typeof obj;
	}
	
	module.exports = isObject;


/***/ },
/* 2 */
/***/ function(module, exports) {

	var config = {
	  firebase: {
	    apiKey: 'AIzaSyBGFxhQshQLd11q5wg20ZO0DRLesxzZ5fI',
	    authDomain: 'house-gallery.firebaseapp.com',
	    databaseURL: 'https://house-gallery.firebaseio.com',
	    storageBucket: 'house-gallery.appspot.com',
	    messagingSenderId: '274896176475'
	  },
	  cloudinary: {
	    CLOUDINARY_UPLOAD_PRESET: 'HouseGallery',
	    CLOUDINARY_UPLOAD_URL: 'https://api.cloudinary.com/v1_1/du9exzlar/upload',
	    CLOUDINARY_DESTROY_URL: 'https://api.cloudinary.com/v1_1/du9exzlar/image/destroy'
	  }
	}
	
	module.exports = config


/***/ },
/* 3 */
/***/ function(module, exports, __webpack_require__) {

	
	/**
	 * Expose `Emitter`.
	 */
	
	if (true) {
	  module.exports = Emitter;
	}
	
	/**
	 * Initialize a new `Emitter`.
	 *
	 * @api public
	 */
	
	function Emitter(obj) {
	  if (obj) return mixin(obj);
	};
	
	/**
	 * Mixin the emitter properties.
	 *
	 * @param {Object} obj
	 * @return {Object}
	 * @api private
	 */
	
	function mixin(obj) {
	  for (var key in Emitter.prototype) {
	    obj[key] = Emitter.prototype[key];
	  }
	  return obj;
	}
	
	/**
	 * Listen on the given `event` with `fn`.
	 *
	 * @param {String} event
	 * @param {Function} fn
	 * @return {Emitter}
	 * @api public
	 */
	
	Emitter.prototype.on =
	Emitter.prototype.addEventListener = function(event, fn){
	  this._callbacks = this._callbacks || {};
	  (this._callbacks['$' + event] = this._callbacks['$' + event] || [])
	    .push(fn);
	  return this;
	};
	
	/**
	 * Adds an `event` listener that will be invoked a single
	 * time then automatically removed.
	 *
	 * @param {String} event
	 * @param {Function} fn
	 * @return {Emitter}
	 * @api public
	 */
	
	Emitter.prototype.once = function(event, fn){
	  function on() {
	    this.off(event, on);
	    fn.apply(this, arguments);
	  }
	
	  on.fn = fn;
	  this.on(event, on);
	  return this;
	};
	
	/**
	 * Remove the given callback for `event` or all
	 * registered callbacks.
	 *
	 * @param {String} event
	 * @param {Function} fn
	 * @return {Emitter}
	 * @api public
	 */
	
	Emitter.prototype.off =
	Emitter.prototype.removeListener =
	Emitter.prototype.removeAllListeners =
	Emitter.prototype.removeEventListener = function(event, fn){
	  this._callbacks = this._callbacks || {};
	
	  // all
	  if (0 == arguments.length) {
	    this._callbacks = {};
	    return this;
	  }
	
	  // specific event
	  var callbacks = this._callbacks['$' + event];
	  if (!callbacks) return this;
	
	  // remove all handlers
	  if (1 == arguments.length) {
	    delete this._callbacks['$' + event];
	    return this;
	  }
	
	  // remove specific handler
	  var cb;
	  for (var i = 0; i < callbacks.length; i++) {
	    cb = callbacks[i];
	    if (cb === fn || cb.fn === fn) {
	      callbacks.splice(i, 1);
	      break;
	    }
	  }
	  return this;
	};
	
	/**
	 * Emit `event` with the given args.
	 *
	 * @param {String} event
	 * @param {Mixed} ...
	 * @return {Emitter}
	 */
	
	Emitter.prototype.emit = function(event){
	  this._callbacks = this._callbacks || {};
	  var args = [].slice.call(arguments, 1)
	    , callbacks = this._callbacks['$' + event];
	
	  if (callbacks) {
	    callbacks = callbacks.slice(0);
	    for (var i = 0, len = callbacks.length; i < len; ++i) {
	      callbacks[i].apply(this, args);
	    }
	  }
	
	  return this;
	};
	
	/**
	 * Return array of callbacks for `event`.
	 *
	 * @param {String} event
	 * @return {Array}
	 * @api public
	 */
	
	Emitter.prototype.listeners = function(event){
	  this._callbacks = this._callbacks || {};
	  return this._callbacks['$' + event] || [];
	};
	
	/**
	 * Check if this emitter has `event` handlers.
	 *
	 * @param {String} event
	 * @return {Boolean}
	 * @api public
	 */
	
	Emitter.prototype.hasListeners = function(event){
	  return !! this.listeners(event).length;
	};


/***/ },
/* 4 */
/***/ function(module, exports) {

	
	(function() {
	'use strict';
	
	function F2(fun)
	{
	  function wrapper(a) { return function(b) { return fun(a,b); }; }
	  wrapper.arity = 2;
	  wrapper.func = fun;
	  return wrapper;
	}
	
	function F3(fun)
	{
	  function wrapper(a) {
	    return function(b) { return function(c) { return fun(a, b, c); }; };
	  }
	  wrapper.arity = 3;
	  wrapper.func = fun;
	  return wrapper;
	}
	
	function F4(fun)
	{
	  function wrapper(a) { return function(b) { return function(c) {
	    return function(d) { return fun(a, b, c, d); }; }; };
	  }
	  wrapper.arity = 4;
	  wrapper.func = fun;
	  return wrapper;
	}
	
	function F5(fun)
	{
	  function wrapper(a) { return function(b) { return function(c) {
	    return function(d) { return function(e) { return fun(a, b, c, d, e); }; }; }; };
	  }
	  wrapper.arity = 5;
	  wrapper.func = fun;
	  return wrapper;
	}
	
	function F6(fun)
	{
	  function wrapper(a) { return function(b) { return function(c) {
	    return function(d) { return function(e) { return function(f) {
	    return fun(a, b, c, d, e, f); }; }; }; }; };
	  }
	  wrapper.arity = 6;
	  wrapper.func = fun;
	  return wrapper;
	}
	
	function F7(fun)
	{
	  function wrapper(a) { return function(b) { return function(c) {
	    return function(d) { return function(e) { return function(f) {
	    return function(g) { return fun(a, b, c, d, e, f, g); }; }; }; }; }; };
	  }
	  wrapper.arity = 7;
	  wrapper.func = fun;
	  return wrapper;
	}
	
	function F8(fun)
	{
	  function wrapper(a) { return function(b) { return function(c) {
	    return function(d) { return function(e) { return function(f) {
	    return function(g) { return function(h) {
	    return fun(a, b, c, d, e, f, g, h); }; }; }; }; }; }; };
	  }
	  wrapper.arity = 8;
	  wrapper.func = fun;
	  return wrapper;
	}
	
	function F9(fun)
	{
	  function wrapper(a) { return function(b) { return function(c) {
	    return function(d) { return function(e) { return function(f) {
	    return function(g) { return function(h) { return function(i) {
	    return fun(a, b, c, d, e, f, g, h, i); }; }; }; }; }; }; }; };
	  }
	  wrapper.arity = 9;
	  wrapper.func = fun;
	  return wrapper;
	}
	
	function A2(fun, a, b)
	{
	  return fun.arity === 2
	    ? fun.func(a, b)
	    : fun(a)(b);
	}
	function A3(fun, a, b, c)
	{
	  return fun.arity === 3
	    ? fun.func(a, b, c)
	    : fun(a)(b)(c);
	}
	function A4(fun, a, b, c, d)
	{
	  return fun.arity === 4
	    ? fun.func(a, b, c, d)
	    : fun(a)(b)(c)(d);
	}
	function A5(fun, a, b, c, d, e)
	{
	  return fun.arity === 5
	    ? fun.func(a, b, c, d, e)
	    : fun(a)(b)(c)(d)(e);
	}
	function A6(fun, a, b, c, d, e, f)
	{
	  return fun.arity === 6
	    ? fun.func(a, b, c, d, e, f)
	    : fun(a)(b)(c)(d)(e)(f);
	}
	function A7(fun, a, b, c, d, e, f, g)
	{
	  return fun.arity === 7
	    ? fun.func(a, b, c, d, e, f, g)
	    : fun(a)(b)(c)(d)(e)(f)(g);
	}
	function A8(fun, a, b, c, d, e, f, g, h)
	{
	  return fun.arity === 8
	    ? fun.func(a, b, c, d, e, f, g, h)
	    : fun(a)(b)(c)(d)(e)(f)(g)(h);
	}
	function A9(fun, a, b, c, d, e, f, g, h, i)
	{
	  return fun.arity === 9
	    ? fun.func(a, b, c, d, e, f, g, h, i)
	    : fun(a)(b)(c)(d)(e)(f)(g)(h)(i);
	}
	
	//import Native.List //
	
	var _elm_lang$core$Native_Array = function() {
	
	// A RRB-Tree has two distinct data types.
	// Leaf -> "height"  is always 0
	//         "table"   is an array of elements
	// Node -> "height"  is always greater than 0
	//         "table"   is an array of child nodes
	//         "lengths" is an array of accumulated lengths of the child nodes
	
	// M is the maximal table size. 32 seems fast. E is the allowed increase
	// of search steps when concatting to find an index. Lower values will
	// decrease balancing, but will increase search steps.
	var M = 32;
	var E = 2;
	
	// An empty array.
	var empty = {
		ctor: '_Array',
		height: 0,
		table: []
	};
	
	
	function get(i, array)
	{
		if (i < 0 || i >= length(array))
		{
			throw new Error(
				'Index ' + i + ' is out of range. Check the length of ' +
				'your array first or use getMaybe or getWithDefault.');
		}
		return unsafeGet(i, array);
	}
	
	
	function unsafeGet(i, array)
	{
		for (var x = array.height; x > 0; x--)
		{
			var slot = i >> (x * 5);
			while (array.lengths[slot] <= i)
			{
				slot++;
			}
			if (slot > 0)
			{
				i -= array.lengths[slot - 1];
			}
			array = array.table[slot];
		}
		return array.table[i];
	}
	
	
	// Sets the value at the index i. Only the nodes leading to i will get
	// copied and updated.
	function set(i, item, array)
	{
		if (i < 0 || length(array) <= i)
		{
			return array;
		}
		return unsafeSet(i, item, array);
	}
	
	
	function unsafeSet(i, item, array)
	{
		array = nodeCopy(array);
	
		if (array.height === 0)
		{
			array.table[i] = item;
		}
		else
		{
			var slot = getSlot(i, array);
			if (slot > 0)
			{
				i -= array.lengths[slot - 1];
			}
			array.table[slot] = unsafeSet(i, item, array.table[slot]);
		}
		return array;
	}
	
	
	function initialize(len, f)
	{
		if (len <= 0)
		{
			return empty;
		}
		var h = Math.floor( Math.log(len) / Math.log(M) );
		return initialize_(f, h, 0, len);
	}
	
	function initialize_(f, h, from, to)
	{
		if (h === 0)
		{
			var table = new Array((to - from) % (M + 1));
			for (var i = 0; i < table.length; i++)
			{
			  table[i] = f(from + i);
			}
			return {
				ctor: '_Array',
				height: 0,
				table: table
			};
		}
	
		var step = Math.pow(M, h);
		var table = new Array(Math.ceil((to - from) / step));
		var lengths = new Array(table.length);
		for (var i = 0; i < table.length; i++)
		{
			table[i] = initialize_(f, h - 1, from + (i * step), Math.min(from + ((i + 1) * step), to));
			lengths[i] = length(table[i]) + (i > 0 ? lengths[i-1] : 0);
		}
		return {
			ctor: '_Array',
			height: h,
			table: table,
			lengths: lengths
		};
	}
	
	function fromList(list)
	{
		if (list.ctor === '[]')
		{
			return empty;
		}
	
		// Allocate M sized blocks (table) and write list elements to it.
		var table = new Array(M);
		var nodes = [];
		var i = 0;
	
		while (list.ctor !== '[]')
		{
			table[i] = list._0;
			list = list._1;
			i++;
	
			// table is full, so we can push a leaf containing it into the
			// next node.
			if (i === M)
			{
				var leaf = {
					ctor: '_Array',
					height: 0,
					table: table
				};
				fromListPush(leaf, nodes);
				table = new Array(M);
				i = 0;
			}
		}
	
		// Maybe there is something left on the table.
		if (i > 0)
		{
			var leaf = {
				ctor: '_Array',
				height: 0,
				table: table.splice(0, i)
			};
			fromListPush(leaf, nodes);
		}
	
		// Go through all of the nodes and eventually push them into higher nodes.
		for (var h = 0; h < nodes.length - 1; h++)
		{
			if (nodes[h].table.length > 0)
			{
				fromListPush(nodes[h], nodes);
			}
		}
	
		var head = nodes[nodes.length - 1];
		if (head.height > 0 && head.table.length === 1)
		{
			return head.table[0];
		}
		else
		{
			return head;
		}
	}
	
	// Push a node into a higher node as a child.
	function fromListPush(toPush, nodes)
	{
		var h = toPush.height;
	
		// Maybe the node on this height does not exist.
		if (nodes.length === h)
		{
			var node = {
				ctor: '_Array',
				height: h + 1,
				table: [],
				lengths: []
			};
			nodes.push(node);
		}
	
		nodes[h].table.push(toPush);
		var len = length(toPush);
		if (nodes[h].lengths.length > 0)
		{
			len += nodes[h].lengths[nodes[h].lengths.length - 1];
		}
		nodes[h].lengths.push(len);
	
		if (nodes[h].table.length === M)
		{
			fromListPush(nodes[h], nodes);
			nodes[h] = {
				ctor: '_Array',
				height: h + 1,
				table: [],
				lengths: []
			};
		}
	}
	
	// Pushes an item via push_ to the bottom right of a tree.
	function push(item, a)
	{
		var pushed = push_(item, a);
		if (pushed !== null)
		{
			return pushed;
		}
	
		var newTree = create(item, a.height);
		return siblise(a, newTree);
	}
	
	// Recursively tries to push an item to the bottom-right most
	// tree possible. If there is no space left for the item,
	// null will be returned.
	function push_(item, a)
	{
		// Handle resursion stop at leaf level.
		if (a.height === 0)
		{
			if (a.table.length < M)
			{
				var newA = {
					ctor: '_Array',
					height: 0,
					table: a.table.slice()
				};
				newA.table.push(item);
				return newA;
			}
			else
			{
			  return null;
			}
		}
	
		// Recursively push
		var pushed = push_(item, botRight(a));
	
		// There was space in the bottom right tree, so the slot will
		// be updated.
		if (pushed !== null)
		{
			var newA = nodeCopy(a);
			newA.table[newA.table.length - 1] = pushed;
			newA.lengths[newA.lengths.length - 1]++;
			return newA;
		}
	
		// When there was no space left, check if there is space left
		// for a new slot with a tree which contains only the item
		// at the bottom.
		if (a.table.length < M)
		{
			var newSlot = create(item, a.height - 1);
			var newA = nodeCopy(a);
			newA.table.push(newSlot);
			newA.lengths.push(newA.lengths[newA.lengths.length - 1] + length(newSlot));
			return newA;
		}
		else
		{
			return null;
		}
	}
	
	// Converts an array into a list of elements.
	function toList(a)
	{
		return toList_(_elm_lang$core$Native_List.Nil, a);
	}
	
	function toList_(list, a)
	{
		for (var i = a.table.length - 1; i >= 0; i--)
		{
			list =
				a.height === 0
					? _elm_lang$core$Native_List.Cons(a.table[i], list)
					: toList_(list, a.table[i]);
		}
		return list;
	}
	
	// Maps a function over the elements of an array.
	function map(f, a)
	{
		var newA = {
			ctor: '_Array',
			height: a.height,
			table: new Array(a.table.length)
		};
		if (a.height > 0)
		{
			newA.lengths = a.lengths;
		}
		for (var i = 0; i < a.table.length; i++)
		{
			newA.table[i] =
				a.height === 0
					? f(a.table[i])
					: map(f, a.table[i]);
		}
		return newA;
	}
	
	// Maps a function over the elements with their index as first argument.
	function indexedMap(f, a)
	{
		return indexedMap_(f, a, 0);
	}
	
	function indexedMap_(f, a, from)
	{
		var newA = {
			ctor: '_Array',
			height: a.height,
			table: new Array(a.table.length)
		};
		if (a.height > 0)
		{
			newA.lengths = a.lengths;
		}
		for (var i = 0; i < a.table.length; i++)
		{
			newA.table[i] =
				a.height === 0
					? A2(f, from + i, a.table[i])
					: indexedMap_(f, a.table[i], i == 0 ? from : from + a.lengths[i - 1]);
		}
		return newA;
	}
	
	function foldl(f, b, a)
	{
		if (a.height === 0)
		{
			for (var i = 0; i < a.table.length; i++)
			{
				b = A2(f, a.table[i], b);
			}
		}
		else
		{
			for (var i = 0; i < a.table.length; i++)
			{
				b = foldl(f, b, a.table[i]);
			}
		}
		return b;
	}
	
	function foldr(f, b, a)
	{
		if (a.height === 0)
		{
			for (var i = a.table.length; i--; )
			{
				b = A2(f, a.table[i], b);
			}
		}
		else
		{
			for (var i = a.table.length; i--; )
			{
				b = foldr(f, b, a.table[i]);
			}
		}
		return b;
	}
	
	// TODO: currently, it slices the right, then the left. This can be
	// optimized.
	function slice(from, to, a)
	{
		if (from < 0)
		{
			from += length(a);
		}
		if (to < 0)
		{
			to += length(a);
		}
		return sliceLeft(from, sliceRight(to, a));
	}
	
	function sliceRight(to, a)
	{
		if (to === length(a))
		{
			return a;
		}
	
		// Handle leaf level.
		if (a.height === 0)
		{
			var newA = { ctor:'_Array', height:0 };
			newA.table = a.table.slice(0, to);
			return newA;
		}
	
		// Slice the right recursively.
		var right = getSlot(to, a);
		var sliced = sliceRight(to - (right > 0 ? a.lengths[right - 1] : 0), a.table[right]);
	
		// Maybe the a node is not even needed, as sliced contains the whole slice.
		if (right === 0)
		{
			return sliced;
		}
	
		// Create new node.
		var newA = {
			ctor: '_Array',
			height: a.height,
			table: a.table.slice(0, right),
			lengths: a.lengths.slice(0, right)
		};
		if (sliced.table.length > 0)
		{
			newA.table[right] = sliced;
			newA.lengths[right] = length(sliced) + (right > 0 ? newA.lengths[right - 1] : 0);
		}
		return newA;
	}
	
	function sliceLeft(from, a)
	{
		if (from === 0)
		{
			return a;
		}
	
		// Handle leaf level.
		if (a.height === 0)
		{
			var newA = { ctor:'_Array', height:0 };
			newA.table = a.table.slice(from, a.table.length + 1);
			return newA;
		}
	
		// Slice the left recursively.
		var left = getSlot(from, a);
		var sliced = sliceLeft(from - (left > 0 ? a.lengths[left - 1] : 0), a.table[left]);
	
		// Maybe the a node is not even needed, as sliced contains the whole slice.
		if (left === a.table.length - 1)
		{
			return sliced;
		}
	
		// Create new node.
		var newA = {
			ctor: '_Array',
			height: a.height,
			table: a.table.slice(left, a.table.length + 1),
			lengths: new Array(a.table.length - left)
		};
		newA.table[0] = sliced;
		var len = 0;
		for (var i = 0; i < newA.table.length; i++)
		{
			len += length(newA.table[i]);
			newA.lengths[i] = len;
		}
	
		return newA;
	}
	
	// Appends two trees.
	function append(a,b)
	{
		if (a.table.length === 0)
		{
			return b;
		}
		if (b.table.length === 0)
		{
			return a;
		}
	
		var c = append_(a, b);
	
		// Check if both nodes can be crunshed together.
		if (c[0].table.length + c[1].table.length <= M)
		{
			if (c[0].table.length === 0)
			{
				return c[1];
			}
			if (c[1].table.length === 0)
			{
				return c[0];
			}
	
			// Adjust .table and .lengths
			c[0].table = c[0].table.concat(c[1].table);
			if (c[0].height > 0)
			{
				var len = length(c[0]);
				for (var i = 0; i < c[1].lengths.length; i++)
				{
					c[1].lengths[i] += len;
				}
				c[0].lengths = c[0].lengths.concat(c[1].lengths);
			}
	
			return c[0];
		}
	
		if (c[0].height > 0)
		{
			var toRemove = calcToRemove(a, b);
			if (toRemove > E)
			{
				c = shuffle(c[0], c[1], toRemove);
			}
		}
	
		return siblise(c[0], c[1]);
	}
	
	// Returns an array of two nodes; right and left. One node _may_ be empty.
	function append_(a, b)
	{
		if (a.height === 0 && b.height === 0)
		{
			return [a, b];
		}
	
		if (a.height !== 1 || b.height !== 1)
		{
			if (a.height === b.height)
			{
				a = nodeCopy(a);
				b = nodeCopy(b);
				var appended = append_(botRight(a), botLeft(b));
	
				insertRight(a, appended[1]);
				insertLeft(b, appended[0]);
			}
			else if (a.height > b.height)
			{
				a = nodeCopy(a);
				var appended = append_(botRight(a), b);
	
				insertRight(a, appended[0]);
				b = parentise(appended[1], appended[1].height + 1);
			}
			else
			{
				b = nodeCopy(b);
				var appended = append_(a, botLeft(b));
	
				var left = appended[0].table.length === 0 ? 0 : 1;
				var right = left === 0 ? 1 : 0;
				insertLeft(b, appended[left]);
				a = parentise(appended[right], appended[right].height + 1);
			}
		}
	
		// Check if balancing is needed and return based on that.
		if (a.table.length === 0 || b.table.length === 0)
		{
			return [a, b];
		}
	
		var toRemove = calcToRemove(a, b);
		if (toRemove <= E)
		{
			return [a, b];
		}
		return shuffle(a, b, toRemove);
	}
	
	// Helperfunctions for append_. Replaces a child node at the side of the parent.
	function insertRight(parent, node)
	{
		var index = parent.table.length - 1;
		parent.table[index] = node;
		parent.lengths[index] = length(node);
		parent.lengths[index] += index > 0 ? parent.lengths[index - 1] : 0;
	}
	
	function insertLeft(parent, node)
	{
		if (node.table.length > 0)
		{
			parent.table[0] = node;
			parent.lengths[0] = length(node);
	
			var len = length(parent.table[0]);
			for (var i = 1; i < parent.lengths.length; i++)
			{
				len += length(parent.table[i]);
				parent.lengths[i] = len;
			}
		}
		else
		{
			parent.table.shift();
			for (var i = 1; i < parent.lengths.length; i++)
			{
				parent.lengths[i] = parent.lengths[i] - parent.lengths[0];
			}
			parent.lengths.shift();
		}
	}
	
	// Returns the extra search steps for E. Refer to the paper.
	function calcToRemove(a, b)
	{
		var subLengths = 0;
		for (var i = 0; i < a.table.length; i++)
		{
			subLengths += a.table[i].table.length;
		}
		for (var i = 0; i < b.table.length; i++)
		{
			subLengths += b.table[i].table.length;
		}
	
		var toRemove = a.table.length + b.table.length;
		return toRemove - (Math.floor((subLengths - 1) / M) + 1);
	}
	
	// get2, set2 and saveSlot are helpers for accessing elements over two arrays.
	function get2(a, b, index)
	{
		return index < a.length
			? a[index]
			: b[index - a.length];
	}
	
	function set2(a, b, index, value)
	{
		if (index < a.length)
		{
			a[index] = value;
		}
		else
		{
			b[index - a.length] = value;
		}
	}
	
	function saveSlot(a, b, index, slot)
	{
		set2(a.table, b.table, index, slot);
	
		var l = (index === 0 || index === a.lengths.length)
			? 0
			: get2(a.lengths, a.lengths, index - 1);
	
		set2(a.lengths, b.lengths, index, l + length(slot));
	}
	
	// Creates a node or leaf with a given length at their arrays for perfomance.
	// Is only used by shuffle.
	function createNode(h, length)
	{
		if (length < 0)
		{
			length = 0;
		}
		var a = {
			ctor: '_Array',
			height: h,
			table: new Array(length)
		};
		if (h > 0)
		{
			a.lengths = new Array(length);
		}
		return a;
	}
	
	// Returns an array of two balanced nodes.
	function shuffle(a, b, toRemove)
	{
		var newA = createNode(a.height, Math.min(M, a.table.length + b.table.length - toRemove));
		var newB = createNode(a.height, newA.table.length - (a.table.length + b.table.length - toRemove));
	
		// Skip the slots with size M. More precise: copy the slot references
		// to the new node
		var read = 0;
		while (get2(a.table, b.table, read).table.length % M === 0)
		{
			set2(newA.table, newB.table, read, get2(a.table, b.table, read));
			set2(newA.lengths, newB.lengths, read, get2(a.lengths, b.lengths, read));
			read++;
		}
	
		// Pulling items from left to right, caching in a slot before writing
		// it into the new nodes.
		var write = read;
		var slot = new createNode(a.height - 1, 0);
		var from = 0;
	
		// If the current slot is still containing data, then there will be at
		// least one more write, so we do not break this loop yet.
		while (read - write - (slot.table.length > 0 ? 1 : 0) < toRemove)
		{
			// Find out the max possible items for copying.
			var source = get2(a.table, b.table, read);
			var to = Math.min(M - slot.table.length, source.table.length);
	
			// Copy and adjust size table.
			slot.table = slot.table.concat(source.table.slice(from, to));
			if (slot.height > 0)
			{
				var len = slot.lengths.length;
				for (var i = len; i < len + to - from; i++)
				{
					slot.lengths[i] = length(slot.table[i]);
					slot.lengths[i] += (i > 0 ? slot.lengths[i - 1] : 0);
				}
			}
	
			from += to;
	
			// Only proceed to next slots[i] if the current one was
			// fully copied.
			if (source.table.length <= to)
			{
				read++; from = 0;
			}
	
			// Only create a new slot if the current one is filled up.
			if (slot.table.length === M)
			{
				saveSlot(newA, newB, write, slot);
				slot = createNode(a.height - 1, 0);
				write++;
			}
		}
	
		// Cleanup after the loop. Copy the last slot into the new nodes.
		if (slot.table.length > 0)
		{
			saveSlot(newA, newB, write, slot);
			write++;
		}
	
		// Shift the untouched slots to the left
		while (read < a.table.length + b.table.length )
		{
			saveSlot(newA, newB, write, get2(a.table, b.table, read));
			read++;
			write++;
		}
	
		return [newA, newB];
	}
	
	// Navigation functions
	function botRight(a)
	{
		return a.table[a.table.length - 1];
	}
	function botLeft(a)
	{
		return a.table[0];
	}
	
	// Copies a node for updating. Note that you should not use this if
	// only updating only one of "table" or "lengths" for performance reasons.
	function nodeCopy(a)
	{
		var newA = {
			ctor: '_Array',
			height: a.height,
			table: a.table.slice()
		};
		if (a.height > 0)
		{
			newA.lengths = a.lengths.slice();
		}
		return newA;
	}
	
	// Returns how many items are in the tree.
	function length(array)
	{
		if (array.height === 0)
		{
			return array.table.length;
		}
		else
		{
			return array.lengths[array.lengths.length - 1];
		}
	}
	
	// Calculates in which slot of "table" the item probably is, then
	// find the exact slot via forward searching in  "lengths". Returns the index.
	function getSlot(i, a)
	{
		var slot = i >> (5 * a.height);
		while (a.lengths[slot] <= i)
		{
			slot++;
		}
		return slot;
	}
	
	// Recursively creates a tree with a given height containing
	// only the given item.
	function create(item, h)
	{
		if (h === 0)
		{
			return {
				ctor: '_Array',
				height: 0,
				table: [item]
			};
		}
		return {
			ctor: '_Array',
			height: h,
			table: [create(item, h - 1)],
			lengths: [1]
		};
	}
	
	// Recursively creates a tree that contains the given tree.
	function parentise(tree, h)
	{
		if (h === tree.height)
		{
			return tree;
		}
	
		return {
			ctor: '_Array',
			height: h,
			table: [parentise(tree, h - 1)],
			lengths: [length(tree)]
		};
	}
	
	// Emphasizes blood brotherhood beneath two trees.
	function siblise(a, b)
	{
		return {
			ctor: '_Array',
			height: a.height + 1,
			table: [a, b],
			lengths: [length(a), length(a) + length(b)]
		};
	}
	
	function toJSArray(a)
	{
		var jsArray = new Array(length(a));
		toJSArray_(jsArray, 0, a);
		return jsArray;
	}
	
	function toJSArray_(jsArray, i, a)
	{
		for (var t = 0; t < a.table.length; t++)
		{
			if (a.height === 0)
			{
				jsArray[i + t] = a.table[t];
			}
			else
			{
				var inc = t === 0 ? 0 : a.lengths[t - 1];
				toJSArray_(jsArray, i + inc, a.table[t]);
			}
		}
	}
	
	function fromJSArray(jsArray)
	{
		if (jsArray.length === 0)
		{
			return empty;
		}
		var h = Math.floor(Math.log(jsArray.length) / Math.log(M));
		return fromJSArray_(jsArray, h, 0, jsArray.length);
	}
	
	function fromJSArray_(jsArray, h, from, to)
	{
		if (h === 0)
		{
			return {
				ctor: '_Array',
				height: 0,
				table: jsArray.slice(from, to)
			};
		}
	
		var step = Math.pow(M, h);
		var table = new Array(Math.ceil((to - from) / step));
		var lengths = new Array(table.length);
		for (var i = 0; i < table.length; i++)
		{
			table[i] = fromJSArray_(jsArray, h - 1, from + (i * step), Math.min(from + ((i + 1) * step), to));
			lengths[i] = length(table[i]) + (i > 0 ? lengths[i - 1] : 0);
		}
		return {
			ctor: '_Array',
			height: h,
			table: table,
			lengths: lengths
		};
	}
	
	return {
		empty: empty,
		fromList: fromList,
		toList: toList,
		initialize: F2(initialize),
		append: F2(append),
		push: F2(push),
		slice: F3(slice),
		get: F2(get),
		set: F3(set),
		map: F2(map),
		indexedMap: F2(indexedMap),
		foldl: F3(foldl),
		foldr: F3(foldr),
		length: length,
	
		toJSArray: toJSArray,
		fromJSArray: fromJSArray
	};
	
	}();
	//import Native.Utils //
	
	var _elm_lang$core$Native_Basics = function() {
	
	function div(a, b)
	{
		return (a / b) | 0;
	}
	function rem(a, b)
	{
		return a % b;
	}
	function mod(a, b)
	{
		if (b === 0)
		{
			throw new Error('Cannot perform mod 0. Division by zero error.');
		}
		var r = a % b;
		var m = a === 0 ? 0 : (b > 0 ? (a >= 0 ? r : r + b) : -mod(-a, -b));
	
		return m === b ? 0 : m;
	}
	function logBase(base, n)
	{
		return Math.log(n) / Math.log(base);
	}
	function negate(n)
	{
		return -n;
	}
	function abs(n)
	{
		return n < 0 ? -n : n;
	}
	
	function min(a, b)
	{
		return _elm_lang$core$Native_Utils.cmp(a, b) < 0 ? a : b;
	}
	function max(a, b)
	{
		return _elm_lang$core$Native_Utils.cmp(a, b) > 0 ? a : b;
	}
	function clamp(lo, hi, n)
	{
		return _elm_lang$core$Native_Utils.cmp(n, lo) < 0
			? lo
			: _elm_lang$core$Native_Utils.cmp(n, hi) > 0
				? hi
				: n;
	}
	
	var ord = ['LT', 'EQ', 'GT'];
	
	function compare(x, y)
	{
		return { ctor: ord[_elm_lang$core$Native_Utils.cmp(x, y) + 1] };
	}
	
	function xor(a, b)
	{
		return a !== b;
	}
	function not(b)
	{
		return !b;
	}
	function isInfinite(n)
	{
		return n === Infinity || n === -Infinity;
	}
	
	function truncate(n)
	{
		return n | 0;
	}
	
	function degrees(d)
	{
		return d * Math.PI / 180;
	}
	function turns(t)
	{
		return 2 * Math.PI * t;
	}
	function fromPolar(point)
	{
		var r = point._0;
		var t = point._1;
		return _elm_lang$core$Native_Utils.Tuple2(r * Math.cos(t), r * Math.sin(t));
	}
	function toPolar(point)
	{
		var x = point._0;
		var y = point._1;
		return _elm_lang$core$Native_Utils.Tuple2(Math.sqrt(x * x + y * y), Math.atan2(y, x));
	}
	
	return {
		div: F2(div),
		rem: F2(rem),
		mod: F2(mod),
	
		pi: Math.PI,
		e: Math.E,
		cos: Math.cos,
		sin: Math.sin,
		tan: Math.tan,
		acos: Math.acos,
		asin: Math.asin,
		atan: Math.atan,
		atan2: F2(Math.atan2),
	
		degrees: degrees,
		turns: turns,
		fromPolar: fromPolar,
		toPolar: toPolar,
	
		sqrt: Math.sqrt,
		logBase: F2(logBase),
		negate: negate,
		abs: abs,
		min: F2(min),
		max: F2(max),
		clamp: F3(clamp),
		compare: F2(compare),
	
		xor: F2(xor),
		not: not,
	
		truncate: truncate,
		ceiling: Math.ceil,
		floor: Math.floor,
		round: Math.round,
		toFloat: function(x) { return x; },
		isNaN: isNaN,
		isInfinite: isInfinite
	};
	
	}();
	//import //
	
	var _elm_lang$core$Native_Utils = function() {
	
	// COMPARISONS
	
	function eq(x, y)
	{
		var stack = [];
		var isEqual = eqHelp(x, y, 0, stack);
		var pair;
		while (isEqual && (pair = stack.pop()))
		{
			isEqual = eqHelp(pair.x, pair.y, 0, stack);
		}
		return isEqual;
	}
	
	
	function eqHelp(x, y, depth, stack)
	{
		if (depth > 100)
		{
			stack.push({ x: x, y: y });
			return true;
		}
	
		if (x === y)
		{
			return true;
		}
	
		if (typeof x !== 'object')
		{
			if (typeof x === 'function')
			{
				throw new Error(
					'Trying to use `(==)` on functions. There is no way to know if functions are "the same" in the Elm sense.'
					+ ' Read more about this at http://package.elm-lang.org/packages/elm-lang/core/latest/Basics#=='
					+ ' which describes why it is this way and what the better version will look like.'
				);
			}
			return false;
		}
	
		if (x === null || y === null)
		{
			return false
		}
	
		if (x instanceof Date)
		{
			return x.getTime() === y.getTime();
		}
	
		if (!('ctor' in x))
		{
			for (var key in x)
			{
				if (!eqHelp(x[key], y[key], depth + 1, stack))
				{
					return false;
				}
			}
			return true;
		}
	
		// convert Dicts and Sets to lists
		if (x.ctor === 'RBNode_elm_builtin' || x.ctor === 'RBEmpty_elm_builtin')
		{
			x = _elm_lang$core$Dict$toList(x);
			y = _elm_lang$core$Dict$toList(y);
		}
		if (x.ctor === 'Set_elm_builtin')
		{
			x = _elm_lang$core$Set$toList(x);
			y = _elm_lang$core$Set$toList(y);
		}
	
		// check if lists are equal without recursion
		if (x.ctor === '::')
		{
			var a = x;
			var b = y;
			while (a.ctor === '::' && b.ctor === '::')
			{
				if (!eqHelp(a._0, b._0, depth + 1, stack))
				{
					return false;
				}
				a = a._1;
				b = b._1;
			}
			return a.ctor === b.ctor;
		}
	
		// check if Arrays are equal
		if (x.ctor === '_Array')
		{
			var xs = _elm_lang$core$Native_Array.toJSArray(x);
			var ys = _elm_lang$core$Native_Array.toJSArray(y);
			if (xs.length !== ys.length)
			{
				return false;
			}
			for (var i = 0; i < xs.length; i++)
			{
				if (!eqHelp(xs[i], ys[i], depth + 1, stack))
				{
					return false;
				}
			}
			return true;
		}
	
		if (!eqHelp(x.ctor, y.ctor, depth + 1, stack))
		{
			return false;
		}
	
		for (var key in x)
		{
			if (!eqHelp(x[key], y[key], depth + 1, stack))
			{
				return false;
			}
		}
		return true;
	}
	
	// Code in Generate/JavaScript.hs, Basics.js, and List.js depends on
	// the particular integer values assigned to LT, EQ, and GT.
	
	var LT = -1, EQ = 0, GT = 1;
	
	function cmp(x, y)
	{
		if (typeof x !== 'object')
		{
			return x === y ? EQ : x < y ? LT : GT;
		}
	
		if (x instanceof String)
		{
			var a = x.valueOf();
			var b = y.valueOf();
			return a === b ? EQ : a < b ? LT : GT;
		}
	
		if (x.ctor === '::' || x.ctor === '[]')
		{
			while (x.ctor === '::' && y.ctor === '::')
			{
				var ord = cmp(x._0, y._0);
				if (ord !== EQ)
				{
					return ord;
				}
				x = x._1;
				y = y._1;
			}
			return x.ctor === y.ctor ? EQ : x.ctor === '[]' ? LT : GT;
		}
	
		if (x.ctor.slice(0, 6) === '_Tuple')
		{
			var ord;
			var n = x.ctor.slice(6) - 0;
			var err = 'cannot compare tuples with more than 6 elements.';
			if (n === 0) return EQ;
			if (n >= 1) { ord = cmp(x._0, y._0); if (ord !== EQ) return ord;
			if (n >= 2) { ord = cmp(x._1, y._1); if (ord !== EQ) return ord;
			if (n >= 3) { ord = cmp(x._2, y._2); if (ord !== EQ) return ord;
			if (n >= 4) { ord = cmp(x._3, y._3); if (ord !== EQ) return ord;
			if (n >= 5) { ord = cmp(x._4, y._4); if (ord !== EQ) return ord;
			if (n >= 6) { ord = cmp(x._5, y._5); if (ord !== EQ) return ord;
			if (n >= 7) throw new Error('Comparison error: ' + err); } } } } } }
			return EQ;
		}
	
		throw new Error(
			'Comparison error: comparison is only defined on ints, '
			+ 'floats, times, chars, strings, lists of comparable values, '
			+ 'and tuples of comparable values.'
		);
	}
	
	
	// COMMON VALUES
	
	var Tuple0 = {
		ctor: '_Tuple0'
	};
	
	function Tuple2(x, y)
	{
		return {
			ctor: '_Tuple2',
			_0: x,
			_1: y
		};
	}
	
	function chr(c)
	{
		return new String(c);
	}
	
	
	// GUID
	
	var count = 0;
	function guid(_)
	{
		return count++;
	}
	
	
	// RECORDS
	
	function update(oldRecord, updatedFields)
	{
		var newRecord = {};
	
		for (var key in oldRecord)
		{
			newRecord[key] = oldRecord[key];
		}
	
		for (var key in updatedFields)
		{
			newRecord[key] = updatedFields[key];
		}
	
		return newRecord;
	}
	
	
	//// LIST STUFF ////
	
	var Nil = { ctor: '[]' };
	
	function Cons(hd, tl)
	{
		return {
			ctor: '::',
			_0: hd,
			_1: tl
		};
	}
	
	function append(xs, ys)
	{
		// append Strings
		if (typeof xs === 'string')
		{
			return xs + ys;
		}
	
		// append Lists
		if (xs.ctor === '[]')
		{
			return ys;
		}
		var root = Cons(xs._0, Nil);
		var curr = root;
		xs = xs._1;
		while (xs.ctor !== '[]')
		{
			curr._1 = Cons(xs._0, Nil);
			xs = xs._1;
			curr = curr._1;
		}
		curr._1 = ys;
		return root;
	}
	
	
	// CRASHES
	
	function crash(moduleName, region)
	{
		return function(message) {
			throw new Error(
				'Ran into a `Debug.crash` in module `' + moduleName + '` ' + regionToString(region) + '\n'
				+ 'The message provided by the code author is:\n\n    '
				+ message
			);
		};
	}
	
	function crashCase(moduleName, region, value)
	{
		return function(message) {
			throw new Error(
				'Ran into a `Debug.crash` in module `' + moduleName + '`\n\n'
				+ 'This was caused by the `case` expression ' + regionToString(region) + '.\n'
				+ 'One of the branches ended with a crash and the following value got through:\n\n    ' + toString(value) + '\n\n'
				+ 'The message provided by the code author is:\n\n    '
				+ message
			);
		};
	}
	
	function regionToString(region)
	{
		if (region.start.line == region.end.line)
		{
			return 'on line ' + region.start.line;
		}
		return 'between lines ' + region.start.line + ' and ' + region.end.line;
	}
	
	
	// TO STRING
	
	function toString(v)
	{
		var type = typeof v;
		if (type === 'function')
		{
			return '<function>';
		}
	
		if (type === 'boolean')
		{
			return v ? 'True' : 'False';
		}
	
		if (type === 'number')
		{
			return v + '';
		}
	
		if (v instanceof String)
		{
			return '\'' + addSlashes(v, true) + '\'';
		}
	
		if (type === 'string')
		{
			return '"' + addSlashes(v, false) + '"';
		}
	
		if (v === null)
		{
			return 'null';
		}
	
		if (type === 'object' && 'ctor' in v)
		{
			var ctorStarter = v.ctor.substring(0, 5);
	
			if (ctorStarter === '_Tupl')
			{
				var output = [];
				for (var k in v)
				{
					if (k === 'ctor') continue;
					output.push(toString(v[k]));
				}
				return '(' + output.join(',') + ')';
			}
	
			if (ctorStarter === '_Task')
			{
				return '<task>'
			}
	
			if (v.ctor === '_Array')
			{
				var list = _elm_lang$core$Array$toList(v);
				return 'Array.fromList ' + toString(list);
			}
	
			if (v.ctor === '<decoder>')
			{
				return '<decoder>';
			}
	
			if (v.ctor === '_Process')
			{
				return '<process:' + v.id + '>';
			}
	
			if (v.ctor === '::')
			{
				var output = '[' + toString(v._0);
				v = v._1;
				while (v.ctor === '::')
				{
					output += ',' + toString(v._0);
					v = v._1;
				}
				return output + ']';
			}
	
			if (v.ctor === '[]')
			{
				return '[]';
			}
	
			if (v.ctor === 'Set_elm_builtin')
			{
				return 'Set.fromList ' + toString(_elm_lang$core$Set$toList(v));
			}
	
			if (v.ctor === 'RBNode_elm_builtin' || v.ctor === 'RBEmpty_elm_builtin')
			{
				return 'Dict.fromList ' + toString(_elm_lang$core$Dict$toList(v));
			}
	
			var output = '';
			for (var i in v)
			{
				if (i === 'ctor') continue;
				var str = toString(v[i]);
				var c0 = str[0];
				var parenless = c0 === '{' || c0 === '(' || c0 === '<' || c0 === '"' || str.indexOf(' ') < 0;
				output += ' ' + (parenless ? str : '(' + str + ')');
			}
			return v.ctor + output;
		}
	
		if (type === 'object')
		{
			if (v instanceof Date)
			{
				return '<' + v.toString() + '>';
			}
	
			if (v.elm_web_socket)
			{
				return '<websocket>';
			}
	
			var output = [];
			for (var k in v)
			{
				output.push(k + ' = ' + toString(v[k]));
			}
			if (output.length === 0)
			{
				return '{}';
			}
			return '{ ' + output.join(', ') + ' }';
		}
	
		return '<internal structure>';
	}
	
	function addSlashes(str, isChar)
	{
		var s = str.replace(/\\/g, '\\\\')
				  .replace(/\n/g, '\\n')
				  .replace(/\t/g, '\\t')
				  .replace(/\r/g, '\\r')
				  .replace(/\v/g, '\\v')
				  .replace(/\0/g, '\\0');
		if (isChar)
		{
			return s.replace(/\'/g, '\\\'');
		}
		else
		{
			return s.replace(/\"/g, '\\"');
		}
	}
	
	
	return {
		eq: eq,
		cmp: cmp,
		Tuple0: Tuple0,
		Tuple2: Tuple2,
		chr: chr,
		update: update,
		guid: guid,
	
		append: F2(append),
	
		crash: crash,
		crashCase: crashCase,
	
		toString: toString
	};
	
	}();
	var _elm_lang$core$Basics$never = function (_p0) {
		never:
		while (true) {
			var _p1 = _p0;
			var _v1 = _p1._0;
			_p0 = _v1;
			continue never;
		}
	};
	var _elm_lang$core$Basics$uncurry = F2(
		function (f, _p2) {
			var _p3 = _p2;
			return A2(f, _p3._0, _p3._1);
		});
	var _elm_lang$core$Basics$curry = F3(
		function (f, a, b) {
			return f(
				{ctor: '_Tuple2', _0: a, _1: b});
		});
	var _elm_lang$core$Basics$flip = F3(
		function (f, b, a) {
			return A2(f, a, b);
		});
	var _elm_lang$core$Basics$always = F2(
		function (a, _p4) {
			return a;
		});
	var _elm_lang$core$Basics$identity = function (x) {
		return x;
	};
	var _elm_lang$core$Basics_ops = _elm_lang$core$Basics_ops || {};
	_elm_lang$core$Basics_ops['<|'] = F2(
		function (f, x) {
			return f(x);
		});
	var _elm_lang$core$Basics_ops = _elm_lang$core$Basics_ops || {};
	_elm_lang$core$Basics_ops['|>'] = F2(
		function (x, f) {
			return f(x);
		});
	var _elm_lang$core$Basics_ops = _elm_lang$core$Basics_ops || {};
	_elm_lang$core$Basics_ops['>>'] = F3(
		function (f, g, x) {
			return g(
				f(x));
		});
	var _elm_lang$core$Basics_ops = _elm_lang$core$Basics_ops || {};
	_elm_lang$core$Basics_ops['<<'] = F3(
		function (g, f, x) {
			return g(
				f(x));
		});
	var _elm_lang$core$Basics_ops = _elm_lang$core$Basics_ops || {};
	_elm_lang$core$Basics_ops['++'] = _elm_lang$core$Native_Utils.append;
	var _elm_lang$core$Basics$toString = _elm_lang$core$Native_Utils.toString;
	var _elm_lang$core$Basics$isInfinite = _elm_lang$core$Native_Basics.isInfinite;
	var _elm_lang$core$Basics$isNaN = _elm_lang$core$Native_Basics.isNaN;
	var _elm_lang$core$Basics$toFloat = _elm_lang$core$Native_Basics.toFloat;
	var _elm_lang$core$Basics$ceiling = _elm_lang$core$Native_Basics.ceiling;
	var _elm_lang$core$Basics$floor = _elm_lang$core$Native_Basics.floor;
	var _elm_lang$core$Basics$truncate = _elm_lang$core$Native_Basics.truncate;
	var _elm_lang$core$Basics$round = _elm_lang$core$Native_Basics.round;
	var _elm_lang$core$Basics$not = _elm_lang$core$Native_Basics.not;
	var _elm_lang$core$Basics$xor = _elm_lang$core$Native_Basics.xor;
	var _elm_lang$core$Basics_ops = _elm_lang$core$Basics_ops || {};
	_elm_lang$core$Basics_ops['||'] = _elm_lang$core$Native_Basics.or;
	var _elm_lang$core$Basics_ops = _elm_lang$core$Basics_ops || {};
	_elm_lang$core$Basics_ops['&&'] = _elm_lang$core$Native_Basics.and;
	var _elm_lang$core$Basics$max = _elm_lang$core$Native_Basics.max;
	var _elm_lang$core$Basics$min = _elm_lang$core$Native_Basics.min;
	var _elm_lang$core$Basics$compare = _elm_lang$core$Native_Basics.compare;
	var _elm_lang$core$Basics_ops = _elm_lang$core$Basics_ops || {};
	_elm_lang$core$Basics_ops['>='] = _elm_lang$core$Native_Basics.ge;
	var _elm_lang$core$Basics_ops = _elm_lang$core$Basics_ops || {};
	_elm_lang$core$Basics_ops['<='] = _elm_lang$core$Native_Basics.le;
	var _elm_lang$core$Basics_ops = _elm_lang$core$Basics_ops || {};
	_elm_lang$core$Basics_ops['>'] = _elm_lang$core$Native_Basics.gt;
	var _elm_lang$core$Basics_ops = _elm_lang$core$Basics_ops || {};
	_elm_lang$core$Basics_ops['<'] = _elm_lang$core$Native_Basics.lt;
	var _elm_lang$core$Basics_ops = _elm_lang$core$Basics_ops || {};
	_elm_lang$core$Basics_ops['/='] = _elm_lang$core$Native_Basics.neq;
	var _elm_lang$core$Basics_ops = _elm_lang$core$Basics_ops || {};
	_elm_lang$core$Basics_ops['=='] = _elm_lang$core$Native_Basics.eq;
	var _elm_lang$core$Basics$e = _elm_lang$core$Native_Basics.e;
	var _elm_lang$core$Basics$pi = _elm_lang$core$Native_Basics.pi;
	var _elm_lang$core$Basics$clamp = _elm_lang$core$Native_Basics.clamp;
	var _elm_lang$core$Basics$logBase = _elm_lang$core$Native_Basics.logBase;
	var _elm_lang$core$Basics$abs = _elm_lang$core$Native_Basics.abs;
	var _elm_lang$core$Basics$negate = _elm_lang$core$Native_Basics.negate;
	var _elm_lang$core$Basics$sqrt = _elm_lang$core$Native_Basics.sqrt;
	var _elm_lang$core$Basics$atan2 = _elm_lang$core$Native_Basics.atan2;
	var _elm_lang$core$Basics$atan = _elm_lang$core$Native_Basics.atan;
	var _elm_lang$core$Basics$asin = _elm_lang$core$Native_Basics.asin;
	var _elm_lang$core$Basics$acos = _elm_lang$core$Native_Basics.acos;
	var _elm_lang$core$Basics$tan = _elm_lang$core$Native_Basics.tan;
	var _elm_lang$core$Basics$sin = _elm_lang$core$Native_Basics.sin;
	var _elm_lang$core$Basics$cos = _elm_lang$core$Native_Basics.cos;
	var _elm_lang$core$Basics_ops = _elm_lang$core$Basics_ops || {};
	_elm_lang$core$Basics_ops['^'] = _elm_lang$core$Native_Basics.exp;
	var _elm_lang$core$Basics_ops = _elm_lang$core$Basics_ops || {};
	_elm_lang$core$Basics_ops['%'] = _elm_lang$core$Native_Basics.mod;
	var _elm_lang$core$Basics$rem = _elm_lang$core$Native_Basics.rem;
	var _elm_lang$core$Basics_ops = _elm_lang$core$Basics_ops || {};
	_elm_lang$core$Basics_ops['//'] = _elm_lang$core$Native_Basics.div;
	var _elm_lang$core$Basics_ops = _elm_lang$core$Basics_ops || {};
	_elm_lang$core$Basics_ops['/'] = _elm_lang$core$Native_Basics.floatDiv;
	var _elm_lang$core$Basics_ops = _elm_lang$core$Basics_ops || {};
	_elm_lang$core$Basics_ops['*'] = _elm_lang$core$Native_Basics.mul;
	var _elm_lang$core$Basics_ops = _elm_lang$core$Basics_ops || {};
	_elm_lang$core$Basics_ops['-'] = _elm_lang$core$Native_Basics.sub;
	var _elm_lang$core$Basics_ops = _elm_lang$core$Basics_ops || {};
	_elm_lang$core$Basics_ops['+'] = _elm_lang$core$Native_Basics.add;
	var _elm_lang$core$Basics$toPolar = _elm_lang$core$Native_Basics.toPolar;
	var _elm_lang$core$Basics$fromPolar = _elm_lang$core$Native_Basics.fromPolar;
	var _elm_lang$core$Basics$turns = _elm_lang$core$Native_Basics.turns;
	var _elm_lang$core$Basics$degrees = _elm_lang$core$Native_Basics.degrees;
	var _elm_lang$core$Basics$radians = function (t) {
		return t;
	};
	var _elm_lang$core$Basics$GT = {ctor: 'GT'};
	var _elm_lang$core$Basics$EQ = {ctor: 'EQ'};
	var _elm_lang$core$Basics$LT = {ctor: 'LT'};
	var _elm_lang$core$Basics$JustOneMore = function (a) {
		return {ctor: 'JustOneMore', _0: a};
	};
	
	var _elm_lang$core$Maybe$withDefault = F2(
		function ($default, maybe) {
			var _p0 = maybe;
			if (_p0.ctor === 'Just') {
				return _p0._0;
			} else {
				return $default;
			}
		});
	var _elm_lang$core$Maybe$Nothing = {ctor: 'Nothing'};
	var _elm_lang$core$Maybe$andThen = F2(
		function (callback, maybeValue) {
			var _p1 = maybeValue;
			if (_p1.ctor === 'Just') {
				return callback(_p1._0);
			} else {
				return _elm_lang$core$Maybe$Nothing;
			}
		});
	var _elm_lang$core$Maybe$Just = function (a) {
		return {ctor: 'Just', _0: a};
	};
	var _elm_lang$core$Maybe$map = F2(
		function (f, maybe) {
			var _p2 = maybe;
			if (_p2.ctor === 'Just') {
				return _elm_lang$core$Maybe$Just(
					f(_p2._0));
			} else {
				return _elm_lang$core$Maybe$Nothing;
			}
		});
	var _elm_lang$core$Maybe$map2 = F3(
		function (func, ma, mb) {
			var _p3 = {ctor: '_Tuple2', _0: ma, _1: mb};
			if (((_p3.ctor === '_Tuple2') && (_p3._0.ctor === 'Just')) && (_p3._1.ctor === 'Just')) {
				return _elm_lang$core$Maybe$Just(
					A2(func, _p3._0._0, _p3._1._0));
			} else {
				return _elm_lang$core$Maybe$Nothing;
			}
		});
	var _elm_lang$core$Maybe$map3 = F4(
		function (func, ma, mb, mc) {
			var _p4 = {ctor: '_Tuple3', _0: ma, _1: mb, _2: mc};
			if ((((_p4.ctor === '_Tuple3') && (_p4._0.ctor === 'Just')) && (_p4._1.ctor === 'Just')) && (_p4._2.ctor === 'Just')) {
				return _elm_lang$core$Maybe$Just(
					A3(func, _p4._0._0, _p4._1._0, _p4._2._0));
			} else {
				return _elm_lang$core$Maybe$Nothing;
			}
		});
	var _elm_lang$core$Maybe$map4 = F5(
		function (func, ma, mb, mc, md) {
			var _p5 = {ctor: '_Tuple4', _0: ma, _1: mb, _2: mc, _3: md};
			if (((((_p5.ctor === '_Tuple4') && (_p5._0.ctor === 'Just')) && (_p5._1.ctor === 'Just')) && (_p5._2.ctor === 'Just')) && (_p5._3.ctor === 'Just')) {
				return _elm_lang$core$Maybe$Just(
					A4(func, _p5._0._0, _p5._1._0, _p5._2._0, _p5._3._0));
			} else {
				return _elm_lang$core$Maybe$Nothing;
			}
		});
	var _elm_lang$core$Maybe$map5 = F6(
		function (func, ma, mb, mc, md, me) {
			var _p6 = {ctor: '_Tuple5', _0: ma, _1: mb, _2: mc, _3: md, _4: me};
			if ((((((_p6.ctor === '_Tuple5') && (_p6._0.ctor === 'Just')) && (_p6._1.ctor === 'Just')) && (_p6._2.ctor === 'Just')) && (_p6._3.ctor === 'Just')) && (_p6._4.ctor === 'Just')) {
				return _elm_lang$core$Maybe$Just(
					A5(func, _p6._0._0, _p6._1._0, _p6._2._0, _p6._3._0, _p6._4._0));
			} else {
				return _elm_lang$core$Maybe$Nothing;
			}
		});
	
	//import Native.Utils //
	
	var _elm_lang$core$Native_List = function() {
	
	var Nil = { ctor: '[]' };
	
	function Cons(hd, tl)
	{
		return { ctor: '::', _0: hd, _1: tl };
	}
	
	function fromArray(arr)
	{
		var out = Nil;
		for (var i = arr.length; i--; )
		{
			out = Cons(arr[i], out);
		}
		return out;
	}
	
	function toArray(xs)
	{
		var out = [];
		while (xs.ctor !== '[]')
		{
			out.push(xs._0);
			xs = xs._1;
		}
		return out;
	}
	
	function foldr(f, b, xs)
	{
		var arr = toArray(xs);
		var acc = b;
		for (var i = arr.length; i--; )
		{
			acc = A2(f, arr[i], acc);
		}
		return acc;
	}
	
	function map2(f, xs, ys)
	{
		var arr = [];
		while (xs.ctor !== '[]' && ys.ctor !== '[]')
		{
			arr.push(A2(f, xs._0, ys._0));
			xs = xs._1;
			ys = ys._1;
		}
		return fromArray(arr);
	}
	
	function map3(f, xs, ys, zs)
	{
		var arr = [];
		while (xs.ctor !== '[]' && ys.ctor !== '[]' && zs.ctor !== '[]')
		{
			arr.push(A3(f, xs._0, ys._0, zs._0));
			xs = xs._1;
			ys = ys._1;
			zs = zs._1;
		}
		return fromArray(arr);
	}
	
	function map4(f, ws, xs, ys, zs)
	{
		var arr = [];
		while (   ws.ctor !== '[]'
			   && xs.ctor !== '[]'
			   && ys.ctor !== '[]'
			   && zs.ctor !== '[]')
		{
			arr.push(A4(f, ws._0, xs._0, ys._0, zs._0));
			ws = ws._1;
			xs = xs._1;
			ys = ys._1;
			zs = zs._1;
		}
		return fromArray(arr);
	}
	
	function map5(f, vs, ws, xs, ys, zs)
	{
		var arr = [];
		while (   vs.ctor !== '[]'
			   && ws.ctor !== '[]'
			   && xs.ctor !== '[]'
			   && ys.ctor !== '[]'
			   && zs.ctor !== '[]')
		{
			arr.push(A5(f, vs._0, ws._0, xs._0, ys._0, zs._0));
			vs = vs._1;
			ws = ws._1;
			xs = xs._1;
			ys = ys._1;
			zs = zs._1;
		}
		return fromArray(arr);
	}
	
	function sortBy(f, xs)
	{
		return fromArray(toArray(xs).sort(function(a, b) {
			return _elm_lang$core$Native_Utils.cmp(f(a), f(b));
		}));
	}
	
	function sortWith(f, xs)
	{
		return fromArray(toArray(xs).sort(function(a, b) {
			var ord = f(a)(b).ctor;
			return ord === 'EQ' ? 0 : ord === 'LT' ? -1 : 1;
		}));
	}
	
	return {
		Nil: Nil,
		Cons: Cons,
		cons: F2(Cons),
		toArray: toArray,
		fromArray: fromArray,
	
		foldr: F3(foldr),
	
		map2: F3(map2),
		map3: F4(map3),
		map4: F5(map4),
		map5: F6(map5),
		sortBy: F2(sortBy),
		sortWith: F2(sortWith)
	};
	
	}();
	var _elm_lang$core$List$sortWith = _elm_lang$core$Native_List.sortWith;
	var _elm_lang$core$List$sortBy = _elm_lang$core$Native_List.sortBy;
	var _elm_lang$core$List$sort = function (xs) {
		return A2(_elm_lang$core$List$sortBy, _elm_lang$core$Basics$identity, xs);
	};
	var _elm_lang$core$List$singleton = function (value) {
		return {
			ctor: '::',
			_0: value,
			_1: {ctor: '[]'}
		};
	};
	var _elm_lang$core$List$drop = F2(
		function (n, list) {
			drop:
			while (true) {
				if (_elm_lang$core$Native_Utils.cmp(n, 0) < 1) {
					return list;
				} else {
					var _p0 = list;
					if (_p0.ctor === '[]') {
						return list;
					} else {
						var _v1 = n - 1,
							_v2 = _p0._1;
						n = _v1;
						list = _v2;
						continue drop;
					}
				}
			}
		});
	var _elm_lang$core$List$map5 = _elm_lang$core$Native_List.map5;
	var _elm_lang$core$List$map4 = _elm_lang$core$Native_List.map4;
	var _elm_lang$core$List$map3 = _elm_lang$core$Native_List.map3;
	var _elm_lang$core$List$map2 = _elm_lang$core$Native_List.map2;
	var _elm_lang$core$List$any = F2(
		function (isOkay, list) {
			any:
			while (true) {
				var _p1 = list;
				if (_p1.ctor === '[]') {
					return false;
				} else {
					if (isOkay(_p1._0)) {
						return true;
					} else {
						var _v4 = isOkay,
							_v5 = _p1._1;
						isOkay = _v4;
						list = _v5;
						continue any;
					}
				}
			}
		});
	var _elm_lang$core$List$all = F2(
		function (isOkay, list) {
			return !A2(
				_elm_lang$core$List$any,
				function (_p2) {
					return !isOkay(_p2);
				},
				list);
		});
	var _elm_lang$core$List$foldr = _elm_lang$core$Native_List.foldr;
	var _elm_lang$core$List$foldl = F3(
		function (func, acc, list) {
			foldl:
			while (true) {
				var _p3 = list;
				if (_p3.ctor === '[]') {
					return acc;
				} else {
					var _v7 = func,
						_v8 = A2(func, _p3._0, acc),
						_v9 = _p3._1;
					func = _v7;
					acc = _v8;
					list = _v9;
					continue foldl;
				}
			}
		});
	var _elm_lang$core$List$length = function (xs) {
		return A3(
			_elm_lang$core$List$foldl,
			F2(
				function (_p4, i) {
					return i + 1;
				}),
			0,
			xs);
	};
	var _elm_lang$core$List$sum = function (numbers) {
		return A3(
			_elm_lang$core$List$foldl,
			F2(
				function (x, y) {
					return x + y;
				}),
			0,
			numbers);
	};
	var _elm_lang$core$List$product = function (numbers) {
		return A3(
			_elm_lang$core$List$foldl,
			F2(
				function (x, y) {
					return x * y;
				}),
			1,
			numbers);
	};
	var _elm_lang$core$List$maximum = function (list) {
		var _p5 = list;
		if (_p5.ctor === '::') {
			return _elm_lang$core$Maybe$Just(
				A3(_elm_lang$core$List$foldl, _elm_lang$core$Basics$max, _p5._0, _p5._1));
		} else {
			return _elm_lang$core$Maybe$Nothing;
		}
	};
	var _elm_lang$core$List$minimum = function (list) {
		var _p6 = list;
		if (_p6.ctor === '::') {
			return _elm_lang$core$Maybe$Just(
				A3(_elm_lang$core$List$foldl, _elm_lang$core$Basics$min, _p6._0, _p6._1));
		} else {
			return _elm_lang$core$Maybe$Nothing;
		}
	};
	var _elm_lang$core$List$member = F2(
		function (x, xs) {
			return A2(
				_elm_lang$core$List$any,
				function (a) {
					return _elm_lang$core$Native_Utils.eq(a, x);
				},
				xs);
		});
	var _elm_lang$core$List$isEmpty = function (xs) {
		var _p7 = xs;
		if (_p7.ctor === '[]') {
			return true;
		} else {
			return false;
		}
	};
	var _elm_lang$core$List$tail = function (list) {
		var _p8 = list;
		if (_p8.ctor === '::') {
			return _elm_lang$core$Maybe$Just(_p8._1);
		} else {
			return _elm_lang$core$Maybe$Nothing;
		}
	};
	var _elm_lang$core$List$head = function (list) {
		var _p9 = list;
		if (_p9.ctor === '::') {
			return _elm_lang$core$Maybe$Just(_p9._0);
		} else {
			return _elm_lang$core$Maybe$Nothing;
		}
	};
	var _elm_lang$core$List_ops = _elm_lang$core$List_ops || {};
	_elm_lang$core$List_ops['::'] = _elm_lang$core$Native_List.cons;
	var _elm_lang$core$List$map = F2(
		function (f, xs) {
			return A3(
				_elm_lang$core$List$foldr,
				F2(
					function (x, acc) {
						return {
							ctor: '::',
							_0: f(x),
							_1: acc
						};
					}),
				{ctor: '[]'},
				xs);
		});
	var _elm_lang$core$List$filter = F2(
		function (pred, xs) {
			var conditionalCons = F2(
				function (front, back) {
					return pred(front) ? {ctor: '::', _0: front, _1: back} : back;
				});
			return A3(
				_elm_lang$core$List$foldr,
				conditionalCons,
				{ctor: '[]'},
				xs);
		});
	var _elm_lang$core$List$maybeCons = F3(
		function (f, mx, xs) {
			var _p10 = f(mx);
			if (_p10.ctor === 'Just') {
				return {ctor: '::', _0: _p10._0, _1: xs};
			} else {
				return xs;
			}
		});
	var _elm_lang$core$List$filterMap = F2(
		function (f, xs) {
			return A3(
				_elm_lang$core$List$foldr,
				_elm_lang$core$List$maybeCons(f),
				{ctor: '[]'},
				xs);
		});
	var _elm_lang$core$List$reverse = function (list) {
		return A3(
			_elm_lang$core$List$foldl,
			F2(
				function (x, y) {
					return {ctor: '::', _0: x, _1: y};
				}),
			{ctor: '[]'},
			list);
	};
	var _elm_lang$core$List$scanl = F3(
		function (f, b, xs) {
			var scan1 = F2(
				function (x, accAcc) {
					var _p11 = accAcc;
					if (_p11.ctor === '::') {
						return {
							ctor: '::',
							_0: A2(f, x, _p11._0),
							_1: accAcc
						};
					} else {
						return {ctor: '[]'};
					}
				});
			return _elm_lang$core$List$reverse(
				A3(
					_elm_lang$core$List$foldl,
					scan1,
					{
						ctor: '::',
						_0: b,
						_1: {ctor: '[]'}
					},
					xs));
		});
	var _elm_lang$core$List$append = F2(
		function (xs, ys) {
			var _p12 = ys;
			if (_p12.ctor === '[]') {
				return xs;
			} else {
				return A3(
					_elm_lang$core$List$foldr,
					F2(
						function (x, y) {
							return {ctor: '::', _0: x, _1: y};
						}),
					ys,
					xs);
			}
		});
	var _elm_lang$core$List$concat = function (lists) {
		return A3(
			_elm_lang$core$List$foldr,
			_elm_lang$core$List$append,
			{ctor: '[]'},
			lists);
	};
	var _elm_lang$core$List$concatMap = F2(
		function (f, list) {
			return _elm_lang$core$List$concat(
				A2(_elm_lang$core$List$map, f, list));
		});
	var _elm_lang$core$List$partition = F2(
		function (pred, list) {
			var step = F2(
				function (x, _p13) {
					var _p14 = _p13;
					var _p16 = _p14._0;
					var _p15 = _p14._1;
					return pred(x) ? {
						ctor: '_Tuple2',
						_0: {ctor: '::', _0: x, _1: _p16},
						_1: _p15
					} : {
						ctor: '_Tuple2',
						_0: _p16,
						_1: {ctor: '::', _0: x, _1: _p15}
					};
				});
			return A3(
				_elm_lang$core$List$foldr,
				step,
				{
					ctor: '_Tuple2',
					_0: {ctor: '[]'},
					_1: {ctor: '[]'}
				},
				list);
		});
	var _elm_lang$core$List$unzip = function (pairs) {
		var step = F2(
			function (_p18, _p17) {
				var _p19 = _p18;
				var _p20 = _p17;
				return {
					ctor: '_Tuple2',
					_0: {ctor: '::', _0: _p19._0, _1: _p20._0},
					_1: {ctor: '::', _0: _p19._1, _1: _p20._1}
				};
			});
		return A3(
			_elm_lang$core$List$foldr,
			step,
			{
				ctor: '_Tuple2',
				_0: {ctor: '[]'},
				_1: {ctor: '[]'}
			},
			pairs);
	};
	var _elm_lang$core$List$intersperse = F2(
		function (sep, xs) {
			var _p21 = xs;
			if (_p21.ctor === '[]') {
				return {ctor: '[]'};
			} else {
				var step = F2(
					function (x, rest) {
						return {
							ctor: '::',
							_0: sep,
							_1: {ctor: '::', _0: x, _1: rest}
						};
					});
				var spersed = A3(
					_elm_lang$core$List$foldr,
					step,
					{ctor: '[]'},
					_p21._1);
				return {ctor: '::', _0: _p21._0, _1: spersed};
			}
		});
	var _elm_lang$core$List$takeReverse = F3(
		function (n, list, taken) {
			takeReverse:
			while (true) {
				if (_elm_lang$core$Native_Utils.cmp(n, 0) < 1) {
					return taken;
				} else {
					var _p22 = list;
					if (_p22.ctor === '[]') {
						return taken;
					} else {
						var _v23 = n - 1,
							_v24 = _p22._1,
							_v25 = {ctor: '::', _0: _p22._0, _1: taken};
						n = _v23;
						list = _v24;
						taken = _v25;
						continue takeReverse;
					}
				}
			}
		});
	var _elm_lang$core$List$takeTailRec = F2(
		function (n, list) {
			return _elm_lang$core$List$reverse(
				A3(
					_elm_lang$core$List$takeReverse,
					n,
					list,
					{ctor: '[]'}));
		});
	var _elm_lang$core$List$takeFast = F3(
		function (ctr, n, list) {
			if (_elm_lang$core$Native_Utils.cmp(n, 0) < 1) {
				return {ctor: '[]'};
			} else {
				var _p23 = {ctor: '_Tuple2', _0: n, _1: list};
				_v26_5:
				do {
					_v26_1:
					do {
						if (_p23.ctor === '_Tuple2') {
							if (_p23._1.ctor === '[]') {
								return list;
							} else {
								if (_p23._1._1.ctor === '::') {
									switch (_p23._0) {
										case 1:
											break _v26_1;
										case 2:
											return {
												ctor: '::',
												_0: _p23._1._0,
												_1: {
													ctor: '::',
													_0: _p23._1._1._0,
													_1: {ctor: '[]'}
												}
											};
										case 3:
											if (_p23._1._1._1.ctor === '::') {
												return {
													ctor: '::',
													_0: _p23._1._0,
													_1: {
														ctor: '::',
														_0: _p23._1._1._0,
														_1: {
															ctor: '::',
															_0: _p23._1._1._1._0,
															_1: {ctor: '[]'}
														}
													}
												};
											} else {
												break _v26_5;
											}
										default:
											if ((_p23._1._1._1.ctor === '::') && (_p23._1._1._1._1.ctor === '::')) {
												var _p28 = _p23._1._1._1._0;
												var _p27 = _p23._1._1._0;
												var _p26 = _p23._1._0;
												var _p25 = _p23._1._1._1._1._0;
												var _p24 = _p23._1._1._1._1._1;
												return (_elm_lang$core$Native_Utils.cmp(ctr, 1000) > 0) ? {
													ctor: '::',
													_0: _p26,
													_1: {
														ctor: '::',
														_0: _p27,
														_1: {
															ctor: '::',
															_0: _p28,
															_1: {
																ctor: '::',
																_0: _p25,
																_1: A2(_elm_lang$core$List$takeTailRec, n - 4, _p24)
															}
														}
													}
												} : {
													ctor: '::',
													_0: _p26,
													_1: {
														ctor: '::',
														_0: _p27,
														_1: {
															ctor: '::',
															_0: _p28,
															_1: {
																ctor: '::',
																_0: _p25,
																_1: A3(_elm_lang$core$List$takeFast, ctr + 1, n - 4, _p24)
															}
														}
													}
												};
											} else {
												break _v26_5;
											}
									}
								} else {
									if (_p23._0 === 1) {
										break _v26_1;
									} else {
										break _v26_5;
									}
								}
							}
						} else {
							break _v26_5;
						}
					} while(false);
					return {
						ctor: '::',
						_0: _p23._1._0,
						_1: {ctor: '[]'}
					};
				} while(false);
				return list;
			}
		});
	var _elm_lang$core$List$take = F2(
		function (n, list) {
			return A3(_elm_lang$core$List$takeFast, 0, n, list);
		});
	var _elm_lang$core$List$repeatHelp = F3(
		function (result, n, value) {
			repeatHelp:
			while (true) {
				if (_elm_lang$core$Native_Utils.cmp(n, 0) < 1) {
					return result;
				} else {
					var _v27 = {ctor: '::', _0: value, _1: result},
						_v28 = n - 1,
						_v29 = value;
					result = _v27;
					n = _v28;
					value = _v29;
					continue repeatHelp;
				}
			}
		});
	var _elm_lang$core$List$repeat = F2(
		function (n, value) {
			return A3(
				_elm_lang$core$List$repeatHelp,
				{ctor: '[]'},
				n,
				value);
		});
	var _elm_lang$core$List$rangeHelp = F3(
		function (lo, hi, list) {
			rangeHelp:
			while (true) {
				if (_elm_lang$core$Native_Utils.cmp(lo, hi) < 1) {
					var _v30 = lo,
						_v31 = hi - 1,
						_v32 = {ctor: '::', _0: hi, _1: list};
					lo = _v30;
					hi = _v31;
					list = _v32;
					continue rangeHelp;
				} else {
					return list;
				}
			}
		});
	var _elm_lang$core$List$range = F2(
		function (lo, hi) {
			return A3(
				_elm_lang$core$List$rangeHelp,
				lo,
				hi,
				{ctor: '[]'});
		});
	var _elm_lang$core$List$indexedMap = F2(
		function (f, xs) {
			return A3(
				_elm_lang$core$List$map2,
				f,
				A2(
					_elm_lang$core$List$range,
					0,
					_elm_lang$core$List$length(xs) - 1),
				xs);
		});
	
	var _elm_lang$core$Array$append = _elm_lang$core$Native_Array.append;
	var _elm_lang$core$Array$length = _elm_lang$core$Native_Array.length;
	var _elm_lang$core$Array$isEmpty = function (array) {
		return _elm_lang$core$Native_Utils.eq(
			_elm_lang$core$Array$length(array),
			0);
	};
	var _elm_lang$core$Array$slice = _elm_lang$core$Native_Array.slice;
	var _elm_lang$core$Array$set = _elm_lang$core$Native_Array.set;
	var _elm_lang$core$Array$get = F2(
		function (i, array) {
			return ((_elm_lang$core$Native_Utils.cmp(0, i) < 1) && (_elm_lang$core$Native_Utils.cmp(
				i,
				_elm_lang$core$Native_Array.length(array)) < 0)) ? _elm_lang$core$Maybe$Just(
				A2(_elm_lang$core$Native_Array.get, i, array)) : _elm_lang$core$Maybe$Nothing;
		});
	var _elm_lang$core$Array$push = _elm_lang$core$Native_Array.push;
	var _elm_lang$core$Array$empty = _elm_lang$core$Native_Array.empty;
	var _elm_lang$core$Array$filter = F2(
		function (isOkay, arr) {
			var update = F2(
				function (x, xs) {
					return isOkay(x) ? A2(_elm_lang$core$Native_Array.push, x, xs) : xs;
				});
			return A3(_elm_lang$core$Native_Array.foldl, update, _elm_lang$core$Native_Array.empty, arr);
		});
	var _elm_lang$core$Array$foldr = _elm_lang$core$Native_Array.foldr;
	var _elm_lang$core$Array$foldl = _elm_lang$core$Native_Array.foldl;
	var _elm_lang$core$Array$indexedMap = _elm_lang$core$Native_Array.indexedMap;
	var _elm_lang$core$Array$map = _elm_lang$core$Native_Array.map;
	var _elm_lang$core$Array$toIndexedList = function (array) {
		return A3(
			_elm_lang$core$List$map2,
			F2(
				function (v0, v1) {
					return {ctor: '_Tuple2', _0: v0, _1: v1};
				}),
			A2(
				_elm_lang$core$List$range,
				0,
				_elm_lang$core$Native_Array.length(array) - 1),
			_elm_lang$core$Native_Array.toList(array));
	};
	var _elm_lang$core$Array$toList = _elm_lang$core$Native_Array.toList;
	var _elm_lang$core$Array$fromList = _elm_lang$core$Native_Array.fromList;
	var _elm_lang$core$Array$initialize = _elm_lang$core$Native_Array.initialize;
	var _elm_lang$core$Array$repeat = F2(
		function (n, e) {
			return A2(
				_elm_lang$core$Array$initialize,
				n,
				_elm_lang$core$Basics$always(e));
		});
	var _elm_lang$core$Array$Array = {ctor: 'Array'};
	
	//import Native.Utils //
	
	var _elm_lang$core$Native_Debug = function() {
	
	function log(tag, value)
	{
		var msg = tag + ': ' + _elm_lang$core$Native_Utils.toString(value);
		var process = process || {};
		if (process.stdout)
		{
			process.stdout.write(msg);
		}
		else
		{
			console.log(msg);
		}
		return value;
	}
	
	function crash(message)
	{
		throw new Error(message);
	}
	
	return {
		crash: crash,
		log: F2(log)
	};
	
	}();
	//import Maybe, Native.List, Native.Utils, Result //
	
	var _elm_lang$core$Native_String = function() {
	
	function isEmpty(str)
	{
		return str.length === 0;
	}
	function cons(chr, str)
	{
		return chr + str;
	}
	function uncons(str)
	{
		var hd = str[0];
		if (hd)
		{
			return _elm_lang$core$Maybe$Just(_elm_lang$core$Native_Utils.Tuple2(_elm_lang$core$Native_Utils.chr(hd), str.slice(1)));
		}
		return _elm_lang$core$Maybe$Nothing;
	}
	function append(a, b)
	{
		return a + b;
	}
	function concat(strs)
	{
		return _elm_lang$core$Native_List.toArray(strs).join('');
	}
	function length(str)
	{
		return str.length;
	}
	function map(f, str)
	{
		var out = str.split('');
		for (var i = out.length; i--; )
		{
			out[i] = f(_elm_lang$core$Native_Utils.chr(out[i]));
		}
		return out.join('');
	}
	function filter(pred, str)
	{
		return str.split('').map(_elm_lang$core$Native_Utils.chr).filter(pred).join('');
	}
	function reverse(str)
	{
		return str.split('').reverse().join('');
	}
	function foldl(f, b, str)
	{
		var len = str.length;
		for (var i = 0; i < len; ++i)
		{
			b = A2(f, _elm_lang$core$Native_Utils.chr(str[i]), b);
		}
		return b;
	}
	function foldr(f, b, str)
	{
		for (var i = str.length; i--; )
		{
			b = A2(f, _elm_lang$core$Native_Utils.chr(str[i]), b);
		}
		return b;
	}
	function split(sep, str)
	{
		return _elm_lang$core$Native_List.fromArray(str.split(sep));
	}
	function join(sep, strs)
	{
		return _elm_lang$core$Native_List.toArray(strs).join(sep);
	}
	function repeat(n, str)
	{
		var result = '';
		while (n > 0)
		{
			if (n & 1)
			{
				result += str;
			}
			n >>= 1, str += str;
		}
		return result;
	}
	function slice(start, end, str)
	{
		return str.slice(start, end);
	}
	function left(n, str)
	{
		return n < 1 ? '' : str.slice(0, n);
	}
	function right(n, str)
	{
		return n < 1 ? '' : str.slice(-n);
	}
	function dropLeft(n, str)
	{
		return n < 1 ? str : str.slice(n);
	}
	function dropRight(n, str)
	{
		return n < 1 ? str : str.slice(0, -n);
	}
	function pad(n, chr, str)
	{
		var half = (n - str.length) / 2;
		return repeat(Math.ceil(half), chr) + str + repeat(half | 0, chr);
	}
	function padRight(n, chr, str)
	{
		return str + repeat(n - str.length, chr);
	}
	function padLeft(n, chr, str)
	{
		return repeat(n - str.length, chr) + str;
	}
	
	function trim(str)
	{
		return str.trim();
	}
	function trimLeft(str)
	{
		return str.replace(/^\s+/, '');
	}
	function trimRight(str)
	{
		return str.replace(/\s+$/, '');
	}
	
	function words(str)
	{
		return _elm_lang$core$Native_List.fromArray(str.trim().split(/\s+/g));
	}
	function lines(str)
	{
		return _elm_lang$core$Native_List.fromArray(str.split(/\r\n|\r|\n/g));
	}
	
	function toUpper(str)
	{
		return str.toUpperCase();
	}
	function toLower(str)
	{
		return str.toLowerCase();
	}
	
	function any(pred, str)
	{
		for (var i = str.length; i--; )
		{
			if (pred(_elm_lang$core$Native_Utils.chr(str[i])))
			{
				return true;
			}
		}
		return false;
	}
	function all(pred, str)
	{
		for (var i = str.length; i--; )
		{
			if (!pred(_elm_lang$core$Native_Utils.chr(str[i])))
			{
				return false;
			}
		}
		return true;
	}
	
	function contains(sub, str)
	{
		return str.indexOf(sub) > -1;
	}
	function startsWith(sub, str)
	{
		return str.indexOf(sub) === 0;
	}
	function endsWith(sub, str)
	{
		return str.length >= sub.length &&
			str.lastIndexOf(sub) === str.length - sub.length;
	}
	function indexes(sub, str)
	{
		var subLen = sub.length;
	
		if (subLen < 1)
		{
			return _elm_lang$core$Native_List.Nil;
		}
	
		var i = 0;
		var is = [];
	
		while ((i = str.indexOf(sub, i)) > -1)
		{
			is.push(i);
			i = i + subLen;
		}
	
		return _elm_lang$core$Native_List.fromArray(is);
	}
	
	
	function toInt(s)
	{
		var len = s.length;
	
		// if empty
		if (len === 0)
		{
			return intErr(s);
		}
	
		// if hex
		var c = s[0];
		if (c === '0' && s[1] === 'x')
		{
			for (var i = 2; i < len; ++i)
			{
				var c = s[i];
				if (('0' <= c && c <= '9') || ('A' <= c && c <= 'F') || ('a' <= c && c <= 'f'))
				{
					continue;
				}
				return intErr(s);
			}
			return _elm_lang$core$Result$Ok(parseInt(s, 16));
		}
	
		// is decimal
		if (c > '9' || (c < '0' && c !== '-' && c !== '+'))
		{
			return intErr(s);
		}
		for (var i = 1; i < len; ++i)
		{
			var c = s[i];
			if (c < '0' || '9' < c)
			{
				return intErr(s);
			}
		}
	
		return _elm_lang$core$Result$Ok(parseInt(s, 10));
	}
	
	function intErr(s)
	{
		return _elm_lang$core$Result$Err("could not convert string '" + s + "' to an Int");
	}
	
	
	function toFloat(s)
	{
		// check if it is a hex, octal, or binary number
		if (s.length === 0 || /[\sxbo]/.test(s))
		{
			return floatErr(s);
		}
		var n = +s;
		// faster isNaN check
		return n === n ? _elm_lang$core$Result$Ok(n) : floatErr(s);
	}
	
	function floatErr(s)
	{
		return _elm_lang$core$Result$Err("could not convert string '" + s + "' to a Float");
	}
	
	
	function toList(str)
	{
		return _elm_lang$core$Native_List.fromArray(str.split('').map(_elm_lang$core$Native_Utils.chr));
	}
	function fromList(chars)
	{
		return _elm_lang$core$Native_List.toArray(chars).join('');
	}
	
	return {
		isEmpty: isEmpty,
		cons: F2(cons),
		uncons: uncons,
		append: F2(append),
		concat: concat,
		length: length,
		map: F2(map),
		filter: F2(filter),
		reverse: reverse,
		foldl: F3(foldl),
		foldr: F3(foldr),
	
		split: F2(split),
		join: F2(join),
		repeat: F2(repeat),
	
		slice: F3(slice),
		left: F2(left),
		right: F2(right),
		dropLeft: F2(dropLeft),
		dropRight: F2(dropRight),
	
		pad: F3(pad),
		padLeft: F3(padLeft),
		padRight: F3(padRight),
	
		trim: trim,
		trimLeft: trimLeft,
		trimRight: trimRight,
	
		words: words,
		lines: lines,
	
		toUpper: toUpper,
		toLower: toLower,
	
		any: F2(any),
		all: F2(all),
	
		contains: F2(contains),
		startsWith: F2(startsWith),
		endsWith: F2(endsWith),
		indexes: F2(indexes),
	
		toInt: toInt,
		toFloat: toFloat,
		toList: toList,
		fromList: fromList
	};
	
	}();
	
	//import Native.Utils //
	
	var _elm_lang$core$Native_Char = function() {
	
	return {
		fromCode: function(c) { return _elm_lang$core$Native_Utils.chr(String.fromCharCode(c)); },
		toCode: function(c) { return c.charCodeAt(0); },
		toUpper: function(c) { return _elm_lang$core$Native_Utils.chr(c.toUpperCase()); },
		toLower: function(c) { return _elm_lang$core$Native_Utils.chr(c.toLowerCase()); },
		toLocaleUpper: function(c) { return _elm_lang$core$Native_Utils.chr(c.toLocaleUpperCase()); },
		toLocaleLower: function(c) { return _elm_lang$core$Native_Utils.chr(c.toLocaleLowerCase()); }
	};
	
	}();
	var _elm_lang$core$Char$fromCode = _elm_lang$core$Native_Char.fromCode;
	var _elm_lang$core$Char$toCode = _elm_lang$core$Native_Char.toCode;
	var _elm_lang$core$Char$toLocaleLower = _elm_lang$core$Native_Char.toLocaleLower;
	var _elm_lang$core$Char$toLocaleUpper = _elm_lang$core$Native_Char.toLocaleUpper;
	var _elm_lang$core$Char$toLower = _elm_lang$core$Native_Char.toLower;
	var _elm_lang$core$Char$toUpper = _elm_lang$core$Native_Char.toUpper;
	var _elm_lang$core$Char$isBetween = F3(
		function (low, high, $char) {
			var code = _elm_lang$core$Char$toCode($char);
			return (_elm_lang$core$Native_Utils.cmp(
				code,
				_elm_lang$core$Char$toCode(low)) > -1) && (_elm_lang$core$Native_Utils.cmp(
				code,
				_elm_lang$core$Char$toCode(high)) < 1);
		});
	var _elm_lang$core$Char$isUpper = A2(
		_elm_lang$core$Char$isBetween,
		_elm_lang$core$Native_Utils.chr('A'),
		_elm_lang$core$Native_Utils.chr('Z'));
	var _elm_lang$core$Char$isLower = A2(
		_elm_lang$core$Char$isBetween,
		_elm_lang$core$Native_Utils.chr('a'),
		_elm_lang$core$Native_Utils.chr('z'));
	var _elm_lang$core$Char$isDigit = A2(
		_elm_lang$core$Char$isBetween,
		_elm_lang$core$Native_Utils.chr('0'),
		_elm_lang$core$Native_Utils.chr('9'));
	var _elm_lang$core$Char$isOctDigit = A2(
		_elm_lang$core$Char$isBetween,
		_elm_lang$core$Native_Utils.chr('0'),
		_elm_lang$core$Native_Utils.chr('7'));
	var _elm_lang$core$Char$isHexDigit = function ($char) {
		return _elm_lang$core$Char$isDigit($char) || (A3(
			_elm_lang$core$Char$isBetween,
			_elm_lang$core$Native_Utils.chr('a'),
			_elm_lang$core$Native_Utils.chr('f'),
			$char) || A3(
			_elm_lang$core$Char$isBetween,
			_elm_lang$core$Native_Utils.chr('A'),
			_elm_lang$core$Native_Utils.chr('F'),
			$char));
	};
	
	var _elm_lang$core$Result$toMaybe = function (result) {
		var _p0 = result;
		if (_p0.ctor === 'Ok') {
			return _elm_lang$core$Maybe$Just(_p0._0);
		} else {
			return _elm_lang$core$Maybe$Nothing;
		}
	};
	var _elm_lang$core$Result$withDefault = F2(
		function (def, result) {
			var _p1 = result;
			if (_p1.ctor === 'Ok') {
				return _p1._0;
			} else {
				return def;
			}
		});
	var _elm_lang$core$Result$Err = function (a) {
		return {ctor: 'Err', _0: a};
	};
	var _elm_lang$core$Result$andThen = F2(
		function (callback, result) {
			var _p2 = result;
			if (_p2.ctor === 'Ok') {
				return callback(_p2._0);
			} else {
				return _elm_lang$core$Result$Err(_p2._0);
			}
		});
	var _elm_lang$core$Result$Ok = function (a) {
		return {ctor: 'Ok', _0: a};
	};
	var _elm_lang$core$Result$map = F2(
		function (func, ra) {
			var _p3 = ra;
			if (_p3.ctor === 'Ok') {
				return _elm_lang$core$Result$Ok(
					func(_p3._0));
			} else {
				return _elm_lang$core$Result$Err(_p3._0);
			}
		});
	var _elm_lang$core$Result$map2 = F3(
		function (func, ra, rb) {
			var _p4 = {ctor: '_Tuple2', _0: ra, _1: rb};
			if (_p4._0.ctor === 'Ok') {
				if (_p4._1.ctor === 'Ok') {
					return _elm_lang$core$Result$Ok(
						A2(func, _p4._0._0, _p4._1._0));
				} else {
					return _elm_lang$core$Result$Err(_p4._1._0);
				}
			} else {
				return _elm_lang$core$Result$Err(_p4._0._0);
			}
		});
	var _elm_lang$core$Result$map3 = F4(
		function (func, ra, rb, rc) {
			var _p5 = {ctor: '_Tuple3', _0: ra, _1: rb, _2: rc};
			if (_p5._0.ctor === 'Ok') {
				if (_p5._1.ctor === 'Ok') {
					if (_p5._2.ctor === 'Ok') {
						return _elm_lang$core$Result$Ok(
							A3(func, _p5._0._0, _p5._1._0, _p5._2._0));
					} else {
						return _elm_lang$core$Result$Err(_p5._2._0);
					}
				} else {
					return _elm_lang$core$Result$Err(_p5._1._0);
				}
			} else {
				return _elm_lang$core$Result$Err(_p5._0._0);
			}
		});
	var _elm_lang$core$Result$map4 = F5(
		function (func, ra, rb, rc, rd) {
			var _p6 = {ctor: '_Tuple4', _0: ra, _1: rb, _2: rc, _3: rd};
			if (_p6._0.ctor === 'Ok') {
				if (_p6._1.ctor === 'Ok') {
					if (_p6._2.ctor === 'Ok') {
						if (_p6._3.ctor === 'Ok') {
							return _elm_lang$core$Result$Ok(
								A4(func, _p6._0._0, _p6._1._0, _p6._2._0, _p6._3._0));
						} else {
							return _elm_lang$core$Result$Err(_p6._3._0);
						}
					} else {
						return _elm_lang$core$Result$Err(_p6._2._0);
					}
				} else {
					return _elm_lang$core$Result$Err(_p6._1._0);
				}
			} else {
				return _elm_lang$core$Result$Err(_p6._0._0);
			}
		});
	var _elm_lang$core$Result$map5 = F6(
		function (func, ra, rb, rc, rd, re) {
			var _p7 = {ctor: '_Tuple5', _0: ra, _1: rb, _2: rc, _3: rd, _4: re};
			if (_p7._0.ctor === 'Ok') {
				if (_p7._1.ctor === 'Ok') {
					if (_p7._2.ctor === 'Ok') {
						if (_p7._3.ctor === 'Ok') {
							if (_p7._4.ctor === 'Ok') {
								return _elm_lang$core$Result$Ok(
									A5(func, _p7._0._0, _p7._1._0, _p7._2._0, _p7._3._0, _p7._4._0));
							} else {
								return _elm_lang$core$Result$Err(_p7._4._0);
							}
						} else {
							return _elm_lang$core$Result$Err(_p7._3._0);
						}
					} else {
						return _elm_lang$core$Result$Err(_p7._2._0);
					}
				} else {
					return _elm_lang$core$Result$Err(_p7._1._0);
				}
			} else {
				return _elm_lang$core$Result$Err(_p7._0._0);
			}
		});
	var _elm_lang$core$Result$mapError = F2(
		function (f, result) {
			var _p8 = result;
			if (_p8.ctor === 'Ok') {
				return _elm_lang$core$Result$Ok(_p8._0);
			} else {
				return _elm_lang$core$Result$Err(
					f(_p8._0));
			}
		});
	var _elm_lang$core$Result$fromMaybe = F2(
		function (err, maybe) {
			var _p9 = maybe;
			if (_p9.ctor === 'Just') {
				return _elm_lang$core$Result$Ok(_p9._0);
			} else {
				return _elm_lang$core$Result$Err(err);
			}
		});
	
	var _elm_lang$core$String$fromList = _elm_lang$core$Native_String.fromList;
	var _elm_lang$core$String$toList = _elm_lang$core$Native_String.toList;
	var _elm_lang$core$String$toFloat = _elm_lang$core$Native_String.toFloat;
	var _elm_lang$core$String$toInt = _elm_lang$core$Native_String.toInt;
	var _elm_lang$core$String$indices = _elm_lang$core$Native_String.indexes;
	var _elm_lang$core$String$indexes = _elm_lang$core$Native_String.indexes;
	var _elm_lang$core$String$endsWith = _elm_lang$core$Native_String.endsWith;
	var _elm_lang$core$String$startsWith = _elm_lang$core$Native_String.startsWith;
	var _elm_lang$core$String$contains = _elm_lang$core$Native_String.contains;
	var _elm_lang$core$String$all = _elm_lang$core$Native_String.all;
	var _elm_lang$core$String$any = _elm_lang$core$Native_String.any;
	var _elm_lang$core$String$toLower = _elm_lang$core$Native_String.toLower;
	var _elm_lang$core$String$toUpper = _elm_lang$core$Native_String.toUpper;
	var _elm_lang$core$String$lines = _elm_lang$core$Native_String.lines;
	var _elm_lang$core$String$words = _elm_lang$core$Native_String.words;
	var _elm_lang$core$String$trimRight = _elm_lang$core$Native_String.trimRight;
	var _elm_lang$core$String$trimLeft = _elm_lang$core$Native_String.trimLeft;
	var _elm_lang$core$String$trim = _elm_lang$core$Native_String.trim;
	var _elm_lang$core$String$padRight = _elm_lang$core$Native_String.padRight;
	var _elm_lang$core$String$padLeft = _elm_lang$core$Native_String.padLeft;
	var _elm_lang$core$String$pad = _elm_lang$core$Native_String.pad;
	var _elm_lang$core$String$dropRight = _elm_lang$core$Native_String.dropRight;
	var _elm_lang$core$String$dropLeft = _elm_lang$core$Native_String.dropLeft;
	var _elm_lang$core$String$right = _elm_lang$core$Native_String.right;
	var _elm_lang$core$String$left = _elm_lang$core$Native_String.left;
	var _elm_lang$core$String$slice = _elm_lang$core$Native_String.slice;
	var _elm_lang$core$String$repeat = _elm_lang$core$Native_String.repeat;
	var _elm_lang$core$String$join = _elm_lang$core$Native_String.join;
	var _elm_lang$core$String$split = _elm_lang$core$Native_String.split;
	var _elm_lang$core$String$foldr = _elm_lang$core$Native_String.foldr;
	var _elm_lang$core$String$foldl = _elm_lang$core$Native_String.foldl;
	var _elm_lang$core$String$reverse = _elm_lang$core$Native_String.reverse;
	var _elm_lang$core$String$filter = _elm_lang$core$Native_String.filter;
	var _elm_lang$core$String$map = _elm_lang$core$Native_String.map;
	var _elm_lang$core$String$length = _elm_lang$core$Native_String.length;
	var _elm_lang$core$String$concat = _elm_lang$core$Native_String.concat;
	var _elm_lang$core$String$append = _elm_lang$core$Native_String.append;
	var _elm_lang$core$String$uncons = _elm_lang$core$Native_String.uncons;
	var _elm_lang$core$String$cons = _elm_lang$core$Native_String.cons;
	var _elm_lang$core$String$fromChar = function ($char) {
		return A2(_elm_lang$core$String$cons, $char, '');
	};
	var _elm_lang$core$String$isEmpty = _elm_lang$core$Native_String.isEmpty;
	
	var _elm_lang$core$Dict$foldr = F3(
		function (f, acc, t) {
			foldr:
			while (true) {
				var _p0 = t;
				if (_p0.ctor === 'RBEmpty_elm_builtin') {
					return acc;
				} else {
					var _v1 = f,
						_v2 = A3(
						f,
						_p0._1,
						_p0._2,
						A3(_elm_lang$core$Dict$foldr, f, acc, _p0._4)),
						_v3 = _p0._3;
					f = _v1;
					acc = _v2;
					t = _v3;
					continue foldr;
				}
			}
		});
	var _elm_lang$core$Dict$keys = function (dict) {
		return A3(
			_elm_lang$core$Dict$foldr,
			F3(
				function (key, value, keyList) {
					return {ctor: '::', _0: key, _1: keyList};
				}),
			{ctor: '[]'},
			dict);
	};
	var _elm_lang$core$Dict$values = function (dict) {
		return A3(
			_elm_lang$core$Dict$foldr,
			F3(
				function (key, value, valueList) {
					return {ctor: '::', _0: value, _1: valueList};
				}),
			{ctor: '[]'},
			dict);
	};
	var _elm_lang$core$Dict$toList = function (dict) {
		return A3(
			_elm_lang$core$Dict$foldr,
			F3(
				function (key, value, list) {
					return {
						ctor: '::',
						_0: {ctor: '_Tuple2', _0: key, _1: value},
						_1: list
					};
				}),
			{ctor: '[]'},
			dict);
	};
	var _elm_lang$core$Dict$foldl = F3(
		function (f, acc, dict) {
			foldl:
			while (true) {
				var _p1 = dict;
				if (_p1.ctor === 'RBEmpty_elm_builtin') {
					return acc;
				} else {
					var _v5 = f,
						_v6 = A3(
						f,
						_p1._1,
						_p1._2,
						A3(_elm_lang$core$Dict$foldl, f, acc, _p1._3)),
						_v7 = _p1._4;
					f = _v5;
					acc = _v6;
					dict = _v7;
					continue foldl;
				}
			}
		});
	var _elm_lang$core$Dict$merge = F6(
		function (leftStep, bothStep, rightStep, leftDict, rightDict, initialResult) {
			var stepState = F3(
				function (rKey, rValue, _p2) {
					stepState:
					while (true) {
						var _p3 = _p2;
						var _p9 = _p3._1;
						var _p8 = _p3._0;
						var _p4 = _p8;
						if (_p4.ctor === '[]') {
							return {
								ctor: '_Tuple2',
								_0: _p8,
								_1: A3(rightStep, rKey, rValue, _p9)
							};
						} else {
							var _p7 = _p4._1;
							var _p6 = _p4._0._1;
							var _p5 = _p4._0._0;
							if (_elm_lang$core$Native_Utils.cmp(_p5, rKey) < 0) {
								var _v10 = rKey,
									_v11 = rValue,
									_v12 = {
									ctor: '_Tuple2',
									_0: _p7,
									_1: A3(leftStep, _p5, _p6, _p9)
								};
								rKey = _v10;
								rValue = _v11;
								_p2 = _v12;
								continue stepState;
							} else {
								if (_elm_lang$core$Native_Utils.cmp(_p5, rKey) > 0) {
									return {
										ctor: '_Tuple2',
										_0: _p8,
										_1: A3(rightStep, rKey, rValue, _p9)
									};
								} else {
									return {
										ctor: '_Tuple2',
										_0: _p7,
										_1: A4(bothStep, _p5, _p6, rValue, _p9)
									};
								}
							}
						}
					}
				});
			var _p10 = A3(
				_elm_lang$core$Dict$foldl,
				stepState,
				{
					ctor: '_Tuple2',
					_0: _elm_lang$core$Dict$toList(leftDict),
					_1: initialResult
				},
				rightDict);
			var leftovers = _p10._0;
			var intermediateResult = _p10._1;
			return A3(
				_elm_lang$core$List$foldl,
				F2(
					function (_p11, result) {
						var _p12 = _p11;
						return A3(leftStep, _p12._0, _p12._1, result);
					}),
				intermediateResult,
				leftovers);
		});
	var _elm_lang$core$Dict$reportRemBug = F4(
		function (msg, c, lgot, rgot) {
			return _elm_lang$core$Native_Debug.crash(
				_elm_lang$core$String$concat(
					{
						ctor: '::',
						_0: 'Internal red-black tree invariant violated, expected ',
						_1: {
							ctor: '::',
							_0: msg,
							_1: {
								ctor: '::',
								_0: ' and got ',
								_1: {
									ctor: '::',
									_0: _elm_lang$core$Basics$toString(c),
									_1: {
										ctor: '::',
										_0: '/',
										_1: {
											ctor: '::',
											_0: lgot,
											_1: {
												ctor: '::',
												_0: '/',
												_1: {
													ctor: '::',
													_0: rgot,
													_1: {
														ctor: '::',
														_0: '\nPlease report this bug to <https://github.com/elm-lang/core/issues>',
														_1: {ctor: '[]'}
													}
												}
											}
										}
									}
								}
							}
						}
					}));
		});
	var _elm_lang$core$Dict$isBBlack = function (dict) {
		var _p13 = dict;
		_v14_2:
		do {
			if (_p13.ctor === 'RBNode_elm_builtin') {
				if (_p13._0.ctor === 'BBlack') {
					return true;
				} else {
					break _v14_2;
				}
			} else {
				if (_p13._0.ctor === 'LBBlack') {
					return true;
				} else {
					break _v14_2;
				}
			}
		} while(false);
		return false;
	};
	var _elm_lang$core$Dict$sizeHelp = F2(
		function (n, dict) {
			sizeHelp:
			while (true) {
				var _p14 = dict;
				if (_p14.ctor === 'RBEmpty_elm_builtin') {
					return n;
				} else {
					var _v16 = A2(_elm_lang$core$Dict$sizeHelp, n + 1, _p14._4),
						_v17 = _p14._3;
					n = _v16;
					dict = _v17;
					continue sizeHelp;
				}
			}
		});
	var _elm_lang$core$Dict$size = function (dict) {
		return A2(_elm_lang$core$Dict$sizeHelp, 0, dict);
	};
	var _elm_lang$core$Dict$get = F2(
		function (targetKey, dict) {
			get:
			while (true) {
				var _p15 = dict;
				if (_p15.ctor === 'RBEmpty_elm_builtin') {
					return _elm_lang$core$Maybe$Nothing;
				} else {
					var _p16 = A2(_elm_lang$core$Basics$compare, targetKey, _p15._1);
					switch (_p16.ctor) {
						case 'LT':
							var _v20 = targetKey,
								_v21 = _p15._3;
							targetKey = _v20;
							dict = _v21;
							continue get;
						case 'EQ':
							return _elm_lang$core$Maybe$Just(_p15._2);
						default:
							var _v22 = targetKey,
								_v23 = _p15._4;
							targetKey = _v22;
							dict = _v23;
							continue get;
					}
				}
			}
		});
	var _elm_lang$core$Dict$member = F2(
		function (key, dict) {
			var _p17 = A2(_elm_lang$core$Dict$get, key, dict);
			if (_p17.ctor === 'Just') {
				return true;
			} else {
				return false;
			}
		});
	var _elm_lang$core$Dict$maxWithDefault = F3(
		function (k, v, r) {
			maxWithDefault:
			while (true) {
				var _p18 = r;
				if (_p18.ctor === 'RBEmpty_elm_builtin') {
					return {ctor: '_Tuple2', _0: k, _1: v};
				} else {
					var _v26 = _p18._1,
						_v27 = _p18._2,
						_v28 = _p18._4;
					k = _v26;
					v = _v27;
					r = _v28;
					continue maxWithDefault;
				}
			}
		});
	var _elm_lang$core$Dict$NBlack = {ctor: 'NBlack'};
	var _elm_lang$core$Dict$BBlack = {ctor: 'BBlack'};
	var _elm_lang$core$Dict$Black = {ctor: 'Black'};
	var _elm_lang$core$Dict$blackish = function (t) {
		var _p19 = t;
		if (_p19.ctor === 'RBNode_elm_builtin') {
			var _p20 = _p19._0;
			return _elm_lang$core$Native_Utils.eq(_p20, _elm_lang$core$Dict$Black) || _elm_lang$core$Native_Utils.eq(_p20, _elm_lang$core$Dict$BBlack);
		} else {
			return true;
		}
	};
	var _elm_lang$core$Dict$Red = {ctor: 'Red'};
	var _elm_lang$core$Dict$moreBlack = function (color) {
		var _p21 = color;
		switch (_p21.ctor) {
			case 'Black':
				return _elm_lang$core$Dict$BBlack;
			case 'Red':
				return _elm_lang$core$Dict$Black;
			case 'NBlack':
				return _elm_lang$core$Dict$Red;
			default:
				return _elm_lang$core$Native_Debug.crash('Can\'t make a double black node more black!');
		}
	};
	var _elm_lang$core$Dict$lessBlack = function (color) {
		var _p22 = color;
		switch (_p22.ctor) {
			case 'BBlack':
				return _elm_lang$core$Dict$Black;
			case 'Black':
				return _elm_lang$core$Dict$Red;
			case 'Red':
				return _elm_lang$core$Dict$NBlack;
			default:
				return _elm_lang$core$Native_Debug.crash('Can\'t make a negative black node less black!');
		}
	};
	var _elm_lang$core$Dict$LBBlack = {ctor: 'LBBlack'};
	var _elm_lang$core$Dict$LBlack = {ctor: 'LBlack'};
	var _elm_lang$core$Dict$RBEmpty_elm_builtin = function (a) {
		return {ctor: 'RBEmpty_elm_builtin', _0: a};
	};
	var _elm_lang$core$Dict$empty = _elm_lang$core$Dict$RBEmpty_elm_builtin(_elm_lang$core$Dict$LBlack);
	var _elm_lang$core$Dict$isEmpty = function (dict) {
		return _elm_lang$core$Native_Utils.eq(dict, _elm_lang$core$Dict$empty);
	};
	var _elm_lang$core$Dict$RBNode_elm_builtin = F5(
		function (a, b, c, d, e) {
			return {ctor: 'RBNode_elm_builtin', _0: a, _1: b, _2: c, _3: d, _4: e};
		});
	var _elm_lang$core$Dict$ensureBlackRoot = function (dict) {
		var _p23 = dict;
		if ((_p23.ctor === 'RBNode_elm_builtin') && (_p23._0.ctor === 'Red')) {
			return A5(_elm_lang$core$Dict$RBNode_elm_builtin, _elm_lang$core$Dict$Black, _p23._1, _p23._2, _p23._3, _p23._4);
		} else {
			return dict;
		}
	};
	var _elm_lang$core$Dict$lessBlackTree = function (dict) {
		var _p24 = dict;
		if (_p24.ctor === 'RBNode_elm_builtin') {
			return A5(
				_elm_lang$core$Dict$RBNode_elm_builtin,
				_elm_lang$core$Dict$lessBlack(_p24._0),
				_p24._1,
				_p24._2,
				_p24._3,
				_p24._4);
		} else {
			return _elm_lang$core$Dict$RBEmpty_elm_builtin(_elm_lang$core$Dict$LBlack);
		}
	};
	var _elm_lang$core$Dict$balancedTree = function (col) {
		return function (xk) {
			return function (xv) {
				return function (yk) {
					return function (yv) {
						return function (zk) {
							return function (zv) {
								return function (a) {
									return function (b) {
										return function (c) {
											return function (d) {
												return A5(
													_elm_lang$core$Dict$RBNode_elm_builtin,
													_elm_lang$core$Dict$lessBlack(col),
													yk,
													yv,
													A5(_elm_lang$core$Dict$RBNode_elm_builtin, _elm_lang$core$Dict$Black, xk, xv, a, b),
													A5(_elm_lang$core$Dict$RBNode_elm_builtin, _elm_lang$core$Dict$Black, zk, zv, c, d));
											};
										};
									};
								};
							};
						};
					};
				};
			};
		};
	};
	var _elm_lang$core$Dict$blacken = function (t) {
		var _p25 = t;
		if (_p25.ctor === 'RBEmpty_elm_builtin') {
			return _elm_lang$core$Dict$RBEmpty_elm_builtin(_elm_lang$core$Dict$LBlack);
		} else {
			return A5(_elm_lang$core$Dict$RBNode_elm_builtin, _elm_lang$core$Dict$Black, _p25._1, _p25._2, _p25._3, _p25._4);
		}
	};
	var _elm_lang$core$Dict$redden = function (t) {
		var _p26 = t;
		if (_p26.ctor === 'RBEmpty_elm_builtin') {
			return _elm_lang$core$Native_Debug.crash('can\'t make a Leaf red');
		} else {
			return A5(_elm_lang$core$Dict$RBNode_elm_builtin, _elm_lang$core$Dict$Red, _p26._1, _p26._2, _p26._3, _p26._4);
		}
	};
	var _elm_lang$core$Dict$balanceHelp = function (tree) {
		var _p27 = tree;
		_v36_6:
		do {
			_v36_5:
			do {
				_v36_4:
				do {
					_v36_3:
					do {
						_v36_2:
						do {
							_v36_1:
							do {
								_v36_0:
								do {
									if (_p27.ctor === 'RBNode_elm_builtin') {
										if (_p27._3.ctor === 'RBNode_elm_builtin') {
											if (_p27._4.ctor === 'RBNode_elm_builtin') {
												switch (_p27._3._0.ctor) {
													case 'Red':
														switch (_p27._4._0.ctor) {
															case 'Red':
																if ((_p27._3._3.ctor === 'RBNode_elm_builtin') && (_p27._3._3._0.ctor === 'Red')) {
																	break _v36_0;
																} else {
																	if ((_p27._3._4.ctor === 'RBNode_elm_builtin') && (_p27._3._4._0.ctor === 'Red')) {
																		break _v36_1;
																	} else {
																		if ((_p27._4._3.ctor === 'RBNode_elm_builtin') && (_p27._4._3._0.ctor === 'Red')) {
																			break _v36_2;
																		} else {
																			if ((_p27._4._4.ctor === 'RBNode_elm_builtin') && (_p27._4._4._0.ctor === 'Red')) {
																				break _v36_3;
																			} else {
																				break _v36_6;
																			}
																		}
																	}
																}
															case 'NBlack':
																if ((_p27._3._3.ctor === 'RBNode_elm_builtin') && (_p27._3._3._0.ctor === 'Red')) {
																	break _v36_0;
																} else {
																	if ((_p27._3._4.ctor === 'RBNode_elm_builtin') && (_p27._3._4._0.ctor === 'Red')) {
																		break _v36_1;
																	} else {
																		if (((((_p27._0.ctor === 'BBlack') && (_p27._4._3.ctor === 'RBNode_elm_builtin')) && (_p27._4._3._0.ctor === 'Black')) && (_p27._4._4.ctor === 'RBNode_elm_builtin')) && (_p27._4._4._0.ctor === 'Black')) {
																			break _v36_4;
																		} else {
																			break _v36_6;
																		}
																	}
																}
															default:
																if ((_p27._3._3.ctor === 'RBNode_elm_builtin') && (_p27._3._3._0.ctor === 'Red')) {
																	break _v36_0;
																} else {
																	if ((_p27._3._4.ctor === 'RBNode_elm_builtin') && (_p27._3._4._0.ctor === 'Red')) {
																		break _v36_1;
																	} else {
																		break _v36_6;
																	}
																}
														}
													case 'NBlack':
														switch (_p27._4._0.ctor) {
															case 'Red':
																if ((_p27._4._3.ctor === 'RBNode_elm_builtin') && (_p27._4._3._0.ctor === 'Red')) {
																	break _v36_2;
																} else {
																	if ((_p27._4._4.ctor === 'RBNode_elm_builtin') && (_p27._4._4._0.ctor === 'Red')) {
																		break _v36_3;
																	} else {
																		if (((((_p27._0.ctor === 'BBlack') && (_p27._3._3.ctor === 'RBNode_elm_builtin')) && (_p27._3._3._0.ctor === 'Black')) && (_p27._3._4.ctor === 'RBNode_elm_builtin')) && (_p27._3._4._0.ctor === 'Black')) {
																			break _v36_5;
																		} else {
																			break _v36_6;
																		}
																	}
																}
															case 'NBlack':
																if (_p27._0.ctor === 'BBlack') {
																	if ((((_p27._4._3.ctor === 'RBNode_elm_builtin') && (_p27._4._3._0.ctor === 'Black')) && (_p27._4._4.ctor === 'RBNode_elm_builtin')) && (_p27._4._4._0.ctor === 'Black')) {
																		break _v36_4;
																	} else {
																		if ((((_p27._3._3.ctor === 'RBNode_elm_builtin') && (_p27._3._3._0.ctor === 'Black')) && (_p27._3._4.ctor === 'RBNode_elm_builtin')) && (_p27._3._4._0.ctor === 'Black')) {
																			break _v36_5;
																		} else {
																			break _v36_6;
																		}
																	}
																} else {
																	break _v36_6;
																}
															default:
																if (((((_p27._0.ctor === 'BBlack') && (_p27._3._3.ctor === 'RBNode_elm_builtin')) && (_p27._3._3._0.ctor === 'Black')) && (_p27._3._4.ctor === 'RBNode_elm_builtin')) && (_p27._3._4._0.ctor === 'Black')) {
																	break _v36_5;
																} else {
																	break _v36_6;
																}
														}
													default:
														switch (_p27._4._0.ctor) {
															case 'Red':
																if ((_p27._4._3.ctor === 'RBNode_elm_builtin') && (_p27._4._3._0.ctor === 'Red')) {
																	break _v36_2;
																} else {
																	if ((_p27._4._4.ctor === 'RBNode_elm_builtin') && (_p27._4._4._0.ctor === 'Red')) {
																		break _v36_3;
																	} else {
																		break _v36_6;
																	}
																}
															case 'NBlack':
																if (((((_p27._0.ctor === 'BBlack') && (_p27._4._3.ctor === 'RBNode_elm_builtin')) && (_p27._4._3._0.ctor === 'Black')) && (_p27._4._4.ctor === 'RBNode_elm_builtin')) && (_p27._4._4._0.ctor === 'Black')) {
																	break _v36_4;
																} else {
																	break _v36_6;
																}
															default:
																break _v36_6;
														}
												}
											} else {
												switch (_p27._3._0.ctor) {
													case 'Red':
														if ((_p27._3._3.ctor === 'RBNode_elm_builtin') && (_p27._3._3._0.ctor === 'Red')) {
															break _v36_0;
														} else {
															if ((_p27._3._4.ctor === 'RBNode_elm_builtin') && (_p27._3._4._0.ctor === 'Red')) {
																break _v36_1;
															} else {
																break _v36_6;
															}
														}
													case 'NBlack':
														if (((((_p27._0.ctor === 'BBlack') && (_p27._3._3.ctor === 'RBNode_elm_builtin')) && (_p27._3._3._0.ctor === 'Black')) && (_p27._3._4.ctor === 'RBNode_elm_builtin')) && (_p27._3._4._0.ctor === 'Black')) {
															break _v36_5;
														} else {
															break _v36_6;
														}
													default:
														break _v36_6;
												}
											}
										} else {
											if (_p27._4.ctor === 'RBNode_elm_builtin') {
												switch (_p27._4._0.ctor) {
													case 'Red':
														if ((_p27._4._3.ctor === 'RBNode_elm_builtin') && (_p27._4._3._0.ctor === 'Red')) {
															break _v36_2;
														} else {
															if ((_p27._4._4.ctor === 'RBNode_elm_builtin') && (_p27._4._4._0.ctor === 'Red')) {
																break _v36_3;
															} else {
																break _v36_6;
															}
														}
													case 'NBlack':
														if (((((_p27._0.ctor === 'BBlack') && (_p27._4._3.ctor === 'RBNode_elm_builtin')) && (_p27._4._3._0.ctor === 'Black')) && (_p27._4._4.ctor === 'RBNode_elm_builtin')) && (_p27._4._4._0.ctor === 'Black')) {
															break _v36_4;
														} else {
															break _v36_6;
														}
													default:
														break _v36_6;
												}
											} else {
												break _v36_6;
											}
										}
									} else {
										break _v36_6;
									}
								} while(false);
								return _elm_lang$core$Dict$balancedTree(_p27._0)(_p27._3._3._1)(_p27._3._3._2)(_p27._3._1)(_p27._3._2)(_p27._1)(_p27._2)(_p27._3._3._3)(_p27._3._3._4)(_p27._3._4)(_p27._4);
							} while(false);
							return _elm_lang$core$Dict$balancedTree(_p27._0)(_p27._3._1)(_p27._3._2)(_p27._3._4._1)(_p27._3._4._2)(_p27._1)(_p27._2)(_p27._3._3)(_p27._3._4._3)(_p27._3._4._4)(_p27._4);
						} while(false);
						return _elm_lang$core$Dict$balancedTree(_p27._0)(_p27._1)(_p27._2)(_p27._4._3._1)(_p27._4._3._2)(_p27._4._1)(_p27._4._2)(_p27._3)(_p27._4._3._3)(_p27._4._3._4)(_p27._4._4);
					} while(false);
					return _elm_lang$core$Dict$balancedTree(_p27._0)(_p27._1)(_p27._2)(_p27._4._1)(_p27._4._2)(_p27._4._4._1)(_p27._4._4._2)(_p27._3)(_p27._4._3)(_p27._4._4._3)(_p27._4._4._4);
				} while(false);
				return A5(
					_elm_lang$core$Dict$RBNode_elm_builtin,
					_elm_lang$core$Dict$Black,
					_p27._4._3._1,
					_p27._4._3._2,
					A5(_elm_lang$core$Dict$RBNode_elm_builtin, _elm_lang$core$Dict$Black, _p27._1, _p27._2, _p27._3, _p27._4._3._3),
					A5(
						_elm_lang$core$Dict$balance,
						_elm_lang$core$Dict$Black,
						_p27._4._1,
						_p27._4._2,
						_p27._4._3._4,
						_elm_lang$core$Dict$redden(_p27._4._4)));
			} while(false);
			return A5(
				_elm_lang$core$Dict$RBNode_elm_builtin,
				_elm_lang$core$Dict$Black,
				_p27._3._4._1,
				_p27._3._4._2,
				A5(
					_elm_lang$core$Dict$balance,
					_elm_lang$core$Dict$Black,
					_p27._3._1,
					_p27._3._2,
					_elm_lang$core$Dict$redden(_p27._3._3),
					_p27._3._4._3),
				A5(_elm_lang$core$Dict$RBNode_elm_builtin, _elm_lang$core$Dict$Black, _p27._1, _p27._2, _p27._3._4._4, _p27._4));
		} while(false);
		return tree;
	};
	var _elm_lang$core$Dict$balance = F5(
		function (c, k, v, l, r) {
			var tree = A5(_elm_lang$core$Dict$RBNode_elm_builtin, c, k, v, l, r);
			return _elm_lang$core$Dict$blackish(tree) ? _elm_lang$core$Dict$balanceHelp(tree) : tree;
		});
	var _elm_lang$core$Dict$bubble = F5(
		function (c, k, v, l, r) {
			return (_elm_lang$core$Dict$isBBlack(l) || _elm_lang$core$Dict$isBBlack(r)) ? A5(
				_elm_lang$core$Dict$balance,
				_elm_lang$core$Dict$moreBlack(c),
				k,
				v,
				_elm_lang$core$Dict$lessBlackTree(l),
				_elm_lang$core$Dict$lessBlackTree(r)) : A5(_elm_lang$core$Dict$RBNode_elm_builtin, c, k, v, l, r);
		});
	var _elm_lang$core$Dict$removeMax = F5(
		function (c, k, v, l, r) {
			var _p28 = r;
			if (_p28.ctor === 'RBEmpty_elm_builtin') {
				return A3(_elm_lang$core$Dict$rem, c, l, r);
			} else {
				return A5(
					_elm_lang$core$Dict$bubble,
					c,
					k,
					v,
					l,
					A5(_elm_lang$core$Dict$removeMax, _p28._0, _p28._1, _p28._2, _p28._3, _p28._4));
			}
		});
	var _elm_lang$core$Dict$rem = F3(
		function (color, left, right) {
			var _p29 = {ctor: '_Tuple2', _0: left, _1: right};
			if (_p29._0.ctor === 'RBEmpty_elm_builtin') {
				if (_p29._1.ctor === 'RBEmpty_elm_builtin') {
					var _p30 = color;
					switch (_p30.ctor) {
						case 'Red':
							return _elm_lang$core$Dict$RBEmpty_elm_builtin(_elm_lang$core$Dict$LBlack);
						case 'Black':
							return _elm_lang$core$Dict$RBEmpty_elm_builtin(_elm_lang$core$Dict$LBBlack);
						default:
							return _elm_lang$core$Native_Debug.crash('cannot have bblack or nblack nodes at this point');
					}
				} else {
					var _p33 = _p29._1._0;
					var _p32 = _p29._0._0;
					var _p31 = {ctor: '_Tuple3', _0: color, _1: _p32, _2: _p33};
					if ((((_p31.ctor === '_Tuple3') && (_p31._0.ctor === 'Black')) && (_p31._1.ctor === 'LBlack')) && (_p31._2.ctor === 'Red')) {
						return A5(_elm_lang$core$Dict$RBNode_elm_builtin, _elm_lang$core$Dict$Black, _p29._1._1, _p29._1._2, _p29._1._3, _p29._1._4);
					} else {
						return A4(
							_elm_lang$core$Dict$reportRemBug,
							'Black/LBlack/Red',
							color,
							_elm_lang$core$Basics$toString(_p32),
							_elm_lang$core$Basics$toString(_p33));
					}
				}
			} else {
				if (_p29._1.ctor === 'RBEmpty_elm_builtin') {
					var _p36 = _p29._1._0;
					var _p35 = _p29._0._0;
					var _p34 = {ctor: '_Tuple3', _0: color, _1: _p35, _2: _p36};
					if ((((_p34.ctor === '_Tuple3') && (_p34._0.ctor === 'Black')) && (_p34._1.ctor === 'Red')) && (_p34._2.ctor === 'LBlack')) {
						return A5(_elm_lang$core$Dict$RBNode_elm_builtin, _elm_lang$core$Dict$Black, _p29._0._1, _p29._0._2, _p29._0._3, _p29._0._4);
					} else {
						return A4(
							_elm_lang$core$Dict$reportRemBug,
							'Black/Red/LBlack',
							color,
							_elm_lang$core$Basics$toString(_p35),
							_elm_lang$core$Basics$toString(_p36));
					}
				} else {
					var _p40 = _p29._0._2;
					var _p39 = _p29._0._4;
					var _p38 = _p29._0._1;
					var newLeft = A5(_elm_lang$core$Dict$removeMax, _p29._0._0, _p38, _p40, _p29._0._3, _p39);
					var _p37 = A3(_elm_lang$core$Dict$maxWithDefault, _p38, _p40, _p39);
					var k = _p37._0;
					var v = _p37._1;
					return A5(_elm_lang$core$Dict$bubble, color, k, v, newLeft, right);
				}
			}
		});
	var _elm_lang$core$Dict$map = F2(
		function (f, dict) {
			var _p41 = dict;
			if (_p41.ctor === 'RBEmpty_elm_builtin') {
				return _elm_lang$core$Dict$RBEmpty_elm_builtin(_elm_lang$core$Dict$LBlack);
			} else {
				var _p42 = _p41._1;
				return A5(
					_elm_lang$core$Dict$RBNode_elm_builtin,
					_p41._0,
					_p42,
					A2(f, _p42, _p41._2),
					A2(_elm_lang$core$Dict$map, f, _p41._3),
					A2(_elm_lang$core$Dict$map, f, _p41._4));
			}
		});
	var _elm_lang$core$Dict$Same = {ctor: 'Same'};
	var _elm_lang$core$Dict$Remove = {ctor: 'Remove'};
	var _elm_lang$core$Dict$Insert = {ctor: 'Insert'};
	var _elm_lang$core$Dict$update = F3(
		function (k, alter, dict) {
			var up = function (dict) {
				var _p43 = dict;
				if (_p43.ctor === 'RBEmpty_elm_builtin') {
					var _p44 = alter(_elm_lang$core$Maybe$Nothing);
					if (_p44.ctor === 'Nothing') {
						return {ctor: '_Tuple2', _0: _elm_lang$core$Dict$Same, _1: _elm_lang$core$Dict$empty};
					} else {
						return {
							ctor: '_Tuple2',
							_0: _elm_lang$core$Dict$Insert,
							_1: A5(_elm_lang$core$Dict$RBNode_elm_builtin, _elm_lang$core$Dict$Red, k, _p44._0, _elm_lang$core$Dict$empty, _elm_lang$core$Dict$empty)
						};
					}
				} else {
					var _p55 = _p43._2;
					var _p54 = _p43._4;
					var _p53 = _p43._3;
					var _p52 = _p43._1;
					var _p51 = _p43._0;
					var _p45 = A2(_elm_lang$core$Basics$compare, k, _p52);
					switch (_p45.ctor) {
						case 'EQ':
							var _p46 = alter(
								_elm_lang$core$Maybe$Just(_p55));
							if (_p46.ctor === 'Nothing') {
								return {
									ctor: '_Tuple2',
									_0: _elm_lang$core$Dict$Remove,
									_1: A3(_elm_lang$core$Dict$rem, _p51, _p53, _p54)
								};
							} else {
								return {
									ctor: '_Tuple2',
									_0: _elm_lang$core$Dict$Same,
									_1: A5(_elm_lang$core$Dict$RBNode_elm_builtin, _p51, _p52, _p46._0, _p53, _p54)
								};
							}
						case 'LT':
							var _p47 = up(_p53);
							var flag = _p47._0;
							var newLeft = _p47._1;
							var _p48 = flag;
							switch (_p48.ctor) {
								case 'Same':
									return {
										ctor: '_Tuple2',
										_0: _elm_lang$core$Dict$Same,
										_1: A5(_elm_lang$core$Dict$RBNode_elm_builtin, _p51, _p52, _p55, newLeft, _p54)
									};
								case 'Insert':
									return {
										ctor: '_Tuple2',
										_0: _elm_lang$core$Dict$Insert,
										_1: A5(_elm_lang$core$Dict$balance, _p51, _p52, _p55, newLeft, _p54)
									};
								default:
									return {
										ctor: '_Tuple2',
										_0: _elm_lang$core$Dict$Remove,
										_1: A5(_elm_lang$core$Dict$bubble, _p51, _p52, _p55, newLeft, _p54)
									};
							}
						default:
							var _p49 = up(_p54);
							var flag = _p49._0;
							var newRight = _p49._1;
							var _p50 = flag;
							switch (_p50.ctor) {
								case 'Same':
									return {
										ctor: '_Tuple2',
										_0: _elm_lang$core$Dict$Same,
										_1: A5(_elm_lang$core$Dict$RBNode_elm_builtin, _p51, _p52, _p55, _p53, newRight)
									};
								case 'Insert':
									return {
										ctor: '_Tuple2',
										_0: _elm_lang$core$Dict$Insert,
										_1: A5(_elm_lang$core$Dict$balance, _p51, _p52, _p55, _p53, newRight)
									};
								default:
									return {
										ctor: '_Tuple2',
										_0: _elm_lang$core$Dict$Remove,
										_1: A5(_elm_lang$core$Dict$bubble, _p51, _p52, _p55, _p53, newRight)
									};
							}
					}
				}
			};
			var _p56 = up(dict);
			var flag = _p56._0;
			var updatedDict = _p56._1;
			var _p57 = flag;
			switch (_p57.ctor) {
				case 'Same':
					return updatedDict;
				case 'Insert':
					return _elm_lang$core$Dict$ensureBlackRoot(updatedDict);
				default:
					return _elm_lang$core$Dict$blacken(updatedDict);
			}
		});
	var _elm_lang$core$Dict$insert = F3(
		function (key, value, dict) {
			return A3(
				_elm_lang$core$Dict$update,
				key,
				_elm_lang$core$Basics$always(
					_elm_lang$core$Maybe$Just(value)),
				dict);
		});
	var _elm_lang$core$Dict$singleton = F2(
		function (key, value) {
			return A3(_elm_lang$core$Dict$insert, key, value, _elm_lang$core$Dict$empty);
		});
	var _elm_lang$core$Dict$union = F2(
		function (t1, t2) {
			return A3(_elm_lang$core$Dict$foldl, _elm_lang$core$Dict$insert, t2, t1);
		});
	var _elm_lang$core$Dict$filter = F2(
		function (predicate, dictionary) {
			var add = F3(
				function (key, value, dict) {
					return A2(predicate, key, value) ? A3(_elm_lang$core$Dict$insert, key, value, dict) : dict;
				});
			return A3(_elm_lang$core$Dict$foldl, add, _elm_lang$core$Dict$empty, dictionary);
		});
	var _elm_lang$core$Dict$intersect = F2(
		function (t1, t2) {
			return A2(
				_elm_lang$core$Dict$filter,
				F2(
					function (k, _p58) {
						return A2(_elm_lang$core$Dict$member, k, t2);
					}),
				t1);
		});
	var _elm_lang$core$Dict$partition = F2(
		function (predicate, dict) {
			var add = F3(
				function (key, value, _p59) {
					var _p60 = _p59;
					var _p62 = _p60._1;
					var _p61 = _p60._0;
					return A2(predicate, key, value) ? {
						ctor: '_Tuple2',
						_0: A3(_elm_lang$core$Dict$insert, key, value, _p61),
						_1: _p62
					} : {
						ctor: '_Tuple2',
						_0: _p61,
						_1: A3(_elm_lang$core$Dict$insert, key, value, _p62)
					};
				});
			return A3(
				_elm_lang$core$Dict$foldl,
				add,
				{ctor: '_Tuple2', _0: _elm_lang$core$Dict$empty, _1: _elm_lang$core$Dict$empty},
				dict);
		});
	var _elm_lang$core$Dict$fromList = function (assocs) {
		return A3(
			_elm_lang$core$List$foldl,
			F2(
				function (_p63, dict) {
					var _p64 = _p63;
					return A3(_elm_lang$core$Dict$insert, _p64._0, _p64._1, dict);
				}),
			_elm_lang$core$Dict$empty,
			assocs);
	};
	var _elm_lang$core$Dict$remove = F2(
		function (key, dict) {
			return A3(
				_elm_lang$core$Dict$update,
				key,
				_elm_lang$core$Basics$always(_elm_lang$core$Maybe$Nothing),
				dict);
		});
	var _elm_lang$core$Dict$diff = F2(
		function (t1, t2) {
			return A3(
				_elm_lang$core$Dict$foldl,
				F3(
					function (k, v, t) {
						return A2(_elm_lang$core$Dict$remove, k, t);
					}),
				t1,
				t2);
		});
	
	//import Maybe, Native.Array, Native.List, Native.Utils, Result //
	
	var _elm_lang$core$Native_Json = function() {
	
	
	// CORE DECODERS
	
	function succeed(msg)
	{
		return {
			ctor: '<decoder>',
			tag: 'succeed',
			msg: msg
		};
	}
	
	function fail(msg)
	{
		return {
			ctor: '<decoder>',
			tag: 'fail',
			msg: msg
		};
	}
	
	function decodePrimitive(tag)
	{
		return {
			ctor: '<decoder>',
			tag: tag
		};
	}
	
	function decodeContainer(tag, decoder)
	{
		return {
			ctor: '<decoder>',
			tag: tag,
			decoder: decoder
		};
	}
	
	function decodeNull(value)
	{
		return {
			ctor: '<decoder>',
			tag: 'null',
			value: value
		};
	}
	
	function decodeField(field, decoder)
	{
		return {
			ctor: '<decoder>',
			tag: 'field',
			field: field,
			decoder: decoder
		};
	}
	
	function decodeIndex(index, decoder)
	{
		return {
			ctor: '<decoder>',
			tag: 'index',
			index: index,
			decoder: decoder
		};
	}
	
	function decodeKeyValuePairs(decoder)
	{
		return {
			ctor: '<decoder>',
			tag: 'key-value',
			decoder: decoder
		};
	}
	
	function mapMany(f, decoders)
	{
		return {
			ctor: '<decoder>',
			tag: 'map-many',
			func: f,
			decoders: decoders
		};
	}
	
	function andThen(callback, decoder)
	{
		return {
			ctor: '<decoder>',
			tag: 'andThen',
			decoder: decoder,
			callback: callback
		};
	}
	
	function oneOf(decoders)
	{
		return {
			ctor: '<decoder>',
			tag: 'oneOf',
			decoders: decoders
		};
	}
	
	
	// DECODING OBJECTS
	
	function map1(f, d1)
	{
		return mapMany(f, [d1]);
	}
	
	function map2(f, d1, d2)
	{
		return mapMany(f, [d1, d2]);
	}
	
	function map3(f, d1, d2, d3)
	{
		return mapMany(f, [d1, d2, d3]);
	}
	
	function map4(f, d1, d2, d3, d4)
	{
		return mapMany(f, [d1, d2, d3, d4]);
	}
	
	function map5(f, d1, d2, d3, d4, d5)
	{
		return mapMany(f, [d1, d2, d3, d4, d5]);
	}
	
	function map6(f, d1, d2, d3, d4, d5, d6)
	{
		return mapMany(f, [d1, d2, d3, d4, d5, d6]);
	}
	
	function map7(f, d1, d2, d3, d4, d5, d6, d7)
	{
		return mapMany(f, [d1, d2, d3, d4, d5, d6, d7]);
	}
	
	function map8(f, d1, d2, d3, d4, d5, d6, d7, d8)
	{
		return mapMany(f, [d1, d2, d3, d4, d5, d6, d7, d8]);
	}
	
	
	// DECODE HELPERS
	
	function ok(value)
	{
		return { tag: 'ok', value: value };
	}
	
	function badPrimitive(type, value)
	{
		return { tag: 'primitive', type: type, value: value };
	}
	
	function badIndex(index, nestedProblems)
	{
		return { tag: 'index', index: index, rest: nestedProblems };
	}
	
	function badField(field, nestedProblems)
	{
		return { tag: 'field', field: field, rest: nestedProblems };
	}
	
	function badIndex(index, nestedProblems)
	{
		return { tag: 'index', index: index, rest: nestedProblems };
	}
	
	function badOneOf(problems)
	{
		return { tag: 'oneOf', problems: problems };
	}
	
	function bad(msg)
	{
		return { tag: 'fail', msg: msg };
	}
	
	function badToString(problem)
	{
		var context = '_';
		while (problem)
		{
			switch (problem.tag)
			{
				case 'primitive':
					return 'Expecting ' + problem.type
						+ (context === '_' ? '' : ' at ' + context)
						+ ' but instead got: ' + jsToString(problem.value);
	
				case 'index':
					context += '[' + problem.index + ']';
					problem = problem.rest;
					break;
	
				case 'field':
					context += '.' + problem.field;
					problem = problem.rest;
					break;
	
				case 'oneOf':
					var problems = problem.problems;
					for (var i = 0; i < problems.length; i++)
					{
						problems[i] = badToString(problems[i]);
					}
					return 'I ran into the following problems'
						+ (context === '_' ? '' : ' at ' + context)
						+ ':\n\n' + problems.join('\n');
	
				case 'fail':
					return 'I ran into a `fail` decoder'
						+ (context === '_' ? '' : ' at ' + context)
						+ ': ' + problem.msg;
			}
		}
	}
	
	function jsToString(value)
	{
		return value === undefined
			? 'undefined'
			: JSON.stringify(value);
	}
	
	
	// DECODE
	
	function runOnString(decoder, string)
	{
		var json;
		try
		{
			json = JSON.parse(string);
		}
		catch (e)
		{
			return _elm_lang$core$Result$Err('Given an invalid JSON: ' + e.message);
		}
		return run(decoder, json);
	}
	
	function run(decoder, value)
	{
		var result = runHelp(decoder, value);
		return (result.tag === 'ok')
			? _elm_lang$core$Result$Ok(result.value)
			: _elm_lang$core$Result$Err(badToString(result));
	}
	
	function runHelp(decoder, value)
	{
		switch (decoder.tag)
		{
			case 'bool':
				return (typeof value === 'boolean')
					? ok(value)
					: badPrimitive('a Bool', value);
	
			case 'int':
				if (typeof value !== 'number') {
					return badPrimitive('an Int', value);
				}
	
				if (-2147483647 < value && value < 2147483647 && (value | 0) === value) {
					return ok(value);
				}
	
				if (isFinite(value) && !(value % 1)) {
					return ok(value);
				}
	
				return badPrimitive('an Int', value);
	
			case 'float':
				return (typeof value === 'number')
					? ok(value)
					: badPrimitive('a Float', value);
	
			case 'string':
				return (typeof value === 'string')
					? ok(value)
					: (value instanceof String)
						? ok(value + '')
						: badPrimitive('a String', value);
	
			case 'null':
				return (value === null)
					? ok(decoder.value)
					: badPrimitive('null', value);
	
			case 'value':
				return ok(value);
	
			case 'list':
				if (!(value instanceof Array))
				{
					return badPrimitive('a List', value);
				}
	
				var list = _elm_lang$core$Native_List.Nil;
				for (var i = value.length; i--; )
				{
					var result = runHelp(decoder.decoder, value[i]);
					if (result.tag !== 'ok')
					{
						return badIndex(i, result)
					}
					list = _elm_lang$core$Native_List.Cons(result.value, list);
				}
				return ok(list);
	
			case 'array':
				if (!(value instanceof Array))
				{
					return badPrimitive('an Array', value);
				}
	
				var len = value.length;
				var array = new Array(len);
				for (var i = len; i--; )
				{
					var result = runHelp(decoder.decoder, value[i]);
					if (result.tag !== 'ok')
					{
						return badIndex(i, result);
					}
					array[i] = result.value;
				}
				return ok(_elm_lang$core$Native_Array.fromJSArray(array));
	
			case 'maybe':
				var result = runHelp(decoder.decoder, value);
				return (result.tag === 'ok')
					? ok(_elm_lang$core$Maybe$Just(result.value))
					: ok(_elm_lang$core$Maybe$Nothing);
	
			case 'field':
				var field = decoder.field;
				if (typeof value !== 'object' || value === null || !(field in value))
				{
					return badPrimitive('an object with a field named `' + field + '`', value);
				}
	
				var result = runHelp(decoder.decoder, value[field]);
				return (result.tag === 'ok') ? result : badField(field, result);
	
			case 'index':
				var index = decoder.index;
				if (!(value instanceof Array))
				{
					return badPrimitive('an array', value);
				}
				if (index >= value.length)
				{
					return badPrimitive('a longer array. Need index ' + index + ' but there are only ' + value.length + ' entries', value);
				}
	
				var result = runHelp(decoder.decoder, value[index]);
				return (result.tag === 'ok') ? result : badIndex(index, result);
	
			case 'key-value':
				if (typeof value !== 'object' || value === null || value instanceof Array)
				{
					return badPrimitive('an object', value);
				}
	
				var keyValuePairs = _elm_lang$core$Native_List.Nil;
				for (var key in value)
				{
					var result = runHelp(decoder.decoder, value[key]);
					if (result.tag !== 'ok')
					{
						return badField(key, result);
					}
					var pair = _elm_lang$core$Native_Utils.Tuple2(key, result.value);
					keyValuePairs = _elm_lang$core$Native_List.Cons(pair, keyValuePairs);
				}
				return ok(keyValuePairs);
	
			case 'map-many':
				var answer = decoder.func;
				var decoders = decoder.decoders;
				for (var i = 0; i < decoders.length; i++)
				{
					var result = runHelp(decoders[i], value);
					if (result.tag !== 'ok')
					{
						return result;
					}
					answer = answer(result.value);
				}
				return ok(answer);
	
			case 'andThen':
				var result = runHelp(decoder.decoder, value);
				return (result.tag !== 'ok')
					? result
					: runHelp(decoder.callback(result.value), value);
	
			case 'oneOf':
				var errors = [];
				var temp = decoder.decoders;
				while (temp.ctor !== '[]')
				{
					var result = runHelp(temp._0, value);
	
					if (result.tag === 'ok')
					{
						return result;
					}
	
					errors.push(result);
	
					temp = temp._1;
				}
				return badOneOf(errors);
	
			case 'fail':
				return bad(decoder.msg);
	
			case 'succeed':
				return ok(decoder.msg);
		}
	}
	
	
	// EQUALITY
	
	function equality(a, b)
	{
		if (a === b)
		{
			return true;
		}
	
		if (a.tag !== b.tag)
		{
			return false;
		}
	
		switch (a.tag)
		{
			case 'succeed':
			case 'fail':
				return a.msg === b.msg;
	
			case 'bool':
			case 'int':
			case 'float':
			case 'string':
			case 'value':
				return true;
	
			case 'null':
				return a.value === b.value;
	
			case 'list':
			case 'array':
			case 'maybe':
			case 'key-value':
				return equality(a.decoder, b.decoder);
	
			case 'field':
				return a.field === b.field && equality(a.decoder, b.decoder);
	
			case 'index':
				return a.index === b.index && equality(a.decoder, b.decoder);
	
			case 'map-many':
				if (a.func !== b.func)
				{
					return false;
				}
				return listEquality(a.decoders, b.decoders);
	
			case 'andThen':
				return a.callback === b.callback && equality(a.decoder, b.decoder);
	
			case 'oneOf':
				return listEquality(a.decoders, b.decoders);
		}
	}
	
	function listEquality(aDecoders, bDecoders)
	{
		var len = aDecoders.length;
		if (len !== bDecoders.length)
		{
			return false;
		}
		for (var i = 0; i < len; i++)
		{
			if (!equality(aDecoders[i], bDecoders[i]))
			{
				return false;
			}
		}
		return true;
	}
	
	
	// ENCODE
	
	function encode(indentLevel, value)
	{
		return JSON.stringify(value, null, indentLevel);
	}
	
	function identity(value)
	{
		return value;
	}
	
	function encodeObject(keyValuePairs)
	{
		var obj = {};
		while (keyValuePairs.ctor !== '[]')
		{
			var pair = keyValuePairs._0;
			obj[pair._0] = pair._1;
			keyValuePairs = keyValuePairs._1;
		}
		return obj;
	}
	
	return {
		encode: F2(encode),
		runOnString: F2(runOnString),
		run: F2(run),
	
		decodeNull: decodeNull,
		decodePrimitive: decodePrimitive,
		decodeContainer: F2(decodeContainer),
	
		decodeField: F2(decodeField),
		decodeIndex: F2(decodeIndex),
	
		map1: F2(map1),
		map2: F3(map2),
		map3: F4(map3),
		map4: F5(map4),
		map5: F6(map5),
		map6: F7(map6),
		map7: F8(map7),
		map8: F9(map8),
		decodeKeyValuePairs: decodeKeyValuePairs,
	
		andThen: F2(andThen),
		fail: fail,
		succeed: succeed,
		oneOf: oneOf,
	
		identity: identity,
		encodeNull: null,
		encodeArray: _elm_lang$core$Native_Array.toJSArray,
		encodeList: _elm_lang$core$Native_List.toArray,
		encodeObject: encodeObject,
	
		equality: equality
	};
	
	}();
	
	var _elm_lang$core$Json_Encode$list = _elm_lang$core$Native_Json.encodeList;
	var _elm_lang$core$Json_Encode$array = _elm_lang$core$Native_Json.encodeArray;
	var _elm_lang$core$Json_Encode$object = _elm_lang$core$Native_Json.encodeObject;
	var _elm_lang$core$Json_Encode$null = _elm_lang$core$Native_Json.encodeNull;
	var _elm_lang$core$Json_Encode$bool = _elm_lang$core$Native_Json.identity;
	var _elm_lang$core$Json_Encode$float = _elm_lang$core$Native_Json.identity;
	var _elm_lang$core$Json_Encode$int = _elm_lang$core$Native_Json.identity;
	var _elm_lang$core$Json_Encode$string = _elm_lang$core$Native_Json.identity;
	var _elm_lang$core$Json_Encode$encode = _elm_lang$core$Native_Json.encode;
	var _elm_lang$core$Json_Encode$Value = {ctor: 'Value'};
	
	var _elm_lang$core$Json_Decode$null = _elm_lang$core$Native_Json.decodeNull;
	var _elm_lang$core$Json_Decode$value = _elm_lang$core$Native_Json.decodePrimitive('value');
	var _elm_lang$core$Json_Decode$andThen = _elm_lang$core$Native_Json.andThen;
	var _elm_lang$core$Json_Decode$fail = _elm_lang$core$Native_Json.fail;
	var _elm_lang$core$Json_Decode$succeed = _elm_lang$core$Native_Json.succeed;
	var _elm_lang$core$Json_Decode$lazy = function (thunk) {
		return A2(
			_elm_lang$core$Json_Decode$andThen,
			thunk,
			_elm_lang$core$Json_Decode$succeed(
				{ctor: '_Tuple0'}));
	};
	var _elm_lang$core$Json_Decode$decodeValue = _elm_lang$core$Native_Json.run;
	var _elm_lang$core$Json_Decode$decodeString = _elm_lang$core$Native_Json.runOnString;
	var _elm_lang$core$Json_Decode$map8 = _elm_lang$core$Native_Json.map8;
	var _elm_lang$core$Json_Decode$map7 = _elm_lang$core$Native_Json.map7;
	var _elm_lang$core$Json_Decode$map6 = _elm_lang$core$Native_Json.map6;
	var _elm_lang$core$Json_Decode$map5 = _elm_lang$core$Native_Json.map5;
	var _elm_lang$core$Json_Decode$map4 = _elm_lang$core$Native_Json.map4;
	var _elm_lang$core$Json_Decode$map3 = _elm_lang$core$Native_Json.map3;
	var _elm_lang$core$Json_Decode$map2 = _elm_lang$core$Native_Json.map2;
	var _elm_lang$core$Json_Decode$map = _elm_lang$core$Native_Json.map1;
	var _elm_lang$core$Json_Decode$oneOf = _elm_lang$core$Native_Json.oneOf;
	var _elm_lang$core$Json_Decode$maybe = function (decoder) {
		return A2(_elm_lang$core$Native_Json.decodeContainer, 'maybe', decoder);
	};
	var _elm_lang$core$Json_Decode$index = _elm_lang$core$Native_Json.decodeIndex;
	var _elm_lang$core$Json_Decode$field = _elm_lang$core$Native_Json.decodeField;
	var _elm_lang$core$Json_Decode$at = F2(
		function (fields, decoder) {
			return A3(_elm_lang$core$List$foldr, _elm_lang$core$Json_Decode$field, decoder, fields);
		});
	var _elm_lang$core$Json_Decode$keyValuePairs = _elm_lang$core$Native_Json.decodeKeyValuePairs;
	var _elm_lang$core$Json_Decode$dict = function (decoder) {
		return A2(
			_elm_lang$core$Json_Decode$map,
			_elm_lang$core$Dict$fromList,
			_elm_lang$core$Json_Decode$keyValuePairs(decoder));
	};
	var _elm_lang$core$Json_Decode$array = function (decoder) {
		return A2(_elm_lang$core$Native_Json.decodeContainer, 'array', decoder);
	};
	var _elm_lang$core$Json_Decode$list = function (decoder) {
		return A2(_elm_lang$core$Native_Json.decodeContainer, 'list', decoder);
	};
	var _elm_lang$core$Json_Decode$nullable = function (decoder) {
		return _elm_lang$core$Json_Decode$oneOf(
			{
				ctor: '::',
				_0: _elm_lang$core$Json_Decode$null(_elm_lang$core$Maybe$Nothing),
				_1: {
					ctor: '::',
					_0: A2(_elm_lang$core$Json_Decode$map, _elm_lang$core$Maybe$Just, decoder),
					_1: {ctor: '[]'}
				}
			});
	};
	var _elm_lang$core$Json_Decode$float = _elm_lang$core$Native_Json.decodePrimitive('float');
	var _elm_lang$core$Json_Decode$int = _elm_lang$core$Native_Json.decodePrimitive('int');
	var _elm_lang$core$Json_Decode$bool = _elm_lang$core$Native_Json.decodePrimitive('bool');
	var _elm_lang$core$Json_Decode$string = _elm_lang$core$Native_Json.decodePrimitive('string');
	var _elm_lang$core$Json_Decode$Decoder = {ctor: 'Decoder'};
	
	var _elm_lang$core$Debug$crash = _elm_lang$core$Native_Debug.crash;
	var _elm_lang$core$Debug$log = _elm_lang$core$Native_Debug.log;
	
	var _elm_lang$core$Tuple$mapSecond = F2(
		function (func, _p0) {
			var _p1 = _p0;
			return {
				ctor: '_Tuple2',
				_0: _p1._0,
				_1: func(_p1._1)
			};
		});
	var _elm_lang$core$Tuple$mapFirst = F2(
		function (func, _p2) {
			var _p3 = _p2;
			return {
				ctor: '_Tuple2',
				_0: func(_p3._0),
				_1: _p3._1
			};
		});
	var _elm_lang$core$Tuple$second = function (_p4) {
		var _p5 = _p4;
		return _p5._1;
	};
	var _elm_lang$core$Tuple$first = function (_p6) {
		var _p7 = _p6;
		return _p7._0;
	};
	
	//import //
	
	var _elm_lang$core$Native_Platform = function() {
	
	
	// PROGRAMS
	
	function program(impl)
	{
		return function(flagDecoder)
		{
			return function(object, moduleName)
			{
				object['worker'] = function worker(flags)
				{
					if (typeof flags !== 'undefined')
					{
						throw new Error(
							'The `' + moduleName + '` module does not need flags.\n'
							+ 'Call ' + moduleName + '.worker() with no arguments and you should be all set!'
						);
					}
	
					return initialize(
						impl.init,
						impl.update,
						impl.subscriptions,
						renderer
					);
				};
			};
		};
	}
	
	function programWithFlags(impl)
	{
		return function(flagDecoder)
		{
			return function(object, moduleName)
			{
				object['worker'] = function worker(flags)
				{
					if (typeof flagDecoder === 'undefined')
					{
						throw new Error(
							'Are you trying to sneak a Never value into Elm? Trickster!\n'
							+ 'It looks like ' + moduleName + '.main is defined with `programWithFlags` but has type `Program Never`.\n'
							+ 'Use `program` instead if you do not want flags.'
						);
					}
	
					var result = A2(_elm_lang$core$Native_Json.run, flagDecoder, flags);
					if (result.ctor === 'Err')
					{
						throw new Error(
							moduleName + '.worker(...) was called with an unexpected argument.\n'
							+ 'I tried to convert it to an Elm value, but ran into this problem:\n\n'
							+ result._0
						);
					}
	
					return initialize(
						impl.init(result._0),
						impl.update,
						impl.subscriptions,
						renderer
					);
				};
			};
		};
	}
	
	function renderer(enqueue, _)
	{
		return function(_) {};
	}
	
	
	// HTML TO PROGRAM
	
	function htmlToProgram(vnode)
	{
		var emptyBag = batch(_elm_lang$core$Native_List.Nil);
		var noChange = _elm_lang$core$Native_Utils.Tuple2(
			_elm_lang$core$Native_Utils.Tuple0,
			emptyBag
		);
	
		return _elm_lang$virtual_dom$VirtualDom$program({
			init: noChange,
			view: function(model) { return main; },
			update: F2(function(msg, model) { return noChange; }),
			subscriptions: function (model) { return emptyBag; }
		});
	}
	
	
	// INITIALIZE A PROGRAM
	
	function initialize(init, update, subscriptions, renderer)
	{
		// ambient state
		var managers = {};
		var updateView;
	
		// init and update state in main process
		var initApp = _elm_lang$core$Native_Scheduler.nativeBinding(function(callback) {
			var model = init._0;
			updateView = renderer(enqueue, model);
			var cmds = init._1;
			var subs = subscriptions(model);
			dispatchEffects(managers, cmds, subs);
			callback(_elm_lang$core$Native_Scheduler.succeed(model));
		});
	
		function onMessage(msg, model)
		{
			return _elm_lang$core$Native_Scheduler.nativeBinding(function(callback) {
				var results = A2(update, msg, model);
				model = results._0;
				updateView(model);
				var cmds = results._1;
				var subs = subscriptions(model);
				dispatchEffects(managers, cmds, subs);
				callback(_elm_lang$core$Native_Scheduler.succeed(model));
			});
		}
	
		var mainProcess = spawnLoop(initApp, onMessage);
	
		function enqueue(msg)
		{
			_elm_lang$core$Native_Scheduler.rawSend(mainProcess, msg);
		}
	
		var ports = setupEffects(managers, enqueue);
	
		return ports ? { ports: ports } : {};
	}
	
	
	// EFFECT MANAGERS
	
	var effectManagers = {};
	
	function setupEffects(managers, callback)
	{
		var ports;
	
		// setup all necessary effect managers
		for (var key in effectManagers)
		{
			var manager = effectManagers[key];
	
			if (manager.isForeign)
			{
				ports = ports || {};
				ports[key] = manager.tag === 'cmd'
					? setupOutgoingPort(key)
					: setupIncomingPort(key, callback);
			}
	
			managers[key] = makeManager(manager, callback);
		}
	
		return ports;
	}
	
	function makeManager(info, callback)
	{
		var router = {
			main: callback,
			self: undefined
		};
	
		var tag = info.tag;
		var onEffects = info.onEffects;
		var onSelfMsg = info.onSelfMsg;
	
		function onMessage(msg, state)
		{
			if (msg.ctor === 'self')
			{
				return A3(onSelfMsg, router, msg._0, state);
			}
	
			var fx = msg._0;
			switch (tag)
			{
				case 'cmd':
					return A3(onEffects, router, fx.cmds, state);
	
				case 'sub':
					return A3(onEffects, router, fx.subs, state);
	
				case 'fx':
					return A4(onEffects, router, fx.cmds, fx.subs, state);
			}
		}
	
		var process = spawnLoop(info.init, onMessage);
		router.self = process;
		return process;
	}
	
	function sendToApp(router, msg)
	{
		return _elm_lang$core$Native_Scheduler.nativeBinding(function(callback)
		{
			router.main(msg);
			callback(_elm_lang$core$Native_Scheduler.succeed(_elm_lang$core$Native_Utils.Tuple0));
		});
	}
	
	function sendToSelf(router, msg)
	{
		return A2(_elm_lang$core$Native_Scheduler.send, router.self, {
			ctor: 'self',
			_0: msg
		});
	}
	
	
	// HELPER for STATEFUL LOOPS
	
	function spawnLoop(init, onMessage)
	{
		var andThen = _elm_lang$core$Native_Scheduler.andThen;
	
		function loop(state)
		{
			var handleMsg = _elm_lang$core$Native_Scheduler.receive(function(msg) {
				return onMessage(msg, state);
			});
			return A2(andThen, loop, handleMsg);
		}
	
		var task = A2(andThen, loop, init);
	
		return _elm_lang$core$Native_Scheduler.rawSpawn(task);
	}
	
	
	// BAGS
	
	function leaf(home)
	{
		return function(value)
		{
			return {
				type: 'leaf',
				home: home,
				value: value
			};
		};
	}
	
	function batch(list)
	{
		return {
			type: 'node',
			branches: list
		};
	}
	
	function map(tagger, bag)
	{
		return {
			type: 'map',
			tagger: tagger,
			tree: bag
		}
	}
	
	
	// PIPE BAGS INTO EFFECT MANAGERS
	
	function dispatchEffects(managers, cmdBag, subBag)
	{
		var effectsDict = {};
		gatherEffects(true, cmdBag, effectsDict, null);
		gatherEffects(false, subBag, effectsDict, null);
	
		for (var home in managers)
		{
			var fx = home in effectsDict
				? effectsDict[home]
				: {
					cmds: _elm_lang$core$Native_List.Nil,
					subs: _elm_lang$core$Native_List.Nil
				};
	
			_elm_lang$core$Native_Scheduler.rawSend(managers[home], { ctor: 'fx', _0: fx });
		}
	}
	
	function gatherEffects(isCmd, bag, effectsDict, taggers)
	{
		switch (bag.type)
		{
			case 'leaf':
				var home = bag.home;
				var effect = toEffect(isCmd, home, taggers, bag.value);
				effectsDict[home] = insert(isCmd, effect, effectsDict[home]);
				return;
	
			case 'node':
				var list = bag.branches;
				while (list.ctor !== '[]')
				{
					gatherEffects(isCmd, list._0, effectsDict, taggers);
					list = list._1;
				}
				return;
	
			case 'map':
				gatherEffects(isCmd, bag.tree, effectsDict, {
					tagger: bag.tagger,
					rest: taggers
				});
				return;
		}
	}
	
	function toEffect(isCmd, home, taggers, value)
	{
		function applyTaggers(x)
		{
			var temp = taggers;
			while (temp)
			{
				x = temp.tagger(x);
				temp = temp.rest;
			}
			return x;
		}
	
		var map = isCmd
			? effectManagers[home].cmdMap
			: effectManagers[home].subMap;
	
		return A2(map, applyTaggers, value)
	}
	
	function insert(isCmd, newEffect, effects)
	{
		effects = effects || {
			cmds: _elm_lang$core$Native_List.Nil,
			subs: _elm_lang$core$Native_List.Nil
		};
		if (isCmd)
		{
			effects.cmds = _elm_lang$core$Native_List.Cons(newEffect, effects.cmds);
			return effects;
		}
		effects.subs = _elm_lang$core$Native_List.Cons(newEffect, effects.subs);
		return effects;
	}
	
	
	// PORTS
	
	function checkPortName(name)
	{
		if (name in effectManagers)
		{
			throw new Error('There can only be one port named `' + name + '`, but your program has multiple.');
		}
	}
	
	
	// OUTGOING PORTS
	
	function outgoingPort(name, converter)
	{
		checkPortName(name);
		effectManagers[name] = {
			tag: 'cmd',
			cmdMap: outgoingPortMap,
			converter: converter,
			isForeign: true
		};
		return leaf(name);
	}
	
	var outgoingPortMap = F2(function cmdMap(tagger, value) {
		return value;
	});
	
	function setupOutgoingPort(name)
	{
		var subs = [];
		var converter = effectManagers[name].converter;
	
		// CREATE MANAGER
	
		var init = _elm_lang$core$Native_Scheduler.succeed(null);
	
		function onEffects(router, cmdList, state)
		{
			while (cmdList.ctor !== '[]')
			{
				// grab a separate reference to subs in case unsubscribe is called
				var currentSubs = subs;
				var value = converter(cmdList._0);
				for (var i = 0; i < currentSubs.length; i++)
				{
					currentSubs[i](value);
				}
				cmdList = cmdList._1;
			}
			return init;
		}
	
		effectManagers[name].init = init;
		effectManagers[name].onEffects = F3(onEffects);
	
		// PUBLIC API
	
		function subscribe(callback)
		{
			subs.push(callback);
		}
	
		function unsubscribe(callback)
		{
			// copy subs into a new array in case unsubscribe is called within a
			// subscribed callback
			subs = subs.slice();
			var index = subs.indexOf(callback);
			if (index >= 0)
			{
				subs.splice(index, 1);
			}
		}
	
		return {
			subscribe: subscribe,
			unsubscribe: unsubscribe
		};
	}
	
	
	// INCOMING PORTS
	
	function incomingPort(name, converter)
	{
		checkPortName(name);
		effectManagers[name] = {
			tag: 'sub',
			subMap: incomingPortMap,
			converter: converter,
			isForeign: true
		};
		return leaf(name);
	}
	
	var incomingPortMap = F2(function subMap(tagger, finalTagger)
	{
		return function(value)
		{
			return tagger(finalTagger(value));
		};
	});
	
	function setupIncomingPort(name, callback)
	{
		var sentBeforeInit = [];
		var subs = _elm_lang$core$Native_List.Nil;
		var converter = effectManagers[name].converter;
		var currentOnEffects = preInitOnEffects;
		var currentSend = preInitSend;
	
		// CREATE MANAGER
	
		var init = _elm_lang$core$Native_Scheduler.succeed(null);
	
		function preInitOnEffects(router, subList, state)
		{
			var postInitResult = postInitOnEffects(router, subList, state);
	
			for(var i = 0; i < sentBeforeInit.length; i++)
			{
				postInitSend(sentBeforeInit[i]);
			}
	
			sentBeforeInit = null; // to release objects held in queue
			currentSend = postInitSend;
			currentOnEffects = postInitOnEffects;
			return postInitResult;
		}
	
		function postInitOnEffects(router, subList, state)
		{
			subs = subList;
			return init;
		}
	
		function onEffects(router, subList, state)
		{
			return currentOnEffects(router, subList, state);
		}
	
		effectManagers[name].init = init;
		effectManagers[name].onEffects = F3(onEffects);
	
		// PUBLIC API
	
		function preInitSend(value)
		{
			sentBeforeInit.push(value);
		}
	
		function postInitSend(value)
		{
			var temp = subs;
			while (temp.ctor !== '[]')
			{
				callback(temp._0(value));
				temp = temp._1;
			}
		}
	
		function send(incomingValue)
		{
			var result = A2(_elm_lang$core$Json_Decode$decodeValue, converter, incomingValue);
			if (result.ctor === 'Err')
			{
				throw new Error('Trying to send an unexpected type of value through port `' + name + '`:\n' + result._0);
			}
	
			currentSend(result._0);
		}
	
		return { send: send };
	}
	
	return {
		// routers
		sendToApp: F2(sendToApp),
		sendToSelf: F2(sendToSelf),
	
		// global setup
		effectManagers: effectManagers,
		outgoingPort: outgoingPort,
		incomingPort: incomingPort,
	
		htmlToProgram: htmlToProgram,
		program: program,
		programWithFlags: programWithFlags,
		initialize: initialize,
	
		// effect bags
		leaf: leaf,
		batch: batch,
		map: F2(map)
	};
	
	}();
	
	//import Native.Utils //
	
	var _elm_lang$core$Native_Scheduler = function() {
	
	var MAX_STEPS = 10000;
	
	
	// TASKS
	
	function succeed(value)
	{
		return {
			ctor: '_Task_succeed',
			value: value
		};
	}
	
	function fail(error)
	{
		return {
			ctor: '_Task_fail',
			value: error
		};
	}
	
	function nativeBinding(callback)
	{
		return {
			ctor: '_Task_nativeBinding',
			callback: callback,
			cancel: null
		};
	}
	
	function andThen(callback, task)
	{
		return {
			ctor: '_Task_andThen',
			callback: callback,
			task: task
		};
	}
	
	function onError(callback, task)
	{
		return {
			ctor: '_Task_onError',
			callback: callback,
			task: task
		};
	}
	
	function receive(callback)
	{
		return {
			ctor: '_Task_receive',
			callback: callback
		};
	}
	
	
	// PROCESSES
	
	function rawSpawn(task)
	{
		var process = {
			ctor: '_Process',
			id: _elm_lang$core$Native_Utils.guid(),
			root: task,
			stack: null,
			mailbox: []
		};
	
		enqueue(process);
	
		return process;
	}
	
	function spawn(task)
	{
		return nativeBinding(function(callback) {
			var process = rawSpawn(task);
			callback(succeed(process));
		});
	}
	
	function rawSend(process, msg)
	{
		process.mailbox.push(msg);
		enqueue(process);
	}
	
	function send(process, msg)
	{
		return nativeBinding(function(callback) {
			rawSend(process, msg);
			callback(succeed(_elm_lang$core$Native_Utils.Tuple0));
		});
	}
	
	function kill(process)
	{
		return nativeBinding(function(callback) {
			var root = process.root;
			if (root.ctor === '_Task_nativeBinding' && root.cancel)
			{
				root.cancel();
			}
	
			process.root = null;
	
			callback(succeed(_elm_lang$core$Native_Utils.Tuple0));
		});
	}
	
	function sleep(time)
	{
		return nativeBinding(function(callback) {
			var id = setTimeout(function() {
				callback(succeed(_elm_lang$core$Native_Utils.Tuple0));
			}, time);
	
			return function() { clearTimeout(id); };
		});
	}
	
	
	// STEP PROCESSES
	
	function step(numSteps, process)
	{
		while (numSteps < MAX_STEPS)
		{
			var ctor = process.root.ctor;
	
			if (ctor === '_Task_succeed')
			{
				while (process.stack && process.stack.ctor === '_Task_onError')
				{
					process.stack = process.stack.rest;
				}
				if (process.stack === null)
				{
					break;
				}
				process.root = process.stack.callback(process.root.value);
				process.stack = process.stack.rest;
				++numSteps;
				continue;
			}
	
			if (ctor === '_Task_fail')
			{
				while (process.stack && process.stack.ctor === '_Task_andThen')
				{
					process.stack = process.stack.rest;
				}
				if (process.stack === null)
				{
					break;
				}
				process.root = process.stack.callback(process.root.value);
				process.stack = process.stack.rest;
				++numSteps;
				continue;
			}
	
			if (ctor === '_Task_andThen')
			{
				process.stack = {
					ctor: '_Task_andThen',
					callback: process.root.callback,
					rest: process.stack
				};
				process.root = process.root.task;
				++numSteps;
				continue;
			}
	
			if (ctor === '_Task_onError')
			{
				process.stack = {
					ctor: '_Task_onError',
					callback: process.root.callback,
					rest: process.stack
				};
				process.root = process.root.task;
				++numSteps;
				continue;
			}
	
			if (ctor === '_Task_nativeBinding')
			{
				process.root.cancel = process.root.callback(function(newRoot) {
					process.root = newRoot;
					enqueue(process);
				});
	
				break;
			}
	
			if (ctor === '_Task_receive')
			{
				var mailbox = process.mailbox;
				if (mailbox.length === 0)
				{
					break;
				}
	
				process.root = process.root.callback(mailbox.shift());
				++numSteps;
				continue;
			}
	
			throw new Error(ctor);
		}
	
		if (numSteps < MAX_STEPS)
		{
			return numSteps + 1;
		}
		enqueue(process);
	
		return numSteps;
	}
	
	
	// WORK QUEUE
	
	var working = false;
	var workQueue = [];
	
	function enqueue(process)
	{
		workQueue.push(process);
	
		if (!working)
		{
			setTimeout(work, 0);
			working = true;
		}
	}
	
	function work()
	{
		var numSteps = 0;
		var process;
		while (numSteps < MAX_STEPS && (process = workQueue.shift()))
		{
			if (process.root)
			{
				numSteps = step(numSteps, process);
			}
		}
		if (!process)
		{
			working = false;
			return;
		}
		setTimeout(work, 0);
	}
	
	
	return {
		succeed: succeed,
		fail: fail,
		nativeBinding: nativeBinding,
		andThen: F2(andThen),
		onError: F2(onError),
		receive: receive,
	
		spawn: spawn,
		kill: kill,
		sleep: sleep,
		send: F2(send),
	
		rawSpawn: rawSpawn,
		rawSend: rawSend
	};
	
	}();
	var _elm_lang$core$Platform_Cmd$batch = _elm_lang$core$Native_Platform.batch;
	var _elm_lang$core$Platform_Cmd$none = _elm_lang$core$Platform_Cmd$batch(
		{ctor: '[]'});
	var _elm_lang$core$Platform_Cmd_ops = _elm_lang$core$Platform_Cmd_ops || {};
	_elm_lang$core$Platform_Cmd_ops['!'] = F2(
		function (model, commands) {
			return {
				ctor: '_Tuple2',
				_0: model,
				_1: _elm_lang$core$Platform_Cmd$batch(commands)
			};
		});
	var _elm_lang$core$Platform_Cmd$map = _elm_lang$core$Native_Platform.map;
	var _elm_lang$core$Platform_Cmd$Cmd = {ctor: 'Cmd'};
	
	var _elm_lang$core$Platform_Sub$batch = _elm_lang$core$Native_Platform.batch;
	var _elm_lang$core$Platform_Sub$none = _elm_lang$core$Platform_Sub$batch(
		{ctor: '[]'});
	var _elm_lang$core$Platform_Sub$map = _elm_lang$core$Native_Platform.map;
	var _elm_lang$core$Platform_Sub$Sub = {ctor: 'Sub'};
	
	var _elm_lang$core$Platform$hack = _elm_lang$core$Native_Scheduler.succeed;
	var _elm_lang$core$Platform$sendToSelf = _elm_lang$core$Native_Platform.sendToSelf;
	var _elm_lang$core$Platform$sendToApp = _elm_lang$core$Native_Platform.sendToApp;
	var _elm_lang$core$Platform$programWithFlags = _elm_lang$core$Native_Platform.programWithFlags;
	var _elm_lang$core$Platform$program = _elm_lang$core$Native_Platform.program;
	var _elm_lang$core$Platform$Program = {ctor: 'Program'};
	var _elm_lang$core$Platform$Task = {ctor: 'Task'};
	var _elm_lang$core$Platform$ProcessId = {ctor: 'ProcessId'};
	var _elm_lang$core$Platform$Router = {ctor: 'Router'};
	
	var _NoRedInk$elm_decode_pipeline$Json_Decode_Pipeline$decode = _elm_lang$core$Json_Decode$succeed;
	var _NoRedInk$elm_decode_pipeline$Json_Decode_Pipeline$resolve = _elm_lang$core$Json_Decode$andThen(_elm_lang$core$Basics$identity);
	var _NoRedInk$elm_decode_pipeline$Json_Decode_Pipeline$custom = _elm_lang$core$Json_Decode$map2(
		F2(
			function (x, y) {
				return y(x);
			}));
	var _NoRedInk$elm_decode_pipeline$Json_Decode_Pipeline$hardcoded = function (_p0) {
		return _NoRedInk$elm_decode_pipeline$Json_Decode_Pipeline$custom(
			_elm_lang$core$Json_Decode$succeed(_p0));
	};
	var _NoRedInk$elm_decode_pipeline$Json_Decode_Pipeline$optionalDecoder = F3(
		function (pathDecoder, valDecoder, fallback) {
			var nullOr = function (decoder) {
				return _elm_lang$core$Json_Decode$oneOf(
					{
						ctor: '::',
						_0: decoder,
						_1: {
							ctor: '::',
							_0: _elm_lang$core$Json_Decode$null(fallback),
							_1: {ctor: '[]'}
						}
					});
			};
			var handleResult = function (input) {
				var _p1 = A2(_elm_lang$core$Json_Decode$decodeValue, pathDecoder, input);
				if (_p1.ctor === 'Ok') {
					var _p2 = A2(
						_elm_lang$core$Json_Decode$decodeValue,
						nullOr(valDecoder),
						_p1._0);
					if (_p2.ctor === 'Ok') {
						return _elm_lang$core$Json_Decode$succeed(_p2._0);
					} else {
						return _elm_lang$core$Json_Decode$fail(_p2._0);
					}
				} else {
					return _elm_lang$core$Json_Decode$succeed(fallback);
				}
			};
			return A2(_elm_lang$core$Json_Decode$andThen, handleResult, _elm_lang$core$Json_Decode$value);
		});
	var _NoRedInk$elm_decode_pipeline$Json_Decode_Pipeline$optionalAt = F4(
		function (path, valDecoder, fallback, decoder) {
			return A2(
				_NoRedInk$elm_decode_pipeline$Json_Decode_Pipeline$custom,
				A3(
					_NoRedInk$elm_decode_pipeline$Json_Decode_Pipeline$optionalDecoder,
					A2(_elm_lang$core$Json_Decode$at, path, _elm_lang$core$Json_Decode$value),
					valDecoder,
					fallback),
				decoder);
		});
	var _NoRedInk$elm_decode_pipeline$Json_Decode_Pipeline$optional = F4(
		function (key, valDecoder, fallback, decoder) {
			return A2(
				_NoRedInk$elm_decode_pipeline$Json_Decode_Pipeline$custom,
				A3(
					_NoRedInk$elm_decode_pipeline$Json_Decode_Pipeline$optionalDecoder,
					A2(_elm_lang$core$Json_Decode$field, key, _elm_lang$core$Json_Decode$value),
					valDecoder,
					fallback),
				decoder);
		});
	var _NoRedInk$elm_decode_pipeline$Json_Decode_Pipeline$requiredAt = F3(
		function (path, valDecoder, decoder) {
			return A2(
				_NoRedInk$elm_decode_pipeline$Json_Decode_Pipeline$custom,
				A2(_elm_lang$core$Json_Decode$at, path, valDecoder),
				decoder);
		});
	var _NoRedInk$elm_decode_pipeline$Json_Decode_Pipeline$required = F3(
		function (key, valDecoder, decoder) {
			return A2(
				_NoRedInk$elm_decode_pipeline$Json_Decode_Pipeline$custom,
				A2(_elm_lang$core$Json_Decode$field, key, valDecoder),
				decoder);
		});
	
	var _elm_lang$core$Task$onError = _elm_lang$core$Native_Scheduler.onError;
	var _elm_lang$core$Task$andThen = _elm_lang$core$Native_Scheduler.andThen;
	var _elm_lang$core$Task$spawnCmd = F2(
		function (router, _p0) {
			var _p1 = _p0;
			return _elm_lang$core$Native_Scheduler.spawn(
				A2(
					_elm_lang$core$Task$andThen,
					_elm_lang$core$Platform$sendToApp(router),
					_p1._0));
		});
	var _elm_lang$core$Task$fail = _elm_lang$core$Native_Scheduler.fail;
	var _elm_lang$core$Task$mapError = F2(
		function (convert, task) {
			return A2(
				_elm_lang$core$Task$onError,
				function (_p2) {
					return _elm_lang$core$Task$fail(
						convert(_p2));
				},
				task);
		});
	var _elm_lang$core$Task$succeed = _elm_lang$core$Native_Scheduler.succeed;
	var _elm_lang$core$Task$map = F2(
		function (func, taskA) {
			return A2(
				_elm_lang$core$Task$andThen,
				function (a) {
					return _elm_lang$core$Task$succeed(
						func(a));
				},
				taskA);
		});
	var _elm_lang$core$Task$map2 = F3(
		function (func, taskA, taskB) {
			return A2(
				_elm_lang$core$Task$andThen,
				function (a) {
					return A2(
						_elm_lang$core$Task$andThen,
						function (b) {
							return _elm_lang$core$Task$succeed(
								A2(func, a, b));
						},
						taskB);
				},
				taskA);
		});
	var _elm_lang$core$Task$map3 = F4(
		function (func, taskA, taskB, taskC) {
			return A2(
				_elm_lang$core$Task$andThen,
				function (a) {
					return A2(
						_elm_lang$core$Task$andThen,
						function (b) {
							return A2(
								_elm_lang$core$Task$andThen,
								function (c) {
									return _elm_lang$core$Task$succeed(
										A3(func, a, b, c));
								},
								taskC);
						},
						taskB);
				},
				taskA);
		});
	var _elm_lang$core$Task$map4 = F5(
		function (func, taskA, taskB, taskC, taskD) {
			return A2(
				_elm_lang$core$Task$andThen,
				function (a) {
					return A2(
						_elm_lang$core$Task$andThen,
						function (b) {
							return A2(
								_elm_lang$core$Task$andThen,
								function (c) {
									return A2(
										_elm_lang$core$Task$andThen,
										function (d) {
											return _elm_lang$core$Task$succeed(
												A4(func, a, b, c, d));
										},
										taskD);
								},
								taskC);
						},
						taskB);
				},
				taskA);
		});
	var _elm_lang$core$Task$map5 = F6(
		function (func, taskA, taskB, taskC, taskD, taskE) {
			return A2(
				_elm_lang$core$Task$andThen,
				function (a) {
					return A2(
						_elm_lang$core$Task$andThen,
						function (b) {
							return A2(
								_elm_lang$core$Task$andThen,
								function (c) {
									return A2(
										_elm_lang$core$Task$andThen,
										function (d) {
											return A2(
												_elm_lang$core$Task$andThen,
												function (e) {
													return _elm_lang$core$Task$succeed(
														A5(func, a, b, c, d, e));
												},
												taskE);
										},
										taskD);
								},
								taskC);
						},
						taskB);
				},
				taskA);
		});
	var _elm_lang$core$Task$sequence = function (tasks) {
		var _p3 = tasks;
		if (_p3.ctor === '[]') {
			return _elm_lang$core$Task$succeed(
				{ctor: '[]'});
		} else {
			return A3(
				_elm_lang$core$Task$map2,
				F2(
					function (x, y) {
						return {ctor: '::', _0: x, _1: y};
					}),
				_p3._0,
				_elm_lang$core$Task$sequence(_p3._1));
		}
	};
	var _elm_lang$core$Task$onEffects = F3(
		function (router, commands, state) {
			return A2(
				_elm_lang$core$Task$map,
				function (_p4) {
					return {ctor: '_Tuple0'};
				},
				_elm_lang$core$Task$sequence(
					A2(
						_elm_lang$core$List$map,
						_elm_lang$core$Task$spawnCmd(router),
						commands)));
		});
	var _elm_lang$core$Task$init = _elm_lang$core$Task$succeed(
		{ctor: '_Tuple0'});
	var _elm_lang$core$Task$onSelfMsg = F3(
		function (_p7, _p6, _p5) {
			return _elm_lang$core$Task$succeed(
				{ctor: '_Tuple0'});
		});
	var _elm_lang$core$Task$command = _elm_lang$core$Native_Platform.leaf('Task');
	var _elm_lang$core$Task$Perform = function (a) {
		return {ctor: 'Perform', _0: a};
	};
	var _elm_lang$core$Task$perform = F2(
		function (toMessage, task) {
			return _elm_lang$core$Task$command(
				_elm_lang$core$Task$Perform(
					A2(_elm_lang$core$Task$map, toMessage, task)));
		});
	var _elm_lang$core$Task$attempt = F2(
		function (resultToMessage, task) {
			return _elm_lang$core$Task$command(
				_elm_lang$core$Task$Perform(
					A2(
						_elm_lang$core$Task$onError,
						function (_p8) {
							return _elm_lang$core$Task$succeed(
								resultToMessage(
									_elm_lang$core$Result$Err(_p8)));
						},
						A2(
							_elm_lang$core$Task$andThen,
							function (_p9) {
								return _elm_lang$core$Task$succeed(
									resultToMessage(
										_elm_lang$core$Result$Ok(_p9)));
							},
							task))));
		});
	var _elm_lang$core$Task$cmdMap = F2(
		function (tagger, _p10) {
			var _p11 = _p10;
			return _elm_lang$core$Task$Perform(
				A2(_elm_lang$core$Task$map, tagger, _p11._0));
		});
	_elm_lang$core$Native_Platform.effectManagers['Task'] = {pkg: 'elm-lang/core', init: _elm_lang$core$Task$init, onEffects: _elm_lang$core$Task$onEffects, onSelfMsg: _elm_lang$core$Task$onSelfMsg, tag: 'cmd', cmdMap: _elm_lang$core$Task$cmdMap};
	
	//import Native.Scheduler //
	
	var _elm_lang$core$Native_Time = function() {
	
	var now = _elm_lang$core$Native_Scheduler.nativeBinding(function(callback)
	{
		callback(_elm_lang$core$Native_Scheduler.succeed(Date.now()));
	});
	
	function setInterval_(interval, task)
	{
		return _elm_lang$core$Native_Scheduler.nativeBinding(function(callback)
		{
			var id = setInterval(function() {
				_elm_lang$core$Native_Scheduler.rawSpawn(task);
			}, interval);
	
			return function() { clearInterval(id); };
		});
	}
	
	return {
		now: now,
		setInterval_: F2(setInterval_)
	};
	
	}();
	var _elm_lang$core$Time$setInterval = _elm_lang$core$Native_Time.setInterval_;
	var _elm_lang$core$Time$spawnHelp = F3(
		function (router, intervals, processes) {
			var _p0 = intervals;
			if (_p0.ctor === '[]') {
				return _elm_lang$core$Task$succeed(processes);
			} else {
				var _p1 = _p0._0;
				var spawnRest = function (id) {
					return A3(
						_elm_lang$core$Time$spawnHelp,
						router,
						_p0._1,
						A3(_elm_lang$core$Dict$insert, _p1, id, processes));
				};
				var spawnTimer = _elm_lang$core$Native_Scheduler.spawn(
					A2(
						_elm_lang$core$Time$setInterval,
						_p1,
						A2(_elm_lang$core$Platform$sendToSelf, router, _p1)));
				return A2(_elm_lang$core$Task$andThen, spawnRest, spawnTimer);
			}
		});
	var _elm_lang$core$Time$addMySub = F2(
		function (_p2, state) {
			var _p3 = _p2;
			var _p6 = _p3._1;
			var _p5 = _p3._0;
			var _p4 = A2(_elm_lang$core$Dict$get, _p5, state);
			if (_p4.ctor === 'Nothing') {
				return A3(
					_elm_lang$core$Dict$insert,
					_p5,
					{
						ctor: '::',
						_0: _p6,
						_1: {ctor: '[]'}
					},
					state);
			} else {
				return A3(
					_elm_lang$core$Dict$insert,
					_p5,
					{ctor: '::', _0: _p6, _1: _p4._0},
					state);
			}
		});
	var _elm_lang$core$Time$inMilliseconds = function (t) {
		return t;
	};
	var _elm_lang$core$Time$millisecond = 1;
	var _elm_lang$core$Time$second = 1000 * _elm_lang$core$Time$millisecond;
	var _elm_lang$core$Time$minute = 60 * _elm_lang$core$Time$second;
	var _elm_lang$core$Time$hour = 60 * _elm_lang$core$Time$minute;
	var _elm_lang$core$Time$inHours = function (t) {
		return t / _elm_lang$core$Time$hour;
	};
	var _elm_lang$core$Time$inMinutes = function (t) {
		return t / _elm_lang$core$Time$minute;
	};
	var _elm_lang$core$Time$inSeconds = function (t) {
		return t / _elm_lang$core$Time$second;
	};
	var _elm_lang$core$Time$now = _elm_lang$core$Native_Time.now;
	var _elm_lang$core$Time$onSelfMsg = F3(
		function (router, interval, state) {
			var _p7 = A2(_elm_lang$core$Dict$get, interval, state.taggers);
			if (_p7.ctor === 'Nothing') {
				return _elm_lang$core$Task$succeed(state);
			} else {
				var tellTaggers = function (time) {
					return _elm_lang$core$Task$sequence(
						A2(
							_elm_lang$core$List$map,
							function (tagger) {
								return A2(
									_elm_lang$core$Platform$sendToApp,
									router,
									tagger(time));
							},
							_p7._0));
				};
				return A2(
					_elm_lang$core$Task$andThen,
					function (_p8) {
						return _elm_lang$core$Task$succeed(state);
					},
					A2(_elm_lang$core$Task$andThen, tellTaggers, _elm_lang$core$Time$now));
			}
		});
	var _elm_lang$core$Time$subscription = _elm_lang$core$Native_Platform.leaf('Time');
	var _elm_lang$core$Time$State = F2(
		function (a, b) {
			return {taggers: a, processes: b};
		});
	var _elm_lang$core$Time$init = _elm_lang$core$Task$succeed(
		A2(_elm_lang$core$Time$State, _elm_lang$core$Dict$empty, _elm_lang$core$Dict$empty));
	var _elm_lang$core$Time$onEffects = F3(
		function (router, subs, _p9) {
			var _p10 = _p9;
			var rightStep = F3(
				function (_p12, id, _p11) {
					var _p13 = _p11;
					return {
						ctor: '_Tuple3',
						_0: _p13._0,
						_1: _p13._1,
						_2: A2(
							_elm_lang$core$Task$andThen,
							function (_p14) {
								return _p13._2;
							},
							_elm_lang$core$Native_Scheduler.kill(id))
					};
				});
			var bothStep = F4(
				function (interval, taggers, id, _p15) {
					var _p16 = _p15;
					return {
						ctor: '_Tuple3',
						_0: _p16._0,
						_1: A3(_elm_lang$core$Dict$insert, interval, id, _p16._1),
						_2: _p16._2
					};
				});
			var leftStep = F3(
				function (interval, taggers, _p17) {
					var _p18 = _p17;
					return {
						ctor: '_Tuple3',
						_0: {ctor: '::', _0: interval, _1: _p18._0},
						_1: _p18._1,
						_2: _p18._2
					};
				});
			var newTaggers = A3(_elm_lang$core$List$foldl, _elm_lang$core$Time$addMySub, _elm_lang$core$Dict$empty, subs);
			var _p19 = A6(
				_elm_lang$core$Dict$merge,
				leftStep,
				bothStep,
				rightStep,
				newTaggers,
				_p10.processes,
				{
					ctor: '_Tuple3',
					_0: {ctor: '[]'},
					_1: _elm_lang$core$Dict$empty,
					_2: _elm_lang$core$Task$succeed(
						{ctor: '_Tuple0'})
				});
			var spawnList = _p19._0;
			var existingDict = _p19._1;
			var killTask = _p19._2;
			return A2(
				_elm_lang$core$Task$andThen,
				function (newProcesses) {
					return _elm_lang$core$Task$succeed(
						A2(_elm_lang$core$Time$State, newTaggers, newProcesses));
				},
				A2(
					_elm_lang$core$Task$andThen,
					function (_p20) {
						return A3(_elm_lang$core$Time$spawnHelp, router, spawnList, existingDict);
					},
					killTask));
		});
	var _elm_lang$core$Time$Every = F2(
		function (a, b) {
			return {ctor: 'Every', _0: a, _1: b};
		});
	var _elm_lang$core$Time$every = F2(
		function (interval, tagger) {
			return _elm_lang$core$Time$subscription(
				A2(_elm_lang$core$Time$Every, interval, tagger));
		});
	var _elm_lang$core$Time$subMap = F2(
		function (f, _p21) {
			var _p22 = _p21;
			return A2(
				_elm_lang$core$Time$Every,
				_p22._0,
				function (_p23) {
					return f(
						_p22._1(_p23));
				});
		});
	_elm_lang$core$Native_Platform.effectManagers['Time'] = {pkg: 'elm-lang/core', init: _elm_lang$core$Time$init, onEffects: _elm_lang$core$Time$onEffects, onSelfMsg: _elm_lang$core$Time$onSelfMsg, tag: 'sub', subMap: _elm_lang$core$Time$subMap};
	
	//import Maybe, Native.List //
	
	var _elm_lang$core$Native_Regex = function() {
	
	function escape(str)
	{
		return str.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
	}
	function caseInsensitive(re)
	{
		return new RegExp(re.source, 'gi');
	}
	function regex(raw)
	{
		return new RegExp(raw, 'g');
	}
	
	function contains(re, string)
	{
		return string.match(re) !== null;
	}
	
	function find(n, re, str)
	{
		n = n.ctor === 'All' ? Infinity : n._0;
		var out = [];
		var number = 0;
		var string = str;
		var lastIndex = re.lastIndex;
		var prevLastIndex = -1;
		var result;
		while (number++ < n && (result = re.exec(string)))
		{
			if (prevLastIndex === re.lastIndex) break;
			var i = result.length - 1;
			var subs = new Array(i);
			while (i > 0)
			{
				var submatch = result[i];
				subs[--i] = submatch === undefined
					? _elm_lang$core$Maybe$Nothing
					: _elm_lang$core$Maybe$Just(submatch);
			}
			out.push({
				match: result[0],
				submatches: _elm_lang$core$Native_List.fromArray(subs),
				index: result.index,
				number: number
			});
			prevLastIndex = re.lastIndex;
		}
		re.lastIndex = lastIndex;
		return _elm_lang$core$Native_List.fromArray(out);
	}
	
	function replace(n, re, replacer, string)
	{
		n = n.ctor === 'All' ? Infinity : n._0;
		var count = 0;
		function jsReplacer(match)
		{
			if (count++ >= n)
			{
				return match;
			}
			var i = arguments.length - 3;
			var submatches = new Array(i);
			while (i > 0)
			{
				var submatch = arguments[i];
				submatches[--i] = submatch === undefined
					? _elm_lang$core$Maybe$Nothing
					: _elm_lang$core$Maybe$Just(submatch);
			}
			return replacer({
				match: match,
				submatches: _elm_lang$core$Native_List.fromArray(submatches),
				index: arguments[arguments.length - 2],
				number: count
			});
		}
		return string.replace(re, jsReplacer);
	}
	
	function split(n, re, str)
	{
		n = n.ctor === 'All' ? Infinity : n._0;
		if (n === Infinity)
		{
			return _elm_lang$core$Native_List.fromArray(str.split(re));
		}
		var string = str;
		var result;
		var out = [];
		var start = re.lastIndex;
		var restoreLastIndex = re.lastIndex;
		while (n--)
		{
			if (!(result = re.exec(string))) break;
			out.push(string.slice(start, result.index));
			start = re.lastIndex;
		}
		out.push(string.slice(start));
		re.lastIndex = restoreLastIndex;
		return _elm_lang$core$Native_List.fromArray(out);
	}
	
	return {
		regex: regex,
		caseInsensitive: caseInsensitive,
		escape: escape,
	
		contains: F2(contains),
		find: F3(find),
		replace: F4(replace),
		split: F3(split)
	};
	
	}();
	
	var _elm_lang$core$Process$kill = _elm_lang$core$Native_Scheduler.kill;
	var _elm_lang$core$Process$sleep = _elm_lang$core$Native_Scheduler.sleep;
	var _elm_lang$core$Process$spawn = _elm_lang$core$Native_Scheduler.spawn;
	
	var _elm_lang$core$Regex$split = _elm_lang$core$Native_Regex.split;
	var _elm_lang$core$Regex$replace = _elm_lang$core$Native_Regex.replace;
	var _elm_lang$core$Regex$find = _elm_lang$core$Native_Regex.find;
	var _elm_lang$core$Regex$contains = _elm_lang$core$Native_Regex.contains;
	var _elm_lang$core$Regex$caseInsensitive = _elm_lang$core$Native_Regex.caseInsensitive;
	var _elm_lang$core$Regex$regex = _elm_lang$core$Native_Regex.regex;
	var _elm_lang$core$Regex$escape = _elm_lang$core$Native_Regex.escape;
	var _elm_lang$core$Regex$Match = F4(
		function (a, b, c, d) {
			return {match: a, submatches: b, index: c, number: d};
		});
	var _elm_lang$core$Regex$Regex = {ctor: 'Regex'};
	var _elm_lang$core$Regex$AtMost = function (a) {
		return {ctor: 'AtMost', _0: a};
	};
	var _elm_lang$core$Regex$All = {ctor: 'All'};
	
	var _elm_lang$dom$Native_Dom = function() {
	
	var fakeNode = {
		addEventListener: function() {},
		removeEventListener: function() {}
	};
	
	var onDocument = on(typeof document !== 'undefined' ? document : fakeNode);
	var onWindow = on(typeof window !== 'undefined' ? window : fakeNode);
	
	function on(node)
	{
		return function(eventName, decoder, toTask)
		{
			return _elm_lang$core$Native_Scheduler.nativeBinding(function(callback) {
	
				function performTask(event)
				{
					var result = A2(_elm_lang$core$Json_Decode$decodeValue, decoder, event);
					if (result.ctor === 'Ok')
					{
						_elm_lang$core$Native_Scheduler.rawSpawn(toTask(result._0));
					}
				}
	
				node.addEventListener(eventName, performTask);
	
				return function()
				{
					node.removeEventListener(eventName, performTask);
				};
			});
		};
	}
	
	var rAF = typeof requestAnimationFrame !== 'undefined'
		? requestAnimationFrame
		: function(callback) { callback(); };
	
	function withNode(id, doStuff)
	{
		return _elm_lang$core$Native_Scheduler.nativeBinding(function(callback)
		{
			rAF(function()
			{
				var node = document.getElementById(id);
				if (node === null)
				{
					callback(_elm_lang$core$Native_Scheduler.fail({ ctor: 'NotFound', _0: id }));
					return;
				}
				callback(_elm_lang$core$Native_Scheduler.succeed(doStuff(node)));
			});
		});
	}
	
	
	// FOCUS
	
	function focus(id)
	{
		return withNode(id, function(node) {
			node.focus();
			return _elm_lang$core$Native_Utils.Tuple0;
		});
	}
	
	function blur(id)
	{
		return withNode(id, function(node) {
			node.blur();
			return _elm_lang$core$Native_Utils.Tuple0;
		});
	}
	
	
	// SCROLLING
	
	function getScrollTop(id)
	{
		return withNode(id, function(node) {
			return node.scrollTop;
		});
	}
	
	function setScrollTop(id, desiredScrollTop)
	{
		return withNode(id, function(node) {
			node.scrollTop = desiredScrollTop;
			return _elm_lang$core$Native_Utils.Tuple0;
		});
	}
	
	function toBottom(id)
	{
		return withNode(id, function(node) {
			node.scrollTop = node.scrollHeight;
			return _elm_lang$core$Native_Utils.Tuple0;
		});
	}
	
	function getScrollLeft(id)
	{
		return withNode(id, function(node) {
			return node.scrollLeft;
		});
	}
	
	function setScrollLeft(id, desiredScrollLeft)
	{
		return withNode(id, function(node) {
			node.scrollLeft = desiredScrollLeft;
			return _elm_lang$core$Native_Utils.Tuple0;
		});
	}
	
	function toRight(id)
	{
		return withNode(id, function(node) {
			node.scrollLeft = node.scrollWidth;
			return _elm_lang$core$Native_Utils.Tuple0;
		});
	}
	
	
	// SIZE
	
	function width(options, id)
	{
		return withNode(id, function(node) {
			switch (options.ctor)
			{
				case 'Content':
					return node.scrollWidth;
				case 'VisibleContent':
					return node.clientWidth;
				case 'VisibleContentWithBorders':
					return node.offsetWidth;
				case 'VisibleContentWithBordersAndMargins':
					var rect = node.getBoundingClientRect();
					return rect.right - rect.left;
			}
		});
	}
	
	function height(options, id)
	{
		return withNode(id, function(node) {
			switch (options.ctor)
			{
				case 'Content':
					return node.scrollHeight;
				case 'VisibleContent':
					return node.clientHeight;
				case 'VisibleContentWithBorders':
					return node.offsetHeight;
				case 'VisibleContentWithBordersAndMargins':
					var rect = node.getBoundingClientRect();
					return rect.bottom - rect.top;
			}
		});
	}
	
	return {
		onDocument: F3(onDocument),
		onWindow: F3(onWindow),
	
		focus: focus,
		blur: blur,
	
		getScrollTop: getScrollTop,
		setScrollTop: F2(setScrollTop),
		getScrollLeft: getScrollLeft,
		setScrollLeft: F2(setScrollLeft),
		toBottom: toBottom,
		toRight: toRight,
	
		height: F2(height),
		width: F2(width)
	};
	
	}();
	
	var _elm_lang$dom$Dom_LowLevel$onWindow = _elm_lang$dom$Native_Dom.onWindow;
	var _elm_lang$dom$Dom_LowLevel$onDocument = _elm_lang$dom$Native_Dom.onDocument;
	
	var _elm_lang$virtual_dom$VirtualDom_Debug$wrap;
	var _elm_lang$virtual_dom$VirtualDom_Debug$wrapWithFlags;
	
	var _elm_lang$virtual_dom$Native_VirtualDom = function() {
	
	var STYLE_KEY = 'STYLE';
	var EVENT_KEY = 'EVENT';
	var ATTR_KEY = 'ATTR';
	var ATTR_NS_KEY = 'ATTR_NS';
	
	var localDoc = typeof document !== 'undefined' ? document : {};
	
	
	////////////  VIRTUAL DOM NODES  ////////////
	
	
	function text(string)
	{
		return {
			type: 'text',
			text: string
		};
	}
	
	
	function node(tag)
	{
		return F2(function(factList, kidList) {
			return nodeHelp(tag, factList, kidList);
		});
	}
	
	
	function nodeHelp(tag, factList, kidList)
	{
		var organized = organizeFacts(factList);
		var namespace = organized.namespace;
		var facts = organized.facts;
	
		var children = [];
		var descendantsCount = 0;
		while (kidList.ctor !== '[]')
		{
			var kid = kidList._0;
			descendantsCount += (kid.descendantsCount || 0);
			children.push(kid);
			kidList = kidList._1;
		}
		descendantsCount += children.length;
	
		return {
			type: 'node',
			tag: tag,
			facts: facts,
			children: children,
			namespace: namespace,
			descendantsCount: descendantsCount
		};
	}
	
	
	function keyedNode(tag, factList, kidList)
	{
		var organized = organizeFacts(factList);
		var namespace = organized.namespace;
		var facts = organized.facts;
	
		var children = [];
		var descendantsCount = 0;
		while (kidList.ctor !== '[]')
		{
			var kid = kidList._0;
			descendantsCount += (kid._1.descendantsCount || 0);
			children.push(kid);
			kidList = kidList._1;
		}
		descendantsCount += children.length;
	
		return {
			type: 'keyed-node',
			tag: tag,
			facts: facts,
			children: children,
			namespace: namespace,
			descendantsCount: descendantsCount
		};
	}
	
	
	function custom(factList, model, impl)
	{
		var facts = organizeFacts(factList).facts;
	
		return {
			type: 'custom',
			facts: facts,
			model: model,
			impl: impl
		};
	}
	
	
	function map(tagger, node)
	{
		return {
			type: 'tagger',
			tagger: tagger,
			node: node,
			descendantsCount: 1 + (node.descendantsCount || 0)
		};
	}
	
	
	function thunk(func, args, thunk)
	{
		return {
			type: 'thunk',
			func: func,
			args: args,
			thunk: thunk,
			node: undefined
		};
	}
	
	function lazy(fn, a)
	{
		return thunk(fn, [a], function() {
			return fn(a);
		});
	}
	
	function lazy2(fn, a, b)
	{
		return thunk(fn, [a,b], function() {
			return A2(fn, a, b);
		});
	}
	
	function lazy3(fn, a, b, c)
	{
		return thunk(fn, [a,b,c], function() {
			return A3(fn, a, b, c);
		});
	}
	
	
	
	// FACTS
	
	
	function organizeFacts(factList)
	{
		var namespace, facts = {};
	
		while (factList.ctor !== '[]')
		{
			var entry = factList._0;
			var key = entry.key;
	
			if (key === ATTR_KEY || key === ATTR_NS_KEY || key === EVENT_KEY)
			{
				var subFacts = facts[key] || {};
				subFacts[entry.realKey] = entry.value;
				facts[key] = subFacts;
			}
			else if (key === STYLE_KEY)
			{
				var styles = facts[key] || {};
				var styleList = entry.value;
				while (styleList.ctor !== '[]')
				{
					var style = styleList._0;
					styles[style._0] = style._1;
					styleList = styleList._1;
				}
				facts[key] = styles;
			}
			else if (key === 'namespace')
			{
				namespace = entry.value;
			}
			else if (key === 'className')
			{
				var classes = facts[key];
				facts[key] = typeof classes === 'undefined'
					? entry.value
					: classes + ' ' + entry.value;
			}
	 		else
			{
				facts[key] = entry.value;
			}
			factList = factList._1;
		}
	
		return {
			facts: facts,
			namespace: namespace
		};
	}
	
	
	
	////////////  PROPERTIES AND ATTRIBUTES  ////////////
	
	
	function style(value)
	{
		return {
			key: STYLE_KEY,
			value: value
		};
	}
	
	
	function property(key, value)
	{
		return {
			key: key,
			value: value
		};
	}
	
	
	function attribute(key, value)
	{
		return {
			key: ATTR_KEY,
			realKey: key,
			value: value
		};
	}
	
	
	function attributeNS(namespace, key, value)
	{
		return {
			key: ATTR_NS_KEY,
			realKey: key,
			value: {
				value: value,
				namespace: namespace
			}
		};
	}
	
	
	function on(name, options, decoder)
	{
		return {
			key: EVENT_KEY,
			realKey: name,
			value: {
				options: options,
				decoder: decoder
			}
		};
	}
	
	
	function equalEvents(a, b)
	{
		if (a.options !== b.options)
		{
			if (a.options.stopPropagation !== b.options.stopPropagation || a.options.preventDefault !== b.options.preventDefault)
			{
				return false;
			}
		}
		return _elm_lang$core$Native_Json.equality(a.decoder, b.decoder);
	}
	
	
	function mapProperty(func, property)
	{
		if (property.key !== EVENT_KEY)
		{
			return property;
		}
		return on(
			property.realKey,
			property.value.options,
			A2(_elm_lang$core$Json_Decode$map, func, property.value.decoder)
		);
	}
	
	
	////////////  RENDER  ////////////
	
	
	function render(vNode, eventNode)
	{
		switch (vNode.type)
		{
			case 'thunk':
				if (!vNode.node)
				{
					vNode.node = vNode.thunk();
				}
				return render(vNode.node, eventNode);
	
			case 'tagger':
				var subNode = vNode.node;
				var tagger = vNode.tagger;
	
				while (subNode.type === 'tagger')
				{
					typeof tagger !== 'object'
						? tagger = [tagger, subNode.tagger]
						: tagger.push(subNode.tagger);
	
					subNode = subNode.node;
				}
	
				var subEventRoot = { tagger: tagger, parent: eventNode };
				var domNode = render(subNode, subEventRoot);
				domNode.elm_event_node_ref = subEventRoot;
				return domNode;
	
			case 'text':
				return localDoc.createTextNode(vNode.text);
	
			case 'node':
				var domNode = vNode.namespace
					? localDoc.createElementNS(vNode.namespace, vNode.tag)
					: localDoc.createElement(vNode.tag);
	
				applyFacts(domNode, eventNode, vNode.facts);
	
				var children = vNode.children;
	
				for (var i = 0; i < children.length; i++)
				{
					domNode.appendChild(render(children[i], eventNode));
				}
	
				return domNode;
	
			case 'keyed-node':
				var domNode = vNode.namespace
					? localDoc.createElementNS(vNode.namespace, vNode.tag)
					: localDoc.createElement(vNode.tag);
	
				applyFacts(domNode, eventNode, vNode.facts);
	
				var children = vNode.children;
	
				for (var i = 0; i < children.length; i++)
				{
					domNode.appendChild(render(children[i]._1, eventNode));
				}
	
				return domNode;
	
			case 'custom':
				var domNode = vNode.impl.render(vNode.model);
				applyFacts(domNode, eventNode, vNode.facts);
				return domNode;
		}
	}
	
	
	
	////////////  APPLY FACTS  ////////////
	
	
	function applyFacts(domNode, eventNode, facts)
	{
		for (var key in facts)
		{
			var value = facts[key];
	
			switch (key)
			{
				case STYLE_KEY:
					applyStyles(domNode, value);
					break;
	
				case EVENT_KEY:
					applyEvents(domNode, eventNode, value);
					break;
	
				case ATTR_KEY:
					applyAttrs(domNode, value);
					break;
	
				case ATTR_NS_KEY:
					applyAttrsNS(domNode, value);
					break;
	
				case 'value':
					if (domNode[key] !== value)
					{
						domNode[key] = value;
					}
					break;
	
				default:
					domNode[key] = value;
					break;
			}
		}
	}
	
	function applyStyles(domNode, styles)
	{
		var domNodeStyle = domNode.style;
	
		for (var key in styles)
		{
			domNodeStyle[key] = styles[key];
		}
	}
	
	function applyEvents(domNode, eventNode, events)
	{
		var allHandlers = domNode.elm_handlers || {};
	
		for (var key in events)
		{
			var handler = allHandlers[key];
			var value = events[key];
	
			if (typeof value === 'undefined')
			{
				domNode.removeEventListener(key, handler);
				allHandlers[key] = undefined;
			}
			else if (typeof handler === 'undefined')
			{
				var handler = makeEventHandler(eventNode, value);
				domNode.addEventListener(key, handler);
				allHandlers[key] = handler;
			}
			else
			{
				handler.info = value;
			}
		}
	
		domNode.elm_handlers = allHandlers;
	}
	
	function makeEventHandler(eventNode, info)
	{
		function eventHandler(event)
		{
			var info = eventHandler.info;
	
			var value = A2(_elm_lang$core$Native_Json.run, info.decoder, event);
	
			if (value.ctor === 'Ok')
			{
				var options = info.options;
				if (options.stopPropagation)
				{
					event.stopPropagation();
				}
				if (options.preventDefault)
				{
					event.preventDefault();
				}
	
				var message = value._0;
	
				var currentEventNode = eventNode;
				while (currentEventNode)
				{
					var tagger = currentEventNode.tagger;
					if (typeof tagger === 'function')
					{
						message = tagger(message);
					}
					else
					{
						for (var i = tagger.length; i--; )
						{
							message = tagger[i](message);
						}
					}
					currentEventNode = currentEventNode.parent;
				}
			}
		};
	
		eventHandler.info = info;
	
		return eventHandler;
	}
	
	function applyAttrs(domNode, attrs)
	{
		for (var key in attrs)
		{
			var value = attrs[key];
			if (typeof value === 'undefined')
			{
				domNode.removeAttribute(key);
			}
			else
			{
				domNode.setAttribute(key, value);
			}
		}
	}
	
	function applyAttrsNS(domNode, nsAttrs)
	{
		for (var key in nsAttrs)
		{
			var pair = nsAttrs[key];
			var namespace = pair.namespace;
			var value = pair.value;
	
			if (typeof value === 'undefined')
			{
				domNode.removeAttributeNS(namespace, key);
			}
			else
			{
				domNode.setAttributeNS(namespace, key, value);
			}
		}
	}
	
	
	
	////////////  DIFF  ////////////
	
	
	function diff(a, b)
	{
		var patches = [];
		diffHelp(a, b, patches, 0);
		return patches;
	}
	
	
	function makePatch(type, index, data)
	{
		return {
			index: index,
			type: type,
			data: data,
			domNode: undefined,
			eventNode: undefined
		};
	}
	
	
	function diffHelp(a, b, patches, index)
	{
		if (a === b)
		{
			return;
		}
	
		var aType = a.type;
		var bType = b.type;
	
		// Bail if you run into different types of nodes. Implies that the
		// structure has changed significantly and it's not worth a diff.
		if (aType !== bType)
		{
			patches.push(makePatch('p-redraw', index, b));
			return;
		}
	
		// Now we know that both nodes are the same type.
		switch (bType)
		{
			case 'thunk':
				var aArgs = a.args;
				var bArgs = b.args;
				var i = aArgs.length;
				var same = a.func === b.func && i === bArgs.length;
				while (same && i--)
				{
					same = aArgs[i] === bArgs[i];
				}
				if (same)
				{
					b.node = a.node;
					return;
				}
				b.node = b.thunk();
				var subPatches = [];
				diffHelp(a.node, b.node, subPatches, 0);
				if (subPatches.length > 0)
				{
					patches.push(makePatch('p-thunk', index, subPatches));
				}
				return;
	
			case 'tagger':
				// gather nested taggers
				var aTaggers = a.tagger;
				var bTaggers = b.tagger;
				var nesting = false;
	
				var aSubNode = a.node;
				while (aSubNode.type === 'tagger')
				{
					nesting = true;
	
					typeof aTaggers !== 'object'
						? aTaggers = [aTaggers, aSubNode.tagger]
						: aTaggers.push(aSubNode.tagger);
	
					aSubNode = aSubNode.node;
				}
	
				var bSubNode = b.node;
				while (bSubNode.type === 'tagger')
				{
					nesting = true;
	
					typeof bTaggers !== 'object'
						? bTaggers = [bTaggers, bSubNode.tagger]
						: bTaggers.push(bSubNode.tagger);
	
					bSubNode = bSubNode.node;
				}
	
				// Just bail if different numbers of taggers. This implies the
				// structure of the virtual DOM has changed.
				if (nesting && aTaggers.length !== bTaggers.length)
				{
					patches.push(makePatch('p-redraw', index, b));
					return;
				}
	
				// check if taggers are "the same"
				if (nesting ? !pairwiseRefEqual(aTaggers, bTaggers) : aTaggers !== bTaggers)
				{
					patches.push(makePatch('p-tagger', index, bTaggers));
				}
	
				// diff everything below the taggers
				diffHelp(aSubNode, bSubNode, patches, index + 1);
				return;
	
			case 'text':
				if (a.text !== b.text)
				{
					patches.push(makePatch('p-text', index, b.text));
					return;
				}
	
				return;
	
			case 'node':
				// Bail if obvious indicators have changed. Implies more serious
				// structural changes such that it's not worth it to diff.
				if (a.tag !== b.tag || a.namespace !== b.namespace)
				{
					patches.push(makePatch('p-redraw', index, b));
					return;
				}
	
				var factsDiff = diffFacts(a.facts, b.facts);
	
				if (typeof factsDiff !== 'undefined')
				{
					patches.push(makePatch('p-facts', index, factsDiff));
				}
	
				diffChildren(a, b, patches, index);
				return;
	
			case 'keyed-node':
				// Bail if obvious indicators have changed. Implies more serious
				// structural changes such that it's not worth it to diff.
				if (a.tag !== b.tag || a.namespace !== b.namespace)
				{
					patches.push(makePatch('p-redraw', index, b));
					return;
				}
	
				var factsDiff = diffFacts(a.facts, b.facts);
	
				if (typeof factsDiff !== 'undefined')
				{
					patches.push(makePatch('p-facts', index, factsDiff));
				}
	
				diffKeyedChildren(a, b, patches, index);
				return;
	
			case 'custom':
				if (a.impl !== b.impl)
				{
					patches.push(makePatch('p-redraw', index, b));
					return;
				}
	
				var factsDiff = diffFacts(a.facts, b.facts);
				if (typeof factsDiff !== 'undefined')
				{
					patches.push(makePatch('p-facts', index, factsDiff));
				}
	
				var patch = b.impl.diff(a,b);
				if (patch)
				{
					patches.push(makePatch('p-custom', index, patch));
					return;
				}
	
				return;
		}
	}
	
	
	// assumes the incoming arrays are the same length
	function pairwiseRefEqual(as, bs)
	{
		for (var i = 0; i < as.length; i++)
		{
			if (as[i] !== bs[i])
			{
				return false;
			}
		}
	
		return true;
	}
	
	
	// TODO Instead of creating a new diff object, it's possible to just test if
	// there *is* a diff. During the actual patch, do the diff again and make the
	// modifications directly. This way, there's no new allocations. Worth it?
	function diffFacts(a, b, category)
	{
		var diff;
	
		// look for changes and removals
		for (var aKey in a)
		{
			if (aKey === STYLE_KEY || aKey === EVENT_KEY || aKey === ATTR_KEY || aKey === ATTR_NS_KEY)
			{
				var subDiff = diffFacts(a[aKey], b[aKey] || {}, aKey);
				if (subDiff)
				{
					diff = diff || {};
					diff[aKey] = subDiff;
				}
				continue;
			}
	
			// remove if not in the new facts
			if (!(aKey in b))
			{
				diff = diff || {};
				diff[aKey] =
					(typeof category === 'undefined')
						? (typeof a[aKey] === 'string' ? '' : null)
						:
					(category === STYLE_KEY)
						? ''
						:
					(category === EVENT_KEY || category === ATTR_KEY)
						? undefined
						:
					{ namespace: a[aKey].namespace, value: undefined };
	
				continue;
			}
	
			var aValue = a[aKey];
			var bValue = b[aKey];
	
			// reference equal, so don't worry about it
			if (aValue === bValue && aKey !== 'value'
				|| category === EVENT_KEY && equalEvents(aValue, bValue))
			{
				continue;
			}
	
			diff = diff || {};
			diff[aKey] = bValue;
		}
	
		// add new stuff
		for (var bKey in b)
		{
			if (!(bKey in a))
			{
				diff = diff || {};
				diff[bKey] = b[bKey];
			}
		}
	
		return diff;
	}
	
	
	function diffChildren(aParent, bParent, patches, rootIndex)
	{
		var aChildren = aParent.children;
		var bChildren = bParent.children;
	
		var aLen = aChildren.length;
		var bLen = bChildren.length;
	
		// FIGURE OUT IF THERE ARE INSERTS OR REMOVALS
	
		if (aLen > bLen)
		{
			patches.push(makePatch('p-remove-last', rootIndex, aLen - bLen));
		}
		else if (aLen < bLen)
		{
			patches.push(makePatch('p-append', rootIndex, bChildren.slice(aLen)));
		}
	
		// PAIRWISE DIFF EVERYTHING ELSE
	
		var index = rootIndex;
		var minLen = aLen < bLen ? aLen : bLen;
		for (var i = 0; i < minLen; i++)
		{
			index++;
			var aChild = aChildren[i];
			diffHelp(aChild, bChildren[i], patches, index);
			index += aChild.descendantsCount || 0;
		}
	}
	
	
	
	////////////  KEYED DIFF  ////////////
	
	
	function diffKeyedChildren(aParent, bParent, patches, rootIndex)
	{
		var localPatches = [];
	
		var changes = {}; // Dict String Entry
		var inserts = []; // Array { index : Int, entry : Entry }
		// type Entry = { tag : String, vnode : VNode, index : Int, data : _ }
	
		var aChildren = aParent.children;
		var bChildren = bParent.children;
		var aLen = aChildren.length;
		var bLen = bChildren.length;
		var aIndex = 0;
		var bIndex = 0;
	
		var index = rootIndex;
	
		while (aIndex < aLen && bIndex < bLen)
		{
			var a = aChildren[aIndex];
			var b = bChildren[bIndex];
	
			var aKey = a._0;
			var bKey = b._0;
			var aNode = a._1;
			var bNode = b._1;
	
			// check if keys match
	
			if (aKey === bKey)
			{
				index++;
				diffHelp(aNode, bNode, localPatches, index);
				index += aNode.descendantsCount || 0;
	
				aIndex++;
				bIndex++;
				continue;
			}
	
			// look ahead 1 to detect insertions and removals.
	
			var aLookAhead = aIndex + 1 < aLen;
			var bLookAhead = bIndex + 1 < bLen;
	
			if (aLookAhead)
			{
				var aNext = aChildren[aIndex + 1];
				var aNextKey = aNext._0;
				var aNextNode = aNext._1;
				var oldMatch = bKey === aNextKey;
			}
	
			if (bLookAhead)
			{
				var bNext = bChildren[bIndex + 1];
				var bNextKey = bNext._0;
				var bNextNode = bNext._1;
				var newMatch = aKey === bNextKey;
			}
	
	
			// swap a and b
			if (aLookAhead && bLookAhead && newMatch && oldMatch)
			{
				index++;
				diffHelp(aNode, bNextNode, localPatches, index);
				insertNode(changes, localPatches, aKey, bNode, bIndex, inserts);
				index += aNode.descendantsCount || 0;
	
				index++;
				removeNode(changes, localPatches, aKey, aNextNode, index);
				index += aNextNode.descendantsCount || 0;
	
				aIndex += 2;
				bIndex += 2;
				continue;
			}
	
			// insert b
			if (bLookAhead && newMatch)
			{
				index++;
				insertNode(changes, localPatches, bKey, bNode, bIndex, inserts);
				diffHelp(aNode, bNextNode, localPatches, index);
				index += aNode.descendantsCount || 0;
	
				aIndex += 1;
				bIndex += 2;
				continue;
			}
	
			// remove a
			if (aLookAhead && oldMatch)
			{
				index++;
				removeNode(changes, localPatches, aKey, aNode, index);
				index += aNode.descendantsCount || 0;
	
				index++;
				diffHelp(aNextNode, bNode, localPatches, index);
				index += aNextNode.descendantsCount || 0;
	
				aIndex += 2;
				bIndex += 1;
				continue;
			}
	
			// remove a, insert b
			if (aLookAhead && bLookAhead && aNextKey === bNextKey)
			{
				index++;
				removeNode(changes, localPatches, aKey, aNode, index);
				insertNode(changes, localPatches, bKey, bNode, bIndex, inserts);
				index += aNode.descendantsCount || 0;
	
				index++;
				diffHelp(aNextNode, bNextNode, localPatches, index);
				index += aNextNode.descendantsCount || 0;
	
				aIndex += 2;
				bIndex += 2;
				continue;
			}
	
			break;
		}
	
		// eat up any remaining nodes with removeNode and insertNode
	
		while (aIndex < aLen)
		{
			index++;
			var a = aChildren[aIndex];
			var aNode = a._1;
			removeNode(changes, localPatches, a._0, aNode, index);
			index += aNode.descendantsCount || 0;
			aIndex++;
		}
	
		var endInserts;
		while (bIndex < bLen)
		{
			endInserts = endInserts || [];
			var b = bChildren[bIndex];
			insertNode(changes, localPatches, b._0, b._1, undefined, endInserts);
			bIndex++;
		}
	
		if (localPatches.length > 0 || inserts.length > 0 || typeof endInserts !== 'undefined')
		{
			patches.push(makePatch('p-reorder', rootIndex, {
				patches: localPatches,
				inserts: inserts,
				endInserts: endInserts
			}));
		}
	}
	
	
	
	////////////  CHANGES FROM KEYED DIFF  ////////////
	
	
	var POSTFIX = '_elmW6BL';
	
	
	function insertNode(changes, localPatches, key, vnode, bIndex, inserts)
	{
		var entry = changes[key];
	
		// never seen this key before
		if (typeof entry === 'undefined')
		{
			entry = {
				tag: 'insert',
				vnode: vnode,
				index: bIndex,
				data: undefined
			};
	
			inserts.push({ index: bIndex, entry: entry });
			changes[key] = entry;
	
			return;
		}
	
		// this key was removed earlier, a match!
		if (entry.tag === 'remove')
		{
			inserts.push({ index: bIndex, entry: entry });
	
			entry.tag = 'move';
			var subPatches = [];
			diffHelp(entry.vnode, vnode, subPatches, entry.index);
			entry.index = bIndex;
			entry.data.data = {
				patches: subPatches,
				entry: entry
			};
	
			return;
		}
	
		// this key has already been inserted or moved, a duplicate!
		insertNode(changes, localPatches, key + POSTFIX, vnode, bIndex, inserts);
	}
	
	
	function removeNode(changes, localPatches, key, vnode, index)
	{
		var entry = changes[key];
	
		// never seen this key before
		if (typeof entry === 'undefined')
		{
			var patch = makePatch('p-remove', index, undefined);
			localPatches.push(patch);
	
			changes[key] = {
				tag: 'remove',
				vnode: vnode,
				index: index,
				data: patch
			};
	
			return;
		}
	
		// this key was inserted earlier, a match!
		if (entry.tag === 'insert')
		{
			entry.tag = 'move';
			var subPatches = [];
			diffHelp(vnode, entry.vnode, subPatches, index);
	
			var patch = makePatch('p-remove', index, {
				patches: subPatches,
				entry: entry
			});
			localPatches.push(patch);
	
			return;
		}
	
		// this key has already been removed or moved, a duplicate!
		removeNode(changes, localPatches, key + POSTFIX, vnode, index);
	}
	
	
	
	////////////  ADD DOM NODES  ////////////
	//
	// Each DOM node has an "index" assigned in order of traversal. It is important
	// to minimize our crawl over the actual DOM, so these indexes (along with the
	// descendantsCount of virtual nodes) let us skip touching entire subtrees of
	// the DOM if we know there are no patches there.
	
	
	function addDomNodes(domNode, vNode, patches, eventNode)
	{
		addDomNodesHelp(domNode, vNode, patches, 0, 0, vNode.descendantsCount, eventNode);
	}
	
	
	// assumes `patches` is non-empty and indexes increase monotonically.
	function addDomNodesHelp(domNode, vNode, patches, i, low, high, eventNode)
	{
		var patch = patches[i];
		var index = patch.index;
	
		while (index === low)
		{
			var patchType = patch.type;
	
			if (patchType === 'p-thunk')
			{
				addDomNodes(domNode, vNode.node, patch.data, eventNode);
			}
			else if (patchType === 'p-reorder')
			{
				patch.domNode = domNode;
				patch.eventNode = eventNode;
	
				var subPatches = patch.data.patches;
				if (subPatches.length > 0)
				{
					addDomNodesHelp(domNode, vNode, subPatches, 0, low, high, eventNode);
				}
			}
			else if (patchType === 'p-remove')
			{
				patch.domNode = domNode;
				patch.eventNode = eventNode;
	
				var data = patch.data;
				if (typeof data !== 'undefined')
				{
					data.entry.data = domNode;
					var subPatches = data.patches;
					if (subPatches.length > 0)
					{
						addDomNodesHelp(domNode, vNode, subPatches, 0, low, high, eventNode);
					}
				}
			}
			else
			{
				patch.domNode = domNode;
				patch.eventNode = eventNode;
			}
	
			i++;
	
			if (!(patch = patches[i]) || (index = patch.index) > high)
			{
				return i;
			}
		}
	
		switch (vNode.type)
		{
			case 'tagger':
				var subNode = vNode.node;
	
				while (subNode.type === "tagger")
				{
					subNode = subNode.node;
				}
	
				return addDomNodesHelp(domNode, subNode, patches, i, low + 1, high, domNode.elm_event_node_ref);
	
			case 'node':
				var vChildren = vNode.children;
				var childNodes = domNode.childNodes;
				for (var j = 0; j < vChildren.length; j++)
				{
					low++;
					var vChild = vChildren[j];
					var nextLow = low + (vChild.descendantsCount || 0);
					if (low <= index && index <= nextLow)
					{
						i = addDomNodesHelp(childNodes[j], vChild, patches, i, low, nextLow, eventNode);
						if (!(patch = patches[i]) || (index = patch.index) > high)
						{
							return i;
						}
					}
					low = nextLow;
				}
				return i;
	
			case 'keyed-node':
				var vChildren = vNode.children;
				var childNodes = domNode.childNodes;
				for (var j = 0; j < vChildren.length; j++)
				{
					low++;
					var vChild = vChildren[j]._1;
					var nextLow = low + (vChild.descendantsCount || 0);
					if (low <= index && index <= nextLow)
					{
						i = addDomNodesHelp(childNodes[j], vChild, patches, i, low, nextLow, eventNode);
						if (!(patch = patches[i]) || (index = patch.index) > high)
						{
							return i;
						}
					}
					low = nextLow;
				}
				return i;
	
			case 'text':
			case 'thunk':
				throw new Error('should never traverse `text` or `thunk` nodes like this');
		}
	}
	
	
	
	////////////  APPLY PATCHES  ////////////
	
	
	function applyPatches(rootDomNode, oldVirtualNode, patches, eventNode)
	{
		if (patches.length === 0)
		{
			return rootDomNode;
		}
	
		addDomNodes(rootDomNode, oldVirtualNode, patches, eventNode);
		return applyPatchesHelp(rootDomNode, patches);
	}
	
	function applyPatchesHelp(rootDomNode, patches)
	{
		for (var i = 0; i < patches.length; i++)
		{
			var patch = patches[i];
			var localDomNode = patch.domNode
			var newNode = applyPatch(localDomNode, patch);
			if (localDomNode === rootDomNode)
			{
				rootDomNode = newNode;
			}
		}
		return rootDomNode;
	}
	
	function applyPatch(domNode, patch)
	{
		switch (patch.type)
		{
			case 'p-redraw':
				return applyPatchRedraw(domNode, patch.data, patch.eventNode);
	
			case 'p-facts':
				applyFacts(domNode, patch.eventNode, patch.data);
				return domNode;
	
			case 'p-text':
				domNode.replaceData(0, domNode.length, patch.data);
				return domNode;
	
			case 'p-thunk':
				return applyPatchesHelp(domNode, patch.data);
	
			case 'p-tagger':
				if (typeof domNode.elm_event_node_ref !== 'undefined')
				{
					domNode.elm_event_node_ref.tagger = patch.data;
				}
				else
				{
					domNode.elm_event_node_ref = { tagger: patch.data, parent: patch.eventNode };
				}
				return domNode;
	
			case 'p-remove-last':
				var i = patch.data;
				while (i--)
				{
					domNode.removeChild(domNode.lastChild);
				}
				return domNode;
	
			case 'p-append':
				var newNodes = patch.data;
				for (var i = 0; i < newNodes.length; i++)
				{
					domNode.appendChild(render(newNodes[i], patch.eventNode));
				}
				return domNode;
	
			case 'p-remove':
				var data = patch.data;
				if (typeof data === 'undefined')
				{
					domNode.parentNode.removeChild(domNode);
					return domNode;
				}
				var entry = data.entry;
				if (typeof entry.index !== 'undefined')
				{
					domNode.parentNode.removeChild(domNode);
				}
				entry.data = applyPatchesHelp(domNode, data.patches);
				return domNode;
	
			case 'p-reorder':
				return applyPatchReorder(domNode, patch);
	
			case 'p-custom':
				var impl = patch.data;
				return impl.applyPatch(domNode, impl.data);
	
			default:
				throw new Error('Ran into an unknown patch!');
		}
	}
	
	
	function applyPatchRedraw(domNode, vNode, eventNode)
	{
		var parentNode = domNode.parentNode;
		var newNode = render(vNode, eventNode);
	
		if (typeof newNode.elm_event_node_ref === 'undefined')
		{
			newNode.elm_event_node_ref = domNode.elm_event_node_ref;
		}
	
		if (parentNode && newNode !== domNode)
		{
			parentNode.replaceChild(newNode, domNode);
		}
		return newNode;
	}
	
	
	function applyPatchReorder(domNode, patch)
	{
		var data = patch.data;
	
		// remove end inserts
		var frag = applyPatchReorderEndInsertsHelp(data.endInserts, patch);
	
		// removals
		domNode = applyPatchesHelp(domNode, data.patches);
	
		// inserts
		var inserts = data.inserts;
		for (var i = 0; i < inserts.length; i++)
		{
			var insert = inserts[i];
			var entry = insert.entry;
			var node = entry.tag === 'move'
				? entry.data
				: render(entry.vnode, patch.eventNode);
			domNode.insertBefore(node, domNode.childNodes[insert.index]);
		}
	
		// add end inserts
		if (typeof frag !== 'undefined')
		{
			domNode.appendChild(frag);
		}
	
		return domNode;
	}
	
	
	function applyPatchReorderEndInsertsHelp(endInserts, patch)
	{
		if (typeof endInserts === 'undefined')
		{
			return;
		}
	
		var frag = localDoc.createDocumentFragment();
		for (var i = 0; i < endInserts.length; i++)
		{
			var insert = endInserts[i];
			var entry = insert.entry;
			frag.appendChild(entry.tag === 'move'
				? entry.data
				: render(entry.vnode, patch.eventNode)
			);
		}
		return frag;
	}
	
	
	// PROGRAMS
	
	var program = makeProgram(checkNoFlags);
	var programWithFlags = makeProgram(checkYesFlags);
	
	function makeProgram(flagChecker)
	{
		return F2(function(debugWrap, impl)
		{
			return function(flagDecoder)
			{
				return function(object, moduleName, debugMetadata)
				{
					var checker = flagChecker(flagDecoder, moduleName);
					if (typeof debugMetadata === 'undefined')
					{
						normalSetup(impl, object, moduleName, checker);
					}
					else
					{
						debugSetup(A2(debugWrap, debugMetadata, impl), object, moduleName, checker);
					}
				};
			};
		});
	}
	
	function staticProgram(vNode)
	{
		var nothing = _elm_lang$core$Native_Utils.Tuple2(
			_elm_lang$core$Native_Utils.Tuple0,
			_elm_lang$core$Platform_Cmd$none
		);
		return A2(program, _elm_lang$virtual_dom$VirtualDom_Debug$wrap, {
			init: nothing,
			view: function() { return vNode; },
			update: F2(function() { return nothing; }),
			subscriptions: function() { return _elm_lang$core$Platform_Sub$none; }
		})();
	}
	
	
	// FLAG CHECKERS
	
	function checkNoFlags(flagDecoder, moduleName)
	{
		return function(init, flags, domNode)
		{
			if (typeof flags === 'undefined')
			{
				return init;
			}
	
			var errorMessage =
				'The `' + moduleName + '` module does not need flags.\n'
				+ 'Initialize it with no arguments and you should be all set!';
	
			crash(errorMessage, domNode);
		};
	}
	
	function checkYesFlags(flagDecoder, moduleName)
	{
		return function(init, flags, domNode)
		{
			if (typeof flagDecoder === 'undefined')
			{
				var errorMessage =
					'Are you trying to sneak a Never value into Elm? Trickster!\n'
					+ 'It looks like ' + moduleName + '.main is defined with `programWithFlags` but has type `Program Never`.\n'
					+ 'Use `program` instead if you do not want flags.'
	
				crash(errorMessage, domNode);
			}
	
			var result = A2(_elm_lang$core$Native_Json.run, flagDecoder, flags);
			if (result.ctor === 'Ok')
			{
				return init(result._0);
			}
	
			var errorMessage =
				'Trying to initialize the `' + moduleName + '` module with an unexpected flag.\n'
				+ 'I tried to convert it to an Elm value, but ran into this problem:\n\n'
				+ result._0;
	
			crash(errorMessage, domNode);
		};
	}
	
	function crash(errorMessage, domNode)
	{
		if (domNode)
		{
			domNode.innerHTML =
				'<div style="padding-left:1em;">'
				+ '<h2 style="font-weight:normal;"><b>Oops!</b> Something went wrong when starting your Elm program.</h2>'
				+ '<pre style="padding-left:1em;">' + errorMessage + '</pre>'
				+ '</div>';
		}
	
		throw new Error(errorMessage);
	}
	
	
	//  NORMAL SETUP
	
	function normalSetup(impl, object, moduleName, flagChecker)
	{
		object['embed'] = function embed(node, flags)
		{
			while (node.lastChild)
			{
				node.removeChild(node.lastChild);
			}
	
			return _elm_lang$core$Native_Platform.initialize(
				flagChecker(impl.init, flags, node),
				impl.update,
				impl.subscriptions,
				normalRenderer(node, impl.view)
			);
		};
	
		object['fullscreen'] = function fullscreen(flags)
		{
			return _elm_lang$core$Native_Platform.initialize(
				flagChecker(impl.init, flags, document.body),
				impl.update,
				impl.subscriptions,
				normalRenderer(document.body, impl.view)
			);
		};
	}
	
	function normalRenderer(parentNode, view)
	{
		return function(tagger, initialModel)
		{
			var eventNode = { tagger: tagger, parent: undefined };
			var initialVirtualNode = view(initialModel);
			var domNode = render(initialVirtualNode, eventNode);
			parentNode.appendChild(domNode);
			return makeStepper(domNode, view, initialVirtualNode, eventNode);
		};
	}
	
	
	// STEPPER
	
	var rAF =
		typeof requestAnimationFrame !== 'undefined'
			? requestAnimationFrame
			: function(callback) { setTimeout(callback, 1000 / 60); };
	
	function makeStepper(domNode, view, initialVirtualNode, eventNode)
	{
		var state = 'NO_REQUEST';
		var currNode = initialVirtualNode;
		var nextModel;
	
		function updateIfNeeded()
		{
			switch (state)
			{
				case 'NO_REQUEST':
					throw new Error(
						'Unexpected draw callback.\n' +
						'Please report this to <https://github.com/elm-lang/virtual-dom/issues>.'
					);
	
				case 'PENDING_REQUEST':
					rAF(updateIfNeeded);
					state = 'EXTRA_REQUEST';
	
					var nextNode = view(nextModel);
					var patches = diff(currNode, nextNode);
					domNode = applyPatches(domNode, currNode, patches, eventNode);
					currNode = nextNode;
	
					return;
	
				case 'EXTRA_REQUEST':
					state = 'NO_REQUEST';
					return;
			}
		}
	
		return function stepper(model)
		{
			if (state === 'NO_REQUEST')
			{
				rAF(updateIfNeeded);
			}
			state = 'PENDING_REQUEST';
			nextModel = model;
		};
	}
	
	
	// DEBUG SETUP
	
	function debugSetup(impl, object, moduleName, flagChecker)
	{
		object['fullscreen'] = function fullscreen(flags)
		{
			var popoutRef = { doc: undefined };
			return _elm_lang$core$Native_Platform.initialize(
				flagChecker(impl.init, flags, document.body),
				impl.update(scrollTask(popoutRef)),
				impl.subscriptions,
				debugRenderer(moduleName, document.body, popoutRef, impl.view, impl.viewIn, impl.viewOut)
			);
		};
	
		object['embed'] = function fullscreen(node, flags)
		{
			var popoutRef = { doc: undefined };
			return _elm_lang$core$Native_Platform.initialize(
				flagChecker(impl.init, flags, node),
				impl.update(scrollTask(popoutRef)),
				impl.subscriptions,
				debugRenderer(moduleName, node, popoutRef, impl.view, impl.viewIn, impl.viewOut)
			);
		};
	}
	
	function scrollTask(popoutRef)
	{
		return _elm_lang$core$Native_Scheduler.nativeBinding(function(callback)
		{
			var doc = popoutRef.doc;
			if (doc)
			{
				var msgs = doc.getElementsByClassName('debugger-sidebar-messages')[0];
				if (msgs)
				{
					msgs.scrollTop = msgs.scrollHeight;
				}
			}
			callback(_elm_lang$core$Native_Scheduler.succeed(_elm_lang$core$Native_Utils.Tuple0));
		});
	}
	
	
	function debugRenderer(moduleName, parentNode, popoutRef, view, viewIn, viewOut)
	{
		return function(tagger, initialModel)
		{
			var appEventNode = { tagger: tagger, parent: undefined };
			var eventNode = { tagger: tagger, parent: undefined };
	
			// make normal stepper
			var appVirtualNode = view(initialModel);
			var appNode = render(appVirtualNode, appEventNode);
			parentNode.appendChild(appNode);
			var appStepper = makeStepper(appNode, view, appVirtualNode, appEventNode);
	
			// make overlay stepper
			var overVirtualNode = viewIn(initialModel)._1;
			var overNode = render(overVirtualNode, eventNode);
			parentNode.appendChild(overNode);
			var wrappedViewIn = wrapViewIn(appEventNode, overNode, viewIn);
			var overStepper = makeStepper(overNode, wrappedViewIn, overVirtualNode, eventNode);
	
			// make debugger stepper
			var debugStepper = makeDebugStepper(initialModel, viewOut, eventNode, parentNode, moduleName, popoutRef);
	
			return function stepper(model)
			{
				appStepper(model);
				overStepper(model);
				debugStepper(model);
			}
		};
	}
	
	function makeDebugStepper(initialModel, view, eventNode, parentNode, moduleName, popoutRef)
	{
		var curr;
		var domNode;
	
		return function stepper(model)
		{
			if (!model.isDebuggerOpen)
			{
				return;
			}
	
			if (!popoutRef.doc)
			{
				curr = view(model);
				domNode = openDebugWindow(moduleName, popoutRef, curr, eventNode);
				return;
			}
	
			// switch to document of popout
			localDoc = popoutRef.doc;
	
			var next = view(model);
			var patches = diff(curr, next);
			domNode = applyPatches(domNode, curr, patches, eventNode);
			curr = next;
	
			// switch back to normal document
			localDoc = document;
		};
	}
	
	function openDebugWindow(moduleName, popoutRef, virtualNode, eventNode)
	{
		var w = 900;
		var h = 360;
		var x = screen.width - w;
		var y = screen.height - h;
		var debugWindow = window.open('', '', 'width=' + w + ',height=' + h + ',left=' + x + ',top=' + y);
	
		// switch to window document
		localDoc = debugWindow.document;
	
		popoutRef.doc = localDoc;
		localDoc.title = 'Debugger - ' + moduleName;
		localDoc.body.style.margin = '0';
		localDoc.body.style.padding = '0';
		var domNode = render(virtualNode, eventNode);
		localDoc.body.appendChild(domNode);
	
		localDoc.addEventListener('keydown', function(event) {
			if (event.metaKey && event.which === 82)
			{
				window.location.reload();
			}
			if (event.which === 38)
			{
				eventNode.tagger({ ctor: 'Up' });
				event.preventDefault();
			}
			if (event.which === 40)
			{
				eventNode.tagger({ ctor: 'Down' });
				event.preventDefault();
			}
		});
	
		function close()
		{
			popoutRef.doc = undefined;
			debugWindow.close();
		}
		window.addEventListener('unload', close);
		debugWindow.addEventListener('unload', function() {
			popoutRef.doc = undefined;
			window.removeEventListener('unload', close);
			eventNode.tagger({ ctor: 'Close' });
		});
	
		// switch back to the normal document
		localDoc = document;
	
		return domNode;
	}
	
	
	// BLOCK EVENTS
	
	function wrapViewIn(appEventNode, overlayNode, viewIn)
	{
		var ignorer = makeIgnorer(overlayNode);
		var blocking = 'Normal';
		var overflow;
	
		var normalTagger = appEventNode.tagger;
		var blockTagger = function() {};
	
		return function(model)
		{
			var tuple = viewIn(model);
			var newBlocking = tuple._0.ctor;
			appEventNode.tagger = newBlocking === 'Normal' ? normalTagger : blockTagger;
			if (blocking !== newBlocking)
			{
				traverse('removeEventListener', ignorer, blocking);
				traverse('addEventListener', ignorer, newBlocking);
	
				if (blocking === 'Normal')
				{
					overflow = document.body.style.overflow;
					document.body.style.overflow = 'hidden';
				}
	
				if (newBlocking === 'Normal')
				{
					document.body.style.overflow = overflow;
				}
	
				blocking = newBlocking;
			}
			return tuple._1;
		}
	}
	
	function traverse(verbEventListener, ignorer, blocking)
	{
		switch(blocking)
		{
			case 'Normal':
				return;
	
			case 'Pause':
				return traverseHelp(verbEventListener, ignorer, mostEvents);
	
			case 'Message':
				return traverseHelp(verbEventListener, ignorer, allEvents);
		}
	}
	
	function traverseHelp(verbEventListener, handler, eventNames)
	{
		for (var i = 0; i < eventNames.length; i++)
		{
			document.body[verbEventListener](eventNames[i], handler, true);
		}
	}
	
	function makeIgnorer(overlayNode)
	{
		return function(event)
		{
			if (event.type === 'keydown' && event.metaKey && event.which === 82)
			{
				return;
			}
	
			var isScroll = event.type === 'scroll' || event.type === 'wheel';
	
			var node = event.target;
			while (node !== null)
			{
				if (node.className === 'elm-overlay-message-details' && isScroll)
				{
					return;
				}
	
				if (node === overlayNode && !isScroll)
				{
					return;
				}
				node = node.parentNode;
			}
	
			event.stopPropagation();
			event.preventDefault();
		}
	}
	
	var mostEvents = [
		'click', 'dblclick', 'mousemove',
		'mouseup', 'mousedown', 'mouseenter', 'mouseleave',
		'touchstart', 'touchend', 'touchcancel', 'touchmove',
		'pointerdown', 'pointerup', 'pointerover', 'pointerout',
		'pointerenter', 'pointerleave', 'pointermove', 'pointercancel',
		'dragstart', 'drag', 'dragend', 'dragenter', 'dragover', 'dragleave', 'drop',
		'keyup', 'keydown', 'keypress',
		'input', 'change',
		'focus', 'blur'
	];
	
	var allEvents = mostEvents.concat('wheel', 'scroll');
	
	
	return {
		node: node,
		text: text,
		custom: custom,
		map: F2(map),
	
		on: F3(on),
		style: style,
		property: F2(property),
		attribute: F2(attribute),
		attributeNS: F3(attributeNS),
		mapProperty: F2(mapProperty),
	
		lazy: F2(lazy),
		lazy2: F3(lazy2),
		lazy3: F4(lazy3),
		keyedNode: F3(keyedNode),
	
		program: program,
		programWithFlags: programWithFlags,
		staticProgram: staticProgram
	};
	
	}();
	
	var _elm_lang$virtual_dom$VirtualDom$programWithFlags = function (impl) {
		return A2(_elm_lang$virtual_dom$Native_VirtualDom.programWithFlags, _elm_lang$virtual_dom$VirtualDom_Debug$wrapWithFlags, impl);
	};
	var _elm_lang$virtual_dom$VirtualDom$program = function (impl) {
		return A2(_elm_lang$virtual_dom$Native_VirtualDom.program, _elm_lang$virtual_dom$VirtualDom_Debug$wrap, impl);
	};
	var _elm_lang$virtual_dom$VirtualDom$keyedNode = _elm_lang$virtual_dom$Native_VirtualDom.keyedNode;
	var _elm_lang$virtual_dom$VirtualDom$lazy3 = _elm_lang$virtual_dom$Native_VirtualDom.lazy3;
	var _elm_lang$virtual_dom$VirtualDom$lazy2 = _elm_lang$virtual_dom$Native_VirtualDom.lazy2;
	var _elm_lang$virtual_dom$VirtualDom$lazy = _elm_lang$virtual_dom$Native_VirtualDom.lazy;
	var _elm_lang$virtual_dom$VirtualDom$defaultOptions = {stopPropagation: false, preventDefault: false};
	var _elm_lang$virtual_dom$VirtualDom$onWithOptions = _elm_lang$virtual_dom$Native_VirtualDom.on;
	var _elm_lang$virtual_dom$VirtualDom$on = F2(
		function (eventName, decoder) {
			return A3(_elm_lang$virtual_dom$VirtualDom$onWithOptions, eventName, _elm_lang$virtual_dom$VirtualDom$defaultOptions, decoder);
		});
	var _elm_lang$virtual_dom$VirtualDom$style = _elm_lang$virtual_dom$Native_VirtualDom.style;
	var _elm_lang$virtual_dom$VirtualDom$mapProperty = _elm_lang$virtual_dom$Native_VirtualDom.mapProperty;
	var _elm_lang$virtual_dom$VirtualDom$attributeNS = _elm_lang$virtual_dom$Native_VirtualDom.attributeNS;
	var _elm_lang$virtual_dom$VirtualDom$attribute = _elm_lang$virtual_dom$Native_VirtualDom.attribute;
	var _elm_lang$virtual_dom$VirtualDom$property = _elm_lang$virtual_dom$Native_VirtualDom.property;
	var _elm_lang$virtual_dom$VirtualDom$map = _elm_lang$virtual_dom$Native_VirtualDom.map;
	var _elm_lang$virtual_dom$VirtualDom$text = _elm_lang$virtual_dom$Native_VirtualDom.text;
	var _elm_lang$virtual_dom$VirtualDom$node = _elm_lang$virtual_dom$Native_VirtualDom.node;
	var _elm_lang$virtual_dom$VirtualDom$Options = F2(
		function (a, b) {
			return {stopPropagation: a, preventDefault: b};
		});
	var _elm_lang$virtual_dom$VirtualDom$Node = {ctor: 'Node'};
	var _elm_lang$virtual_dom$VirtualDom$Property = {ctor: 'Property'};
	
	var _elm_lang$html$Html$programWithFlags = _elm_lang$virtual_dom$VirtualDom$programWithFlags;
	var _elm_lang$html$Html$program = _elm_lang$virtual_dom$VirtualDom$program;
	var _elm_lang$html$Html$beginnerProgram = function (_p0) {
		var _p1 = _p0;
		return _elm_lang$html$Html$program(
			{
				init: A2(
					_elm_lang$core$Platform_Cmd_ops['!'],
					_p1.model,
					{ctor: '[]'}),
				update: F2(
					function (msg, model) {
						return A2(
							_elm_lang$core$Platform_Cmd_ops['!'],
							A2(_p1.update, msg, model),
							{ctor: '[]'});
					}),
				view: _p1.view,
				subscriptions: function (_p2) {
					return _elm_lang$core$Platform_Sub$none;
				}
			});
	};
	var _elm_lang$html$Html$map = _elm_lang$virtual_dom$VirtualDom$map;
	var _elm_lang$html$Html$text = _elm_lang$virtual_dom$VirtualDom$text;
	var _elm_lang$html$Html$node = _elm_lang$virtual_dom$VirtualDom$node;
	var _elm_lang$html$Html$body = _elm_lang$html$Html$node('body');
	var _elm_lang$html$Html$section = _elm_lang$html$Html$node('section');
	var _elm_lang$html$Html$nav = _elm_lang$html$Html$node('nav');
	var _elm_lang$html$Html$article = _elm_lang$html$Html$node('article');
	var _elm_lang$html$Html$aside = _elm_lang$html$Html$node('aside');
	var _elm_lang$html$Html$h1 = _elm_lang$html$Html$node('h1');
	var _elm_lang$html$Html$h2 = _elm_lang$html$Html$node('h2');
	var _elm_lang$html$Html$h3 = _elm_lang$html$Html$node('h3');
	var _elm_lang$html$Html$h4 = _elm_lang$html$Html$node('h4');
	var _elm_lang$html$Html$h5 = _elm_lang$html$Html$node('h5');
	var _elm_lang$html$Html$h6 = _elm_lang$html$Html$node('h6');
	var _elm_lang$html$Html$header = _elm_lang$html$Html$node('header');
	var _elm_lang$html$Html$footer = _elm_lang$html$Html$node('footer');
	var _elm_lang$html$Html$address = _elm_lang$html$Html$node('address');
	var _elm_lang$html$Html$main_ = _elm_lang$html$Html$node('main');
	var _elm_lang$html$Html$p = _elm_lang$html$Html$node('p');
	var _elm_lang$html$Html$hr = _elm_lang$html$Html$node('hr');
	var _elm_lang$html$Html$pre = _elm_lang$html$Html$node('pre');
	var _elm_lang$html$Html$blockquote = _elm_lang$html$Html$node('blockquote');
	var _elm_lang$html$Html$ol = _elm_lang$html$Html$node('ol');
	var _elm_lang$html$Html$ul = _elm_lang$html$Html$node('ul');
	var _elm_lang$html$Html$li = _elm_lang$html$Html$node('li');
	var _elm_lang$html$Html$dl = _elm_lang$html$Html$node('dl');
	var _elm_lang$html$Html$dt = _elm_lang$html$Html$node('dt');
	var _elm_lang$html$Html$dd = _elm_lang$html$Html$node('dd');
	var _elm_lang$html$Html$figure = _elm_lang$html$Html$node('figure');
	var _elm_lang$html$Html$figcaption = _elm_lang$html$Html$node('figcaption');
	var _elm_lang$html$Html$div = _elm_lang$html$Html$node('div');
	var _elm_lang$html$Html$a = _elm_lang$html$Html$node('a');
	var _elm_lang$html$Html$em = _elm_lang$html$Html$node('em');
	var _elm_lang$html$Html$strong = _elm_lang$html$Html$node('strong');
	var _elm_lang$html$Html$small = _elm_lang$html$Html$node('small');
	var _elm_lang$html$Html$s = _elm_lang$html$Html$node('s');
	var _elm_lang$html$Html$cite = _elm_lang$html$Html$node('cite');
	var _elm_lang$html$Html$q = _elm_lang$html$Html$node('q');
	var _elm_lang$html$Html$dfn = _elm_lang$html$Html$node('dfn');
	var _elm_lang$html$Html$abbr = _elm_lang$html$Html$node('abbr');
	var _elm_lang$html$Html$time = _elm_lang$html$Html$node('time');
	var _elm_lang$html$Html$code = _elm_lang$html$Html$node('code');
	var _elm_lang$html$Html$var = _elm_lang$html$Html$node('var');
	var _elm_lang$html$Html$samp = _elm_lang$html$Html$node('samp');
	var _elm_lang$html$Html$kbd = _elm_lang$html$Html$node('kbd');
	var _elm_lang$html$Html$sub = _elm_lang$html$Html$node('sub');
	var _elm_lang$html$Html$sup = _elm_lang$html$Html$node('sup');
	var _elm_lang$html$Html$i = _elm_lang$html$Html$node('i');
	var _elm_lang$html$Html$b = _elm_lang$html$Html$node('b');
	var _elm_lang$html$Html$u = _elm_lang$html$Html$node('u');
	var _elm_lang$html$Html$mark = _elm_lang$html$Html$node('mark');
	var _elm_lang$html$Html$ruby = _elm_lang$html$Html$node('ruby');
	var _elm_lang$html$Html$rt = _elm_lang$html$Html$node('rt');
	var _elm_lang$html$Html$rp = _elm_lang$html$Html$node('rp');
	var _elm_lang$html$Html$bdi = _elm_lang$html$Html$node('bdi');
	var _elm_lang$html$Html$bdo = _elm_lang$html$Html$node('bdo');
	var _elm_lang$html$Html$span = _elm_lang$html$Html$node('span');
	var _elm_lang$html$Html$br = _elm_lang$html$Html$node('br');
	var _elm_lang$html$Html$wbr = _elm_lang$html$Html$node('wbr');
	var _elm_lang$html$Html$ins = _elm_lang$html$Html$node('ins');
	var _elm_lang$html$Html$del = _elm_lang$html$Html$node('del');
	var _elm_lang$html$Html$img = _elm_lang$html$Html$node('img');
	var _elm_lang$html$Html$iframe = _elm_lang$html$Html$node('iframe');
	var _elm_lang$html$Html$embed = _elm_lang$html$Html$node('embed');
	var _elm_lang$html$Html$object = _elm_lang$html$Html$node('object');
	var _elm_lang$html$Html$param = _elm_lang$html$Html$node('param');
	var _elm_lang$html$Html$video = _elm_lang$html$Html$node('video');
	var _elm_lang$html$Html$audio = _elm_lang$html$Html$node('audio');
	var _elm_lang$html$Html$source = _elm_lang$html$Html$node('source');
	var _elm_lang$html$Html$track = _elm_lang$html$Html$node('track');
	var _elm_lang$html$Html$canvas = _elm_lang$html$Html$node('canvas');
	var _elm_lang$html$Html$math = _elm_lang$html$Html$node('math');
	var _elm_lang$html$Html$table = _elm_lang$html$Html$node('table');
	var _elm_lang$html$Html$caption = _elm_lang$html$Html$node('caption');
	var _elm_lang$html$Html$colgroup = _elm_lang$html$Html$node('colgroup');
	var _elm_lang$html$Html$col = _elm_lang$html$Html$node('col');
	var _elm_lang$html$Html$tbody = _elm_lang$html$Html$node('tbody');
	var _elm_lang$html$Html$thead = _elm_lang$html$Html$node('thead');
	var _elm_lang$html$Html$tfoot = _elm_lang$html$Html$node('tfoot');
	var _elm_lang$html$Html$tr = _elm_lang$html$Html$node('tr');
	var _elm_lang$html$Html$td = _elm_lang$html$Html$node('td');
	var _elm_lang$html$Html$th = _elm_lang$html$Html$node('th');
	var _elm_lang$html$Html$form = _elm_lang$html$Html$node('form');
	var _elm_lang$html$Html$fieldset = _elm_lang$html$Html$node('fieldset');
	var _elm_lang$html$Html$legend = _elm_lang$html$Html$node('legend');
	var _elm_lang$html$Html$label = _elm_lang$html$Html$node('label');
	var _elm_lang$html$Html$input = _elm_lang$html$Html$node('input');
	var _elm_lang$html$Html$button = _elm_lang$html$Html$node('button');
	var _elm_lang$html$Html$select = _elm_lang$html$Html$node('select');
	var _elm_lang$html$Html$datalist = _elm_lang$html$Html$node('datalist');
	var _elm_lang$html$Html$optgroup = _elm_lang$html$Html$node('optgroup');
	var _elm_lang$html$Html$option = _elm_lang$html$Html$node('option');
	var _elm_lang$html$Html$textarea = _elm_lang$html$Html$node('textarea');
	var _elm_lang$html$Html$keygen = _elm_lang$html$Html$node('keygen');
	var _elm_lang$html$Html$output = _elm_lang$html$Html$node('output');
	var _elm_lang$html$Html$progress = _elm_lang$html$Html$node('progress');
	var _elm_lang$html$Html$meter = _elm_lang$html$Html$node('meter');
	var _elm_lang$html$Html$details = _elm_lang$html$Html$node('details');
	var _elm_lang$html$Html$summary = _elm_lang$html$Html$node('summary');
	var _elm_lang$html$Html$menuitem = _elm_lang$html$Html$node('menuitem');
	var _elm_lang$html$Html$menu = _elm_lang$html$Html$node('menu');
	
	var _elm_lang$html$Html_Attributes$map = _elm_lang$virtual_dom$VirtualDom$mapProperty;
	var _elm_lang$html$Html_Attributes$attribute = _elm_lang$virtual_dom$VirtualDom$attribute;
	var _elm_lang$html$Html_Attributes$contextmenu = function (value) {
		return A2(_elm_lang$html$Html_Attributes$attribute, 'contextmenu', value);
	};
	var _elm_lang$html$Html_Attributes$draggable = function (value) {
		return A2(_elm_lang$html$Html_Attributes$attribute, 'draggable', value);
	};
	var _elm_lang$html$Html_Attributes$itemprop = function (value) {
		return A2(_elm_lang$html$Html_Attributes$attribute, 'itemprop', value);
	};
	var _elm_lang$html$Html_Attributes$tabindex = function (n) {
		return A2(
			_elm_lang$html$Html_Attributes$attribute,
			'tabIndex',
			_elm_lang$core$Basics$toString(n));
	};
	var _elm_lang$html$Html_Attributes$charset = function (value) {
		return A2(_elm_lang$html$Html_Attributes$attribute, 'charset', value);
	};
	var _elm_lang$html$Html_Attributes$height = function (value) {
		return A2(
			_elm_lang$html$Html_Attributes$attribute,
			'height',
			_elm_lang$core$Basics$toString(value));
	};
	var _elm_lang$html$Html_Attributes$width = function (value) {
		return A2(
			_elm_lang$html$Html_Attributes$attribute,
			'width',
			_elm_lang$core$Basics$toString(value));
	};
	var _elm_lang$html$Html_Attributes$formaction = function (value) {
		return A2(_elm_lang$html$Html_Attributes$attribute, 'formAction', value);
	};
	var _elm_lang$html$Html_Attributes$list = function (value) {
		return A2(_elm_lang$html$Html_Attributes$attribute, 'list', value);
	};
	var _elm_lang$html$Html_Attributes$minlength = function (n) {
		return A2(
			_elm_lang$html$Html_Attributes$attribute,
			'minLength',
			_elm_lang$core$Basics$toString(n));
	};
	var _elm_lang$html$Html_Attributes$maxlength = function (n) {
		return A2(
			_elm_lang$html$Html_Attributes$attribute,
			'maxlength',
			_elm_lang$core$Basics$toString(n));
	};
	var _elm_lang$html$Html_Attributes$size = function (n) {
		return A2(
			_elm_lang$html$Html_Attributes$attribute,
			'size',
			_elm_lang$core$Basics$toString(n));
	};
	var _elm_lang$html$Html_Attributes$form = function (value) {
		return A2(_elm_lang$html$Html_Attributes$attribute, 'form', value);
	};
	var _elm_lang$html$Html_Attributes$cols = function (n) {
		return A2(
			_elm_lang$html$Html_Attributes$attribute,
			'cols',
			_elm_lang$core$Basics$toString(n));
	};
	var _elm_lang$html$Html_Attributes$rows = function (n) {
		return A2(
			_elm_lang$html$Html_Attributes$attribute,
			'rows',
			_elm_lang$core$Basics$toString(n));
	};
	var _elm_lang$html$Html_Attributes$challenge = function (value) {
		return A2(_elm_lang$html$Html_Attributes$attribute, 'challenge', value);
	};
	var _elm_lang$html$Html_Attributes$media = function (value) {
		return A2(_elm_lang$html$Html_Attributes$attribute, 'media', value);
	};
	var _elm_lang$html$Html_Attributes$rel = function (value) {
		return A2(_elm_lang$html$Html_Attributes$attribute, 'rel', value);
	};
	var _elm_lang$html$Html_Attributes$datetime = function (value) {
		return A2(_elm_lang$html$Html_Attributes$attribute, 'datetime', value);
	};
	var _elm_lang$html$Html_Attributes$pubdate = function (value) {
		return A2(_elm_lang$html$Html_Attributes$attribute, 'pubdate', value);
	};
	var _elm_lang$html$Html_Attributes$colspan = function (n) {
		return A2(
			_elm_lang$html$Html_Attributes$attribute,
			'colspan',
			_elm_lang$core$Basics$toString(n));
	};
	var _elm_lang$html$Html_Attributes$rowspan = function (n) {
		return A2(
			_elm_lang$html$Html_Attributes$attribute,
			'rowspan',
			_elm_lang$core$Basics$toString(n));
	};
	var _elm_lang$html$Html_Attributes$manifest = function (value) {
		return A2(_elm_lang$html$Html_Attributes$attribute, 'manifest', value);
	};
	var _elm_lang$html$Html_Attributes$property = _elm_lang$virtual_dom$VirtualDom$property;
	var _elm_lang$html$Html_Attributes$stringProperty = F2(
		function (name, string) {
			return A2(
				_elm_lang$html$Html_Attributes$property,
				name,
				_elm_lang$core$Json_Encode$string(string));
		});
	var _elm_lang$html$Html_Attributes$class = function (name) {
		return A2(_elm_lang$html$Html_Attributes$stringProperty, 'className', name);
	};
	var _elm_lang$html$Html_Attributes$id = function (name) {
		return A2(_elm_lang$html$Html_Attributes$stringProperty, 'id', name);
	};
	var _elm_lang$html$Html_Attributes$title = function (name) {
		return A2(_elm_lang$html$Html_Attributes$stringProperty, 'title', name);
	};
	var _elm_lang$html$Html_Attributes$accesskey = function ($char) {
		return A2(
			_elm_lang$html$Html_Attributes$stringProperty,
			'accessKey',
			_elm_lang$core$String$fromChar($char));
	};
	var _elm_lang$html$Html_Attributes$dir = function (value) {
		return A2(_elm_lang$html$Html_Attributes$stringProperty, 'dir', value);
	};
	var _elm_lang$html$Html_Attributes$dropzone = function (value) {
		return A2(_elm_lang$html$Html_Attributes$stringProperty, 'dropzone', value);
	};
	var _elm_lang$html$Html_Attributes$lang = function (value) {
		return A2(_elm_lang$html$Html_Attributes$stringProperty, 'lang', value);
	};
	var _elm_lang$html$Html_Attributes$content = function (value) {
		return A2(_elm_lang$html$Html_Attributes$stringProperty, 'content', value);
	};
	var _elm_lang$html$Html_Attributes$httpEquiv = function (value) {
		return A2(_elm_lang$html$Html_Attributes$stringProperty, 'httpEquiv', value);
	};
	var _elm_lang$html$Html_Attributes$language = function (value) {
		return A2(_elm_lang$html$Html_Attributes$stringProperty, 'language', value);
	};
	var _elm_lang$html$Html_Attributes$src = function (value) {
		return A2(_elm_lang$html$Html_Attributes$stringProperty, 'src', value);
	};
	var _elm_lang$html$Html_Attributes$alt = function (value) {
		return A2(_elm_lang$html$Html_Attributes$stringProperty, 'alt', value);
	};
	var _elm_lang$html$Html_Attributes$preload = function (value) {
		return A2(_elm_lang$html$Html_Attributes$stringProperty, 'preload', value);
	};
	var _elm_lang$html$Html_Attributes$poster = function (value) {
		return A2(_elm_lang$html$Html_Attributes$stringProperty, 'poster', value);
	};
	var _elm_lang$html$Html_Attributes$kind = function (value) {
		return A2(_elm_lang$html$Html_Attributes$stringProperty, 'kind', value);
	};
	var _elm_lang$html$Html_Attributes$srclang = function (value) {
		return A2(_elm_lang$html$Html_Attributes$stringProperty, 'srclang', value);
	};
	var _elm_lang$html$Html_Attributes$sandbox = function (value) {
		return A2(_elm_lang$html$Html_Attributes$stringProperty, 'sandbox', value);
	};
	var _elm_lang$html$Html_Attributes$srcdoc = function (value) {
		return A2(_elm_lang$html$Html_Attributes$stringProperty, 'srcdoc', value);
	};
	var _elm_lang$html$Html_Attributes$type_ = function (value) {
		return A2(_elm_lang$html$Html_Attributes$stringProperty, 'type', value);
	};
	var _elm_lang$html$Html_Attributes$value = function (value) {
		return A2(_elm_lang$html$Html_Attributes$stringProperty, 'value', value);
	};
	var _elm_lang$html$Html_Attributes$defaultValue = function (value) {
		return A2(_elm_lang$html$Html_Attributes$stringProperty, 'defaultValue', value);
	};
	var _elm_lang$html$Html_Attributes$placeholder = function (value) {
		return A2(_elm_lang$html$Html_Attributes$stringProperty, 'placeholder', value);
	};
	var _elm_lang$html$Html_Attributes$accept = function (value) {
		return A2(_elm_lang$html$Html_Attributes$stringProperty, 'accept', value);
	};
	var _elm_lang$html$Html_Attributes$acceptCharset = function (value) {
		return A2(_elm_lang$html$Html_Attributes$stringProperty, 'acceptCharset', value);
	};
	var _elm_lang$html$Html_Attributes$action = function (value) {
		return A2(_elm_lang$html$Html_Attributes$stringProperty, 'action', value);
	};
	var _elm_lang$html$Html_Attributes$autocomplete = function (bool) {
		return A2(
			_elm_lang$html$Html_Attributes$stringProperty,
			'autocomplete',
			bool ? 'on' : 'off');
	};
	var _elm_lang$html$Html_Attributes$enctype = function (value) {
		return A2(_elm_lang$html$Html_Attributes$stringProperty, 'enctype', value);
	};
	var _elm_lang$html$Html_Attributes$method = function (value) {
		return A2(_elm_lang$html$Html_Attributes$stringProperty, 'method', value);
	};
	var _elm_lang$html$Html_Attributes$name = function (value) {
		return A2(_elm_lang$html$Html_Attributes$stringProperty, 'name', value);
	};
	var _elm_lang$html$Html_Attributes$pattern = function (value) {
		return A2(_elm_lang$html$Html_Attributes$stringProperty, 'pattern', value);
	};
	var _elm_lang$html$Html_Attributes$for = function (value) {
		return A2(_elm_lang$html$Html_Attributes$stringProperty, 'htmlFor', value);
	};
	var _elm_lang$html$Html_Attributes$max = function (value) {
		return A2(_elm_lang$html$Html_Attributes$stringProperty, 'max', value);
	};
	var _elm_lang$html$Html_Attributes$min = function (value) {
		return A2(_elm_lang$html$Html_Attributes$stringProperty, 'min', value);
	};
	var _elm_lang$html$Html_Attributes$step = function (n) {
		return A2(_elm_lang$html$Html_Attributes$stringProperty, 'step', n);
	};
	var _elm_lang$html$Html_Attributes$wrap = function (value) {
		return A2(_elm_lang$html$Html_Attributes$stringProperty, 'wrap', value);
	};
	var _elm_lang$html$Html_Attributes$usemap = function (value) {
		return A2(_elm_lang$html$Html_Attributes$stringProperty, 'useMap', value);
	};
	var _elm_lang$html$Html_Attributes$shape = function (value) {
		return A2(_elm_lang$html$Html_Attributes$stringProperty, 'shape', value);
	};
	var _elm_lang$html$Html_Attributes$coords = function (value) {
		return A2(_elm_lang$html$Html_Attributes$stringProperty, 'coords', value);
	};
	var _elm_lang$html$Html_Attributes$keytype = function (value) {
		return A2(_elm_lang$html$Html_Attributes$stringProperty, 'keytype', value);
	};
	var _elm_lang$html$Html_Attributes$align = function (value) {
		return A2(_elm_lang$html$Html_Attributes$stringProperty, 'align', value);
	};
	var _elm_lang$html$Html_Attributes$cite = function (value) {
		return A2(_elm_lang$html$Html_Attributes$stringProperty, 'cite', value);
	};
	var _elm_lang$html$Html_Attributes$href = function (value) {
		return A2(_elm_lang$html$Html_Attributes$stringProperty, 'href', value);
	};
	var _elm_lang$html$Html_Attributes$target = function (value) {
		return A2(_elm_lang$html$Html_Attributes$stringProperty, 'target', value);
	};
	var _elm_lang$html$Html_Attributes$downloadAs = function (value) {
		return A2(_elm_lang$html$Html_Attributes$stringProperty, 'download', value);
	};
	var _elm_lang$html$Html_Attributes$hreflang = function (value) {
		return A2(_elm_lang$html$Html_Attributes$stringProperty, 'hreflang', value);
	};
	var _elm_lang$html$Html_Attributes$ping = function (value) {
		return A2(_elm_lang$html$Html_Attributes$stringProperty, 'ping', value);
	};
	var _elm_lang$html$Html_Attributes$start = function (n) {
		return A2(
			_elm_lang$html$Html_Attributes$stringProperty,
			'start',
			_elm_lang$core$Basics$toString(n));
	};
	var _elm_lang$html$Html_Attributes$headers = function (value) {
		return A2(_elm_lang$html$Html_Attributes$stringProperty, 'headers', value);
	};
	var _elm_lang$html$Html_Attributes$scope = function (value) {
		return A2(_elm_lang$html$Html_Attributes$stringProperty, 'scope', value);
	};
	var _elm_lang$html$Html_Attributes$boolProperty = F2(
		function (name, bool) {
			return A2(
				_elm_lang$html$Html_Attributes$property,
				name,
				_elm_lang$core$Json_Encode$bool(bool));
		});
	var _elm_lang$html$Html_Attributes$hidden = function (bool) {
		return A2(_elm_lang$html$Html_Attributes$boolProperty, 'hidden', bool);
	};
	var _elm_lang$html$Html_Attributes$contenteditable = function (bool) {
		return A2(_elm_lang$html$Html_Attributes$boolProperty, 'contentEditable', bool);
	};
	var _elm_lang$html$Html_Attributes$spellcheck = function (bool) {
		return A2(_elm_lang$html$Html_Attributes$boolProperty, 'spellcheck', bool);
	};
	var _elm_lang$html$Html_Attributes$async = function (bool) {
		return A2(_elm_lang$html$Html_Attributes$boolProperty, 'async', bool);
	};
	var _elm_lang$html$Html_Attributes$defer = function (bool) {
		return A2(_elm_lang$html$Html_Attributes$boolProperty, 'defer', bool);
	};
	var _elm_lang$html$Html_Attributes$scoped = function (bool) {
		return A2(_elm_lang$html$Html_Attributes$boolProperty, 'scoped', bool);
	};
	var _elm_lang$html$Html_Attributes$autoplay = function (bool) {
		return A2(_elm_lang$html$Html_Attributes$boolProperty, 'autoplay', bool);
	};
	var _elm_lang$html$Html_Attributes$controls = function (bool) {
		return A2(_elm_lang$html$Html_Attributes$boolProperty, 'controls', bool);
	};
	var _elm_lang$html$Html_Attributes$loop = function (bool) {
		return A2(_elm_lang$html$Html_Attributes$boolProperty, 'loop', bool);
	};
	var _elm_lang$html$Html_Attributes$default = function (bool) {
		return A2(_elm_lang$html$Html_Attributes$boolProperty, 'default', bool);
	};
	var _elm_lang$html$Html_Attributes$seamless = function (bool) {
		return A2(_elm_lang$html$Html_Attributes$boolProperty, 'seamless', bool);
	};
	var _elm_lang$html$Html_Attributes$checked = function (bool) {
		return A2(_elm_lang$html$Html_Attributes$boolProperty, 'checked', bool);
	};
	var _elm_lang$html$Html_Attributes$selected = function (bool) {
		return A2(_elm_lang$html$Html_Attributes$boolProperty, 'selected', bool);
	};
	var _elm_lang$html$Html_Attributes$autofocus = function (bool) {
		return A2(_elm_lang$html$Html_Attributes$boolProperty, 'autofocus', bool);
	};
	var _elm_lang$html$Html_Attributes$disabled = function (bool) {
		return A2(_elm_lang$html$Html_Attributes$boolProperty, 'disabled', bool);
	};
	var _elm_lang$html$Html_Attributes$multiple = function (bool) {
		return A2(_elm_lang$html$Html_Attributes$boolProperty, 'multiple', bool);
	};
	var _elm_lang$html$Html_Attributes$novalidate = function (bool) {
		return A2(_elm_lang$html$Html_Attributes$boolProperty, 'noValidate', bool);
	};
	var _elm_lang$html$Html_Attributes$readonly = function (bool) {
		return A2(_elm_lang$html$Html_Attributes$boolProperty, 'readOnly', bool);
	};
	var _elm_lang$html$Html_Attributes$required = function (bool) {
		return A2(_elm_lang$html$Html_Attributes$boolProperty, 'required', bool);
	};
	var _elm_lang$html$Html_Attributes$ismap = function (value) {
		return A2(_elm_lang$html$Html_Attributes$boolProperty, 'isMap', value);
	};
	var _elm_lang$html$Html_Attributes$download = function (bool) {
		return A2(_elm_lang$html$Html_Attributes$boolProperty, 'download', bool);
	};
	var _elm_lang$html$Html_Attributes$reversed = function (bool) {
		return A2(_elm_lang$html$Html_Attributes$boolProperty, 'reversed', bool);
	};
	var _elm_lang$html$Html_Attributes$classList = function (list) {
		return _elm_lang$html$Html_Attributes$class(
			A2(
				_elm_lang$core$String$join,
				' ',
				A2(
					_elm_lang$core$List$map,
					_elm_lang$core$Tuple$first,
					A2(_elm_lang$core$List$filter, _elm_lang$core$Tuple$second, list))));
	};
	var _elm_lang$html$Html_Attributes$style = _elm_lang$virtual_dom$VirtualDom$style;
	
	var _elm_lang$html$Html_Events$keyCode = A2(_elm_lang$core$Json_Decode$field, 'keyCode', _elm_lang$core$Json_Decode$int);
	var _elm_lang$html$Html_Events$targetChecked = A2(
		_elm_lang$core$Json_Decode$at,
		{
			ctor: '::',
			_0: 'target',
			_1: {
				ctor: '::',
				_0: 'checked',
				_1: {ctor: '[]'}
			}
		},
		_elm_lang$core$Json_Decode$bool);
	var _elm_lang$html$Html_Events$targetValue = A2(
		_elm_lang$core$Json_Decode$at,
		{
			ctor: '::',
			_0: 'target',
			_1: {
				ctor: '::',
				_0: 'value',
				_1: {ctor: '[]'}
			}
		},
		_elm_lang$core$Json_Decode$string);
	var _elm_lang$html$Html_Events$defaultOptions = _elm_lang$virtual_dom$VirtualDom$defaultOptions;
	var _elm_lang$html$Html_Events$onWithOptions = _elm_lang$virtual_dom$VirtualDom$onWithOptions;
	var _elm_lang$html$Html_Events$on = _elm_lang$virtual_dom$VirtualDom$on;
	var _elm_lang$html$Html_Events$onFocus = function (msg) {
		return A2(
			_elm_lang$html$Html_Events$on,
			'focus',
			_elm_lang$core$Json_Decode$succeed(msg));
	};
	var _elm_lang$html$Html_Events$onBlur = function (msg) {
		return A2(
			_elm_lang$html$Html_Events$on,
			'blur',
			_elm_lang$core$Json_Decode$succeed(msg));
	};
	var _elm_lang$html$Html_Events$onSubmitOptions = _elm_lang$core$Native_Utils.update(
		_elm_lang$html$Html_Events$defaultOptions,
		{preventDefault: true});
	var _elm_lang$html$Html_Events$onSubmit = function (msg) {
		return A3(
			_elm_lang$html$Html_Events$onWithOptions,
			'submit',
			_elm_lang$html$Html_Events$onSubmitOptions,
			_elm_lang$core$Json_Decode$succeed(msg));
	};
	var _elm_lang$html$Html_Events$onCheck = function (tagger) {
		return A2(
			_elm_lang$html$Html_Events$on,
			'change',
			A2(_elm_lang$core$Json_Decode$map, tagger, _elm_lang$html$Html_Events$targetChecked));
	};
	var _elm_lang$html$Html_Events$onInput = function (tagger) {
		return A2(
			_elm_lang$html$Html_Events$on,
			'input',
			A2(_elm_lang$core$Json_Decode$map, tagger, _elm_lang$html$Html_Events$targetValue));
	};
	var _elm_lang$html$Html_Events$onMouseOut = function (msg) {
		return A2(
			_elm_lang$html$Html_Events$on,
			'mouseout',
			_elm_lang$core$Json_Decode$succeed(msg));
	};
	var _elm_lang$html$Html_Events$onMouseOver = function (msg) {
		return A2(
			_elm_lang$html$Html_Events$on,
			'mouseover',
			_elm_lang$core$Json_Decode$succeed(msg));
	};
	var _elm_lang$html$Html_Events$onMouseLeave = function (msg) {
		return A2(
			_elm_lang$html$Html_Events$on,
			'mouseleave',
			_elm_lang$core$Json_Decode$succeed(msg));
	};
	var _elm_lang$html$Html_Events$onMouseEnter = function (msg) {
		return A2(
			_elm_lang$html$Html_Events$on,
			'mouseenter',
			_elm_lang$core$Json_Decode$succeed(msg));
	};
	var _elm_lang$html$Html_Events$onMouseUp = function (msg) {
		return A2(
			_elm_lang$html$Html_Events$on,
			'mouseup',
			_elm_lang$core$Json_Decode$succeed(msg));
	};
	var _elm_lang$html$Html_Events$onMouseDown = function (msg) {
		return A2(
			_elm_lang$html$Html_Events$on,
			'mousedown',
			_elm_lang$core$Json_Decode$succeed(msg));
	};
	var _elm_lang$html$Html_Events$onDoubleClick = function (msg) {
		return A2(
			_elm_lang$html$Html_Events$on,
			'dblclick',
			_elm_lang$core$Json_Decode$succeed(msg));
	};
	var _elm_lang$html$Html_Events$onClick = function (msg) {
		return A2(
			_elm_lang$html$Html_Events$on,
			'click',
			_elm_lang$core$Json_Decode$succeed(msg));
	};
	var _elm_lang$html$Html_Events$Options = F2(
		function (a, b) {
			return {stopPropagation: a, preventDefault: b};
		});
	
	var _elm_lang$navigation$Native_Navigation = function() {
	
	
	// FAKE NAVIGATION
	
	function go(n)
	{
		return _elm_lang$core$Native_Scheduler.nativeBinding(function(callback)
		{
			if (n !== 0)
			{
				history.go(n);
			}
			callback(_elm_lang$core$Native_Scheduler.succeed(_elm_lang$core$Native_Utils.Tuple0));
		});
	}
	
	function pushState(url)
	{
		return _elm_lang$core$Native_Scheduler.nativeBinding(function(callback)
		{
			history.pushState({}, '', url);
			callback(_elm_lang$core$Native_Scheduler.succeed(getLocation()));
		});
	}
	
	function replaceState(url)
	{
		return _elm_lang$core$Native_Scheduler.nativeBinding(function(callback)
		{
			history.replaceState({}, '', url);
			callback(_elm_lang$core$Native_Scheduler.succeed(getLocation()));
		});
	}
	
	
	// REAL NAVIGATION
	
	function reloadPage(skipCache)
	{
		return _elm_lang$core$Native_Scheduler.nativeBinding(function(callback)
		{
			document.location.reload(skipCache);
			callback(_elm_lang$core$Native_Scheduler.succeed(_elm_lang$core$Native_Utils.Tuple0));
		});
	}
	
	function setLocation(url)
	{
		return _elm_lang$core$Native_Scheduler.nativeBinding(function(callback)
		{
			try
			{
				window.location = url;
			}
			catch(err)
			{
				// Only Firefox can throw a NS_ERROR_MALFORMED_URI exception here.
				// Other browsers reload the page, so let's be consistent about that.
				document.location.reload(false);
			}
			callback(_elm_lang$core$Native_Scheduler.succeed(_elm_lang$core$Native_Utils.Tuple0));
		});
	}
	
	
	// GET LOCATION
	
	function getLocation()
	{
		var location = document.location;
	
		return {
			href: location.href,
			host: location.host,
			hostname: location.hostname,
			protocol: location.protocol,
			origin: location.origin,
			port_: location.port,
			pathname: location.pathname,
			search: location.search,
			hash: location.hash,
			username: location.username,
			password: location.password
		};
	}
	
	
	// DETECT IE11 PROBLEMS
	
	function isInternetExplorer11()
	{
		return window.navigator.userAgent.indexOf('Trident') !== -1;
	}
	
	
	return {
		go: go,
		setLocation: setLocation,
		reloadPage: reloadPage,
		pushState: pushState,
		replaceState: replaceState,
		getLocation: getLocation,
		isInternetExplorer11: isInternetExplorer11
	};
	
	}();
	
	var _elm_lang$navigation$Navigation$replaceState = _elm_lang$navigation$Native_Navigation.replaceState;
	var _elm_lang$navigation$Navigation$pushState = _elm_lang$navigation$Native_Navigation.pushState;
	var _elm_lang$navigation$Navigation$go = _elm_lang$navigation$Native_Navigation.go;
	var _elm_lang$navigation$Navigation$reloadPage = _elm_lang$navigation$Native_Navigation.reloadPage;
	var _elm_lang$navigation$Navigation$setLocation = _elm_lang$navigation$Native_Navigation.setLocation;
	var _elm_lang$navigation$Navigation_ops = _elm_lang$navigation$Navigation_ops || {};
	_elm_lang$navigation$Navigation_ops['&>'] = F2(
		function (task1, task2) {
			return A2(
				_elm_lang$core$Task$andThen,
				function (_p0) {
					return task2;
				},
				task1);
		});
	var _elm_lang$navigation$Navigation$notify = F3(
		function (router, subs, location) {
			var send = function (_p1) {
				var _p2 = _p1;
				return A2(
					_elm_lang$core$Platform$sendToApp,
					router,
					_p2._0(location));
			};
			return A2(
				_elm_lang$navigation$Navigation_ops['&>'],
				_elm_lang$core$Task$sequence(
					A2(_elm_lang$core$List$map, send, subs)),
				_elm_lang$core$Task$succeed(
					{ctor: '_Tuple0'}));
		});
	var _elm_lang$navigation$Navigation$cmdHelp = F3(
		function (router, subs, cmd) {
			var _p3 = cmd;
			switch (_p3.ctor) {
				case 'Jump':
					return _elm_lang$navigation$Navigation$go(_p3._0);
				case 'New':
					return A2(
						_elm_lang$core$Task$andThen,
						A2(_elm_lang$navigation$Navigation$notify, router, subs),
						_elm_lang$navigation$Navigation$pushState(_p3._0));
				case 'Modify':
					return A2(
						_elm_lang$core$Task$andThen,
						A2(_elm_lang$navigation$Navigation$notify, router, subs),
						_elm_lang$navigation$Navigation$replaceState(_p3._0));
				case 'Visit':
					return _elm_lang$navigation$Navigation$setLocation(_p3._0);
				default:
					return _elm_lang$navigation$Navigation$reloadPage(_p3._0);
			}
		});
	var _elm_lang$navigation$Navigation$killPopWatcher = function (popWatcher) {
		var _p4 = popWatcher;
		if (_p4.ctor === 'Normal') {
			return _elm_lang$core$Process$kill(_p4._0);
		} else {
			return A2(
				_elm_lang$navigation$Navigation_ops['&>'],
				_elm_lang$core$Process$kill(_p4._0),
				_elm_lang$core$Process$kill(_p4._1));
		}
	};
	var _elm_lang$navigation$Navigation$onSelfMsg = F3(
		function (router, location, state) {
			return A2(
				_elm_lang$navigation$Navigation_ops['&>'],
				A3(_elm_lang$navigation$Navigation$notify, router, state.subs, location),
				_elm_lang$core$Task$succeed(state));
		});
	var _elm_lang$navigation$Navigation$subscription = _elm_lang$core$Native_Platform.leaf('Navigation');
	var _elm_lang$navigation$Navigation$command = _elm_lang$core$Native_Platform.leaf('Navigation');
	var _elm_lang$navigation$Navigation$Location = function (a) {
		return function (b) {
			return function (c) {
				return function (d) {
					return function (e) {
						return function (f) {
							return function (g) {
								return function (h) {
									return function (i) {
										return function (j) {
											return function (k) {
												return {href: a, host: b, hostname: c, protocol: d, origin: e, port_: f, pathname: g, search: h, hash: i, username: j, password: k};
											};
										};
									};
								};
							};
						};
					};
				};
			};
		};
	};
	var _elm_lang$navigation$Navigation$State = F2(
		function (a, b) {
			return {subs: a, popWatcher: b};
		});
	var _elm_lang$navigation$Navigation$init = _elm_lang$core$Task$succeed(
		A2(
			_elm_lang$navigation$Navigation$State,
			{ctor: '[]'},
			_elm_lang$core$Maybe$Nothing));
	var _elm_lang$navigation$Navigation$Reload = function (a) {
		return {ctor: 'Reload', _0: a};
	};
	var _elm_lang$navigation$Navigation$reload = _elm_lang$navigation$Navigation$command(
		_elm_lang$navigation$Navigation$Reload(false));
	var _elm_lang$navigation$Navigation$reloadAndSkipCache = _elm_lang$navigation$Navigation$command(
		_elm_lang$navigation$Navigation$Reload(true));
	var _elm_lang$navigation$Navigation$Visit = function (a) {
		return {ctor: 'Visit', _0: a};
	};
	var _elm_lang$navigation$Navigation$load = function (url) {
		return _elm_lang$navigation$Navigation$command(
			_elm_lang$navigation$Navigation$Visit(url));
	};
	var _elm_lang$navigation$Navigation$Modify = function (a) {
		return {ctor: 'Modify', _0: a};
	};
	var _elm_lang$navigation$Navigation$modifyUrl = function (url) {
		return _elm_lang$navigation$Navigation$command(
			_elm_lang$navigation$Navigation$Modify(url));
	};
	var _elm_lang$navigation$Navigation$New = function (a) {
		return {ctor: 'New', _0: a};
	};
	var _elm_lang$navigation$Navigation$newUrl = function (url) {
		return _elm_lang$navigation$Navigation$command(
			_elm_lang$navigation$Navigation$New(url));
	};
	var _elm_lang$navigation$Navigation$Jump = function (a) {
		return {ctor: 'Jump', _0: a};
	};
	var _elm_lang$navigation$Navigation$back = function (n) {
		return _elm_lang$navigation$Navigation$command(
			_elm_lang$navigation$Navigation$Jump(0 - n));
	};
	var _elm_lang$navigation$Navigation$forward = function (n) {
		return _elm_lang$navigation$Navigation$command(
			_elm_lang$navigation$Navigation$Jump(n));
	};
	var _elm_lang$navigation$Navigation$cmdMap = F2(
		function (_p5, myCmd) {
			var _p6 = myCmd;
			switch (_p6.ctor) {
				case 'Jump':
					return _elm_lang$navigation$Navigation$Jump(_p6._0);
				case 'New':
					return _elm_lang$navigation$Navigation$New(_p6._0);
				case 'Modify':
					return _elm_lang$navigation$Navigation$Modify(_p6._0);
				case 'Visit':
					return _elm_lang$navigation$Navigation$Visit(_p6._0);
				default:
					return _elm_lang$navigation$Navigation$Reload(_p6._0);
			}
		});
	var _elm_lang$navigation$Navigation$Monitor = function (a) {
		return {ctor: 'Monitor', _0: a};
	};
	var _elm_lang$navigation$Navigation$program = F2(
		function (locationToMessage, stuff) {
			var init = stuff.init(
				_elm_lang$navigation$Native_Navigation.getLocation(
					{ctor: '_Tuple0'}));
			var subs = function (model) {
				return _elm_lang$core$Platform_Sub$batch(
					{
						ctor: '::',
						_0: _elm_lang$navigation$Navigation$subscription(
							_elm_lang$navigation$Navigation$Monitor(locationToMessage)),
						_1: {
							ctor: '::',
							_0: stuff.subscriptions(model),
							_1: {ctor: '[]'}
						}
					});
			};
			return _elm_lang$html$Html$program(
				{init: init, view: stuff.view, update: stuff.update, subscriptions: subs});
		});
	var _elm_lang$navigation$Navigation$programWithFlags = F2(
		function (locationToMessage, stuff) {
			var init = function (flags) {
				return A2(
					stuff.init,
					flags,
					_elm_lang$navigation$Native_Navigation.getLocation(
						{ctor: '_Tuple0'}));
			};
			var subs = function (model) {
				return _elm_lang$core$Platform_Sub$batch(
					{
						ctor: '::',
						_0: _elm_lang$navigation$Navigation$subscription(
							_elm_lang$navigation$Navigation$Monitor(locationToMessage)),
						_1: {
							ctor: '::',
							_0: stuff.subscriptions(model),
							_1: {ctor: '[]'}
						}
					});
			};
			return _elm_lang$html$Html$programWithFlags(
				{init: init, view: stuff.view, update: stuff.update, subscriptions: subs});
		});
	var _elm_lang$navigation$Navigation$subMap = F2(
		function (func, _p7) {
			var _p8 = _p7;
			return _elm_lang$navigation$Navigation$Monitor(
				function (_p9) {
					return func(
						_p8._0(_p9));
				});
		});
	var _elm_lang$navigation$Navigation$InternetExplorer = F2(
		function (a, b) {
			return {ctor: 'InternetExplorer', _0: a, _1: b};
		});
	var _elm_lang$navigation$Navigation$Normal = function (a) {
		return {ctor: 'Normal', _0: a};
	};
	var _elm_lang$navigation$Navigation$spawnPopWatcher = function (router) {
		var reportLocation = function (_p10) {
			return A2(
				_elm_lang$core$Platform$sendToSelf,
				router,
				_elm_lang$navigation$Native_Navigation.getLocation(
					{ctor: '_Tuple0'}));
		};
		return _elm_lang$navigation$Native_Navigation.isInternetExplorer11(
			{ctor: '_Tuple0'}) ? A3(
			_elm_lang$core$Task$map2,
			_elm_lang$navigation$Navigation$InternetExplorer,
			_elm_lang$core$Process$spawn(
				A3(_elm_lang$dom$Dom_LowLevel$onWindow, 'popstate', _elm_lang$core$Json_Decode$value, reportLocation)),
			_elm_lang$core$Process$spawn(
				A3(_elm_lang$dom$Dom_LowLevel$onWindow, 'hashchange', _elm_lang$core$Json_Decode$value, reportLocation))) : A2(
			_elm_lang$core$Task$map,
			_elm_lang$navigation$Navigation$Normal,
			_elm_lang$core$Process$spawn(
				A3(_elm_lang$dom$Dom_LowLevel$onWindow, 'popstate', _elm_lang$core$Json_Decode$value, reportLocation)));
	};
	var _elm_lang$navigation$Navigation$onEffects = F4(
		function (router, cmds, subs, _p11) {
			var _p12 = _p11;
			var _p15 = _p12.popWatcher;
			var stepState = function () {
				var _p13 = {ctor: '_Tuple2', _0: subs, _1: _p15};
				_v6_2:
				do {
					if (_p13._0.ctor === '[]') {
						if (_p13._1.ctor === 'Just') {
							return A2(
								_elm_lang$navigation$Navigation_ops['&>'],
								_elm_lang$navigation$Navigation$killPopWatcher(_p13._1._0),
								_elm_lang$core$Task$succeed(
									A2(_elm_lang$navigation$Navigation$State, subs, _elm_lang$core$Maybe$Nothing)));
						} else {
							break _v6_2;
						}
					} else {
						if (_p13._1.ctor === 'Nothing') {
							return A2(
								_elm_lang$core$Task$map,
								function (_p14) {
									return A2(
										_elm_lang$navigation$Navigation$State,
										subs,
										_elm_lang$core$Maybe$Just(_p14));
								},
								_elm_lang$navigation$Navigation$spawnPopWatcher(router));
						} else {
							break _v6_2;
						}
					}
				} while(false);
				return _elm_lang$core$Task$succeed(
					A2(_elm_lang$navigation$Navigation$State, subs, _p15));
			}();
			return A2(
				_elm_lang$navigation$Navigation_ops['&>'],
				_elm_lang$core$Task$sequence(
					A2(
						_elm_lang$core$List$map,
						A2(_elm_lang$navigation$Navigation$cmdHelp, router, subs),
						cmds)),
				stepState);
		});
	_elm_lang$core$Native_Platform.effectManagers['Navigation'] = {pkg: 'elm-lang/navigation', init: _elm_lang$navigation$Navigation$init, onEffects: _elm_lang$navigation$Navigation$onEffects, onSelfMsg: _elm_lang$navigation$Navigation$onSelfMsg, tag: 'fx', cmdMap: _elm_lang$navigation$Navigation$cmdMap, subMap: _elm_lang$navigation$Navigation$subMap};
	
	var _elm_lang$svg$Svg$map = _elm_lang$virtual_dom$VirtualDom$map;
	var _elm_lang$svg$Svg$text = _elm_lang$virtual_dom$VirtualDom$text;
	var _elm_lang$svg$Svg$svgNamespace = A2(
		_elm_lang$virtual_dom$VirtualDom$property,
		'namespace',
		_elm_lang$core$Json_Encode$string('http://www.w3.org/2000/svg'));
	var _elm_lang$svg$Svg$node = F3(
		function (name, attributes, children) {
			return A3(
				_elm_lang$virtual_dom$VirtualDom$node,
				name,
				{ctor: '::', _0: _elm_lang$svg$Svg$svgNamespace, _1: attributes},
				children);
		});
	var _elm_lang$svg$Svg$svg = _elm_lang$svg$Svg$node('svg');
	var _elm_lang$svg$Svg$foreignObject = _elm_lang$svg$Svg$node('foreignObject');
	var _elm_lang$svg$Svg$animate = _elm_lang$svg$Svg$node('animate');
	var _elm_lang$svg$Svg$animateColor = _elm_lang$svg$Svg$node('animateColor');
	var _elm_lang$svg$Svg$animateMotion = _elm_lang$svg$Svg$node('animateMotion');
	var _elm_lang$svg$Svg$animateTransform = _elm_lang$svg$Svg$node('animateTransform');
	var _elm_lang$svg$Svg$mpath = _elm_lang$svg$Svg$node('mpath');
	var _elm_lang$svg$Svg$set = _elm_lang$svg$Svg$node('set');
	var _elm_lang$svg$Svg$a = _elm_lang$svg$Svg$node('a');
	var _elm_lang$svg$Svg$defs = _elm_lang$svg$Svg$node('defs');
	var _elm_lang$svg$Svg$g = _elm_lang$svg$Svg$node('g');
	var _elm_lang$svg$Svg$marker = _elm_lang$svg$Svg$node('marker');
	var _elm_lang$svg$Svg$mask = _elm_lang$svg$Svg$node('mask');
	var _elm_lang$svg$Svg$pattern = _elm_lang$svg$Svg$node('pattern');
	var _elm_lang$svg$Svg$switch = _elm_lang$svg$Svg$node('switch');
	var _elm_lang$svg$Svg$symbol = _elm_lang$svg$Svg$node('symbol');
	var _elm_lang$svg$Svg$desc = _elm_lang$svg$Svg$node('desc');
	var _elm_lang$svg$Svg$metadata = _elm_lang$svg$Svg$node('metadata');
	var _elm_lang$svg$Svg$title = _elm_lang$svg$Svg$node('title');
	var _elm_lang$svg$Svg$feBlend = _elm_lang$svg$Svg$node('feBlend');
	var _elm_lang$svg$Svg$feColorMatrix = _elm_lang$svg$Svg$node('feColorMatrix');
	var _elm_lang$svg$Svg$feComponentTransfer = _elm_lang$svg$Svg$node('feComponentTransfer');
	var _elm_lang$svg$Svg$feComposite = _elm_lang$svg$Svg$node('feComposite');
	var _elm_lang$svg$Svg$feConvolveMatrix = _elm_lang$svg$Svg$node('feConvolveMatrix');
	var _elm_lang$svg$Svg$feDiffuseLighting = _elm_lang$svg$Svg$node('feDiffuseLighting');
	var _elm_lang$svg$Svg$feDisplacementMap = _elm_lang$svg$Svg$node('feDisplacementMap');
	var _elm_lang$svg$Svg$feFlood = _elm_lang$svg$Svg$node('feFlood');
	var _elm_lang$svg$Svg$feFuncA = _elm_lang$svg$Svg$node('feFuncA');
	var _elm_lang$svg$Svg$feFuncB = _elm_lang$svg$Svg$node('feFuncB');
	var _elm_lang$svg$Svg$feFuncG = _elm_lang$svg$Svg$node('feFuncG');
	var _elm_lang$svg$Svg$feFuncR = _elm_lang$svg$Svg$node('feFuncR');
	var _elm_lang$svg$Svg$feGaussianBlur = _elm_lang$svg$Svg$node('feGaussianBlur');
	var _elm_lang$svg$Svg$feImage = _elm_lang$svg$Svg$node('feImage');
	var _elm_lang$svg$Svg$feMerge = _elm_lang$svg$Svg$node('feMerge');
	var _elm_lang$svg$Svg$feMergeNode = _elm_lang$svg$Svg$node('feMergeNode');
	var _elm_lang$svg$Svg$feMorphology = _elm_lang$svg$Svg$node('feMorphology');
	var _elm_lang$svg$Svg$feOffset = _elm_lang$svg$Svg$node('feOffset');
	var _elm_lang$svg$Svg$feSpecularLighting = _elm_lang$svg$Svg$node('feSpecularLighting');
	var _elm_lang$svg$Svg$feTile = _elm_lang$svg$Svg$node('feTile');
	var _elm_lang$svg$Svg$feTurbulence = _elm_lang$svg$Svg$node('feTurbulence');
	var _elm_lang$svg$Svg$font = _elm_lang$svg$Svg$node('font');
	var _elm_lang$svg$Svg$linearGradient = _elm_lang$svg$Svg$node('linearGradient');
	var _elm_lang$svg$Svg$radialGradient = _elm_lang$svg$Svg$node('radialGradient');
	var _elm_lang$svg$Svg$stop = _elm_lang$svg$Svg$node('stop');
	var _elm_lang$svg$Svg$circle = _elm_lang$svg$Svg$node('circle');
	var _elm_lang$svg$Svg$ellipse = _elm_lang$svg$Svg$node('ellipse');
	var _elm_lang$svg$Svg$image = _elm_lang$svg$Svg$node('image');
	var _elm_lang$svg$Svg$line = _elm_lang$svg$Svg$node('line');
	var _elm_lang$svg$Svg$path = _elm_lang$svg$Svg$node('path');
	var _elm_lang$svg$Svg$polygon = _elm_lang$svg$Svg$node('polygon');
	var _elm_lang$svg$Svg$polyline = _elm_lang$svg$Svg$node('polyline');
	var _elm_lang$svg$Svg$rect = _elm_lang$svg$Svg$node('rect');
	var _elm_lang$svg$Svg$use = _elm_lang$svg$Svg$node('use');
	var _elm_lang$svg$Svg$feDistantLight = _elm_lang$svg$Svg$node('feDistantLight');
	var _elm_lang$svg$Svg$fePointLight = _elm_lang$svg$Svg$node('fePointLight');
	var _elm_lang$svg$Svg$feSpotLight = _elm_lang$svg$Svg$node('feSpotLight');
	var _elm_lang$svg$Svg$altGlyph = _elm_lang$svg$Svg$node('altGlyph');
	var _elm_lang$svg$Svg$altGlyphDef = _elm_lang$svg$Svg$node('altGlyphDef');
	var _elm_lang$svg$Svg$altGlyphItem = _elm_lang$svg$Svg$node('altGlyphItem');
	var _elm_lang$svg$Svg$glyph = _elm_lang$svg$Svg$node('glyph');
	var _elm_lang$svg$Svg$glyphRef = _elm_lang$svg$Svg$node('glyphRef');
	var _elm_lang$svg$Svg$textPath = _elm_lang$svg$Svg$node('textPath');
	var _elm_lang$svg$Svg$text_ = _elm_lang$svg$Svg$node('text');
	var _elm_lang$svg$Svg$tref = _elm_lang$svg$Svg$node('tref');
	var _elm_lang$svg$Svg$tspan = _elm_lang$svg$Svg$node('tspan');
	var _elm_lang$svg$Svg$clipPath = _elm_lang$svg$Svg$node('clipPath');
	var _elm_lang$svg$Svg$colorProfile = _elm_lang$svg$Svg$node('colorProfile');
	var _elm_lang$svg$Svg$cursor = _elm_lang$svg$Svg$node('cursor');
	var _elm_lang$svg$Svg$filter = _elm_lang$svg$Svg$node('filter');
	var _elm_lang$svg$Svg$script = _elm_lang$svg$Svg$node('script');
	var _elm_lang$svg$Svg$style = _elm_lang$svg$Svg$node('style');
	var _elm_lang$svg$Svg$view = _elm_lang$svg$Svg$node('view');
	
	var _elm_lang$svg$Svg_Attributes$writingMode = _elm_lang$virtual_dom$VirtualDom$attribute('writing-mode');
	var _elm_lang$svg$Svg_Attributes$wordSpacing = _elm_lang$virtual_dom$VirtualDom$attribute('word-spacing');
	var _elm_lang$svg$Svg_Attributes$visibility = _elm_lang$virtual_dom$VirtualDom$attribute('visibility');
	var _elm_lang$svg$Svg_Attributes$unicodeBidi = _elm_lang$virtual_dom$VirtualDom$attribute('unicode-bidi');
	var _elm_lang$svg$Svg_Attributes$textRendering = _elm_lang$virtual_dom$VirtualDom$attribute('text-rendering');
	var _elm_lang$svg$Svg_Attributes$textDecoration = _elm_lang$virtual_dom$VirtualDom$attribute('text-decoration');
	var _elm_lang$svg$Svg_Attributes$textAnchor = _elm_lang$virtual_dom$VirtualDom$attribute('text-anchor');
	var _elm_lang$svg$Svg_Attributes$stroke = _elm_lang$virtual_dom$VirtualDom$attribute('stroke');
	var _elm_lang$svg$Svg_Attributes$strokeWidth = _elm_lang$virtual_dom$VirtualDom$attribute('stroke-width');
	var _elm_lang$svg$Svg_Attributes$strokeOpacity = _elm_lang$virtual_dom$VirtualDom$attribute('stroke-opacity');
	var _elm_lang$svg$Svg_Attributes$strokeMiterlimit = _elm_lang$virtual_dom$VirtualDom$attribute('stroke-miterlimit');
	var _elm_lang$svg$Svg_Attributes$strokeLinejoin = _elm_lang$virtual_dom$VirtualDom$attribute('stroke-linejoin');
	var _elm_lang$svg$Svg_Attributes$strokeLinecap = _elm_lang$virtual_dom$VirtualDom$attribute('stroke-linecap');
	var _elm_lang$svg$Svg_Attributes$strokeDashoffset = _elm_lang$virtual_dom$VirtualDom$attribute('stroke-dashoffset');
	var _elm_lang$svg$Svg_Attributes$strokeDasharray = _elm_lang$virtual_dom$VirtualDom$attribute('stroke-dasharray');
	var _elm_lang$svg$Svg_Attributes$stopOpacity = _elm_lang$virtual_dom$VirtualDom$attribute('stop-opacity');
	var _elm_lang$svg$Svg_Attributes$stopColor = _elm_lang$virtual_dom$VirtualDom$attribute('stop-color');
	var _elm_lang$svg$Svg_Attributes$shapeRendering = _elm_lang$virtual_dom$VirtualDom$attribute('shape-rendering');
	var _elm_lang$svg$Svg_Attributes$pointerEvents = _elm_lang$virtual_dom$VirtualDom$attribute('pointer-events');
	var _elm_lang$svg$Svg_Attributes$overflow = _elm_lang$virtual_dom$VirtualDom$attribute('overflow');
	var _elm_lang$svg$Svg_Attributes$opacity = _elm_lang$virtual_dom$VirtualDom$attribute('opacity');
	var _elm_lang$svg$Svg_Attributes$mask = _elm_lang$virtual_dom$VirtualDom$attribute('mask');
	var _elm_lang$svg$Svg_Attributes$markerStart = _elm_lang$virtual_dom$VirtualDom$attribute('marker-start');
	var _elm_lang$svg$Svg_Attributes$markerMid = _elm_lang$virtual_dom$VirtualDom$attribute('marker-mid');
	var _elm_lang$svg$Svg_Attributes$markerEnd = _elm_lang$virtual_dom$VirtualDom$attribute('marker-end');
	var _elm_lang$svg$Svg_Attributes$lightingColor = _elm_lang$virtual_dom$VirtualDom$attribute('lighting-color');
	var _elm_lang$svg$Svg_Attributes$letterSpacing = _elm_lang$virtual_dom$VirtualDom$attribute('letter-spacing');
	var _elm_lang$svg$Svg_Attributes$kerning = _elm_lang$virtual_dom$VirtualDom$attribute('kerning');
	var _elm_lang$svg$Svg_Attributes$imageRendering = _elm_lang$virtual_dom$VirtualDom$attribute('image-rendering');
	var _elm_lang$svg$Svg_Attributes$glyphOrientationVertical = _elm_lang$virtual_dom$VirtualDom$attribute('glyph-orientation-vertical');
	var _elm_lang$svg$Svg_Attributes$glyphOrientationHorizontal = _elm_lang$virtual_dom$VirtualDom$attribute('glyph-orientation-horizontal');
	var _elm_lang$svg$Svg_Attributes$fontWeight = _elm_lang$virtual_dom$VirtualDom$attribute('font-weight');
	var _elm_lang$svg$Svg_Attributes$fontVariant = _elm_lang$virtual_dom$VirtualDom$attribute('font-variant');
	var _elm_lang$svg$Svg_Attributes$fontStyle = _elm_lang$virtual_dom$VirtualDom$attribute('font-style');
	var _elm_lang$svg$Svg_Attributes$fontStretch = _elm_lang$virtual_dom$VirtualDom$attribute('font-stretch');
	var _elm_lang$svg$Svg_Attributes$fontSize = _elm_lang$virtual_dom$VirtualDom$attribute('font-size');
	var _elm_lang$svg$Svg_Attributes$fontSizeAdjust = _elm_lang$virtual_dom$VirtualDom$attribute('font-size-adjust');
	var _elm_lang$svg$Svg_Attributes$fontFamily = _elm_lang$virtual_dom$VirtualDom$attribute('font-family');
	var _elm_lang$svg$Svg_Attributes$floodOpacity = _elm_lang$virtual_dom$VirtualDom$attribute('flood-opacity');
	var _elm_lang$svg$Svg_Attributes$floodColor = _elm_lang$virtual_dom$VirtualDom$attribute('flood-color');
	var _elm_lang$svg$Svg_Attributes$filter = _elm_lang$virtual_dom$VirtualDom$attribute('filter');
	var _elm_lang$svg$Svg_Attributes$fill = _elm_lang$virtual_dom$VirtualDom$attribute('fill');
	var _elm_lang$svg$Svg_Attributes$fillRule = _elm_lang$virtual_dom$VirtualDom$attribute('fill-rule');
	var _elm_lang$svg$Svg_Attributes$fillOpacity = _elm_lang$virtual_dom$VirtualDom$attribute('fill-opacity');
	var _elm_lang$svg$Svg_Attributes$enableBackground = _elm_lang$virtual_dom$VirtualDom$attribute('enable-background');
	var _elm_lang$svg$Svg_Attributes$dominantBaseline = _elm_lang$virtual_dom$VirtualDom$attribute('dominant-baseline');
	var _elm_lang$svg$Svg_Attributes$display = _elm_lang$virtual_dom$VirtualDom$attribute('display');
	var _elm_lang$svg$Svg_Attributes$direction = _elm_lang$virtual_dom$VirtualDom$attribute('direction');
	var _elm_lang$svg$Svg_Attributes$cursor = _elm_lang$virtual_dom$VirtualDom$attribute('cursor');
	var _elm_lang$svg$Svg_Attributes$color = _elm_lang$virtual_dom$VirtualDom$attribute('color');
	var _elm_lang$svg$Svg_Attributes$colorRendering = _elm_lang$virtual_dom$VirtualDom$attribute('color-rendering');
	var _elm_lang$svg$Svg_Attributes$colorProfile = _elm_lang$virtual_dom$VirtualDom$attribute('color-profile');
	var _elm_lang$svg$Svg_Attributes$colorInterpolation = _elm_lang$virtual_dom$VirtualDom$attribute('color-interpolation');
	var _elm_lang$svg$Svg_Attributes$colorInterpolationFilters = _elm_lang$virtual_dom$VirtualDom$attribute('color-interpolation-filters');
	var _elm_lang$svg$Svg_Attributes$clip = _elm_lang$virtual_dom$VirtualDom$attribute('clip');
	var _elm_lang$svg$Svg_Attributes$clipRule = _elm_lang$virtual_dom$VirtualDom$attribute('clip-rule');
	var _elm_lang$svg$Svg_Attributes$clipPath = _elm_lang$virtual_dom$VirtualDom$attribute('clip-path');
	var _elm_lang$svg$Svg_Attributes$baselineShift = _elm_lang$virtual_dom$VirtualDom$attribute('baseline-shift');
	var _elm_lang$svg$Svg_Attributes$alignmentBaseline = _elm_lang$virtual_dom$VirtualDom$attribute('alignment-baseline');
	var _elm_lang$svg$Svg_Attributes$zoomAndPan = _elm_lang$virtual_dom$VirtualDom$attribute('zoomAndPan');
	var _elm_lang$svg$Svg_Attributes$z = _elm_lang$virtual_dom$VirtualDom$attribute('z');
	var _elm_lang$svg$Svg_Attributes$yChannelSelector = _elm_lang$virtual_dom$VirtualDom$attribute('yChannelSelector');
	var _elm_lang$svg$Svg_Attributes$y2 = _elm_lang$virtual_dom$VirtualDom$attribute('y2');
	var _elm_lang$svg$Svg_Attributes$y1 = _elm_lang$virtual_dom$VirtualDom$attribute('y1');
	var _elm_lang$svg$Svg_Attributes$y = _elm_lang$virtual_dom$VirtualDom$attribute('y');
	var _elm_lang$svg$Svg_Attributes$xmlSpace = A2(_elm_lang$virtual_dom$VirtualDom$attributeNS, 'http://www.w3.org/XML/1998/namespace', 'xml:space');
	var _elm_lang$svg$Svg_Attributes$xmlLang = A2(_elm_lang$virtual_dom$VirtualDom$attributeNS, 'http://www.w3.org/XML/1998/namespace', 'xml:lang');
	var _elm_lang$svg$Svg_Attributes$xmlBase = A2(_elm_lang$virtual_dom$VirtualDom$attributeNS, 'http://www.w3.org/XML/1998/namespace', 'xml:base');
	var _elm_lang$svg$Svg_Attributes$xlinkType = A2(_elm_lang$virtual_dom$VirtualDom$attributeNS, 'http://www.w3.org/1999/xlink', 'xlink:type');
	var _elm_lang$svg$Svg_Attributes$xlinkTitle = A2(_elm_lang$virtual_dom$VirtualDom$attributeNS, 'http://www.w3.org/1999/xlink', 'xlink:title');
	var _elm_lang$svg$Svg_Attributes$xlinkShow = A2(_elm_lang$virtual_dom$VirtualDom$attributeNS, 'http://www.w3.org/1999/xlink', 'xlink:show');
	var _elm_lang$svg$Svg_Attributes$xlinkRole = A2(_elm_lang$virtual_dom$VirtualDom$attributeNS, 'http://www.w3.org/1999/xlink', 'xlink:role');
	var _elm_lang$svg$Svg_Attributes$xlinkHref = A2(_elm_lang$virtual_dom$VirtualDom$attributeNS, 'http://www.w3.org/1999/xlink', 'xlink:href');
	var _elm_lang$svg$Svg_Attributes$xlinkArcrole = A2(_elm_lang$virtual_dom$VirtualDom$attributeNS, 'http://www.w3.org/1999/xlink', 'xlink:arcrole');
	var _elm_lang$svg$Svg_Attributes$xlinkActuate = A2(_elm_lang$virtual_dom$VirtualDom$attributeNS, 'http://www.w3.org/1999/xlink', 'xlink:actuate');
	var _elm_lang$svg$Svg_Attributes$xChannelSelector = _elm_lang$virtual_dom$VirtualDom$attribute('xChannelSelector');
	var _elm_lang$svg$Svg_Attributes$x2 = _elm_lang$virtual_dom$VirtualDom$attribute('x2');
	var _elm_lang$svg$Svg_Attributes$x1 = _elm_lang$virtual_dom$VirtualDom$attribute('x1');
	var _elm_lang$svg$Svg_Attributes$xHeight = _elm_lang$virtual_dom$VirtualDom$attribute('x-height');
	var _elm_lang$svg$Svg_Attributes$x = _elm_lang$virtual_dom$VirtualDom$attribute('x');
	var _elm_lang$svg$Svg_Attributes$widths = _elm_lang$virtual_dom$VirtualDom$attribute('widths');
	var _elm_lang$svg$Svg_Attributes$width = _elm_lang$virtual_dom$VirtualDom$attribute('width');
	var _elm_lang$svg$Svg_Attributes$viewTarget = _elm_lang$virtual_dom$VirtualDom$attribute('viewTarget');
	var _elm_lang$svg$Svg_Attributes$viewBox = _elm_lang$virtual_dom$VirtualDom$attribute('viewBox');
	var _elm_lang$svg$Svg_Attributes$vertOriginY = _elm_lang$virtual_dom$VirtualDom$attribute('vert-origin-y');
	var _elm_lang$svg$Svg_Attributes$vertOriginX = _elm_lang$virtual_dom$VirtualDom$attribute('vert-origin-x');
	var _elm_lang$svg$Svg_Attributes$vertAdvY = _elm_lang$virtual_dom$VirtualDom$attribute('vert-adv-y');
	var _elm_lang$svg$Svg_Attributes$version = _elm_lang$virtual_dom$VirtualDom$attribute('version');
	var _elm_lang$svg$Svg_Attributes$values = _elm_lang$virtual_dom$VirtualDom$attribute('values');
	var _elm_lang$svg$Svg_Attributes$vMathematical = _elm_lang$virtual_dom$VirtualDom$attribute('v-mathematical');
	var _elm_lang$svg$Svg_Attributes$vIdeographic = _elm_lang$virtual_dom$VirtualDom$attribute('v-ideographic');
	var _elm_lang$svg$Svg_Attributes$vHanging = _elm_lang$virtual_dom$VirtualDom$attribute('v-hanging');
	var _elm_lang$svg$Svg_Attributes$vAlphabetic = _elm_lang$virtual_dom$VirtualDom$attribute('v-alphabetic');
	var _elm_lang$svg$Svg_Attributes$unitsPerEm = _elm_lang$virtual_dom$VirtualDom$attribute('units-per-em');
	var _elm_lang$svg$Svg_Attributes$unicodeRange = _elm_lang$virtual_dom$VirtualDom$attribute('unicode-range');
	var _elm_lang$svg$Svg_Attributes$unicode = _elm_lang$virtual_dom$VirtualDom$attribute('unicode');
	var _elm_lang$svg$Svg_Attributes$underlineThickness = _elm_lang$virtual_dom$VirtualDom$attribute('underline-thickness');
	var _elm_lang$svg$Svg_Attributes$underlinePosition = _elm_lang$virtual_dom$VirtualDom$attribute('underline-position');
	var _elm_lang$svg$Svg_Attributes$u2 = _elm_lang$virtual_dom$VirtualDom$attribute('u2');
	var _elm_lang$svg$Svg_Attributes$u1 = _elm_lang$virtual_dom$VirtualDom$attribute('u1');
	var _elm_lang$svg$Svg_Attributes$type_ = _elm_lang$virtual_dom$VirtualDom$attribute('type');
	var _elm_lang$svg$Svg_Attributes$transform = _elm_lang$virtual_dom$VirtualDom$attribute('transform');
	var _elm_lang$svg$Svg_Attributes$to = _elm_lang$virtual_dom$VirtualDom$attribute('to');
	var _elm_lang$svg$Svg_Attributes$title = _elm_lang$virtual_dom$VirtualDom$attribute('title');
	var _elm_lang$svg$Svg_Attributes$textLength = _elm_lang$virtual_dom$VirtualDom$attribute('textLength');
	var _elm_lang$svg$Svg_Attributes$targetY = _elm_lang$virtual_dom$VirtualDom$attribute('targetY');
	var _elm_lang$svg$Svg_Attributes$targetX = _elm_lang$virtual_dom$VirtualDom$attribute('targetX');
	var _elm_lang$svg$Svg_Attributes$target = _elm_lang$virtual_dom$VirtualDom$attribute('target');
	var _elm_lang$svg$Svg_Attributes$tableValues = _elm_lang$virtual_dom$VirtualDom$attribute('tableValues');
	var _elm_lang$svg$Svg_Attributes$systemLanguage = _elm_lang$virtual_dom$VirtualDom$attribute('systemLanguage');
	var _elm_lang$svg$Svg_Attributes$surfaceScale = _elm_lang$virtual_dom$VirtualDom$attribute('surfaceScale');
	var _elm_lang$svg$Svg_Attributes$style = _elm_lang$virtual_dom$VirtualDom$attribute('style');
	var _elm_lang$svg$Svg_Attributes$string = _elm_lang$virtual_dom$VirtualDom$attribute('string');
	var _elm_lang$svg$Svg_Attributes$strikethroughThickness = _elm_lang$virtual_dom$VirtualDom$attribute('strikethrough-thickness');
	var _elm_lang$svg$Svg_Attributes$strikethroughPosition = _elm_lang$virtual_dom$VirtualDom$attribute('strikethrough-position');
	var _elm_lang$svg$Svg_Attributes$stitchTiles = _elm_lang$virtual_dom$VirtualDom$attribute('stitchTiles');
	var _elm_lang$svg$Svg_Attributes$stemv = _elm_lang$virtual_dom$VirtualDom$attribute('stemv');
	var _elm_lang$svg$Svg_Attributes$stemh = _elm_lang$virtual_dom$VirtualDom$attribute('stemh');
	var _elm_lang$svg$Svg_Attributes$stdDeviation = _elm_lang$virtual_dom$VirtualDom$attribute('stdDeviation');
	var _elm_lang$svg$Svg_Attributes$startOffset = _elm_lang$virtual_dom$VirtualDom$attribute('startOffset');
	var _elm_lang$svg$Svg_Attributes$spreadMethod = _elm_lang$virtual_dom$VirtualDom$attribute('spreadMethod');
	var _elm_lang$svg$Svg_Attributes$speed = _elm_lang$virtual_dom$VirtualDom$attribute('speed');
	var _elm_lang$svg$Svg_Attributes$specularExponent = _elm_lang$virtual_dom$VirtualDom$attribute('specularExponent');
	var _elm_lang$svg$Svg_Attributes$specularConstant = _elm_lang$virtual_dom$VirtualDom$attribute('specularConstant');
	var _elm_lang$svg$Svg_Attributes$spacing = _elm_lang$virtual_dom$VirtualDom$attribute('spacing');
	var _elm_lang$svg$Svg_Attributes$slope = _elm_lang$virtual_dom$VirtualDom$attribute('slope');
	var _elm_lang$svg$Svg_Attributes$seed = _elm_lang$virtual_dom$VirtualDom$attribute('seed');
	var _elm_lang$svg$Svg_Attributes$scale = _elm_lang$virtual_dom$VirtualDom$attribute('scale');
	var _elm_lang$svg$Svg_Attributes$ry = _elm_lang$virtual_dom$VirtualDom$attribute('ry');
	var _elm_lang$svg$Svg_Attributes$rx = _elm_lang$virtual_dom$VirtualDom$attribute('rx');
	var _elm_lang$svg$Svg_Attributes$rotate = _elm_lang$virtual_dom$VirtualDom$attribute('rotate');
	var _elm_lang$svg$Svg_Attributes$result = _elm_lang$virtual_dom$VirtualDom$attribute('result');
	var _elm_lang$svg$Svg_Attributes$restart = _elm_lang$virtual_dom$VirtualDom$attribute('restart');
	var _elm_lang$svg$Svg_Attributes$requiredFeatures = _elm_lang$virtual_dom$VirtualDom$attribute('requiredFeatures');
	var _elm_lang$svg$Svg_Attributes$requiredExtensions = _elm_lang$virtual_dom$VirtualDom$attribute('requiredExtensions');
	var _elm_lang$svg$Svg_Attributes$repeatDur = _elm_lang$virtual_dom$VirtualDom$attribute('repeatDur');
	var _elm_lang$svg$Svg_Attributes$repeatCount = _elm_lang$virtual_dom$VirtualDom$attribute('repeatCount');
	var _elm_lang$svg$Svg_Attributes$renderingIntent = _elm_lang$virtual_dom$VirtualDom$attribute('rendering-intent');
	var _elm_lang$svg$Svg_Attributes$refY = _elm_lang$virtual_dom$VirtualDom$attribute('refY');
	var _elm_lang$svg$Svg_Attributes$refX = _elm_lang$virtual_dom$VirtualDom$attribute('refX');
	var _elm_lang$svg$Svg_Attributes$radius = _elm_lang$virtual_dom$VirtualDom$attribute('radius');
	var _elm_lang$svg$Svg_Attributes$r = _elm_lang$virtual_dom$VirtualDom$attribute('r');
	var _elm_lang$svg$Svg_Attributes$primitiveUnits = _elm_lang$virtual_dom$VirtualDom$attribute('primitiveUnits');
	var _elm_lang$svg$Svg_Attributes$preserveAspectRatio = _elm_lang$virtual_dom$VirtualDom$attribute('preserveAspectRatio');
	var _elm_lang$svg$Svg_Attributes$preserveAlpha = _elm_lang$virtual_dom$VirtualDom$attribute('preserveAlpha');
	var _elm_lang$svg$Svg_Attributes$pointsAtZ = _elm_lang$virtual_dom$VirtualDom$attribute('pointsAtZ');
	var _elm_lang$svg$Svg_Attributes$pointsAtY = _elm_lang$virtual_dom$VirtualDom$attribute('pointsAtY');
	var _elm_lang$svg$Svg_Attributes$pointsAtX = _elm_lang$virtual_dom$VirtualDom$attribute('pointsAtX');
	var _elm_lang$svg$Svg_Attributes$points = _elm_lang$virtual_dom$VirtualDom$attribute('points');
	var _elm_lang$svg$Svg_Attributes$pointOrder = _elm_lang$virtual_dom$VirtualDom$attribute('point-order');
	var _elm_lang$svg$Svg_Attributes$patternUnits = _elm_lang$virtual_dom$VirtualDom$attribute('patternUnits');
	var _elm_lang$svg$Svg_Attributes$patternTransform = _elm_lang$virtual_dom$VirtualDom$attribute('patternTransform');
	var _elm_lang$svg$Svg_Attributes$patternContentUnits = _elm_lang$virtual_dom$VirtualDom$attribute('patternContentUnits');
	var _elm_lang$svg$Svg_Attributes$pathLength = _elm_lang$virtual_dom$VirtualDom$attribute('pathLength');
	var _elm_lang$svg$Svg_Attributes$path = _elm_lang$virtual_dom$VirtualDom$attribute('path');
	var _elm_lang$svg$Svg_Attributes$panose1 = _elm_lang$virtual_dom$VirtualDom$attribute('panose-1');
	var _elm_lang$svg$Svg_Attributes$overlineThickness = _elm_lang$virtual_dom$VirtualDom$attribute('overline-thickness');
	var _elm_lang$svg$Svg_Attributes$overlinePosition = _elm_lang$virtual_dom$VirtualDom$attribute('overline-position');
	var _elm_lang$svg$Svg_Attributes$origin = _elm_lang$virtual_dom$VirtualDom$attribute('origin');
	var _elm_lang$svg$Svg_Attributes$orientation = _elm_lang$virtual_dom$VirtualDom$attribute('orientation');
	var _elm_lang$svg$Svg_Attributes$orient = _elm_lang$virtual_dom$VirtualDom$attribute('orient');
	var _elm_lang$svg$Svg_Attributes$order = _elm_lang$virtual_dom$VirtualDom$attribute('order');
	var _elm_lang$svg$Svg_Attributes$operator = _elm_lang$virtual_dom$VirtualDom$attribute('operator');
	var _elm_lang$svg$Svg_Attributes$offset = _elm_lang$virtual_dom$VirtualDom$attribute('offset');
	var _elm_lang$svg$Svg_Attributes$numOctaves = _elm_lang$virtual_dom$VirtualDom$attribute('numOctaves');
	var _elm_lang$svg$Svg_Attributes$name = _elm_lang$virtual_dom$VirtualDom$attribute('name');
	var _elm_lang$svg$Svg_Attributes$mode = _elm_lang$virtual_dom$VirtualDom$attribute('mode');
	var _elm_lang$svg$Svg_Attributes$min = _elm_lang$virtual_dom$VirtualDom$attribute('min');
	var _elm_lang$svg$Svg_Attributes$method = _elm_lang$virtual_dom$VirtualDom$attribute('method');
	var _elm_lang$svg$Svg_Attributes$media = _elm_lang$virtual_dom$VirtualDom$attribute('media');
	var _elm_lang$svg$Svg_Attributes$max = _elm_lang$virtual_dom$VirtualDom$attribute('max');
	var _elm_lang$svg$Svg_Attributes$mathematical = _elm_lang$virtual_dom$VirtualDom$attribute('mathematical');
	var _elm_lang$svg$Svg_Attributes$maskUnits = _elm_lang$virtual_dom$VirtualDom$attribute('maskUnits');
	var _elm_lang$svg$Svg_Attributes$maskContentUnits = _elm_lang$virtual_dom$VirtualDom$attribute('maskContentUnits');
	var _elm_lang$svg$Svg_Attributes$markerWidth = _elm_lang$virtual_dom$VirtualDom$attribute('markerWidth');
	var _elm_lang$svg$Svg_Attributes$markerUnits = _elm_lang$virtual_dom$VirtualDom$attribute('markerUnits');
	var _elm_lang$svg$Svg_Attributes$markerHeight = _elm_lang$virtual_dom$VirtualDom$attribute('markerHeight');
	var _elm_lang$svg$Svg_Attributes$local = _elm_lang$virtual_dom$VirtualDom$attribute('local');
	var _elm_lang$svg$Svg_Attributes$limitingConeAngle = _elm_lang$virtual_dom$VirtualDom$attribute('limitingConeAngle');
	var _elm_lang$svg$Svg_Attributes$lengthAdjust = _elm_lang$virtual_dom$VirtualDom$attribute('lengthAdjust');
	var _elm_lang$svg$Svg_Attributes$lang = _elm_lang$virtual_dom$VirtualDom$attribute('lang');
	var _elm_lang$svg$Svg_Attributes$keyTimes = _elm_lang$virtual_dom$VirtualDom$attribute('keyTimes');
	var _elm_lang$svg$Svg_Attributes$keySplines = _elm_lang$virtual_dom$VirtualDom$attribute('keySplines');
	var _elm_lang$svg$Svg_Attributes$keyPoints = _elm_lang$virtual_dom$VirtualDom$attribute('keyPoints');
	var _elm_lang$svg$Svg_Attributes$kernelUnitLength = _elm_lang$virtual_dom$VirtualDom$attribute('kernelUnitLength');
	var _elm_lang$svg$Svg_Attributes$kernelMatrix = _elm_lang$virtual_dom$VirtualDom$attribute('kernelMatrix');
	var _elm_lang$svg$Svg_Attributes$k4 = _elm_lang$virtual_dom$VirtualDom$attribute('k4');
	var _elm_lang$svg$Svg_Attributes$k3 = _elm_lang$virtual_dom$VirtualDom$attribute('k3');
	var _elm_lang$svg$Svg_Attributes$k2 = _elm_lang$virtual_dom$VirtualDom$attribute('k2');
	var _elm_lang$svg$Svg_Attributes$k1 = _elm_lang$virtual_dom$VirtualDom$attribute('k1');
	var _elm_lang$svg$Svg_Attributes$k = _elm_lang$virtual_dom$VirtualDom$attribute('k');
	var _elm_lang$svg$Svg_Attributes$intercept = _elm_lang$virtual_dom$VirtualDom$attribute('intercept');
	var _elm_lang$svg$Svg_Attributes$in2 = _elm_lang$virtual_dom$VirtualDom$attribute('in2');
	var _elm_lang$svg$Svg_Attributes$in_ = _elm_lang$virtual_dom$VirtualDom$attribute('in');
	var _elm_lang$svg$Svg_Attributes$ideographic = _elm_lang$virtual_dom$VirtualDom$attribute('ideographic');
	var _elm_lang$svg$Svg_Attributes$id = _elm_lang$virtual_dom$VirtualDom$attribute('id');
	var _elm_lang$svg$Svg_Attributes$horizOriginY = _elm_lang$virtual_dom$VirtualDom$attribute('horiz-origin-y');
	var _elm_lang$svg$Svg_Attributes$horizOriginX = _elm_lang$virtual_dom$VirtualDom$attribute('horiz-origin-x');
	var _elm_lang$svg$Svg_Attributes$horizAdvX = _elm_lang$virtual_dom$VirtualDom$attribute('horiz-adv-x');
	var _elm_lang$svg$Svg_Attributes$height = _elm_lang$virtual_dom$VirtualDom$attribute('height');
	var _elm_lang$svg$Svg_Attributes$hanging = _elm_lang$virtual_dom$VirtualDom$attribute('hanging');
	var _elm_lang$svg$Svg_Attributes$gradientUnits = _elm_lang$virtual_dom$VirtualDom$attribute('gradientUnits');
	var _elm_lang$svg$Svg_Attributes$gradientTransform = _elm_lang$virtual_dom$VirtualDom$attribute('gradientTransform');
	var _elm_lang$svg$Svg_Attributes$glyphRef = _elm_lang$virtual_dom$VirtualDom$attribute('glyphRef');
	var _elm_lang$svg$Svg_Attributes$glyphName = _elm_lang$virtual_dom$VirtualDom$attribute('glyph-name');
	var _elm_lang$svg$Svg_Attributes$g2 = _elm_lang$virtual_dom$VirtualDom$attribute('g2');
	var _elm_lang$svg$Svg_Attributes$g1 = _elm_lang$virtual_dom$VirtualDom$attribute('g1');
	var _elm_lang$svg$Svg_Attributes$fy = _elm_lang$virtual_dom$VirtualDom$attribute('fy');
	var _elm_lang$svg$Svg_Attributes$fx = _elm_lang$virtual_dom$VirtualDom$attribute('fx');
	var _elm_lang$svg$Svg_Attributes$from = _elm_lang$virtual_dom$VirtualDom$attribute('from');
	var _elm_lang$svg$Svg_Attributes$format = _elm_lang$virtual_dom$VirtualDom$attribute('format');
	var _elm_lang$svg$Svg_Attributes$filterUnits = _elm_lang$virtual_dom$VirtualDom$attribute('filterUnits');
	var _elm_lang$svg$Svg_Attributes$filterRes = _elm_lang$virtual_dom$VirtualDom$attribute('filterRes');
	var _elm_lang$svg$Svg_Attributes$externalResourcesRequired = _elm_lang$virtual_dom$VirtualDom$attribute('externalResourcesRequired');
	var _elm_lang$svg$Svg_Attributes$exponent = _elm_lang$virtual_dom$VirtualDom$attribute('exponent');
	var _elm_lang$svg$Svg_Attributes$end = _elm_lang$virtual_dom$VirtualDom$attribute('end');
	var _elm_lang$svg$Svg_Attributes$elevation = _elm_lang$virtual_dom$VirtualDom$attribute('elevation');
	var _elm_lang$svg$Svg_Attributes$edgeMode = _elm_lang$virtual_dom$VirtualDom$attribute('edgeMode');
	var _elm_lang$svg$Svg_Attributes$dy = _elm_lang$virtual_dom$VirtualDom$attribute('dy');
	var _elm_lang$svg$Svg_Attributes$dx = _elm_lang$virtual_dom$VirtualDom$attribute('dx');
	var _elm_lang$svg$Svg_Attributes$dur = _elm_lang$virtual_dom$VirtualDom$attribute('dur');
	var _elm_lang$svg$Svg_Attributes$divisor = _elm_lang$virtual_dom$VirtualDom$attribute('divisor');
	var _elm_lang$svg$Svg_Attributes$diffuseConstant = _elm_lang$virtual_dom$VirtualDom$attribute('diffuseConstant');
	var _elm_lang$svg$Svg_Attributes$descent = _elm_lang$virtual_dom$VirtualDom$attribute('descent');
	var _elm_lang$svg$Svg_Attributes$decelerate = _elm_lang$virtual_dom$VirtualDom$attribute('decelerate');
	var _elm_lang$svg$Svg_Attributes$d = _elm_lang$virtual_dom$VirtualDom$attribute('d');
	var _elm_lang$svg$Svg_Attributes$cy = _elm_lang$virtual_dom$VirtualDom$attribute('cy');
	var _elm_lang$svg$Svg_Attributes$cx = _elm_lang$virtual_dom$VirtualDom$attribute('cx');
	var _elm_lang$svg$Svg_Attributes$contentStyleType = _elm_lang$virtual_dom$VirtualDom$attribute('contentStyleType');
	var _elm_lang$svg$Svg_Attributes$contentScriptType = _elm_lang$virtual_dom$VirtualDom$attribute('contentScriptType');
	var _elm_lang$svg$Svg_Attributes$clipPathUnits = _elm_lang$virtual_dom$VirtualDom$attribute('clipPathUnits');
	var _elm_lang$svg$Svg_Attributes$class = _elm_lang$virtual_dom$VirtualDom$attribute('class');
	var _elm_lang$svg$Svg_Attributes$capHeight = _elm_lang$virtual_dom$VirtualDom$attribute('cap-height');
	var _elm_lang$svg$Svg_Attributes$calcMode = _elm_lang$virtual_dom$VirtualDom$attribute('calcMode');
	var _elm_lang$svg$Svg_Attributes$by = _elm_lang$virtual_dom$VirtualDom$attribute('by');
	var _elm_lang$svg$Svg_Attributes$bias = _elm_lang$virtual_dom$VirtualDom$attribute('bias');
	var _elm_lang$svg$Svg_Attributes$begin = _elm_lang$virtual_dom$VirtualDom$attribute('begin');
	var _elm_lang$svg$Svg_Attributes$bbox = _elm_lang$virtual_dom$VirtualDom$attribute('bbox');
	var _elm_lang$svg$Svg_Attributes$baseProfile = _elm_lang$virtual_dom$VirtualDom$attribute('baseProfile');
	var _elm_lang$svg$Svg_Attributes$baseFrequency = _elm_lang$virtual_dom$VirtualDom$attribute('baseFrequency');
	var _elm_lang$svg$Svg_Attributes$azimuth = _elm_lang$virtual_dom$VirtualDom$attribute('azimuth');
	var _elm_lang$svg$Svg_Attributes$autoReverse = _elm_lang$virtual_dom$VirtualDom$attribute('autoReverse');
	var _elm_lang$svg$Svg_Attributes$attributeType = _elm_lang$virtual_dom$VirtualDom$attribute('attributeType');
	var _elm_lang$svg$Svg_Attributes$attributeName = _elm_lang$virtual_dom$VirtualDom$attribute('attributeName');
	var _elm_lang$svg$Svg_Attributes$ascent = _elm_lang$virtual_dom$VirtualDom$attribute('ascent');
	var _elm_lang$svg$Svg_Attributes$arabicForm = _elm_lang$virtual_dom$VirtualDom$attribute('arabic-form');
	var _elm_lang$svg$Svg_Attributes$amplitude = _elm_lang$virtual_dom$VirtualDom$attribute('amplitude');
	var _elm_lang$svg$Svg_Attributes$allowReorder = _elm_lang$virtual_dom$VirtualDom$attribute('allowReorder');
	var _elm_lang$svg$Svg_Attributes$alphabetic = _elm_lang$virtual_dom$VirtualDom$attribute('alphabetic');
	var _elm_lang$svg$Svg_Attributes$additive = _elm_lang$virtual_dom$VirtualDom$attribute('additive');
	var _elm_lang$svg$Svg_Attributes$accumulate = _elm_lang$virtual_dom$VirtualDom$attribute('accumulate');
	var _elm_lang$svg$Svg_Attributes$accelerate = _elm_lang$virtual_dom$VirtualDom$attribute('accelerate');
	var _elm_lang$svg$Svg_Attributes$accentHeight = _elm_lang$virtual_dom$VirtualDom$attribute('accent-height');
	
	var _user$project$Loading$loadingSvg = A2(
		_elm_lang$html$Html$div,
		{
			ctor: '::',
			_0: _elm_lang$svg$Svg_Attributes$class('loading-container'),
			_1: {ctor: '[]'}
		},
		{
			ctor: '::',
			_0: A2(
				_elm_lang$svg$Svg$svg,
				{
					ctor: '::',
					_0: _elm_lang$svg$Svg_Attributes$width('250'),
					_1: {
						ctor: '::',
						_0: _elm_lang$svg$Svg_Attributes$height('125'),
						_1: {
							ctor: '::',
							_0: _elm_lang$svg$Svg_Attributes$viewBox('0 0 300 200'),
							_1: {ctor: '[]'}
						}
					}
				},
				{
					ctor: '::',
					_0: A2(
						_elm_lang$svg$Svg$g,
						{
							ctor: '::',
							_0: _elm_lang$svg$Svg_Attributes$id('houseable-loading'),
							_1: {ctor: '[]'}
						},
						{
							ctor: '::',
							_0: A2(
								_elm_lang$svg$Svg$polygon,
								{
									ctor: '::',
									_0: _elm_lang$svg$Svg_Attributes$id('middle-2'),
									_1: {
										ctor: '::',
										_0: _elm_lang$svg$Svg_Attributes$fill('#2A303F'),
										_1: {
											ctor: '::',
											_0: _elm_lang$svg$Svg_Attributes$points('122.333,127.668 94.664,100.001 66.996,72.332 122.333,72.332'),
											_1: {ctor: '[]'}
										}
									}
								},
								{ctor: '[]'}),
							_1: {
								ctor: '::',
								_0: A2(
									_elm_lang$svg$Svg$polygon,
									{
										ctor: '::',
										_0: _elm_lang$svg$Svg_Attributes$id('middle-1'),
										_1: {
											ctor: '::',
											_0: _elm_lang$svg$Svg_Attributes$fill('#2A303F'),
											_1: {
												ctor: '::',
												_0: _elm_lang$svg$Svg_Attributes$points('66.996,72.332 94.664,100.001 122.333,127.67 66.996,127.67'),
												_1: {ctor: '[]'}
											}
										}
									},
									{ctor: '[]'}),
								_1: {
									ctor: '::',
									_0: A2(
										_elm_lang$svg$Svg$polygon,
										{
											ctor: '::',
											_0: _elm_lang$svg$Svg_Attributes$id('middle-4'),
											_1: {
												ctor: '::',
												_0: _elm_lang$svg$Svg_Attributes$fill('#2A303F'),
												_1: {
													ctor: '::',
													_0: _elm_lang$svg$Svg_Attributes$points('177.669,127.668 150.001,100 122.332,72.332 177.669,72.332'),
													_1: {ctor: '[]'}
												}
											}
										},
										{ctor: '[]'}),
									_1: {
										ctor: '::',
										_0: A2(
											_elm_lang$svg$Svg$polygon,
											{
												ctor: '::',
												_0: _elm_lang$svg$Svg_Attributes$id('middle-3'),
												_1: {
													ctor: '::',
													_0: _elm_lang$svg$Svg_Attributes$fill('#2A303F'),
													_1: {
														ctor: '::',
														_0: _elm_lang$svg$Svg_Attributes$points('122.333,72.332 150.001,100.001 177.669,127.67 122.333,127.67'),
														_1: {ctor: '[]'}
													}
												}
											},
											{ctor: '[]'}),
										_1: {
											ctor: '::',
											_0: A2(
												_elm_lang$svg$Svg$polygon,
												{
													ctor: '::',
													_0: _elm_lang$svg$Svg_Attributes$id('middle-6'),
													_1: {
														ctor: '::',
														_0: _elm_lang$svg$Svg_Attributes$fill('#38DDE5'),
														_1: {
															ctor: '::',
															_0: _elm_lang$svg$Svg_Attributes$points('233.005,127.668 205.338,100 177.669,72.332 233.005,72.332'),
															_1: {ctor: '[]'}
														}
													}
												},
												{ctor: '[]'}),
											_1: {
												ctor: '::',
												_0: A2(
													_elm_lang$svg$Svg$polygon,
													{
														ctor: '::',
														_0: _elm_lang$svg$Svg_Attributes$id('middle-5_1'),
														_1: {
															ctor: '::',
															_0: _elm_lang$svg$Svg_Attributes$fill('#29C3D3'),
															_1: {
																ctor: '::',
																_0: _elm_lang$svg$Svg_Attributes$points('177.669,72.332 205.338,100.001 233.005,127.67 177.669,127.67'),
																_1: {ctor: '[]'}
															}
														}
													},
													{ctor: '[]'}),
												_1: {
													ctor: '::',
													_0: A2(
														_elm_lang$svg$Svg$polygon,
														{
															ctor: '::',
															_0: _elm_lang$svg$Svg_Attributes$id('middle-5'),
															_1: {
																ctor: '::',
																_0: _elm_lang$svg$Svg_Attributes$fill('#29C3D3'),
																_1: {
																	ctor: '::',
																	_0: _elm_lang$svg$Svg_Attributes$points('66.997,72.331 94.664,44.663 122.333,16.996 122.333,72.331'),
																	_1: {ctor: '[]'}
																}
															}
														},
														{ctor: '[]'}),
													_1: {
														ctor: '::',
														_0: A2(
															_elm_lang$svg$Svg$polygon,
															{
																ctor: '::',
																_0: _elm_lang$svg$Svg_Attributes$id('top-4'),
																_1: {
																	ctor: '::',
																	_0: _elm_lang$svg$Svg_Attributes$fill('#29C3D3'),
																	_1: {
																		ctor: '::',
																		_0: _elm_lang$svg$Svg_Attributes$points('177.669,72.331 150.001,44.663 122.333,16.995 177.669,16.995'),
																		_1: {ctor: '[]'}
																	}
																}
															},
															{ctor: '[]'}),
														_1: {
															ctor: '::',
															_0: A2(
																_elm_lang$svg$Svg$polygon,
																{
																	ctor: '::',
																	_0: _elm_lang$svg$Svg_Attributes$id('top-3'),
																	_1: {
																		ctor: '::',
																		_0: _elm_lang$svg$Svg_Attributes$fill('#2A303F'),
																		_1: {
																			ctor: '::',
																			_0: _elm_lang$svg$Svg_Attributes$points('122.332,16.996 150.001,44.664 177.669,72.332 122.332,72.332'),
																			_1: {ctor: '[]'}
																		}
																	}
																},
																{ctor: '[]'}),
															_1: {
																ctor: '::',
																_0: A2(
																	_elm_lang$svg$Svg$polygon,
																	{
																		ctor: '::',
																		_0: _elm_lang$svg$Svg_Attributes$id('top-5'),
																		_1: {
																			ctor: '::',
																			_0: _elm_lang$svg$Svg_Attributes$fill('#38E8E8'),
																			_1: {
																				ctor: '::',
																				_0: _elm_lang$svg$Svg_Attributes$points('177.669,16.996 205.338,44.664 233.005,72.332 177.669,72.332'),
																				_1: {ctor: '[]'}
																			}
																		}
																	},
																	{ctor: '[]'}),
																_1: {
																	ctor: '::',
																	_0: A2(
																		_elm_lang$svg$Svg$polygon,
																		{
																			ctor: '::',
																			_0: _elm_lang$svg$Svg_Attributes$id('bottom-1'),
																			_1: {
																				ctor: '::',
																				_0: _elm_lang$svg$Svg_Attributes$fill('#2A303F'),
																				_1: {
																					ctor: '::',
																					_0: _elm_lang$svg$Svg_Attributes$points('66.997,127.67 94.665,155.336 122.333,183.006 66.995,183.006'),
																					_1: {ctor: '[]'}
																				}
																			}
																		},
																		{ctor: '[]'}),
																	_1: {
																		ctor: '::',
																		_0: A2(
																			_elm_lang$svg$Svg$polygon,
																			{
																				ctor: '::',
																				_0: _elm_lang$svg$Svg_Attributes$id('bottom-2'),
																				_1: {
																					ctor: '::',
																					_0: _elm_lang$svg$Svg_Attributes$fill('#2A303F'),
																					_1: {
																						ctor: '::',
																						_0: _elm_lang$svg$Svg_Attributes$points('122.333,183.004 94.665,155.336 66.997,127.668 122.333,127.668'),
																						_1: {ctor: '[]'}
																					}
																				}
																			},
																			{ctor: '[]'}),
																		_1: {
																			ctor: '::',
																			_0: A2(
																				_elm_lang$svg$Svg$polygon,
																				{
																					ctor: '::',
																					_0: _elm_lang$svg$Svg_Attributes$id('bottom-3'),
																					_1: {
																						ctor: '::',
																						_0: _elm_lang$svg$Svg_Attributes$fill('#F9F9F9'),
																						_1: {
																							ctor: '::',
																							_0: _elm_lang$svg$Svg_Attributes$points('122.332,127.67 150,155.336 177.669,183.006 122.332,183.006'),
																							_1: {ctor: '[]'}
																						}
																					}
																				},
																				{ctor: '[]'}),
																			_1: {
																				ctor: '::',
																				_0: A2(
																					_elm_lang$svg$Svg$polygon,
																					{
																						ctor: '::',
																						_0: _elm_lang$svg$Svg_Attributes$id('bottom-4'),
																						_1: {
																							ctor: '::',
																							_0: _elm_lang$svg$Svg_Attributes$fill('#F9F9F9'),
																							_1: {
																								ctor: '::',
																								_0: _elm_lang$svg$Svg_Attributes$points('177.669,183.004 150.001,155.336 122.333,127.668 177.669,127.668'),
																								_1: {ctor: '[]'}
																							}
																						}
																					},
																					{ctor: '[]'}),
																				_1: {
																					ctor: '::',
																					_0: A2(
																						_elm_lang$svg$Svg$polygon,
																						{
																							ctor: '::',
																							_0: _elm_lang$svg$Svg_Attributes$id('bottom-6'),
																							_1: {
																								ctor: '::',
																								_0: _elm_lang$svg$Svg_Attributes$fill('#2A303F'),
																								_1: {
																									ctor: '::',
																									_0: _elm_lang$svg$Svg_Attributes$points('233.005,183.004 205.338,155.336 177.669,127.668 233.005,127.668'),
																									_1: {ctor: '[]'}
																								}
																							}
																						},
																						{ctor: '[]'}),
																					_1: {
																						ctor: '::',
																						_0: A2(
																							_elm_lang$svg$Svg$polygon,
																							{
																								ctor: '::',
																								_0: _elm_lang$svg$Svg_Attributes$id('bottom-5'),
																								_1: {
																									ctor: '::',
																									_0: _elm_lang$svg$Svg_Attributes$fill('#2A303F'),
																									_1: {
																										ctor: '::',
																										_0: _elm_lang$svg$Svg_Attributes$points('177.669,127.67 205.338,155.336 233.005,183.006 177.669,183.006'),
																										_1: {ctor: '[]'}
																									}
																								}
																							},
																							{ctor: '[]'}),
																						_1: {ctor: '[]'}
																					}
																				}
																			}
																		}
																	}
																}
															}
														}
													}
												}
											}
										}
									}
								}
							}
						}),
					_1: {ctor: '[]'}
				}),
			_1: {ctor: '[]'}
		});
	
	var _user$project$AddArtwork$errorPanel = function (error) {
		var _p0 = error;
		if (_p0.ctor === 'Nothing') {
			return _elm_lang$html$Html$text('');
		} else {
			return A2(
				_elm_lang$html$Html$div,
				{
					ctor: '::',
					_0: _elm_lang$html$Html_Attributes$class('error'),
					_1: {ctor: '[]'}
				},
				{
					ctor: '::',
					_0: _elm_lang$html$Html$text(_p0._0),
					_1: {ctor: '[]'}
				});
		}
	};
	var _user$project$AddArtwork$validateArtworkImage = function (model) {
		return _elm_lang$core$String$isEmpty(model.artworkImageFile) ? _elm_lang$core$Native_Utils.update(
			model,
			{artworkImageFileError: _elm_lang$core$Maybe$Nothing}) : _elm_lang$core$Native_Utils.update(
			model,
			{artworkImageFileError: _elm_lang$core$Maybe$Nothing});
	};
	var _user$project$AddArtwork$validatePrice = function (model) {
		if (_elm_lang$core$Native_Utils.eq(model.price, '')) {
			return _elm_lang$core$Native_Utils.update(
				model,
				{priceError: _elm_lang$core$Maybe$Nothing});
		} else {
			var priceFloat = A2(
				_elm_lang$core$Result$withDefault,
				0,
				_elm_lang$core$String$toFloat(model.year));
			return (_elm_lang$core$Native_Utils.cmp(priceFloat, 0) < 1) ? _elm_lang$core$Native_Utils.update(
				model,
				{
					priceError: _elm_lang$core$Maybe$Just('only numbers are allowed')
				}) : _elm_lang$core$Native_Utils.update(
				model,
				{priceError: _elm_lang$core$Maybe$Nothing});
		}
	};
	var _user$project$AddArtwork$validateDimensions = function (model) {
		return _elm_lang$core$Native_Utils.eq(
			A2(
				_elm_lang$core$Regex$contains,
				_elm_lang$core$Regex$regex('[!@#$%^&*(){}[]]*$'),
				model.dimensions),
			true) ? _elm_lang$core$Native_Utils.update(
			model,
			{
				dimensionsError: _elm_lang$core$Maybe$Just('only alphanumeric characters')
			}) : _elm_lang$core$Native_Utils.update(
			model,
			{dimensionsError: _elm_lang$core$Maybe$Nothing});
	};
	var _user$project$AddArtwork$validateYear = function (model) {
		if (_elm_lang$core$Native_Utils.eq(model.year, '')) {
			return _elm_lang$core$Native_Utils.update(
				model,
				{yearError: _elm_lang$core$Maybe$Nothing});
		} else {
			var yearInt = A2(
				_elm_lang$core$Result$withDefault,
				0,
				_elm_lang$core$String$toInt(model.year));
			return (_elm_lang$core$Native_Utils.cmp(yearInt, 0) < 1) ? _elm_lang$core$Native_Utils.update(
				model,
				{
					yearError: _elm_lang$core$Maybe$Just('only numbers allowed')
				}) : _elm_lang$core$Native_Utils.update(
				model,
				{yearError: _elm_lang$core$Maybe$Nothing});
		}
	};
	var _user$project$AddArtwork$validateMedium = function (model) {
		return _elm_lang$core$Native_Utils.eq(
			A2(
				_elm_lang$core$Regex$contains,
				_elm_lang$core$Regex$regex('[!@#$%^&*(){}[]]*$'),
				model.medium),
			true) ? _elm_lang$core$Native_Utils.update(
			model,
			{
				mediumError: _elm_lang$core$Maybe$Just('only alphanumeric characters')
			}) : _elm_lang$core$Native_Utils.update(
			model,
			{mediumError: _elm_lang$core$Maybe$Nothing});
	};
	var _user$project$AddArtwork$validateTitle = function (model) {
		return _elm_lang$core$Native_Utils.eq(
			A2(
				_elm_lang$core$Regex$contains,
				_elm_lang$core$Regex$regex('[!@#$%^&*(){}[]]*$'),
				model.title),
			true) ? _elm_lang$core$Native_Utils.update(
			model,
			{
				titleError: _elm_lang$core$Maybe$Just('only alphanumeric characters')
			}) : _elm_lang$core$Native_Utils.update(
			model,
			{titleError: _elm_lang$core$Maybe$Nothing});
	};
	var _user$project$AddArtwork$validateArtist = function (model) {
		return _elm_lang$core$Native_Utils.eq(
			A2(
				_elm_lang$core$Regex$contains,
				_elm_lang$core$Regex$regex('[!@#$%^&*(){}[]]*$'),
				model.artist),
			true) ? _elm_lang$core$Native_Utils.update(
			model,
			{
				artistError: _elm_lang$core$Maybe$Just('only alphanumeric characters')
			}) : _elm_lang$core$Native_Utils.update(
			model,
			{artistError: _elm_lang$core$Maybe$Nothing});
	};
	var _user$project$AddArtwork$validate = function (model) {
		return _user$project$AddArtwork$validateArtworkImage(
			_user$project$AddArtwork$validatePrice(
				_user$project$AddArtwork$validateDimensions(
					_user$project$AddArtwork$validateYear(
						_user$project$AddArtwork$validateMedium(
							_user$project$AddArtwork$validateTitle(
								_user$project$AddArtwork$validateArtist(model)))))));
	};
	var _user$project$AddArtwork$isValid = function (model) {
		return _elm_lang$core$Native_Utils.eq(model.artistError, _elm_lang$core$Maybe$Nothing) && (_elm_lang$core$Native_Utils.eq(model.titleError, _elm_lang$core$Maybe$Nothing) && (_elm_lang$core$Native_Utils.eq(model.mediumError, _elm_lang$core$Maybe$Nothing) && (_elm_lang$core$Native_Utils.eq(model.yearError, _elm_lang$core$Maybe$Nothing) && (_elm_lang$core$Native_Utils.eq(model.dimensionsError, _elm_lang$core$Maybe$Nothing) && (_elm_lang$core$Native_Utils.eq(model.priceError, _elm_lang$core$Maybe$Nothing) && _elm_lang$core$Native_Utils.eq(model.artworkImageFileError, _elm_lang$core$Maybe$Nothing))))));
	};
	var _user$project$AddArtwork$priceInputCheck = F2(
		function (model, price) {
			if (_elm_lang$core$Native_Utils.eq(price, '')) {
				return {
					ctor: '_Tuple2',
					_0: _elm_lang$core$Native_Utils.update(
						model,
						{price: price}),
					_1: _elm_lang$core$Platform_Cmd$none
				};
			} else {
				var priceInt = A2(
					_elm_lang$core$Result$withDefault,
					0,
					_elm_lang$core$String$toFloat(price));
				var priceError = (_elm_lang$core$Native_Utils.cmp(priceInt, 0) < 1) ? _elm_lang$core$Maybe$Just('Enter a positive number') : _elm_lang$core$Maybe$Nothing;
				return {
					ctor: '_Tuple2',
					_0: _elm_lang$core$Native_Utils.update(
						model,
						{price: price, priceError: priceError}),
					_1: _elm_lang$core$Platform_Cmd$none
				};
			}
		});
	var _user$project$AddArtwork$yearInputCheck = F2(
		function (model, year) {
			if (_elm_lang$core$Native_Utils.eq(year, '')) {
				return {
					ctor: '_Tuple2',
					_0: _elm_lang$core$Native_Utils.update(
						model,
						{year: year}),
					_1: _elm_lang$core$Platform_Cmd$none
				};
			} else {
				var yearInt = A2(
					_elm_lang$core$Result$withDefault,
					0,
					_elm_lang$core$String$toInt(year));
				var yearError = (_elm_lang$core$Native_Utils.cmp(yearInt, -1) < 1) ? _elm_lang$core$Maybe$Just('Enter a positive number') : _elm_lang$core$Maybe$Nothing;
				return {
					ctor: '_Tuple2',
					_0: _elm_lang$core$Native_Utils.update(
						model,
						{year: year, yearError: yearError}),
					_1: _elm_lang$core$Platform_Cmd$none
				};
			}
		});
	var _user$project$AddArtwork$onChange = function (tagger) {
		return A2(
			_elm_lang$html$Html_Events$on,
			'change',
			A2(_elm_lang$core$Json_Decode$map, tagger, _elm_lang$html$Html_Events$targetValue));
	};
	var _user$project$AddArtwork$initModel = {error: _elm_lang$core$Maybe$Nothing, isLoading: false, artist: '', artistError: _elm_lang$core$Maybe$Nothing, title: '', titleError: _elm_lang$core$Maybe$Nothing, medium: '', mediumError: _elm_lang$core$Maybe$Nothing, year: '', yearError: _elm_lang$core$Maybe$Nothing, dimensions: '', dimensionsError: _elm_lang$core$Maybe$Nothing, price: '', priceError: _elm_lang$core$Maybe$Nothing, artworkImageFile: '', artworkImageFileError: _elm_lang$core$Maybe$Nothing};
	var _user$project$AddArtwork$init = {ctor: '_Tuple2', _0: _user$project$AddArtwork$initModel, _1: _elm_lang$core$Platform_Cmd$none};
	var _user$project$AddArtwork$addArtworkToFb = _elm_lang$core$Native_Platform.outgoingPort(
		'addArtworkToFb',
		function (v) {
			return v;
		});
	var _user$project$AddArtwork$artworkAdded = _elm_lang$core$Native_Platform.incomingPort('artworkAdded', _elm_lang$core$Json_Decode$string);
	var _user$project$AddArtwork$fetchImageFile = _elm_lang$core$Native_Platform.outgoingPort(
		'fetchImageFile',
		function (v) {
			return v;
		});
	var _user$project$AddArtwork$update = F3(
		function (uid, msg, model) {
			var _p1 = msg;
			switch (_p1.ctor) {
				case 'ArtistInput':
					return {
						ctor: '_Tuple2',
						_0: _elm_lang$core$Native_Utils.update(
							model,
							{artist: _p1._0, artistError: _elm_lang$core$Maybe$Nothing}),
						_1: _elm_lang$core$Platform_Cmd$none
					};
				case 'TitleInput':
					return {
						ctor: '_Tuple2',
						_0: _elm_lang$core$Native_Utils.update(
							model,
							{title: _p1._0, titleError: _elm_lang$core$Maybe$Nothing}),
						_1: _elm_lang$core$Platform_Cmd$none
					};
				case 'MediumInput':
					return {
						ctor: '_Tuple2',
						_0: _elm_lang$core$Native_Utils.update(
							model,
							{medium: _p1._0, mediumError: _elm_lang$core$Maybe$Nothing}),
						_1: _elm_lang$core$Platform_Cmd$none
					};
				case 'YearInput':
					return A2(_user$project$AddArtwork$yearInputCheck, model, _p1._0);
				case 'DimensionsInput':
					return {
						ctor: '_Tuple2',
						_0: _elm_lang$core$Native_Utils.update(
							model,
							{dimensions: _p1._0, dimensionsError: _elm_lang$core$Maybe$Nothing}),
						_1: _elm_lang$core$Platform_Cmd$none
					};
				case 'PriceInput':
					return A2(_user$project$AddArtwork$priceInputCheck, model, _p1._0);
				case 'FetchImageFile':
					return {
						ctor: '_Tuple2',
						_0: model,
						_1: _user$project$AddArtwork$fetchImageFile('cloudinary-input')
					};
				case 'ArtworkImageInput':
					return {
						ctor: '_Tuple2',
						_0: _elm_lang$core$Native_Utils.update(
							model,
							{artworkImageFile: _p1._0, artworkImageFileError: _elm_lang$core$Maybe$Nothing}),
						_1: _elm_lang$core$Platform_Cmd$none
					};
				case 'Submit':
					var body = A2(
						_elm_lang$core$Json_Encode$encode,
						4,
						_elm_lang$core$Json_Encode$object(
							{
								ctor: '::',
								_0: {
									ctor: '_Tuple2',
									_0: 'artist',
									_1: _elm_lang$core$Json_Encode$string(model.artist)
								},
								_1: {
									ctor: '::',
									_0: {
										ctor: '_Tuple2',
										_0: 'title',
										_1: _elm_lang$core$Json_Encode$string(model.title)
									},
									_1: {
										ctor: '::',
										_0: {
											ctor: '_Tuple2',
											_0: 'medium',
											_1: _elm_lang$core$Json_Encode$string(model.medium)
										},
										_1: {
											ctor: '::',
											_0: {
												ctor: '_Tuple2',
												_0: 'year',
												_1: _elm_lang$core$Json_Encode$string(model.year)
											},
											_1: {
												ctor: '::',
												_0: {
													ctor: '_Tuple2',
													_0: 'dimensions',
													_1: _elm_lang$core$Json_Encode$string(model.dimensions)
												},
												_1: {
													ctor: '::',
													_0: {
														ctor: '_Tuple2',
														_0: 'price',
														_1: _elm_lang$core$Json_Encode$string(model.price)
													},
													_1: {
														ctor: '::',
														_0: {
															ctor: '_Tuple2',
															_0: 'artworkImage',
															_1: _elm_lang$core$Json_Encode$string(model.artworkImageFile)
														},
														_1: {
															ctor: '::',
															_0: {
																ctor: '_Tuple2',
																_0: 'uid',
																_1: _elm_lang$core$Json_Encode$string(uid)
															},
															_1: {ctor: '[]'}
														}
													}
												}
											}
										}
									}
								}
							}));
					var cmd = _user$project$AddArtwork$addArtworkToFb(body);
					var updatedModel = _user$project$AddArtwork$validate(model);
					return _user$project$AddArtwork$isValid(updatedModel) ? {
						ctor: '_Tuple2',
						_0: _elm_lang$core$Native_Utils.update(
							model,
							{isLoading: true}),
						_1: cmd
					} : {ctor: '_Tuple2', _0: updatedModel, _1: _elm_lang$core$Platform_Cmd$none};
				default:
					var _p2 = _p1._0;
					return _elm_lang$core$Native_Utils.eq(_p2, 'Error') ? {
						ctor: '_Tuple2',
						_0: _elm_lang$core$Native_Utils.update(
							model,
							{
								error: _elm_lang$core$Maybe$Just(_p2)
							}),
						_1: _elm_lang$core$Platform_Cmd$none
					} : {
						ctor: '_Tuple2',
						_0: _user$project$AddArtwork$initModel,
						_1: _elm_lang$navigation$Navigation$newUrl('#/gallery')
					};
			}
		});
	var _user$project$AddArtwork$imageFileRead = _elm_lang$core$Native_Platform.incomingPort('imageFileRead', _elm_lang$core$Json_Decode$string);
	var _user$project$AddArtwork$Model = function (a) {
		return function (b) {
			return function (c) {
				return function (d) {
					return function (e) {
						return function (f) {
							return function (g) {
								return function (h) {
									return function (i) {
										return function (j) {
											return function (k) {
												return function (l) {
													return function (m) {
														return function (n) {
															return function (o) {
																return function (p) {
																	return {error: a, isLoading: b, artist: c, artistError: d, title: e, titleError: f, medium: g, mediumError: h, year: i, yearError: j, dimensions: k, dimensionsError: l, price: m, priceError: n, artworkImageFile: o, artworkImageFileError: p};
																};
															};
														};
													};
												};
											};
										};
									};
								};
							};
						};
					};
				};
			};
		};
	};
	var _user$project$AddArtwork$ArtworkAdded = function (a) {
		return {ctor: 'ArtworkAdded', _0: a};
	};
	var _user$project$AddArtwork$Submit = {ctor: 'Submit'};
	var _user$project$AddArtwork$ArtworkImageInput = function (a) {
		return {ctor: 'ArtworkImageInput', _0: a};
	};
	var _user$project$AddArtwork$subscriptions = function (model) {
		return _elm_lang$core$Platform_Sub$batch(
			{
				ctor: '::',
				_0: _user$project$AddArtwork$artworkAdded(_user$project$AddArtwork$ArtworkAdded),
				_1: {
					ctor: '::',
					_0: _user$project$AddArtwork$imageFileRead(_user$project$AddArtwork$ArtworkImageInput),
					_1: {ctor: '[]'}
				}
			});
	};
	var _user$project$AddArtwork$FetchImageFile = function (a) {
		return {ctor: 'FetchImageFile', _0: a};
	};
	var _user$project$AddArtwork$PriceInput = function (a) {
		return {ctor: 'PriceInput', _0: a};
	};
	var _user$project$AddArtwork$DimensionsInput = function (a) {
		return {ctor: 'DimensionsInput', _0: a};
	};
	var _user$project$AddArtwork$YearInput = function (a) {
		return {ctor: 'YearInput', _0: a};
	};
	var _user$project$AddArtwork$MediumInput = function (a) {
		return {ctor: 'MediumInput', _0: a};
	};
	var _user$project$AddArtwork$TitleInput = function (a) {
		return {ctor: 'TitleInput', _0: a};
	};
	var _user$project$AddArtwork$ArtistInput = function (a) {
		return {ctor: 'ArtistInput', _0: a};
	};
	var _user$project$AddArtwork$addArtwork = function (model) {
		return A2(
			_elm_lang$html$Html$div,
			{
				ctor: '::',
				_0: _elm_lang$html$Html_Attributes$class('row formRow'),
				_1: {ctor: '[]'}
			},
			{
				ctor: '::',
				_0: A2(
					_elm_lang$html$Html$div,
					{
						ctor: '::',
						_0: _elm_lang$html$Html_Attributes$class('col-md-6 col-md-offset-3'),
						_1: {ctor: '[]'}
					},
					{
						ctor: '::',
						_0: A2(
							_elm_lang$html$Html$form,
							{
								ctor: '::',
								_0: _elm_lang$html$Html_Attributes$class('formRow__form'),
								_1: {
									ctor: '::',
									_0: _elm_lang$html$Html_Events$onSubmit(_user$project$AddArtwork$Submit),
									_1: {ctor: '[]'}
								}
							},
							{
								ctor: '::',
								_0: A2(
									_elm_lang$html$Html$input,
									{
										ctor: '::',
										_0: _elm_lang$html$Html_Attributes$type_('text'),
										_1: {
											ctor: '::',
											_0: _elm_lang$html$Html_Attributes$class('formRow__input artwork-container__input--artist'),
											_1: {
												ctor: '::',
												_0: _elm_lang$html$Html_Attributes$placeholder('artist'),
												_1: {
													ctor: '::',
													_0: _elm_lang$html$Html_Attributes$value(model.artist),
													_1: {
														ctor: '::',
														_0: _elm_lang$html$Html_Events$onInput(_user$project$AddArtwork$ArtistInput),
														_1: {ctor: '[]'}
													}
												}
											}
										}
									},
									{ctor: '[]'}),
								_1: {
									ctor: '::',
									_0: A2(
										_elm_lang$html$Html$p,
										{
											ctor: '::',
											_0: _elm_lang$html$Html_Attributes$class('formRow__p--error'),
											_1: {ctor: '[]'}
										},
										{
											ctor: '::',
											_0: _elm_lang$html$Html$text(
												A2(_elm_lang$core$Maybe$withDefault, '', model.artistError)),
											_1: {ctor: '[]'}
										}),
									_1: {
										ctor: '::',
										_0: A2(
											_elm_lang$html$Html$input,
											{
												ctor: '::',
												_0: _elm_lang$html$Html_Attributes$type_('text'),
												_1: {
													ctor: '::',
													_0: _elm_lang$html$Html_Attributes$class('formRow__input artwork-container__input--title'),
													_1: {
														ctor: '::',
														_0: _elm_lang$html$Html_Attributes$placeholder('title'),
														_1: {
															ctor: '::',
															_0: _elm_lang$html$Html_Attributes$value(model.title),
															_1: {
																ctor: '::',
																_0: _elm_lang$html$Html_Events$onInput(_user$project$AddArtwork$TitleInput),
																_1: {ctor: '[]'}
															}
														}
													}
												}
											},
											{ctor: '[]'}),
										_1: {
											ctor: '::',
											_0: A2(
												_elm_lang$html$Html$p,
												{
													ctor: '::',
													_0: _elm_lang$html$Html_Attributes$class('formRow__p--error'),
													_1: {ctor: '[]'}
												},
												{
													ctor: '::',
													_0: _elm_lang$html$Html$text(
														A2(_elm_lang$core$Maybe$withDefault, '', model.titleError)),
													_1: {ctor: '[]'}
												}),
											_1: {
												ctor: '::',
												_0: A2(
													_elm_lang$html$Html$input,
													{
														ctor: '::',
														_0: _elm_lang$html$Html_Attributes$type_('text'),
														_1: {
															ctor: '::',
															_0: _elm_lang$html$Html_Attributes$class('formRow__input artwork-container__input--medium'),
															_1: {
																ctor: '::',
																_0: _elm_lang$html$Html_Attributes$placeholder('medium'),
																_1: {
																	ctor: '::',
																	_0: _elm_lang$html$Html_Attributes$value(model.medium),
																	_1: {
																		ctor: '::',
																		_0: _elm_lang$html$Html_Events$onInput(_user$project$AddArtwork$MediumInput),
																		_1: {ctor: '[]'}
																	}
																}
															}
														}
													},
													{ctor: '[]'}),
												_1: {
													ctor: '::',
													_0: A2(
														_elm_lang$html$Html$p,
														{
															ctor: '::',
															_0: _elm_lang$html$Html_Attributes$class('formRow__p--error'),
															_1: {ctor: '[]'}
														},
														{
															ctor: '::',
															_0: _elm_lang$html$Html$text(
																A2(_elm_lang$core$Maybe$withDefault, '', model.mediumError)),
															_1: {ctor: '[]'}
														}),
													_1: {
														ctor: '::',
														_0: A2(
															_elm_lang$html$Html$input,
															{
																ctor: '::',
																_0: _elm_lang$html$Html_Attributes$type_('text'),
																_1: {
																	ctor: '::',
																	_0: _elm_lang$html$Html_Attributes$class('formRow__input artwork-container__input--year'),
																	_1: {
																		ctor: '::',
																		_0: _elm_lang$html$Html_Attributes$placeholder('year'),
																		_1: {
																			ctor: '::',
																			_0: _elm_lang$html$Html_Attributes$value(model.year),
																			_1: {
																				ctor: '::',
																				_0: _elm_lang$html$Html_Events$onInput(_user$project$AddArtwork$YearInput),
																				_1: {ctor: '[]'}
																			}
																		}
																	}
																}
															},
															{ctor: '[]'}),
														_1: {
															ctor: '::',
															_0: A2(
																_elm_lang$html$Html$p,
																{
																	ctor: '::',
																	_0: _elm_lang$html$Html_Attributes$class('formRow__p--error'),
																	_1: {ctor: '[]'}
																},
																{
																	ctor: '::',
																	_0: _elm_lang$html$Html$text(
																		A2(_elm_lang$core$Maybe$withDefault, '', model.yearError)),
																	_1: {ctor: '[]'}
																}),
															_1: {
																ctor: '::',
																_0: A2(
																	_elm_lang$html$Html$input,
																	{
																		ctor: '::',
																		_0: _elm_lang$html$Html_Attributes$type_('text'),
																		_1: {
																			ctor: '::',
																			_0: _elm_lang$html$Html_Attributes$class('formRow__input artwork-container__input--dimensions'),
																			_1: {
																				ctor: '::',
																				_0: _elm_lang$html$Html_Attributes$placeholder('dimensions (eg 72 x 20)'),
																				_1: {
																					ctor: '::',
																					_0: _elm_lang$html$Html_Attributes$value(model.dimensions),
																					_1: {
																						ctor: '::',
																						_0: _elm_lang$html$Html_Events$onInput(_user$project$AddArtwork$DimensionsInput),
																						_1: {ctor: '[]'}
																					}
																				}
																			}
																		}
																	},
																	{ctor: '[]'}),
																_1: {
																	ctor: '::',
																	_0: A2(
																		_elm_lang$html$Html$p,
																		{
																			ctor: '::',
																			_0: _elm_lang$html$Html_Attributes$class('formRow__p--error'),
																			_1: {ctor: '[]'}
																		},
																		{
																			ctor: '::',
																			_0: _elm_lang$html$Html$text(
																				A2(_elm_lang$core$Maybe$withDefault, '', model.dimensionsError)),
																			_1: {ctor: '[]'}
																		}),
																	_1: {
																		ctor: '::',
																		_0: A2(
																			_elm_lang$html$Html$input,
																			{
																				ctor: '::',
																				_0: _elm_lang$html$Html_Attributes$type_('text'),
																				_1: {
																					ctor: '::',
																					_0: _elm_lang$html$Html_Attributes$class('formRow__input artwork-container__input--price'),
																					_1: {
																						ctor: '::',
																						_0: _elm_lang$html$Html_Attributes$placeholder('price'),
																						_1: {
																							ctor: '::',
																							_0: _elm_lang$html$Html_Attributes$value(model.price),
																							_1: {
																								ctor: '::',
																								_0: _elm_lang$html$Html_Events$onInput(_user$project$AddArtwork$PriceInput),
																								_1: {ctor: '[]'}
																							}
																						}
																					}
																				}
																			},
																			{ctor: '[]'}),
																		_1: {
																			ctor: '::',
																			_0: A2(
																				_elm_lang$html$Html$p,
																				{
																					ctor: '::',
																					_0: _elm_lang$html$Html_Attributes$class('formRow__p--error'),
																					_1: {ctor: '[]'}
																				},
																				{
																					ctor: '::',
																					_0: _elm_lang$html$Html$text(
																						A2(_elm_lang$core$Maybe$withDefault, '', model.priceError)),
																					_1: {ctor: '[]'}
																				}),
																			_1: {
																				ctor: '::',
																				_0: A2(
																					_elm_lang$html$Html$input,
																					{
																						ctor: '::',
																						_0: _elm_lang$html$Html_Attributes$type_('file'),
																						_1: {
																							ctor: '::',
																							_0: _elm_lang$html$Html_Attributes$class('formRow__input artwork-container__input--artworkImageFile'),
																							_1: {
																								ctor: '::',
																								_0: _elm_lang$html$Html_Attributes$placeholder('artwork image file'),
																								_1: {
																									ctor: '::',
																									_0: _elm_lang$html$Html_Attributes$id('cloudinary-input'),
																									_1: {
																										ctor: '::',
																										_0: _user$project$AddArtwork$onChange(_user$project$AddArtwork$FetchImageFile),
																										_1: {ctor: '[]'}
																									}
																								}
																							}
																						}
																					},
																					{ctor: '[]'}),
																				_1: {
																					ctor: '::',
																					_0: A2(
																						_elm_lang$html$Html$p,
																						{
																							ctor: '::',
																							_0: _elm_lang$html$Html_Attributes$class('formRow__p--error'),
																							_1: {ctor: '[]'}
																						},
																						{
																							ctor: '::',
																							_0: _elm_lang$html$Html$text(
																								A2(_elm_lang$core$Maybe$withDefault, '', model.artworkImageFileError)),
																							_1: {ctor: '[]'}
																						}),
																					_1: {
																						ctor: '::',
																						_0: A2(
																							_elm_lang$html$Html$img,
																							{
																								ctor: '::',
																								_0: _elm_lang$html$Html_Attributes$src(model.artworkImageFile),
																								_1: {ctor: '[]'}
																							},
																							{ctor: '[]'}),
																						_1: {
																							ctor: '::',
																							_0: A2(
																								_elm_lang$html$Html$button,
																								{
																									ctor: '::',
																									_0: _elm_lang$html$Html_Attributes$type_('submit'),
																									_1: {
																										ctor: '::',
																										_0: _elm_lang$html$Html_Attributes$class('btn btn--white formRow--btn'),
																										_1: {ctor: '[]'}
																									}
																								},
																								{
																									ctor: '::',
																									_0: _elm_lang$html$Html$text('add artwork'),
																									_1: {ctor: '[]'}
																								}),
																							_1: {ctor: '[]'}
																						}
																					}
																				}
																			}
																		}
																	}
																}
															}
														}
													}
												}
											}
										}
									}
								}
							}),
						_1: {ctor: '[]'}
					}),
				_1: {ctor: '[]'}
			});
	};
	var _user$project$AddArtwork$view = function (model) {
		return model.isLoading ? A2(
			_elm_lang$html$Html$div,
			{
				ctor: '::',
				_0: _elm_lang$html$Html_Attributes$class('main'),
				_1: {ctor: '[]'}
			},
			{
				ctor: '::',
				_0: _user$project$Loading$loadingSvg,
				_1: {ctor: '[]'}
			}) : A2(
			_elm_lang$html$Html$div,
			{
				ctor: '::',
				_0: _elm_lang$html$Html_Attributes$class('main'),
				_1: {ctor: '[]'}
			},
			{
				ctor: '::',
				_0: _user$project$AddArtwork$errorPanel(model.error),
				_1: {
					ctor: '::',
					_0: _user$project$AddArtwork$addArtwork(model),
					_1: {ctor: '[]'}
				}
			});
	};
	
	var _user$project$Artwork$errorPanel = function (error) {
		var _p0 = error;
		if (_p0.ctor === 'Nothing') {
			return _elm_lang$html$Html$text('');
		} else {
			return A2(
				_elm_lang$html$Html$div,
				{
					ctor: '::',
					_0: _elm_lang$html$Html_Attributes$class('error'),
					_1: {ctor: '[]'}
				},
				{
					ctor: '::',
					_0: _elm_lang$html$Html$text(_p0._0),
					_1: {ctor: '[]'}
				});
		}
	};
	var _user$project$Artwork$onChange = function (tagger) {
		return A2(
			_elm_lang$html$Html_Events$on,
			'change',
			A2(_elm_lang$core$Json_Decode$map, tagger, _elm_lang$html$Html_Events$targetValue));
	};
	var _user$project$Artwork$initArtwork = {artworkId: '', artist: '', title: '', medium: '', year: '', dimensions: '', price: '', artworkImageFile: '', oldArtworkImageFile: ''};
	var _user$project$Artwork$initModel = {error: _elm_lang$core$Maybe$Nothing, active: false, artwork: _user$project$Artwork$initArtwork, isEditing: false, isFetching: true};
	var _user$project$Artwork$init = {ctor: '_Tuple2', _0: _user$project$Artwork$initModel, _1: _elm_lang$core$Platform_Cmd$none};
	var _user$project$Artwork$fetchingArtwork = _elm_lang$core$Native_Platform.incomingPort('fetchingArtwork', _elm_lang$core$Json_Decode$string);
	var _user$project$Artwork$artworkReceived = _elm_lang$core$Native_Platform.incomingPort('artworkReceived', _elm_lang$core$Json_Decode$string);
	var _user$project$Artwork$fetchImageFileEdit = _elm_lang$core$Native_Platform.outgoingPort(
		'fetchImageFileEdit',
		function (v) {
			return v;
		});
	var _user$project$Artwork$imageFileReadEdit = _elm_lang$core$Native_Platform.incomingPort('imageFileReadEdit', _elm_lang$core$Json_Decode$string);
	var _user$project$Artwork$submitEditedArtwork = _elm_lang$core$Native_Platform.outgoingPort(
		'submitEditedArtwork',
		function (v) {
			return v;
		});
	var _user$project$Artwork$deleteArtwork = _elm_lang$core$Native_Platform.outgoingPort(
		'deleteArtwork',
		function (v) {
			return v;
		});
	var _user$project$Artwork$artworkDeleted = _elm_lang$core$Native_Platform.incomingPort('artworkDeleted', _elm_lang$core$Json_Decode$string);
	var _user$project$Artwork$Model = F5(
		function (a, b, c, d, e) {
			return {error: a, active: b, artwork: c, isEditing: d, isFetching: e};
		});
	var _user$project$Artwork$Artwork = F9(
		function (a, b, c, d, e, f, g, h, i) {
			return {artworkId: a, artist: b, title: c, medium: d, year: e, dimensions: f, price: g, artworkImageFile: h, oldArtworkImageFile: i};
		});
	var _user$project$Artwork$decodeArtworkItem = A3(
		_NoRedInk$elm_decode_pipeline$Json_Decode_Pipeline$required,
		'oldArtworkImageFile',
		_elm_lang$core$Json_Decode$string,
		A3(
			_NoRedInk$elm_decode_pipeline$Json_Decode_Pipeline$required,
			'artworkImageFile',
			_elm_lang$core$Json_Decode$string,
			A3(
				_NoRedInk$elm_decode_pipeline$Json_Decode_Pipeline$required,
				'price',
				_elm_lang$core$Json_Decode$string,
				A3(
					_NoRedInk$elm_decode_pipeline$Json_Decode_Pipeline$required,
					'dimensions',
					_elm_lang$core$Json_Decode$string,
					A3(
						_NoRedInk$elm_decode_pipeline$Json_Decode_Pipeline$required,
						'year',
						_elm_lang$core$Json_Decode$string,
						A3(
							_NoRedInk$elm_decode_pipeline$Json_Decode_Pipeline$required,
							'medium',
							_elm_lang$core$Json_Decode$string,
							A3(
								_NoRedInk$elm_decode_pipeline$Json_Decode_Pipeline$required,
								'title',
								_elm_lang$core$Json_Decode$string,
								A3(
									_NoRedInk$elm_decode_pipeline$Json_Decode_Pipeline$required,
									'artist',
									_elm_lang$core$Json_Decode$string,
									A3(
										_NoRedInk$elm_decode_pipeline$Json_Decode_Pipeline$required,
										'artworkId',
										_elm_lang$core$Json_Decode$string,
										_NoRedInk$elm_decode_pipeline$Json_Decode_Pipeline$decode(_user$project$Artwork$Artwork))))))))));
	var _user$project$Artwork$decodeJson = F2(
		function (jsonArtwork, model) {
			var _p1 = A2(_elm_lang$core$Json_Decode$decodeString, _user$project$Artwork$decodeArtworkItem, jsonArtwork);
			if (_p1.ctor === 'Ok') {
				var _p2 = _p1._0;
				return {
					ctor: '_Tuple2',
					_0: _elm_lang$core$Native_Utils.update(
						model,
						{
							isEditing: false,
							artwork: _elm_lang$core$Native_Utils.update(
								_p2,
								{artworkId: _p2.artworkId}),
							artwork: _elm_lang$core$Native_Utils.update(
								_p2,
								{artist: _p2.artist}),
							artwork: _elm_lang$core$Native_Utils.update(
								_p2,
								{title: _p2.title}),
							artwork: _elm_lang$core$Native_Utils.update(
								_p2,
								{medium: _p2.medium}),
							artwork: _elm_lang$core$Native_Utils.update(
								_p2,
								{year: _p2.year}),
							artwork: _elm_lang$core$Native_Utils.update(
								_p2,
								{dimensions: _p2.dimensions}),
							artwork: _elm_lang$core$Native_Utils.update(
								_p2,
								{price: _p2.price}),
							artwork: _elm_lang$core$Native_Utils.update(
								_p2,
								{artworkImageFile: _p2.artworkImageFile}),
							artwork: _elm_lang$core$Native_Utils.update(
								_p2,
								{oldArtworkImageFile: ''}),
							isFetching: false
						}),
					_1: _elm_lang$core$Platform_Cmd$none
				};
			} else {
				return {
					ctor: '_Tuple2',
					_0: _elm_lang$core$Native_Utils.update(
						model,
						{
							error: _elm_lang$core$Maybe$Just(_p1._0)
						}),
					_1: _elm_lang$core$Platform_Cmd$none
				};
			}
		});
	var _user$project$Artwork$update = F3(
		function (uid, msg, model) {
			var artwork = model.artwork;
			var _p3 = msg;
			switch (_p3.ctor) {
				case 'FetchingArtwork':
					return {
						ctor: '_Tuple2',
						_0: _elm_lang$core$Native_Utils.update(
							model,
							{isFetching: true}),
						_1: _elm_lang$core$Platform_Cmd$none
					};
				case 'ArtworkReceived':
					return A2(_user$project$Artwork$decodeJson, _p3._0, model);
				case 'EditArtwork':
					return {
						ctor: '_Tuple2',
						_0: _elm_lang$core$Native_Utils.update(
							model,
							{isEditing: true}),
						_1: _elm_lang$core$Platform_Cmd$none
					};
				case 'ViewArtwork':
					return {
						ctor: '_Tuple2',
						_0: _elm_lang$core$Native_Utils.update(
							model,
							{isEditing: false}),
						_1: _elm_lang$core$Platform_Cmd$none
					};
				case 'ArtistEditInput':
					return {
						ctor: '_Tuple2',
						_0: _elm_lang$core$Native_Utils.update(
							model,
							{
								artwork: _elm_lang$core$Native_Utils.update(
									artwork,
									{artist: _p3._0})
							}),
						_1: _elm_lang$core$Platform_Cmd$none
					};
				case 'TitleEditInput':
					return {
						ctor: '_Tuple2',
						_0: _elm_lang$core$Native_Utils.update(
							model,
							{
								artwork: _elm_lang$core$Native_Utils.update(
									artwork,
									{title: _p3._0})
							}),
						_1: _elm_lang$core$Platform_Cmd$none
					};
				case 'MediumEditInput':
					return {
						ctor: '_Tuple2',
						_0: _elm_lang$core$Native_Utils.update(
							model,
							{
								artwork: _elm_lang$core$Native_Utils.update(
									artwork,
									{medium: _p3._0})
							}),
						_1: _elm_lang$core$Platform_Cmd$none
					};
				case 'YearEditInput':
					return {
						ctor: '_Tuple2',
						_0: _elm_lang$core$Native_Utils.update(
							model,
							{
								artwork: _elm_lang$core$Native_Utils.update(
									artwork,
									{year: _p3._0})
							}),
						_1: _elm_lang$core$Platform_Cmd$none
					};
				case 'DimensionsEditInput':
					return {
						ctor: '_Tuple2',
						_0: _elm_lang$core$Native_Utils.update(
							model,
							{
								artwork: _elm_lang$core$Native_Utils.update(
									artwork,
									{dimensions: _p3._0})
							}),
						_1: _elm_lang$core$Platform_Cmd$none
					};
				case 'PriceEditInput':
					return {
						ctor: '_Tuple2',
						_0: _elm_lang$core$Native_Utils.update(
							model,
							{
								artwork: _elm_lang$core$Native_Utils.update(
									artwork,
									{price: _p3._0})
							}),
						_1: _elm_lang$core$Platform_Cmd$none
					};
				case 'ArtworkImageFileEditInput':
					return {
						ctor: '_Tuple2',
						_0: _elm_lang$core$Native_Utils.update(
							model,
							{
								artwork: _elm_lang$core$Native_Utils.update(
									artwork,
									{artworkImageFile: _p3._0})
							}),
						_1: _elm_lang$core$Platform_Cmd$none
					};
				case 'FetchImageFileEdit':
					return {
						ctor: '_Tuple2',
						_0: _elm_lang$core$Native_Utils.update(
							model,
							{
								artwork: _elm_lang$core$Native_Utils.update(
									artwork,
									{oldArtworkImageFile: artwork.artworkImageFile})
							}),
						_1: _user$project$Artwork$fetchImageFileEdit('cloudinary-input')
					};
				case 'SubmitEditedArtwork':
					var body = A2(
						_elm_lang$core$Json_Encode$encode,
						4,
						_elm_lang$core$Json_Encode$object(
							{
								ctor: '::',
								_0: {
									ctor: '_Tuple2',
									_0: 'artworkId',
									_1: _elm_lang$core$Json_Encode$string(model.artwork.artworkId)
								},
								_1: {
									ctor: '::',
									_0: {
										ctor: '_Tuple2',
										_0: 'artist',
										_1: _elm_lang$core$Json_Encode$string(model.artwork.artist)
									},
									_1: {
										ctor: '::',
										_0: {
											ctor: '_Tuple2',
											_0: 'title',
											_1: _elm_lang$core$Json_Encode$string(model.artwork.title)
										},
										_1: {
											ctor: '::',
											_0: {
												ctor: '_Tuple2',
												_0: 'medium',
												_1: _elm_lang$core$Json_Encode$string(model.artwork.medium)
											},
											_1: {
												ctor: '::',
												_0: {
													ctor: '_Tuple2',
													_0: 'year',
													_1: _elm_lang$core$Json_Encode$string(model.artwork.year)
												},
												_1: {
													ctor: '::',
													_0: {
														ctor: '_Tuple2',
														_0: 'dimensions',
														_1: _elm_lang$core$Json_Encode$string(model.artwork.dimensions)
													},
													_1: {
														ctor: '::',
														_0: {
															ctor: '_Tuple2',
															_0: 'price',
															_1: _elm_lang$core$Json_Encode$string(model.artwork.price)
														},
														_1: {
															ctor: '::',
															_0: {
																ctor: '_Tuple2',
																_0: 'artworkImage',
																_1: _elm_lang$core$Json_Encode$string(model.artwork.artworkImageFile)
															},
															_1: {
																ctor: '::',
																_0: {
																	ctor: '_Tuple2',
																	_0: 'oldArtworkImageFile',
																	_1: _elm_lang$core$Json_Encode$string(model.artwork.oldArtworkImageFile)
																},
																_1: {
																	ctor: '::',
																	_0: {
																		ctor: '_Tuple2',
																		_0: 'uid',
																		_1: _elm_lang$core$Json_Encode$string(uid)
																	},
																	_1: {ctor: '[]'}
																}
															}
														}
													}
												}
											}
										}
									}
								}
							}));
					var cmd = _user$project$Artwork$submitEditedArtwork(body);
					return {
						ctor: '_Tuple2',
						_0: _elm_lang$core$Native_Utils.update(
							model,
							{
								artwork: _elm_lang$core$Native_Utils.update(
									artwork,
									{oldArtworkImageFile: ''}),
								isEditing: false
							}),
						_1: cmd
					};
				case 'DeleteArtwork':
					return {
						ctor: '_Tuple2',
						_0: model,
						_1: _user$project$Artwork$deleteArtwork(model.artwork.artworkId)
					};
				case 'ArtworkDeleted':
					return {
						ctor: '_Tuple2',
						_0: _user$project$Artwork$initModel,
						_1: _elm_lang$navigation$Navigation$newUrl('#/gallery')
					};
				default:
					return {
						ctor: '_Tuple2',
						_0: _elm_lang$core$Native_Utils.update(
							model,
							{
								error: _elm_lang$core$Maybe$Just(_p3._0)
							}),
						_1: _elm_lang$core$Platform_Cmd$none
					};
			}
		});
	var _user$project$Artwork$Error = function (a) {
		return {ctor: 'Error', _0: a};
	};
	var _user$project$Artwork$ArtworkDeleted = function (a) {
		return {ctor: 'ArtworkDeleted', _0: a};
	};
	var _user$project$Artwork$DeleteArtwork = {ctor: 'DeleteArtwork'};
	var _user$project$Artwork$SubmitEditedArtwork = {ctor: 'SubmitEditedArtwork'};
	var _user$project$Artwork$FetchImageFileEdit = function (a) {
		return {ctor: 'FetchImageFileEdit', _0: a};
	};
	var _user$project$Artwork$ArtworkImageFileEditInput = function (a) {
		return {ctor: 'ArtworkImageFileEditInput', _0: a};
	};
	var _user$project$Artwork$PriceEditInput = function (a) {
		return {ctor: 'PriceEditInput', _0: a};
	};
	var _user$project$Artwork$DimensionsEditInput = function (a) {
		return {ctor: 'DimensionsEditInput', _0: a};
	};
	var _user$project$Artwork$YearEditInput = function (a) {
		return {ctor: 'YearEditInput', _0: a};
	};
	var _user$project$Artwork$MediumEditInput = function (a) {
		return {ctor: 'MediumEditInput', _0: a};
	};
	var _user$project$Artwork$TitleEditInput = function (a) {
		return {ctor: 'TitleEditInput', _0: a};
	};
	var _user$project$Artwork$ArtistEditInput = function (a) {
		return {ctor: 'ArtistEditInput', _0: a};
	};
	var _user$project$Artwork$ViewArtwork = {ctor: 'ViewArtwork'};
	var _user$project$Artwork$editArtwork = function (model) {
		return A2(
			_elm_lang$html$Html$div,
			{
				ctor: '::',
				_0: _elm_lang$html$Html_Attributes$class('row'),
				_1: {ctor: '[]'}
			},
			{
				ctor: '::',
				_0: A2(
					_elm_lang$html$Html$div,
					{
						ctor: '::',
						_0: _elm_lang$html$Html_Attributes$class('artwork-container vertical-align'),
						_1: {ctor: '[]'}
					},
					{
						ctor: '::',
						_0: A2(
							_elm_lang$html$Html$div,
							{
								ctor: '::',
								_0: _elm_lang$html$Html_Attributes$class('col-sm-6 artwork-container__col-sm-6'),
								_1: {ctor: '[]'}
							},
							{
								ctor: '::',
								_0: A2(
									_elm_lang$html$Html$img,
									{
										ctor: '::',
										_0: _elm_lang$html$Html_Attributes$src(model.artwork.artworkImageFile),
										_1: {ctor: '[]'}
									},
									{ctor: '[]'}),
								_1: {ctor: '[]'}
							}),
						_1: {
							ctor: '::',
							_0: A2(
								_elm_lang$html$Html$div,
								{
									ctor: '::',
									_0: _elm_lang$html$Html_Attributes$class('col-sm-6 artwork-container__col-sm-6'),
									_1: {ctor: '[]'}
								},
								{
									ctor: '::',
									_0: A2(
										_elm_lang$html$Html$div,
										{
											ctor: '::',
											_0: _elm_lang$html$Html_Attributes$class('text-center artwork-container__artwork-details'),
											_1: {ctor: '[]'}
										},
										{
											ctor: '::',
											_0: A2(
												_elm_lang$html$Html$form,
												{
													ctor: '::',
													_0: _elm_lang$html$Html_Attributes$class('formRow__form formRow__form--artwork-edit'),
													_1: {ctor: '[]'}
												},
												{
													ctor: '::',
													_0: A2(
														_elm_lang$html$Html$input,
														{
															ctor: '::',
															_0: _elm_lang$html$Html_Attributes$type_('text'),
															_1: {
																ctor: '::',
																_0: _elm_lang$html$Html_Attributes$class('formRow__input artwork-container__input--artist'),
																_1: {
																	ctor: '::',
																	_0: _elm_lang$html$Html_Attributes$placeholder('artist'),
																	_1: {
																		ctor: '::',
																		_0: _elm_lang$html$Html_Attributes$value(model.artwork.artist),
																		_1: {
																			ctor: '::',
																			_0: _elm_lang$html$Html_Events$onInput(_user$project$Artwork$ArtistEditInput),
																			_1: {ctor: '[]'}
																		}
																	}
																}
															}
														},
														{ctor: '[]'}),
													_1: {
														ctor: '::',
														_0: A2(
															_elm_lang$html$Html$input,
															{
																ctor: '::',
																_0: _elm_lang$html$Html_Attributes$type_('text'),
																_1: {
																	ctor: '::',
																	_0: _elm_lang$html$Html_Attributes$class('formRow__input artwork-container__input--title'),
																	_1: {
																		ctor: '::',
																		_0: _elm_lang$html$Html_Attributes$placeholder('title'),
																		_1: {
																			ctor: '::',
																			_0: _elm_lang$html$Html_Attributes$value(model.artwork.title),
																			_1: {
																				ctor: '::',
																				_0: _elm_lang$html$Html_Events$onInput(_user$project$Artwork$TitleEditInput),
																				_1: {ctor: '[]'}
																			}
																		}
																	}
																}
															},
															{ctor: '[]'}),
														_1: {
															ctor: '::',
															_0: A2(
																_elm_lang$html$Html$input,
																{
																	ctor: '::',
																	_0: _elm_lang$html$Html_Attributes$type_('text'),
																	_1: {
																		ctor: '::',
																		_0: _elm_lang$html$Html_Attributes$class('formRow__input artwork-container__input--medium'),
																		_1: {
																			ctor: '::',
																			_0: _elm_lang$html$Html_Attributes$placeholder('medium'),
																			_1: {
																				ctor: '::',
																				_0: _elm_lang$html$Html_Attributes$value(model.artwork.medium),
																				_1: {
																					ctor: '::',
																					_0: _elm_lang$html$Html_Events$onInput(_user$project$Artwork$MediumEditInput),
																					_1: {ctor: '[]'}
																				}
																			}
																		}
																	}
																},
																{ctor: '[]'}),
															_1: {
																ctor: '::',
																_0: A2(
																	_elm_lang$html$Html$input,
																	{
																		ctor: '::',
																		_0: _elm_lang$html$Html_Attributes$type_('text'),
																		_1: {
																			ctor: '::',
																			_0: _elm_lang$html$Html_Attributes$class('formRow__input artwork-container__input--year'),
																			_1: {
																				ctor: '::',
																				_0: _elm_lang$html$Html_Attributes$placeholder('year'),
																				_1: {
																					ctor: '::',
																					_0: _elm_lang$html$Html_Attributes$value(model.artwork.year),
																					_1: {
																						ctor: '::',
																						_0: _elm_lang$html$Html_Events$onInput(_user$project$Artwork$YearEditInput),
																						_1: {ctor: '[]'}
																					}
																				}
																			}
																		}
																	},
																	{ctor: '[]'}),
																_1: {
																	ctor: '::',
																	_0: A2(
																		_elm_lang$html$Html$input,
																		{
																			ctor: '::',
																			_0: _elm_lang$html$Html_Attributes$type_('text'),
																			_1: {
																				ctor: '::',
																				_0: _elm_lang$html$Html_Attributes$class('formRow__input artwork-container__input--dimensions'),
																				_1: {
																					ctor: '::',
																					_0: _elm_lang$html$Html_Attributes$placeholder('dimensions (eg 72 x 20)'),
																					_1: {
																						ctor: '::',
																						_0: _elm_lang$html$Html_Attributes$value(model.artwork.dimensions),
																						_1: {
																							ctor: '::',
																							_0: _elm_lang$html$Html_Events$onInput(_user$project$Artwork$DimensionsEditInput),
																							_1: {ctor: '[]'}
																						}
																					}
																				}
																			}
																		},
																		{ctor: '[]'}),
																	_1: {
																		ctor: '::',
																		_0: A2(
																			_elm_lang$html$Html$input,
																			{
																				ctor: '::',
																				_0: _elm_lang$html$Html_Attributes$type_('text'),
																				_1: {
																					ctor: '::',
																					_0: _elm_lang$html$Html_Attributes$class('formRow__input artwork-container__input--price'),
																					_1: {
																						ctor: '::',
																						_0: _elm_lang$html$Html_Attributes$placeholder('price'),
																						_1: {
																							ctor: '::',
																							_0: _elm_lang$html$Html_Attributes$value(model.artwork.price),
																							_1: {
																								ctor: '::',
																								_0: _elm_lang$html$Html_Events$onInput(_user$project$Artwork$PriceEditInput),
																								_1: {ctor: '[]'}
																							}
																						}
																					}
																				}
																			},
																			{ctor: '[]'}),
																		_1: {
																			ctor: '::',
																			_0: A2(
																				_elm_lang$html$Html$input,
																				{
																					ctor: '::',
																					_0: _elm_lang$html$Html_Attributes$type_('file'),
																					_1: {
																						ctor: '::',
																						_0: _elm_lang$html$Html_Attributes$class('formRow__input artwork-container__input--artworkImageFile'),
																						_1: {
																							ctor: '::',
																							_0: _elm_lang$html$Html_Attributes$placeholder('artwork image file'),
																							_1: {
																								ctor: '::',
																								_0: _elm_lang$html$Html_Attributes$id('cloudinary-input'),
																								_1: {
																									ctor: '::',
																									_0: _user$project$Artwork$onChange(_user$project$Artwork$FetchImageFileEdit),
																									_1: {ctor: '[]'}
																								}
																							}
																						}
																					}
																				},
																				{ctor: '[]'}),
																			_1: {
																				ctor: '::',
																				_0: A2(
																					_elm_lang$html$Html$button,
																					{
																						ctor: '::',
																						_0: _elm_lang$html$Html_Attributes$class('btn btn--white formRow--btn'),
																						_1: {
																							ctor: '::',
																							_0: _elm_lang$html$Html_Events$onClick(_user$project$Artwork$SubmitEditedArtwork),
																							_1: {ctor: '[]'}
																						}
																					},
																					{
																						ctor: '::',
																						_0: _elm_lang$html$Html$text('submit edited artwork'),
																						_1: {ctor: '[]'}
																					}),
																				_1: {ctor: '[]'}
																			}
																		}
																	}
																}
															}
														}
													}
												}),
											_1: {ctor: '[]'}
										}),
									_1: {ctor: '[]'}
								}),
							_1: {ctor: '[]'}
						}
					}),
				_1: {
					ctor: '::',
					_0: A2(
						_elm_lang$html$Html$div,
						{
							ctor: '::',
							_0: _elm_lang$html$Html_Attributes$class('text-center div__btn--center'),
							_1: {ctor: '[]'}
						},
						{
							ctor: '::',
							_0: A2(
								_elm_lang$html$Html$button,
								{
									ctor: '::',
									_0: _elm_lang$html$Html_Attributes$class('btn btn--white btn--center'),
									_1: {
										ctor: '::',
										_0: _elm_lang$html$Html_Events$onClick(_user$project$Artwork$ViewArtwork),
										_1: {ctor: '[]'}
									}
								},
								{
									ctor: '::',
									_0: _elm_lang$html$Html$text('return to artwork view'),
									_1: {ctor: '[]'}
								}),
							_1: {ctor: '[]'}
						}),
					_1: {ctor: '[]'}
				}
			});
	};
	var _user$project$Artwork$EditArtwork = {ctor: 'EditArtwork'};
	var _user$project$Artwork$artwork = function (model) {
		return A2(
			_elm_lang$html$Html$div,
			{
				ctor: '::',
				_0: _elm_lang$html$Html_Attributes$class('row'),
				_1: {ctor: '[]'}
			},
			{
				ctor: '::',
				_0: A2(
					_elm_lang$html$Html$div,
					{
						ctor: '::',
						_0: _elm_lang$html$Html_Attributes$class('artwork-container vertical-align'),
						_1: {ctor: '[]'}
					},
					{
						ctor: '::',
						_0: A2(
							_elm_lang$html$Html$div,
							{
								ctor: '::',
								_0: _elm_lang$html$Html_Attributes$class('col-sm-6 artwork-container__col-sm-6'),
								_1: {ctor: '[]'}
							},
							{
								ctor: '::',
								_0: A2(
									_elm_lang$html$Html$img,
									{
										ctor: '::',
										_0: _elm_lang$html$Html_Attributes$src(model.artwork.artworkImageFile),
										_1: {ctor: '[]'}
									},
									{ctor: '[]'}),
								_1: {ctor: '[]'}
							}),
						_1: {
							ctor: '::',
							_0: A2(
								_elm_lang$html$Html$div,
								{
									ctor: '::',
									_0: _elm_lang$html$Html_Attributes$class('col-sm-6 artwork-container__col-sm-6'),
									_1: {ctor: '[]'}
								},
								{
									ctor: '::',
									_0: A2(
										_elm_lang$html$Html$div,
										{
											ctor: '::',
											_0: _elm_lang$html$Html_Attributes$class('text-center artwork-container__artwork-details'),
											_1: {ctor: '[]'}
										},
										{
											ctor: '::',
											_0: A2(
												_elm_lang$html$Html$h2,
												{
													ctor: '::',
													_0: _elm_lang$html$Html_Attributes$class('artwork-container__artwork-details__artist'),
													_1: {ctor: '[]'}
												},
												{
													ctor: '::',
													_0: _elm_lang$html$Html$text(model.artwork.artist),
													_1: {ctor: '[]'}
												}),
											_1: {
												ctor: '::',
												_0: A2(
													_elm_lang$html$Html$p,
													{
														ctor: '::',
														_0: _elm_lang$html$Html_Attributes$class('artwork-container__artwork-details__title'),
														_1: {ctor: '[]'}
													},
													{
														ctor: '::',
														_0: _elm_lang$html$Html$text(
															A2(
																_elm_lang$core$Basics_ops['++'],
																model.artwork.title,
																A2(_elm_lang$core$Basics_ops['++'], ', ', model.artwork.year))),
														_1: {ctor: '[]'}
													}),
												_1: {
													ctor: '::',
													_0: A2(
														_elm_lang$html$Html$p,
														{
															ctor: '::',
															_0: _elm_lang$html$Html_Attributes$class('artwork-container__artwork-details__medium'),
															_1: {ctor: '[]'}
														},
														{
															ctor: '::',
															_0: _elm_lang$html$Html$text(model.artwork.medium),
															_1: {ctor: '[]'}
														}),
													_1: {
														ctor: '::',
														_0: A2(
															_elm_lang$html$Html$p,
															{
																ctor: '::',
																_0: _elm_lang$html$Html_Attributes$class('artwork-container__artwork-details__dimensions'),
																_1: {ctor: '[]'}
															},
															{
																ctor: '::',
																_0: _elm_lang$html$Html$text(model.artwork.dimensions),
																_1: {ctor: '[]'}
															}),
														_1: {
															ctor: '::',
															_0: A2(
																_elm_lang$html$Html$p,
																{
																	ctor: '::',
																	_0: _elm_lang$html$Html_Attributes$class('align-middle artwork-container__artwork-details__price'),
																	_1: {ctor: '[]'}
																},
																{
																	ctor: '::',
																	_0: _elm_lang$html$Html$text(
																		A2(_elm_lang$core$Basics_ops['++'], '$', model.artwork.price)),
																	_1: {ctor: '[]'}
																}),
															_1: {
																ctor: '::',
																_0: A2(
																	_elm_lang$html$Html$button,
																	{
																		ctor: '::',
																		_0: _elm_lang$html$Html_Attributes$class('btn btn--green'),
																		_1: {
																			ctor: '::',
																			_0: _elm_lang$html$Html_Events$onClick(_user$project$Artwork$EditArtwork),
																			_1: {ctor: '[]'}
																		}
																	},
																	{
																		ctor: '::',
																		_0: _elm_lang$html$Html$text('edit artwork'),
																		_1: {ctor: '[]'}
																	}),
																_1: {ctor: '[]'}
															}
														}
													}
												}
											}
										}),
									_1: {ctor: '[]'}
								}),
							_1: {ctor: '[]'}
						}
					}),
				_1: {
					ctor: '::',
					_0: A2(
						_elm_lang$html$Html$div,
						{
							ctor: '::',
							_0: _elm_lang$html$Html_Attributes$class('text-center'),
							_1: {ctor: '[]'}
						},
						{
							ctor: '::',
							_0: A2(
								_elm_lang$html$Html$button,
								{
									ctor: '::',
									_0: _elm_lang$html$Html_Attributes$class('btn btn-danger'),
									_1: {
										ctor: '::',
										_0: _elm_lang$html$Html_Events$onClick(_user$project$Artwork$DeleteArtwork),
										_1: {ctor: '[]'}
									}
								},
								{
									ctor: '::',
									_0: _elm_lang$html$Html$text('delete artwork'),
									_1: {ctor: '[]'}
								}),
							_1: {ctor: '[]'}
						}),
					_1: {ctor: '[]'}
				}
			});
	};
	var _user$project$Artwork$view = function (model) {
		return model.isFetching ? A2(
			_elm_lang$html$Html$div,
			{
				ctor: '::',
				_0: _elm_lang$html$Html_Attributes$class('main'),
				_1: {ctor: '[]'}
			},
			{
				ctor: '::',
				_0: _user$project$Loading$loadingSvg,
				_1: {ctor: '[]'}
			}) : (model.isEditing ? A2(
			_elm_lang$html$Html$div,
			{
				ctor: '::',
				_0: _elm_lang$html$Html_Attributes$class('main main--gallery'),
				_1: {ctor: '[]'}
			},
			{
				ctor: '::',
				_0: A2(
					_elm_lang$html$Html$div,
					{
						ctor: '::',
						_0: _elm_lang$html$Html_Attributes$class('container'),
						_1: {ctor: '[]'}
					},
					{
						ctor: '::',
						_0: _user$project$Artwork$errorPanel(model.error),
						_1: {
							ctor: '::',
							_0: _user$project$Artwork$editArtwork(model),
							_1: {ctor: '[]'}
						}
					}),
				_1: {ctor: '[]'}
			}) : A2(
			_elm_lang$html$Html$div,
			{
				ctor: '::',
				_0: _elm_lang$html$Html_Attributes$class('main main--gallery'),
				_1: {ctor: '[]'}
			},
			{
				ctor: '::',
				_0: A2(
					_elm_lang$html$Html$div,
					{
						ctor: '::',
						_0: _elm_lang$html$Html_Attributes$class('container'),
						_1: {ctor: '[]'}
					},
					{
						ctor: '::',
						_0: _user$project$Artwork$errorPanel(model.error),
						_1: {
							ctor: '::',
							_0: _user$project$Artwork$artwork(model),
							_1: {ctor: '[]'}
						}
					}),
				_1: {ctor: '[]'}
			}));
	};
	var _user$project$Artwork$ArtworkReceived = function (a) {
		return {ctor: 'ArtworkReceived', _0: a};
	};
	var _user$project$Artwork$FetchingArtwork = function (a) {
		return {ctor: 'FetchingArtwork', _0: a};
	};
	var _user$project$Artwork$subscriptions = function (model) {
		return _elm_lang$core$Platform_Sub$batch(
			{
				ctor: '::',
				_0: _user$project$Artwork$fetchingArtwork(_user$project$Artwork$FetchingArtwork),
				_1: {
					ctor: '::',
					_0: _user$project$Artwork$artworkReceived(_user$project$Artwork$ArtworkReceived),
					_1: {
						ctor: '::',
						_0: _user$project$Artwork$imageFileReadEdit(_user$project$Artwork$ArtworkImageFileEditInput),
						_1: {
							ctor: '::',
							_0: _user$project$Artwork$artworkDeleted(_user$project$Artwork$ArtworkDeleted),
							_1: {ctor: '[]'}
						}
					}
				}
			});
	};
	
	var _user$project$Gallery$errorPanel = function (error) {
		var _p0 = error;
		if (_p0.ctor === 'Nothing') {
			return _elm_lang$html$Html$text('');
		} else {
			return A2(
				_elm_lang$html$Html$div,
				{
					ctor: '::',
					_0: _elm_lang$html$Html_Attributes$class('error'),
					_1: {ctor: '[]'}
				},
				{
					ctor: '::',
					_0: _elm_lang$html$Html$text(_p0._0),
					_1: {ctor: '[]'}
				});
		}
	};
	var _user$project$Gallery$galleryHeader = function (model) {
		return _elm_lang$core$Native_Utils.eq(model.userId, model.searchId) ? A2(
			_elm_lang$html$Html$h2,
			{
				ctor: '::',
				_0: _elm_lang$html$Html_Attributes$class('text-center gallery-header'),
				_1: {ctor: '[]'}
			},
			{
				ctor: '::',
				_0: _elm_lang$html$Html$text('Your Gallery'),
				_1: {ctor: '[]'}
			}) : A2(
			_elm_lang$html$Html$div,
			{ctor: '[]'},
			{ctor: '[]'});
	};
	var _user$project$Gallery$galleryTableHeader = A2(
		_elm_lang$html$Html$thead,
		{
			ctor: '::',
			_0: _elm_lang$html$Html_Attributes$class('table-head--custom'),
			_1: {ctor: '[]'}
		},
		{
			ctor: '::',
			_0: A2(
				_elm_lang$html$Html$tr,
				{ctor: '[]'},
				{
					ctor: '::',
					_0: A2(
						_elm_lang$html$Html$th,
						{ctor: '[]'},
						{
							ctor: '::',
							_0: _elm_lang$html$Html$text('Artwork'),
							_1: {ctor: '[]'}
						}),
					_1: {
						ctor: '::',
						_0: A2(
							_elm_lang$html$Html$th,
							{ctor: '[]'},
							{
								ctor: '::',
								_0: _elm_lang$html$Html$text('Artist'),
								_1: {ctor: '[]'}
							}),
						_1: {
							ctor: '::',
							_0: A2(
								_elm_lang$html$Html$th,
								{ctor: '[]'},
								{
									ctor: '::',
									_0: _elm_lang$html$Html$text('Title'),
									_1: {ctor: '[]'}
								}),
							_1: {
								ctor: '::',
								_0: A2(
									_elm_lang$html$Html$th,
									{ctor: '[]'},
									{
										ctor: '::',
										_0: _elm_lang$html$Html$text('Year'),
										_1: {ctor: '[]'}
									}),
								_1: {
									ctor: '::',
									_0: A2(
										_elm_lang$html$Html$th,
										{ctor: '[]'},
										{
											ctor: '::',
											_0: _elm_lang$html$Html$text('Medium'),
											_1: {ctor: '[]'}
										}),
									_1: {
										ctor: '::',
										_0: A2(
											_elm_lang$html$Html$th,
											{ctor: '[]'},
											{
												ctor: '::',
												_0: _elm_lang$html$Html$text('Dimensions'),
												_1: {ctor: '[]'}
											}),
										_1: {
											ctor: '::',
											_0: A2(
												_elm_lang$html$Html$th,
												{ctor: '[]'},
												{
													ctor: '::',
													_0: _elm_lang$html$Html$text('Price'),
													_1: {ctor: '[]'}
												}),
											_1: {ctor: '[]'}
										}
									}
								}
							}
						}
					}
				}),
			_1: {ctor: '[]'}
		});
	var _user$project$Gallery$initModel = {
		error: _elm_lang$core$Maybe$Nothing,
		gallery: {ctor: '[]'},
		searchId: '',
		userId: '',
		routeParam: '',
		isFetching: true,
		listView: true,
		tableView: false
	};
	var _user$project$Gallery$init = {ctor: '_Tuple2', _0: _user$project$Gallery$initModel, _1: _elm_lang$core$Platform_Cmd$none};
	var _user$project$Gallery$usersGallery = _elm_lang$core$Native_Platform.incomingPort('usersGallery', _elm_lang$core$Json_Decode$string);
	var _user$project$Gallery$clearGallery = _elm_lang$core$Native_Platform.incomingPort('clearGallery', _elm_lang$core$Json_Decode$string);
	var _user$project$Gallery$getOneArtwork = _elm_lang$core$Native_Platform.outgoingPort(
		'getOneArtwork',
		function (v) {
			return v;
		});
	var _user$project$Gallery$Model = F8(
		function (a, b, c, d, e, f, g, h) {
			return {error: a, gallery: b, searchId: c, userId: d, routeParam: e, isFetching: f, listView: g, tableView: h};
		});
	var _user$project$Gallery$GalleryItem = function (a) {
		return function (b) {
			return function (c) {
				return function (d) {
					return function (e) {
						return function (f) {
							return function (g) {
								return function (h) {
									return function (i) {
										return function (j) {
											return {artworkId: a, artist: b, title: c, medium: d, year: e, dimensions: f, price: g, artworkImageFile: h, userId: i, searchId: j};
										};
									};
								};
							};
						};
					};
				};
			};
		};
	};
	var _user$project$Gallery$decodeGalleryItem = A3(
		_NoRedInk$elm_decode_pipeline$Json_Decode_Pipeline$required,
		'searchId',
		_elm_lang$core$Json_Decode$string,
		A3(
			_NoRedInk$elm_decode_pipeline$Json_Decode_Pipeline$required,
			'userId',
			_elm_lang$core$Json_Decode$string,
			A3(
				_NoRedInk$elm_decode_pipeline$Json_Decode_Pipeline$required,
				'artworkImageFile',
				_elm_lang$core$Json_Decode$string,
				A3(
					_NoRedInk$elm_decode_pipeline$Json_Decode_Pipeline$required,
					'price',
					_elm_lang$core$Json_Decode$string,
					A3(
						_NoRedInk$elm_decode_pipeline$Json_Decode_Pipeline$required,
						'dimensions',
						_elm_lang$core$Json_Decode$string,
						A3(
							_NoRedInk$elm_decode_pipeline$Json_Decode_Pipeline$required,
							'year',
							_elm_lang$core$Json_Decode$string,
							A3(
								_NoRedInk$elm_decode_pipeline$Json_Decode_Pipeline$required,
								'medium',
								_elm_lang$core$Json_Decode$string,
								A3(
									_NoRedInk$elm_decode_pipeline$Json_Decode_Pipeline$required,
									'title',
									_elm_lang$core$Json_Decode$string,
									A3(
										_NoRedInk$elm_decode_pipeline$Json_Decode_Pipeline$required,
										'artist',
										_elm_lang$core$Json_Decode$string,
										A3(
											_NoRedInk$elm_decode_pipeline$Json_Decode_Pipeline$required,
											'artworkId',
											_elm_lang$core$Json_Decode$string,
											_NoRedInk$elm_decode_pipeline$Json_Decode_Pipeline$decode(_user$project$Gallery$GalleryItem)))))))))));
	var _user$project$Gallery$decodeJson = F2(
		function (jsonGallery, model) {
			var _p1 = A2(_elm_lang$core$Json_Decode$decodeString, _user$project$Gallery$decodeGalleryItem, jsonGallery);
			if (_p1.ctor === 'Ok') {
				return {
					ctor: '_Tuple2',
					_0: _elm_lang$core$Native_Utils.update(
						model,
						{
							gallery: {ctor: '::', _0: _p1._0, _1: model.gallery},
							isFetching: false
						}),
					_1: _elm_lang$core$Platform_Cmd$none
				};
			} else {
				return {
					ctor: '_Tuple2',
					_0: _elm_lang$core$Native_Utils.update(
						model,
						{
							error: _elm_lang$core$Maybe$Just(_p1._0)
						}),
					_1: _elm_lang$core$Platform_Cmd$none
				};
			}
		});
	var _user$project$Gallery$ClearGalleryReturnValue = F2(
		function (a, b) {
			return {searchId: a, userId: b};
		});
	var _user$project$Gallery$decodedClearGallery = A3(
		_NoRedInk$elm_decode_pipeline$Json_Decode_Pipeline$required,
		'userId',
		_elm_lang$core$Json_Decode$string,
		A3(
			_NoRedInk$elm_decode_pipeline$Json_Decode_Pipeline$required,
			'searchId',
			_elm_lang$core$Json_Decode$string,
			_NoRedInk$elm_decode_pipeline$Json_Decode_Pipeline$decode(_user$project$Gallery$ClearGalleryReturnValue)));
	var _user$project$Gallery$jsonDecodeClearGallery = F2(
		function (ids, model) {
			var _p2 = A2(_elm_lang$core$Json_Decode$decodeString, _user$project$Gallery$decodedClearGallery, ids);
			if (_p2.ctor === 'Ok') {
				var _p3 = _p2._0;
				return {
					ctor: '_Tuple2',
					_0: _elm_lang$core$Native_Utils.update(
						model,
						{
							searchId: _p3.searchId,
							userId: _p3.userId,
							gallery: {ctor: '[]'}
						}),
					_1: _elm_lang$core$Platform_Cmd$none
				};
			} else {
				return {
					ctor: '_Tuple2',
					_0: _elm_lang$core$Native_Utils.update(
						model,
						{
							error: _elm_lang$core$Maybe$Just(_p2._0)
						}),
					_1: _elm_lang$core$Platform_Cmd$none
				};
			}
		});
	var _user$project$Gallery$update = F2(
		function (msg, model) {
			var _p4 = msg;
			switch (_p4.ctor) {
				case 'ArtworkPage':
					var _p5 = _p4._0;
					return {
						ctor: '_Tuple2',
						_0: _elm_lang$core$Native_Utils.update(
							model,
							{routeParam: _p5}),
						_1: _elm_lang$core$Platform_Cmd$batch(
							{
								ctor: '::',
								_0: _user$project$Gallery$getOneArtwork(_p5),
								_1: {
									ctor: '::',
									_0: _elm_lang$navigation$Navigation$newUrl('#/artwork'),
									_1: {ctor: '[]'}
								}
							})
					};
				case 'Error':
					return {
						ctor: '_Tuple2',
						_0: _elm_lang$core$Native_Utils.update(
							model,
							{
								error: _elm_lang$core$Maybe$Just(_p4._0)
							}),
						_1: _elm_lang$core$Platform_Cmd$none
					};
				case 'UsersGallery':
					return A2(_user$project$Gallery$decodeJson, _p4._0, model);
				case 'ClearGallery':
					return A2(_user$project$Gallery$jsonDecodeClearGallery, _p4._0, model);
				case 'ListView':
					return {
						ctor: '_Tuple2',
						_0: _elm_lang$core$Native_Utils.update(
							model,
							{listView: true, tableView: false}),
						_1: _elm_lang$core$Platform_Cmd$none
					};
				default:
					return {
						ctor: '_Tuple2',
						_0: _elm_lang$core$Native_Utils.update(
							model,
							{listView: false, tableView: true}),
						_1: _elm_lang$core$Platform_Cmd$none
					};
			}
		});
	var _user$project$Gallery$TableView = {ctor: 'TableView'};
	var _user$project$Gallery$ListView = {ctor: 'ListView'};
	var _user$project$Gallery$ClearGallery = function (a) {
		return {ctor: 'ClearGallery', _0: a};
	};
	var _user$project$Gallery$UsersGallery = function (a) {
		return {ctor: 'UsersGallery', _0: a};
	};
	var _user$project$Gallery$subscriptions = function (model) {
		return _elm_lang$core$Platform_Sub$batch(
			{
				ctor: '::',
				_0: _user$project$Gallery$usersGallery(_user$project$Gallery$UsersGallery),
				_1: {
					ctor: '::',
					_0: _user$project$Gallery$clearGallery(_user$project$Gallery$ClearGallery),
					_1: {ctor: '[]'}
				}
			});
	};
	var _user$project$Gallery$ArtworkPage = function (a) {
		return {ctor: 'ArtworkPage', _0: a};
	};
	var _user$project$Gallery$paintingListView = function (_p6) {
		var _p7 = _p6;
		return A2(
			_elm_lang$html$Html$div,
			{
				ctor: '::',
				_0: _elm_lang$html$Html_Attributes$class('row'),
				_1: {ctor: '[]'}
			},
			{
				ctor: '::',
				_0: A2(
					_elm_lang$html$Html$div,
					{
						ctor: '::',
						_0: _elm_lang$html$Html_Attributes$class('artwork-container vertical-align'),
						_1: {ctor: '[]'}
					},
					{
						ctor: '::',
						_0: A2(
							_elm_lang$html$Html$div,
							{
								ctor: '::',
								_0: _elm_lang$html$Html_Attributes$class('col-sm-6 artwork-container__col-sm-6'),
								_1: {ctor: '[]'}
							},
							{
								ctor: '::',
								_0: A2(
									_elm_lang$html$Html$img,
									{
										ctor: '::',
										_0: _elm_lang$html$Html_Attributes$src(_p7.artworkImageFile),
										_1: {ctor: '[]'}
									},
									{ctor: '[]'}),
								_1: {ctor: '[]'}
							}),
						_1: {
							ctor: '::',
							_0: A2(
								_elm_lang$html$Html$div,
								{
									ctor: '::',
									_0: _elm_lang$html$Html_Attributes$class('col-sm-6 artwork-container__col-sm-6'),
									_1: {ctor: '[]'}
								},
								{
									ctor: '::',
									_0: A2(
										_elm_lang$html$Html$div,
										{
											ctor: '::',
											_0: _elm_lang$html$Html_Attributes$class('text-center artwork-container__artwork-details'),
											_1: {ctor: '[]'}
										},
										{
											ctor: '::',
											_0: A2(
												_elm_lang$html$Html$h2,
												{
													ctor: '::',
													_0: _elm_lang$html$Html_Attributes$class('artwork-container__artwork-details__artist'),
													_1: {ctor: '[]'}
												},
												{
													ctor: '::',
													_0: _elm_lang$html$Html$text(_p7.artist),
													_1: {ctor: '[]'}
												}),
											_1: {
												ctor: '::',
												_0: A2(
													_elm_lang$html$Html$p,
													{
														ctor: '::',
														_0: _elm_lang$html$Html_Attributes$class('artwork-container__artwork-details__title'),
														_1: {ctor: '[]'}
													},
													{
														ctor: '::',
														_0: _elm_lang$html$Html$text(
															A2(
																_elm_lang$core$Basics_ops['++'],
																_p7.title,
																A2(_elm_lang$core$Basics_ops['++'], ', ', _p7.year))),
														_1: {ctor: '[]'}
													}),
												_1: {
													ctor: '::',
													_0: A2(
														_elm_lang$html$Html$p,
														{
															ctor: '::',
															_0: _elm_lang$html$Html_Attributes$class('artwork-container__artwork-details__medium'),
															_1: {ctor: '[]'}
														},
														{
															ctor: '::',
															_0: _elm_lang$html$Html$text(_p7.medium),
															_1: {ctor: '[]'}
														}),
													_1: {
														ctor: '::',
														_0: A2(
															_elm_lang$html$Html$p,
															{
																ctor: '::',
																_0: _elm_lang$html$Html_Attributes$class('artwork-container__artwork-details__dimensions'),
																_1: {ctor: '[]'}
															},
															{
																ctor: '::',
																_0: _elm_lang$html$Html$text(_p7.dimensions),
																_1: {ctor: '[]'}
															}),
														_1: {
															ctor: '::',
															_0: A2(
																_elm_lang$html$Html$p,
																{
																	ctor: '::',
																	_0: _elm_lang$html$Html_Attributes$class('align-middle artwork-container__artwork-details__price'),
																	_1: {ctor: '[]'}
																},
																{
																	ctor: '::',
																	_0: _elm_lang$html$Html$text(
																		A2(_elm_lang$core$Basics_ops['++'], '$', _p7.price)),
																	_1: {ctor: '[]'}
																}),
															_1: {
																ctor: '::',
																_0: _elm_lang$core$Native_Utils.eq(_p7.userId, _p7.searchId) ? A2(
																	_elm_lang$html$Html$button,
																	{
																		ctor: '::',
																		_0: _elm_lang$html$Html_Attributes$class('btn btn--green'),
																		_1: {
																			ctor: '::',
																			_0: _elm_lang$html$Html_Events$onClick(
																				_user$project$Gallery$ArtworkPage(_p7.artworkId)),
																			_1: {ctor: '[]'}
																		}
																	},
																	{
																		ctor: '::',
																		_0: _elm_lang$html$Html$text('view artwork'),
																		_1: {ctor: '[]'}
																	}) : A2(
																	_elm_lang$html$Html$p,
																	{ctor: '[]'},
																	{ctor: '[]'}),
																_1: {ctor: '[]'}
															}
														}
													}
												}
											}
										}),
									_1: {ctor: '[]'}
								}),
							_1: {ctor: '[]'}
						}
					}),
				_1: {ctor: '[]'}
			});
	};
	var _user$project$Gallery$galleryListView = function (model) {
		return A2(
			_elm_lang$html$Html$div,
			{
				ctor: '::',
				_0: _elm_lang$html$Html_Attributes$class('container'),
				_1: {ctor: '[]'}
			},
			A2(_elm_lang$core$List$map, _user$project$Gallery$paintingListView, model.gallery));
	};
	var _user$project$Gallery$paintingTableView = function (_p8) {
		var _p9 = _p8;
		var _p14 = _p9.userId;
		var _p13 = _p9.title;
		var _p12 = _p9.searchId;
		var _p11 = _p9.artworkImageFile;
		var _p10 = _p9.artworkId;
		return A2(
			_elm_lang$html$Html$tr,
			{ctor: '[]'},
			{
				ctor: '::',
				_0: _elm_lang$core$Native_Utils.eq(_p14, _p12) ? A2(
					_elm_lang$html$Html$td,
					{ctor: '[]'},
					{
						ctor: '::',
						_0: A2(
							_elm_lang$html$Html$img,
							{
								ctor: '::',
								_0: _elm_lang$html$Html_Attributes$src(_p11),
								_1: {
									ctor: '::',
									_0: _elm_lang$html$Html_Attributes$class('thumbnail'),
									_1: {
										ctor: '::',
										_0: _elm_lang$html$Html_Events$onClick(
											_user$project$Gallery$ArtworkPage(_p10)),
										_1: {ctor: '[]'}
									}
								}
							},
							{ctor: '[]'}),
						_1: {ctor: '[]'}
					}) : A2(
					_elm_lang$html$Html$td,
					{ctor: '[]'},
					{
						ctor: '::',
						_0: A2(
							_elm_lang$html$Html$img,
							{
								ctor: '::',
								_0: _elm_lang$html$Html_Attributes$src(_p11),
								_1: {
									ctor: '::',
									_0: _elm_lang$html$Html_Attributes$class('thumbnail'),
									_1: {ctor: '[]'}
								}
							},
							{ctor: '[]'}),
						_1: {ctor: '[]'}
					}),
				_1: {
					ctor: '::',
					_0: A2(
						_elm_lang$html$Html$td,
						{ctor: '[]'},
						{
							ctor: '::',
							_0: _elm_lang$html$Html$text(_p9.artist),
							_1: {ctor: '[]'}
						}),
					_1: {
						ctor: '::',
						_0: _elm_lang$core$Native_Utils.eq(_p14, _p12) ? A2(
							_elm_lang$html$Html$td,
							{ctor: '[]'},
							{
								ctor: '::',
								_0: A2(
									_elm_lang$html$Html$a,
									{
										ctor: '::',
										_0: _elm_lang$html$Html_Events$onClick(
											_user$project$Gallery$ArtworkPage(_p10)),
										_1: {ctor: '[]'}
									},
									{
										ctor: '::',
										_0: _elm_lang$html$Html$text(_p13),
										_1: {ctor: '[]'}
									}),
								_1: {ctor: '[]'}
							}) : A2(
							_elm_lang$html$Html$td,
							{ctor: '[]'},
							{
								ctor: '::',
								_0: _elm_lang$html$Html$text(_p13),
								_1: {ctor: '[]'}
							}),
						_1: {
							ctor: '::',
							_0: A2(
								_elm_lang$html$Html$td,
								{ctor: '[]'},
								{
									ctor: '::',
									_0: _elm_lang$html$Html$text(_p9.year),
									_1: {ctor: '[]'}
								}),
							_1: {
								ctor: '::',
								_0: A2(
									_elm_lang$html$Html$td,
									{ctor: '[]'},
									{
										ctor: '::',
										_0: _elm_lang$html$Html$text(_p9.medium),
										_1: {ctor: '[]'}
									}),
								_1: {
									ctor: '::',
									_0: A2(
										_elm_lang$html$Html$td,
										{ctor: '[]'},
										{
											ctor: '::',
											_0: _elm_lang$html$Html$text(_p9.dimensions),
											_1: {ctor: '[]'}
										}),
									_1: {
										ctor: '::',
										_0: A2(
											_elm_lang$html$Html$td,
											{ctor: '[]'},
											{
												ctor: '::',
												_0: _elm_lang$html$Html$text(
													A2(_elm_lang$core$Basics_ops['++'], '$', _p9.price)),
												_1: {ctor: '[]'}
											}),
										_1: {ctor: '[]'}
									}
								}
							}
						}
					}
				}
			});
	};
	var _user$project$Gallery$galleryTableView = function (_p15) {
		var _p16 = _p15;
		return A2(
			_elm_lang$html$Html$table,
			{
				ctor: '::',
				_0: _elm_lang$html$Html_Attributes$class('table table-striped table--custom'),
				_1: {ctor: '[]'}
			},
			function (g) {
				return {
					ctor: '::',
					_0: _user$project$Gallery$galleryTableHeader,
					_1: {
						ctor: '::',
						_0: g,
						_1: {ctor: '[]'}
					}
				};
			}(
				A2(
					_elm_lang$html$Html$tbody,
					{
						ctor: '::',
						_0: _elm_lang$html$Html_Attributes$class('main--gallery--table'),
						_1: {ctor: '[]'}
					},
					A2(_elm_lang$core$List$map, _user$project$Gallery$paintingTableView, _p16.gallery))));
	};
	var _user$project$Gallery$view = function (model) {
		return model.isFetching ? A2(
			_elm_lang$html$Html$div,
			{
				ctor: '::',
				_0: _elm_lang$html$Html_Attributes$class('main'),
				_1: {ctor: '[]'}
			},
			{
				ctor: '::',
				_0: _user$project$Loading$loadingSvg,
				_1: {ctor: '[]'}
			}) : A2(
			_elm_lang$html$Html$div,
			{
				ctor: '::',
				_0: _elm_lang$html$Html_Attributes$class('main main--gallery'),
				_1: {ctor: '[]'}
			},
			{
				ctor: '::',
				_0: _user$project$Gallery$errorPanel(model.error),
				_1: {
					ctor: '::',
					_0: A2(
						_elm_lang$html$Html$div,
						{ctor: '[]'},
						{
							ctor: '::',
							_0: A2(
								_elm_lang$html$Html$span,
								{
									ctor: '::',
									_0: _elm_lang$html$Html_Attributes$class('glyphicon glyphicon-th-large glyphicon--custom-table'),
									_1: {
										ctor: '::',
										_0: _elm_lang$html$Html_Events$onClick(_user$project$Gallery$ListView),
										_1: {ctor: '[]'}
									}
								},
								{ctor: '[]'}),
							_1: {
								ctor: '::',
								_0: A2(
									_elm_lang$html$Html$span,
									{
										ctor: '::',
										_0: _elm_lang$html$Html_Attributes$class('glyphicon glyphicon-th-list glyphicon--custom-table'),
										_1: {
											ctor: '::',
											_0: _elm_lang$html$Html_Events$onClick(_user$project$Gallery$TableView),
											_1: {ctor: '[]'}
										}
									},
									{ctor: '[]'}),
								_1: {ctor: '[]'}
							}
						}),
					_1: {
						ctor: '::',
						_0: _user$project$Gallery$galleryHeader(model),
						_1: {
							ctor: '::',
							_0: model.listView ? _user$project$Gallery$galleryListView(model) : A2(
								_elm_lang$html$Html$div,
								{
									ctor: '::',
									_0: _elm_lang$html$Html_Attributes$class('container'),
									_1: {ctor: '[]'}
								},
								{
									ctor: '::',
									_0: A2(
										_elm_lang$html$Html$div,
										{
											ctor: '::',
											_0: _elm_lang$html$Html_Attributes$class('table-responsive'),
											_1: {ctor: '[]'}
										},
										{
											ctor: '::',
											_0: _user$project$Gallery$galleryTableView(model),
											_1: {ctor: '[]'}
										}),
									_1: {ctor: '[]'}
								}),
							_1: {ctor: '[]'}
						}
					}
				}
			});
	};
	var _user$project$Gallery$Error = function (a) {
		return {ctor: 'Error', _0: a};
	};
	
	var _user$project$Home$subscriptions = function (model) {
		return _elm_lang$core$Platform_Sub$none;
	};
	var _user$project$Home$update = F2(
		function (msg, model) {
			var _p0 = msg;
			return {
				ctor: '_Tuple2',
				_0: _elm_lang$core$Native_Utils.update(
					model,
					{
						error: _elm_lang$core$Maybe$Just('woops')
					}),
				_1: _elm_lang$navigation$Navigation$newUrl('#/signup')
			};
		});
	var _user$project$Home$initModel = {error: _elm_lang$core$Maybe$Nothing};
	var _user$project$Home$init = {ctor: '_Tuple2', _0: _user$project$Home$initModel, _1: _elm_lang$core$Platform_Cmd$none};
	var _user$project$Home$Model = function (a) {
		return {error: a};
	};
	var _user$project$Home$SignupPage = {ctor: 'SignupPage'};
	var _user$project$Home$view = function (model) {
		return A2(
			_elm_lang$html$Html$div,
			{
				ctor: '::',
				_0: _elm_lang$html$Html_Attributes$class('fluid-container'),
				_1: {ctor: '[]'}
			},
			{
				ctor: '::',
				_0: A2(
					_elm_lang$html$Html$div,
					{
						ctor: '::',
						_0: _elm_lang$html$Html_Attributes$class('jumbotron jumbo-bg'),
						_1: {ctor: '[]'}
					},
					{
						ctor: '::',
						_0: A2(
							_elm_lang$html$Html$div,
							{
								ctor: '::',
								_0: _elm_lang$html$Html_Attributes$class('container'),
								_1: {ctor: '[]'}
							},
							{
								ctor: '::',
								_0: A2(
									_elm_lang$html$Html$h1,
									{ctor: '[]'},
									{
										ctor: '::',
										_0: _elm_lang$html$Html$text('houseable'),
										_1: {ctor: '[]'}
									}),
								_1: {
									ctor: '::',
									_0: A2(
										_elm_lang$html$Html$p,
										{ctor: '[]'},
										{
											ctor: '::',
											_0: A2(
												_elm_lang$html$Html$em,
												{ctor: '[]'},
												{
													ctor: '::',
													_0: _elm_lang$html$Html$text('save, share and sell your art collection online'),
													_1: {ctor: '[]'}
												}),
											_1: {ctor: '[]'}
										}),
									_1: {
										ctor: '::',
										_0: A2(
											_elm_lang$html$Html$button,
											{
												ctor: '::',
												_0: _elm_lang$html$Html_Attributes$class('jumbotron__btn btn btn--white'),
												_1: {
													ctor: '::',
													_0: _elm_lang$html$Html_Events$onClick(_user$project$Home$SignupPage),
													_1: {ctor: '[]'}
												}
											},
											{
												ctor: '::',
												_0: _elm_lang$html$Html$text('sign up'),
												_1: {ctor: '[]'}
											}),
										_1: {ctor: '[]'}
									}
								}
							}),
						_1: {ctor: '[]'}
					}),
				_1: {ctor: '[]'}
			});
	};
	
	var _user$project$Login$errorPanel = function (error) {
		var _p0 = error;
		if (_p0.ctor === 'Nothing') {
			return _elm_lang$html$Html$text('');
		} else {
			return A2(
				_elm_lang$html$Html$div,
				{
					ctor: '::',
					_0: _elm_lang$html$Html_Attributes$class('error'),
					_1: {ctor: '[]'}
				},
				{
					ctor: '::',
					_0: _elm_lang$html$Html$text(_p0._0),
					_1: {ctor: '[]'}
				});
		}
	};
	var _user$project$Login$initModel = {email: '', password: '', error: _elm_lang$core$Maybe$Nothing};
	var _user$project$Login$init = {ctor: '_Tuple2', _0: _user$project$Login$initModel, _1: _elm_lang$core$Platform_Cmd$none};
	var _user$project$Login$fetchingUser = _elm_lang$core$Native_Platform.outgoingPort(
		'fetchingUser',
		function (v) {
			return v;
		});
	var _user$project$Login$update = F2(
		function (msg, model) {
			var _p1 = msg;
			switch (_p1.ctor) {
				case 'EmailInput':
					return {
						ctor: '_Tuple3',
						_0: _elm_lang$core$Native_Utils.update(
							model,
							{email: _p1._0}),
						_1: _elm_lang$core$Platform_Cmd$none,
						_2: _elm_lang$core$Maybe$Nothing
					};
				case 'PasswordInput':
					return {
						ctor: '_Tuple3',
						_0: _elm_lang$core$Native_Utils.update(
							model,
							{password: _p1._0}),
						_1: _elm_lang$core$Platform_Cmd$none,
						_2: _elm_lang$core$Maybe$Nothing
					};
				case 'Submit':
					var body = A2(
						_elm_lang$core$Json_Encode$encode,
						4,
						_elm_lang$core$Json_Encode$object(
							{
								ctor: '::',
								_0: {
									ctor: '_Tuple2',
									_0: 'email',
									_1: _elm_lang$core$Json_Encode$string(model.email)
								},
								_1: {
									ctor: '::',
									_0: {
										ctor: '_Tuple2',
										_0: 'password',
										_1: _elm_lang$core$Json_Encode$string(model.password)
									},
									_1: {ctor: '[]'}
								}
							}));
					var cmd = _user$project$Login$fetchingUser(body);
					return {ctor: '_Tuple3', _0: model, _1: cmd, _2: _elm_lang$core$Maybe$Nothing};
				case 'Error':
					return {
						ctor: '_Tuple3',
						_0: _elm_lang$core$Native_Utils.update(
							model,
							{
								error: _elm_lang$core$Maybe$Just(_p1._0)
							}),
						_1: _elm_lang$core$Platform_Cmd$none,
						_2: _elm_lang$core$Maybe$Nothing
					};
				default:
					return {
						ctor: '_Tuple3',
						_0: _elm_lang$core$Native_Utils.update(
							model,
							{email: '', password: ''}),
						_1: _elm_lang$navigation$Navigation$newUrl('#/gallery'),
						_2: _elm_lang$core$Maybe$Just(_p1._0)
					};
			}
		});
	var _user$project$Login$userLoggedIn = _elm_lang$core$Native_Platform.incomingPort('userLoggedIn', _elm_lang$core$Json_Decode$string);
	var _user$project$Login$Model = F3(
		function (a, b, c) {
			return {email: a, password: b, error: c};
		});
	var _user$project$Login$UserLoggedIn = function (a) {
		return {ctor: 'UserLoggedIn', _0: a};
	};
	var _user$project$Login$subscriptions = function (model) {
		return _elm_lang$core$Platform_Sub$batch(
			{
				ctor: '::',
				_0: _user$project$Login$userLoggedIn(_user$project$Login$UserLoggedIn),
				_1: {ctor: '[]'}
			});
	};
	var _user$project$Login$Error = function (a) {
		return {ctor: 'Error', _0: a};
	};
	var _user$project$Login$Submit = {ctor: 'Submit'};
	var _user$project$Login$PasswordInput = function (a) {
		return {ctor: 'PasswordInput', _0: a};
	};
	var _user$project$Login$EmailInput = function (a) {
		return {ctor: 'EmailInput', _0: a};
	};
	var _user$project$Login$loginForm = function (model) {
		return A2(
			_elm_lang$html$Html$div,
			{
				ctor: '::',
				_0: _elm_lang$html$Html_Attributes$class('row formRow login-signup'),
				_1: {ctor: '[]'}
			},
			{
				ctor: '::',
				_0: A2(
					_elm_lang$html$Html$div,
					{
						ctor: '::',
						_0: _elm_lang$html$Html_Attributes$class('col-md-6 col-md-offset-3'),
						_1: {ctor: '[]'}
					},
					{
						ctor: '::',
						_0: A2(
							_elm_lang$html$Html$form,
							{
								ctor: '::',
								_0: _elm_lang$html$Html_Attributes$class('formRow__form'),
								_1: {
									ctor: '::',
									_0: _elm_lang$html$Html_Events$onSubmit(_user$project$Login$Submit),
									_1: {ctor: '[]'}
								}
							},
							{
								ctor: '::',
								_0: A2(
									_elm_lang$html$Html$input,
									{
										ctor: '::',
										_0: _elm_lang$html$Html_Attributes$type_('email'),
										_1: {
											ctor: '::',
											_0: _elm_lang$html$Html_Attributes$class('formRow__input formRow__input--email'),
											_1: {
												ctor: '::',
												_0: _elm_lang$html$Html_Attributes$placeholder('email'),
												_1: {
													ctor: '::',
													_0: _elm_lang$html$Html_Attributes$value(model.email),
													_1: {
														ctor: '::',
														_0: _elm_lang$html$Html_Events$onInput(_user$project$Login$EmailInput),
														_1: {ctor: '[]'}
													}
												}
											}
										}
									},
									{ctor: '[]'}),
								_1: {
									ctor: '::',
									_0: A2(
										_elm_lang$html$Html$input,
										{
											ctor: '::',
											_0: _elm_lang$html$Html_Attributes$type_('password'),
											_1: {
												ctor: '::',
												_0: _elm_lang$html$Html_Attributes$class('formRow__input formRow__input--password'),
												_1: {
													ctor: '::',
													_0: _elm_lang$html$Html_Attributes$placeholder('password'),
													_1: {
														ctor: '::',
														_0: _elm_lang$html$Html_Attributes$value(model.password),
														_1: {
															ctor: '::',
															_0: _elm_lang$html$Html_Events$onInput(_user$project$Login$PasswordInput),
															_1: {ctor: '[]'}
														}
													}
												}
											}
										},
										{ctor: '[]'}),
									_1: {
										ctor: '::',
										_0: A2(
											_elm_lang$html$Html$div,
											{
												ctor: '::',
												_0: _elm_lang$html$Html_Attributes$class('form-group'),
												_1: {ctor: '[]'}
											},
											{
												ctor: '::',
												_0: A2(
													_elm_lang$html$Html$label,
													{ctor: '[]'},
													{ctor: '[]'}),
												_1: {
													ctor: '::',
													_0: A2(
														_elm_lang$html$Html$button,
														{
															ctor: '::',
															_0: _elm_lang$html$Html_Attributes$type_('submit'),
															_1: {
																ctor: '::',
																_0: _elm_lang$html$Html_Attributes$class('btn btn--white formRow--btn'),
																_1: {ctor: '[]'}
															}
														},
														{
															ctor: '::',
															_0: _elm_lang$html$Html$text('login'),
															_1: {ctor: '[]'}
														}),
													_1: {ctor: '[]'}
												}
											}),
										_1: {ctor: '[]'}
									}
								}
							}),
						_1: {ctor: '[]'}
					}),
				_1: {ctor: '[]'}
			});
	};
	var _user$project$Login$view = function (model) {
		return A2(
			_elm_lang$html$Html$div,
			{
				ctor: '::',
				_0: _elm_lang$html$Html_Attributes$class('main'),
				_1: {ctor: '[]'}
			},
			{
				ctor: '::',
				_0: _user$project$Login$errorPanel(model.error),
				_1: {
					ctor: '::',
					_0: _user$project$Login$loginForm(model),
					_1: {ctor: '[]'}
				}
			});
	};
	
	var _user$project$Signup$errorPanel = function (error) {
		var _p0 = error;
		if (_p0.ctor === 'Nothing') {
			return _elm_lang$html$Html$text('');
		} else {
			return A2(
				_elm_lang$html$Html$div,
				{
					ctor: '::',
					_0: _elm_lang$html$Html_Attributes$class('error'),
					_1: {ctor: '[]'}
				},
				{
					ctor: '::',
					_0: _elm_lang$html$Html$text(_p0._0),
					_1: {ctor: '[]'}
				});
		}
	};
	var _user$project$Signup$initModel = {username: '', password: '', email: '', error: _elm_lang$core$Maybe$Nothing};
	var _user$project$Signup$init = {ctor: '_Tuple2', _0: _user$project$Signup$initModel, _1: _elm_lang$core$Platform_Cmd$none};
	var _user$project$Signup$saveUser = _elm_lang$core$Native_Platform.outgoingPort(
		'saveUser',
		function (v) {
			return v;
		});
	var _user$project$Signup$update = F2(
		function (msg, model) {
			var _p1 = msg;
			switch (_p1.ctor) {
				case 'UsernameInput':
					return {
						ctor: '_Tuple3',
						_0: _elm_lang$core$Native_Utils.update(
							model,
							{username: _p1._0}),
						_1: _elm_lang$core$Platform_Cmd$none,
						_2: _elm_lang$core$Maybe$Nothing
					};
				case 'EmailInput':
					return {
						ctor: '_Tuple3',
						_0: _elm_lang$core$Native_Utils.update(
							model,
							{email: _p1._0}),
						_1: _elm_lang$core$Platform_Cmd$none,
						_2: _elm_lang$core$Maybe$Nothing
					};
				case 'PasswordInput':
					return {
						ctor: '_Tuple3',
						_0: _elm_lang$core$Native_Utils.update(
							model,
							{password: _p1._0}),
						_1: _elm_lang$core$Platform_Cmd$none,
						_2: _elm_lang$core$Maybe$Nothing
					};
				case 'Submit':
					var body = A2(
						_elm_lang$core$Json_Encode$encode,
						4,
						_elm_lang$core$Json_Encode$object(
							{
								ctor: '::',
								_0: {
									ctor: '_Tuple2',
									_0: 'username',
									_1: _elm_lang$core$Json_Encode$string(model.username)
								},
								_1: {
									ctor: '::',
									_0: {
										ctor: '_Tuple2',
										_0: 'email',
										_1: _elm_lang$core$Json_Encode$string(model.email)
									},
									_1: {
										ctor: '::',
										_0: {
											ctor: '_Tuple2',
											_0: 'password',
											_1: _elm_lang$core$Json_Encode$string(model.password)
										},
										_1: {ctor: '[]'}
									}
								}
							}));
					var cmd = _user$project$Signup$saveUser(body);
					return {ctor: '_Tuple3', _0: model, _1: cmd, _2: _elm_lang$core$Maybe$Nothing};
				case 'Error':
					return {
						ctor: '_Tuple3',
						_0: _elm_lang$core$Native_Utils.update(
							model,
							{
								error: _elm_lang$core$Maybe$Just(_p1._0)
							}),
						_1: _elm_lang$core$Platform_Cmd$none,
						_2: _elm_lang$core$Maybe$Nothing
					};
				default:
					return {
						ctor: '_Tuple3',
						_0: _elm_lang$core$Native_Utils.update(
							model,
							{username: '', email: '', password: ''}),
						_1: _elm_lang$navigation$Navigation$newUrl('#/gallery'),
						_2: _elm_lang$core$Maybe$Just(_p1._0)
					};
			}
		});
	var _user$project$Signup$userSaved = _elm_lang$core$Native_Platform.incomingPort('userSaved', _elm_lang$core$Json_Decode$string);
	var _user$project$Signup$Model = F4(
		function (a, b, c, d) {
			return {username: a, email: b, password: c, error: d};
		});
	var _user$project$Signup$UserSaved = function (a) {
		return {ctor: 'UserSaved', _0: a};
	};
	var _user$project$Signup$subscriptions = function (model) {
		return _elm_lang$core$Platform_Sub$batch(
			{
				ctor: '::',
				_0: _user$project$Signup$userSaved(_user$project$Signup$UserSaved),
				_1: {ctor: '[]'}
			});
	};
	var _user$project$Signup$Error = function (a) {
		return {ctor: 'Error', _0: a};
	};
	var _user$project$Signup$Submit = {ctor: 'Submit'};
	var _user$project$Signup$PasswordInput = function (a) {
		return {ctor: 'PasswordInput', _0: a};
	};
	var _user$project$Signup$EmailInput = function (a) {
		return {ctor: 'EmailInput', _0: a};
	};
	var _user$project$Signup$UsernameInput = function (a) {
		return {ctor: 'UsernameInput', _0: a};
	};
	var _user$project$Signup$signupForm = function (model) {
		return A2(
			_elm_lang$html$Html$div,
			{
				ctor: '::',
				_0: _elm_lang$html$Html_Attributes$class('row formRow login-signup'),
				_1: {ctor: '[]'}
			},
			{
				ctor: '::',
				_0: A2(
					_elm_lang$html$Html$div,
					{
						ctor: '::',
						_0: _elm_lang$html$Html_Attributes$class('col-md-6 col-md-offset-3'),
						_1: {ctor: '[]'}
					},
					{
						ctor: '::',
						_0: A2(
							_elm_lang$html$Html$form,
							{
								ctor: '::',
								_0: _elm_lang$html$Html_Attributes$class('formRow__form'),
								_1: {
									ctor: '::',
									_0: _elm_lang$html$Html_Events$onSubmit(_user$project$Signup$Submit),
									_1: {ctor: '[]'}
								}
							},
							{
								ctor: '::',
								_0: A2(
									_elm_lang$html$Html$input,
									{
										ctor: '::',
										_0: _elm_lang$html$Html_Attributes$type_('text'),
										_1: {
											ctor: '::',
											_0: _elm_lang$html$Html_Attributes$class('formRow__input formRow__input--username'),
											_1: {
												ctor: '::',
												_0: _elm_lang$html$Html_Attributes$placeholder('username'),
												_1: {
													ctor: '::',
													_0: _elm_lang$html$Html_Attributes$value(model.username),
													_1: {
														ctor: '::',
														_0: _elm_lang$html$Html_Events$onInput(_user$project$Signup$UsernameInput),
														_1: {ctor: '[]'}
													}
												}
											}
										}
									},
									{ctor: '[]'}),
								_1: {
									ctor: '::',
									_0: A2(
										_elm_lang$html$Html$input,
										{
											ctor: '::',
											_0: _elm_lang$html$Html_Attributes$type_('email'),
											_1: {
												ctor: '::',
												_0: _elm_lang$html$Html_Attributes$class('formRow__input formRow__input--email'),
												_1: {
													ctor: '::',
													_0: _elm_lang$html$Html_Attributes$placeholder('email'),
													_1: {
														ctor: '::',
														_0: _elm_lang$html$Html_Attributes$value(model.email),
														_1: {
															ctor: '::',
															_0: _elm_lang$html$Html_Events$onInput(_user$project$Signup$EmailInput),
															_1: {ctor: '[]'}
														}
													}
												}
											}
										},
										{ctor: '[]'}),
									_1: {
										ctor: '::',
										_0: A2(
											_elm_lang$html$Html$input,
											{
												ctor: '::',
												_0: _elm_lang$html$Html_Attributes$type_('password'),
												_1: {
													ctor: '::',
													_0: _elm_lang$html$Html_Attributes$class('formRow__input formRow__input--password'),
													_1: {
														ctor: '::',
														_0: _elm_lang$html$Html_Attributes$placeholder('password'),
														_1: {
															ctor: '::',
															_0: _elm_lang$html$Html_Attributes$value(model.password),
															_1: {
																ctor: '::',
																_0: _elm_lang$html$Html_Events$onInput(_user$project$Signup$PasswordInput),
																_1: {ctor: '[]'}
															}
														}
													}
												}
											},
											{ctor: '[]'}),
										_1: {
											ctor: '::',
											_0: A2(
												_elm_lang$html$Html$div,
												{
													ctor: '::',
													_0: _elm_lang$html$Html_Attributes$class('form-group'),
													_1: {ctor: '[]'}
												},
												{
													ctor: '::',
													_0: A2(
														_elm_lang$html$Html$label,
														{ctor: '[]'},
														{ctor: '[]'}),
													_1: {
														ctor: '::',
														_0: A2(
															_elm_lang$html$Html$button,
															{
																ctor: '::',
																_0: _elm_lang$html$Html_Attributes$type_('submit'),
																_1: {
																	ctor: '::',
																	_0: _elm_lang$html$Html_Attributes$class('btn btn--white formRow--btn'),
																	_1: {ctor: '[]'}
																}
															},
															{
																ctor: '::',
																_0: _elm_lang$html$Html$text('signup'),
																_1: {ctor: '[]'}
															}),
														_1: {ctor: '[]'}
													}
												}),
											_1: {ctor: '[]'}
										}
									}
								}
							}),
						_1: {ctor: '[]'}
					}),
				_1: {ctor: '[]'}
			});
	};
	var _user$project$Signup$view = function (model) {
		return A2(
			_elm_lang$html$Html$div,
			{
				ctor: '::',
				_0: _elm_lang$html$Html_Attributes$class('main'),
				_1: {ctor: '[]'}
			},
			{
				ctor: '::',
				_0: _user$project$Signup$errorPanel(model.error),
				_1: {
					ctor: '::',
					_0: _user$project$Signup$signupForm(model),
					_1: {ctor: '[]'}
				}
			});
	};
	
	var _user$project$Main$decoder = F2(
		function (jsonToDecode, jsonKey) {
			return A2(
				_elm_lang$core$Json_Decode$decodeString,
				A2(_elm_lang$core$Json_Decode$field, jsonKey, _elm_lang$core$Json_Decode$string),
				jsonToDecode);
		});
	var _user$project$Main$pageToHash = function (page) {
		var _p0 = page;
		switch (_p0.ctor) {
			case 'HomePage':
				return '#/';
			case 'SignupPage':
				return '#/signup';
			case 'GalleryPage':
				return '#/gallery';
			case 'LoginPage':
				return '#/login';
			case 'AddArtworkPage':
				return '#/addArtwork';
			case 'ArtworkPage':
				return '#/artwork';
			default:
				return '#notFound';
		}
	};
	var _user$project$Main$fromJust = function (just) {
		var _p1 = just;
		if (_p1.ctor === 'Nothing') {
			return 'there was nothing in that maybe';
		} else {
			return _p1._0;
		}
	};
	var _user$project$Main$logout = _elm_lang$core$Native_Platform.outgoingPort(
		'logout',
		function (v) {
			return null;
		});
	var _user$project$Main$fetchingUsers = _elm_lang$core$Native_Platform.outgoingPort(
		'fetchingUsers',
		function (v) {
			return v;
		});
	var _user$project$Main$noUserFetched = _elm_lang$core$Native_Platform.incomingPort('noUserFetched', _elm_lang$core$Json_Decode$string);
	var _user$project$Main$userFetched = _elm_lang$core$Native_Platform.incomingPort('userFetched', _elm_lang$core$Json_Decode$string);
	var _user$project$Main$fetchingSearchUserGallery = _elm_lang$core$Native_Platform.outgoingPort(
		'fetchingSearchUserGallery',
		function (v) {
			return v;
		});
	var _user$project$Main$Model = function (a) {
		return function (b) {
			return function (c) {
				return function (d) {
					return function (e) {
						return function (f) {
							return function (g) {
								return function (h) {
									return function (i) {
										return function (j) {
											return function (k) {
												return function (l) {
													return function (m) {
														return function (n) {
															return {page: a, home: b, signup: c, gallery: d, login: e, addArtwork: f, artwork: g, fbLoggedIn: h, uid: i, loggedIn: j, searchDisplay: k, search: l, searchContent: m, searchError: n};
														};
													};
												};
											};
										};
									};
								};
							};
						};
					};
				};
			};
		};
	};
	var _user$project$Main$UserLink = F2(
		function (a, b) {
			return {displayName: a, userId: b};
		});
	var _user$project$Main$decodeUser = A3(
		_NoRedInk$elm_decode_pipeline$Json_Decode_Pipeline$required,
		'userId',
		_elm_lang$core$Json_Decode$string,
		A3(
			_NoRedInk$elm_decode_pipeline$Json_Decode_Pipeline$required,
			'displayName',
			_elm_lang$core$Json_Decode$string,
			_NoRedInk$elm_decode_pipeline$Json_Decode_Pipeline$decode(_user$project$Main$UserLink)));
	var _user$project$Main$decodeJson = F2(
		function (stringifiedUser, model) {
			var _p2 = A2(_elm_lang$core$Json_Decode$decodeString, _user$project$Main$decodeUser, stringifiedUser);
			if (_p2.ctor === 'Ok') {
				var _p3 = _p2._0;
				return {
					ctor: '_Tuple2',
					_0: _elm_lang$core$Native_Utils.update(
						model,
						{
							searchContent: _elm_lang$core$Native_Utils.update(
								_p3,
								{displayName: _p3.displayName}),
							searchContent: _elm_lang$core$Native_Utils.update(
								_p3,
								{userId: _p3.userId})
						}),
					_1: _elm_lang$core$Platform_Cmd$none
				};
			} else {
				return {
					ctor: '_Tuple2',
					_0: _elm_lang$core$Native_Utils.update(
						model,
						{
							searchError: _elm_lang$core$Maybe$Just(_p2._0)
						}),
					_1: _elm_lang$core$Platform_Cmd$none
				};
			}
		});
	var _user$project$Main$Flags = function (a) {
		return {fbLoggedIn: a};
	};
	var _user$project$Main$ArtworkPage = {ctor: 'ArtworkPage'};
	var _user$project$Main$AddArtworkPage = {ctor: 'AddArtworkPage'};
	var _user$project$Main$authPages = {
		ctor: '::',
		_0: _user$project$Main$AddArtworkPage,
		_1: {
			ctor: '::',
			_0: _user$project$Main$ArtworkPage,
			_1: {ctor: '[]'}
		}
	};
	var _user$project$Main$authForPage = F2(
		function (page, loggedIn) {
			return loggedIn || (!A2(_elm_lang$core$List$member, page, _user$project$Main$authPages));
		});
	var _user$project$Main$LoginPage = {ctor: 'LoginPage'};
	var _user$project$Main$authedRedirect = F2(
		function (page, loggedIn) {
			return A2(_user$project$Main$authForPage, page, loggedIn) ? {ctor: '_Tuple2', _0: page, _1: _elm_lang$core$Platform_Cmd$none} : {
				ctor: '_Tuple2',
				_0: _user$project$Main$LoginPage,
				_1: _elm_lang$navigation$Navigation$modifyUrl(
					_user$project$Main$pageToHash(_user$project$Main$LoginPage))
			};
		});
	var _user$project$Main$GalleryPage = {ctor: 'GalleryPage'};
	var _user$project$Main$SignupPage = {ctor: 'SignupPage'};
	var _user$project$Main$HomePage = {ctor: 'HomePage'};
	var _user$project$Main$NotFound = {ctor: 'NotFound'};
	var _user$project$Main$hashToPage = function (hash) {
		var _p4 = hash;
		switch (_p4) {
			case '#/':
				return _user$project$Main$HomePage;
			case '':
				return _user$project$Main$HomePage;
			case '#/signup':
				return _user$project$Main$SignupPage;
			case '#/gallery':
				return _user$project$Main$GalleryPage;
			case '#/login':
				return _user$project$Main$LoginPage;
			case '#/addArtwork':
				return _user$project$Main$AddArtworkPage;
			case '#/artwork':
				return _user$project$Main$ArtworkPage;
			default:
				return _user$project$Main$NotFound;
		}
	};
	var _user$project$Main$FetchLoggedInUserGallery = {ctor: 'FetchLoggedInUserGallery'};
	var _user$project$Main$FetchSearchUserGallery = {ctor: 'FetchSearchUserGallery'};
	var _user$project$Main$UserFetched = function (a) {
		return {ctor: 'UserFetched', _0: a};
	};
	var _user$project$Main$NoUserFetched = function (a) {
		return {ctor: 'NoUserFetched', _0: a};
	};
	var _user$project$Main$SearchInput = function (a) {
		return {ctor: 'SearchInput', _0: a};
	};
	var _user$project$Main$SearchHide = {ctor: 'SearchHide'};
	var _user$project$Main$SearchDisplay = {ctor: 'SearchDisplay'};
	var _user$project$Main$searchResults = function (model) {
		return A2(
			_elm_lang$html$Html$div,
			{
				ctor: '::',
				_0: _elm_lang$html$Html_Attributes$class('search-results'),
				_1: {ctor: '[]'}
			},
			{
				ctor: '::',
				_0: model.loggedIn ? A2(
					_elm_lang$html$Html$div,
					{
						ctor: '::',
						_0: _elm_lang$html$Html_Attributes$class('search-results__search-header'),
						_1: {ctor: '[]'}
					},
					{
						ctor: '::',
						_0: A2(
							_elm_lang$html$Html$p,
							{
								ctor: '::',
								_0: _elm_lang$html$Html_Attributes$class('search-results__search-header__close-search'),
								_1: {
									ctor: '::',
									_0: _elm_lang$html$Html_Events$onClick(_user$project$Main$FetchLoggedInUserGallery),
									_1: {ctor: '[]'}
								}
							},
							{
								ctor: '::',
								_0: _elm_lang$html$Html$text('Return to my Gallery'),
								_1: {ctor: '[]'}
							}),
						_1: {ctor: '[]'}
					}) : A2(
					_elm_lang$html$Html$div,
					{
						ctor: '::',
						_0: _elm_lang$html$Html_Attributes$class('search-results__search-header'),
						_1: {ctor: '[]'}
					},
					{
						ctor: '::',
						_0: A2(
							_elm_lang$html$Html$p,
							{
								ctor: '::',
								_0: _elm_lang$html$Html_Attributes$class('search-results__search-header__close-search'),
								_1: {
									ctor: '::',
									_0: _elm_lang$html$Html_Events$onClick(_user$project$Main$SearchHide),
									_1: {ctor: '[]'}
								}
							},
							{
								ctor: '::',
								_0: _elm_lang$html$Html$text('Close'),
								_1: {ctor: '[]'}
							}),
						_1: {ctor: '[]'}
					}),
				_1: {
					ctor: '::',
					_0: A2(
						_elm_lang$html$Html$input,
						{
							ctor: '::',
							_0: _elm_lang$html$Html_Attributes$type_('text'),
							_1: {
								ctor: '::',
								_0: _elm_lang$html$Html_Attributes$class('formRow__input formRow__input--search'),
								_1: {
									ctor: '::',
									_0: _elm_lang$html$Html_Attributes$placeholder('search for users'),
									_1: {
										ctor: '::',
										_0: _elm_lang$html$Html_Events$onFocus(_user$project$Main$SearchDisplay),
										_1: {
											ctor: '::',
											_0: _elm_lang$html$Html_Attributes$value(model.search),
											_1: {
												ctor: '::',
												_0: _elm_lang$html$Html_Events$onInput(_user$project$Main$SearchInput),
												_1: {ctor: '[]'}
											}
										}
									}
								}
							}
						},
						{ctor: '[]'}),
					_1: {
						ctor: '::',
						_0: _elm_lang$core$Native_Utils.eq(model.searchContent.userId, '') ? A2(
							_elm_lang$html$Html$p,
							{
								ctor: '::',
								_0: _elm_lang$html$Html_Attributes$class('search-results__search-header__search-content'),
								_1: {ctor: '[]'}
							},
							{
								ctor: '::',
								_0: _elm_lang$html$Html$text(model.searchContent.displayName),
								_1: {ctor: '[]'}
							}) : A2(
							_elm_lang$html$Html$p,
							{
								ctor: '::',
								_0: _elm_lang$html$Html_Attributes$class('search-results__search-header__search-content'),
								_1: {
									ctor: '::',
									_0: _elm_lang$html$Html_Events$onClick(_user$project$Main$FetchSearchUserGallery),
									_1: {ctor: '[]'}
								}
							},
							{
								ctor: '::',
								_0: A2(
									_elm_lang$html$Html$a,
									{
										ctor: '::',
										_0: _elm_lang$html$Html_Attributes$class('search-results__search-header__search-content__a'),
										_1: {
											ctor: '::',
											_0: _elm_lang$html$Html_Attributes$href('#/gallery'),
											_1: {ctor: '[]'}
										}
									},
									{
										ctor: '::',
										_0: _elm_lang$html$Html$text(model.searchContent.displayName),
										_1: {ctor: '[]'}
									}),
								_1: {ctor: '[]'}
							}),
						_1: {ctor: '[]'}
					}
				}
			});
	};
	var _user$project$Main$Logout = {ctor: 'Logout'};
	var _user$project$Main$ArtworkMsg = function (a) {
		return {ctor: 'ArtworkMsg', _0: a};
	};
	var _user$project$Main$AddArtworkMsg = function (a) {
		return {ctor: 'AddArtworkMsg', _0: a};
	};
	var _user$project$Main$LoginMsg = function (a) {
		return {ctor: 'LoginMsg', _0: a};
	};
	var _user$project$Main$GalleryMsg = function (a) {
		return {ctor: 'GalleryMsg', _0: a};
	};
	var _user$project$Main$SignupMsg = function (a) {
		return {ctor: 'SignupMsg', _0: a};
	};
	var _user$project$Main$HomeMsg = function (a) {
		return {ctor: 'HomeMsg', _0: a};
	};
	var _user$project$Main$init = F2(
		function (flags, location) {
			var initSearchContent = {displayName: '', userId: ''};
			var _p5 = _user$project$Artwork$init;
			var artworkInitModel = _p5._0;
			var artworkCmd = _p5._1;
			var _p6 = _user$project$AddArtwork$init;
			var addArtworkInitModel = _p6._0;
			var addArtworkCmd = _p6._1;
			var _p7 = _user$project$Login$init;
			var loginInitModel = _p7._0;
			var loginCmd = _p7._1;
			var _p8 = _user$project$Gallery$init;
			var galleryInitModel = _p8._0;
			var galleryCmd = _p8._1;
			var _p9 = _user$project$Signup$init;
			var signupInitModel = _p9._0;
			var signupCmd = _p9._1;
			var _p10 = _user$project$Home$init;
			var homeInitModel = _p10._0;
			var homeCmd = _p10._1;
			var loggedIn = !_elm_lang$core$Native_Utils.eq(flags.fbLoggedIn, _elm_lang$core$Maybe$Nothing);
			var page = _user$project$Main$hashToPage(location.hash);
			var _p11 = A2(_user$project$Main$authedRedirect, page, loggedIn);
			var updatedPage = _p11._0;
			var cmd = _p11._1;
			var initModel = {page: updatedPage, home: homeInitModel, signup: signupInitModel, gallery: galleryInitModel, login: loginInitModel, addArtwork: addArtworkInitModel, artwork: artworkInitModel, fbLoggedIn: flags.fbLoggedIn, uid: _elm_lang$core$Maybe$Nothing, loggedIn: loggedIn, searchDisplay: false, search: '', searchContent: initSearchContent, searchError: _elm_lang$core$Maybe$Nothing};
			var cmds = _elm_lang$core$Platform_Cmd$batch(
				{
					ctor: '::',
					_0: A2(_elm_lang$core$Platform_Cmd$map, _user$project$Main$HomeMsg, homeCmd),
					_1: {
						ctor: '::',
						_0: A2(_elm_lang$core$Platform_Cmd$map, _user$project$Main$SignupMsg, signupCmd),
						_1: {
							ctor: '::',
							_0: A2(_elm_lang$core$Platform_Cmd$map, _user$project$Main$GalleryMsg, galleryCmd),
							_1: {
								ctor: '::',
								_0: A2(_elm_lang$core$Platform_Cmd$map, _user$project$Main$LoginMsg, loginCmd),
								_1: {
									ctor: '::',
									_0: A2(_elm_lang$core$Platform_Cmd$map, _user$project$Main$AddArtworkMsg, addArtworkCmd),
									_1: {
										ctor: '::',
										_0: A2(_elm_lang$core$Platform_Cmd$map, _user$project$Main$ArtworkMsg, artworkCmd),
										_1: {
											ctor: '::',
											_0: cmd,
											_1: {ctor: '[]'}
										}
									}
								}
							}
						}
					}
				});
			return {ctor: '_Tuple2', _0: initModel, _1: cmds};
		});
	var _user$project$Main$update = F2(
		function (msg, model) {
			var _p12 = msg;
			switch (_p12.ctor) {
				case 'Navigate':
					var _p13 = _p12._0;
					return {
						ctor: '_Tuple2',
						_0: _elm_lang$core$Native_Utils.update(
							model,
							{page: _p13}),
						_1: _elm_lang$navigation$Navigation$newUrl(
							_user$project$Main$pageToHash(_p13))
					};
				case 'ChangePage':
					var _p14 = A2(_user$project$Main$authedRedirect, _p12._0, model.loggedIn);
					var updatedPage = _p14._0;
					var cmd = _p14._1;
					return {
						ctor: '_Tuple2',
						_0: _elm_lang$core$Native_Utils.update(
							model,
							{page: updatedPage}),
						_1: cmd
					};
				case 'HomeMsg':
					var _p15 = A2(_user$project$Home$update, _p12._0, model.home);
					var homeModel = _p15._0;
					var cmd = _p15._1;
					return {
						ctor: '_Tuple2',
						_0: _elm_lang$core$Native_Utils.update(
							model,
							{home: homeModel}),
						_1: A2(_elm_lang$core$Platform_Cmd$map, _user$project$Main$HomeMsg, cmd)
					};
				case 'SignupMsg':
					var _p16 = A2(_user$project$Signup$update, _p12._0, model.signup);
					var signupModel = _p16._0;
					var cmd = _p16._1;
					var fbData = _p16._2;
					var loggedIn = !_elm_lang$core$Native_Utils.eq(fbData, _elm_lang$core$Maybe$Nothing);
					var uidDecoded = function () {
						var _p17 = fbData;
						if (_p17.ctor === 'Just') {
							var _p18 = A2(_user$project$Main$decoder, _p17._0, 'uid');
							if (_p18.ctor === 'Ok') {
								return _elm_lang$core$Maybe$Just(_p18._0);
							} else {
								return _elm_lang$core$Maybe$Just('uid error');
							}
						} else {
							return _elm_lang$core$Maybe$Just('no uid');
						}
					}();
					var fbLoggedInDecoded = function () {
						var _p19 = fbData;
						if (_p19.ctor === 'Just') {
							var _p20 = A2(_user$project$Main$decoder, _p19._0, 'fbLoggedIn');
							if (_p20.ctor === 'Ok') {
								return _elm_lang$core$Maybe$Just(_p20._0);
							} else {
								return _elm_lang$core$Maybe$Just('fbLoggedIn error');
							}
						} else {
							return _elm_lang$core$Maybe$Just('no fbLoggedIn');
						}
					}();
					return {
						ctor: '_Tuple2',
						_0: _elm_lang$core$Native_Utils.update(
							model,
							{signup: signupModel, fbLoggedIn: fbLoggedInDecoded, uid: uidDecoded, loggedIn: loggedIn}),
						_1: _elm_lang$core$Platform_Cmd$batch(
							{
								ctor: '::',
								_0: A2(_elm_lang$core$Platform_Cmd$map, _user$project$Main$SignupMsg, cmd),
								_1: {ctor: '[]'}
							})
					};
				case 'GalleryMsg':
					var _p21 = A2(_user$project$Gallery$update, _p12._0, model.gallery);
					var galleryModel = _p21._0;
					var cmd = _p21._1;
					return {
						ctor: '_Tuple2',
						_0: _elm_lang$core$Native_Utils.update(
							model,
							{gallery: galleryModel}),
						_1: A2(_elm_lang$core$Platform_Cmd$map, _user$project$Main$GalleryMsg, cmd)
					};
				case 'LoginMsg':
					var _p22 = A2(_user$project$Login$update, _p12._0, model.login);
					var loginModel = _p22._0;
					var cmd = _p22._1;
					var fbData = _p22._2;
					var loggedIn = !_elm_lang$core$Native_Utils.eq(fbData, _elm_lang$core$Maybe$Nothing);
					var uidDecoded = function () {
						var _p23 = fbData;
						if (_p23.ctor === 'Just') {
							var _p24 = A2(_user$project$Main$decoder, _p23._0, 'uid');
							if (_p24.ctor === 'Ok') {
								return _elm_lang$core$Maybe$Just(_p24._0);
							} else {
								return _elm_lang$core$Maybe$Just('uid error');
							}
						} else {
							return _elm_lang$core$Maybe$Just('no uid');
						}
					}();
					var fbLoggedInDecoded = function () {
						var _p25 = fbData;
						if (_p25.ctor === 'Just') {
							var _p26 = A2(_user$project$Main$decoder, _p25._0, 'fbLoggedIn');
							if (_p26.ctor === 'Ok') {
								return _elm_lang$core$Maybe$Just(_p26._0);
							} else {
								return _elm_lang$core$Maybe$Just('fbLoggedIn error');
							}
						} else {
							return _elm_lang$core$Maybe$Just('no fbLoggedIn');
						}
					}();
					return {
						ctor: '_Tuple2',
						_0: _elm_lang$core$Native_Utils.update(
							model,
							{login: loginModel, fbLoggedIn: fbLoggedInDecoded, uid: uidDecoded, loggedIn: loggedIn}),
						_1: _elm_lang$core$Platform_Cmd$batch(
							{
								ctor: '::',
								_0: A2(_elm_lang$core$Platform_Cmd$map, _user$project$Main$LoginMsg, cmd),
								_1: {ctor: '[]'}
							})
					};
				case 'AddArtworkMsg':
					var _p27 = A3(
						_user$project$AddArtwork$update,
						A2(_elm_lang$core$Maybe$withDefault, '', model.uid),
						_p12._0,
						model.addArtwork);
					var addArtworkModel = _p27._0;
					var cmd = _p27._1;
					return {
						ctor: '_Tuple2',
						_0: _elm_lang$core$Native_Utils.update(
							model,
							{addArtwork: addArtworkModel}),
						_1: A2(_elm_lang$core$Platform_Cmd$map, _user$project$Main$AddArtworkMsg, cmd)
					};
				case 'ArtworkMsg':
					var _p28 = A3(
						_user$project$Artwork$update,
						A2(_elm_lang$core$Maybe$withDefault, '', model.uid),
						_p12._0,
						model.artwork);
					var artworkModel = _p28._0;
					var cmd = _p28._1;
					return {
						ctor: '_Tuple2',
						_0: _elm_lang$core$Native_Utils.update(
							model,
							{artwork: artworkModel}),
						_1: A2(_elm_lang$core$Platform_Cmd$map, _user$project$Main$ArtworkMsg, cmd)
					};
				case 'Logout':
					return {
						ctor: '_Tuple2',
						_0: _elm_lang$core$Native_Utils.update(
							model,
							{fbLoggedIn: _elm_lang$core$Maybe$Nothing, uid: _elm_lang$core$Maybe$Nothing, loggedIn: false}),
						_1: _elm_lang$core$Platform_Cmd$batch(
							{
								ctor: '::',
								_0: _user$project$Main$logout(
									{ctor: '_Tuple0'}),
								_1: {
									ctor: '::',
									_0: _elm_lang$navigation$Navigation$newUrl('#/login'),
									_1: {ctor: '[]'}
								}
							})
					};
				case 'SearchDisplay':
					return {
						ctor: '_Tuple2',
						_0: _elm_lang$core$Native_Utils.update(
							model,
							{searchDisplay: true}),
						_1: _elm_lang$core$Platform_Cmd$none
					};
				case 'SearchHide':
					return {
						ctor: '_Tuple2',
						_0: _elm_lang$core$Native_Utils.update(
							model,
							{searchDisplay: false}),
						_1: _elm_lang$core$Platform_Cmd$none
					};
				case 'SearchInput':
					var _p29 = _p12._0;
					return {
						ctor: '_Tuple2',
						_0: _elm_lang$core$Native_Utils.update(
							model,
							{search: _p29}),
						_1: _user$project$Main$fetchingUsers(_p29)
					};
				case 'NoUserFetched':
					return A2(_user$project$Main$decodeJson, _p12._0, model);
				case 'UserFetched':
					return A2(_user$project$Main$decodeJson, _p12._0, model);
				case 'FetchSearchUserGallery':
					var body = A2(
						_elm_lang$core$Json_Encode$encode,
						4,
						_elm_lang$core$Json_Encode$object(
							{
								ctor: '::',
								_0: {
									ctor: '_Tuple2',
									_0: 'userId',
									_1: _elm_lang$core$Json_Encode$string(
										_user$project$Main$fromJust(model.uid))
								},
								_1: {
									ctor: '::',
									_0: {
										ctor: '_Tuple2',
										_0: 'searchId',
										_1: _elm_lang$core$Json_Encode$string(model.searchContent.userId)
									},
									_1: {ctor: '[]'}
								}
							}));
					return {
						ctor: '_Tuple2',
						_0: model,
						_1: _user$project$Main$fetchingSearchUserGallery(body)
					};
				default:
					var body = A2(
						_elm_lang$core$Json_Encode$encode,
						4,
						_elm_lang$core$Json_Encode$object(
							{
								ctor: '::',
								_0: {
									ctor: '_Tuple2',
									_0: 'userId',
									_1: _elm_lang$core$Json_Encode$string(
										_user$project$Main$fromJust(model.uid))
								},
								_1: {
									ctor: '::',
									_0: {
										ctor: '_Tuple2',
										_0: 'searchId',
										_1: _elm_lang$core$Json_Encode$string(
											_user$project$Main$fromJust(model.uid))
									},
									_1: {ctor: '[]'}
								}
							}));
					return {
						ctor: '_Tuple2',
						_0: _elm_lang$core$Native_Utils.update(
							model,
							{searchDisplay: false}),
						_1: _user$project$Main$fetchingSearchUserGallery(body)
					};
			}
		});
	var _user$project$Main$subscriptions = function (model) {
		var artworkSub = _user$project$Artwork$subscriptions(model.artwork);
		var addArtworkSub = _user$project$AddArtwork$subscriptions(model.addArtwork);
		var loginSub = _user$project$Login$subscriptions(model.login);
		var gallerySub = _user$project$Gallery$subscriptions(model.gallery);
		var signupSub = _user$project$Signup$subscriptions(model.signup);
		var homeSub = _user$project$Home$subscriptions(model.home);
		return _elm_lang$core$Platform_Sub$batch(
			{
				ctor: '::',
				_0: A2(_elm_lang$core$Platform_Sub$map, _user$project$Main$HomeMsg, homeSub),
				_1: {
					ctor: '::',
					_0: A2(_elm_lang$core$Platform_Sub$map, _user$project$Main$SignupMsg, signupSub),
					_1: {
						ctor: '::',
						_0: A2(_elm_lang$core$Platform_Sub$map, _user$project$Main$GalleryMsg, gallerySub),
						_1: {
							ctor: '::',
							_0: A2(_elm_lang$core$Platform_Sub$map, _user$project$Main$LoginMsg, loginSub),
							_1: {
								ctor: '::',
								_0: A2(_elm_lang$core$Platform_Sub$map, _user$project$Main$AddArtworkMsg, addArtworkSub),
								_1: {
									ctor: '::',
									_0: A2(_elm_lang$core$Platform_Sub$map, _user$project$Main$ArtworkMsg, artworkSub),
									_1: {
										ctor: '::',
										_0: _user$project$Main$noUserFetched(_user$project$Main$NoUserFetched),
										_1: {
											ctor: '::',
											_0: _user$project$Main$userFetched(_user$project$Main$UserFetched),
											_1: {ctor: '[]'}
										}
									}
								}
							}
						}
					}
				}
			});
	};
	var _user$project$Main$ChangePage = function (a) {
		return {ctor: 'ChangePage', _0: a};
	};
	var _user$project$Main$locationToMsg = function (location) {
		return _user$project$Main$ChangePage(
			_user$project$Main$hashToPage(location.hash));
	};
	var _user$project$Main$Navigate = function (a) {
		return {ctor: 'Navigate', _0: a};
	};
	var _user$project$Main$pageHeader = function (model) {
		return model.loggedIn ? A2(
			_elm_lang$html$Html$header,
			{
				ctor: '::',
				_0: _elm_lang$html$Html_Attributes$class('container-fluid'),
				_1: {ctor: '[]'}
			},
			{
				ctor: '::',
				_0: A2(
					_elm_lang$html$Html$nav,
					{
						ctor: '::',
						_0: _elm_lang$html$Html_Attributes$class('navbar'),
						_1: {ctor: '[]'}
					},
					{
						ctor: '::',
						_0: A2(
							_elm_lang$html$Html$ul,
							{
								ctor: '::',
								_0: _elm_lang$html$Html_Attributes$class('nav navbar-nav navbar-left'),
								_1: {ctor: '[]'}
							},
							{
								ctor: '::',
								_0: A2(
									_elm_lang$html$Html$li,
									{ctor: '[]'},
									{
										ctor: '::',
										_0: A2(
											_elm_lang$html$Html$a,
											{
												ctor: '::',
												_0: _elm_lang$html$Html_Attributes$class('a-img'),
												_1: {
													ctor: '::',
													_0: _elm_lang$html$Html_Events$onClick(
														_user$project$Main$Navigate(_user$project$Main$HomePage)),
													_1: {ctor: '[]'}
												}
											},
											{
												ctor: '::',
												_0: A2(
													_elm_lang$html$Html$img,
													{
														ctor: '::',
														_0: _elm_lang$html$Html_Attributes$class('nav__img'),
														_1: {
															ctor: '::',
															_0: _elm_lang$html$Html_Attributes$src('dist/img/houseable-logo.svg'),
															_1: {ctor: '[]'}
														}
													},
													{ctor: '[]'}),
												_1: {ctor: '[]'}
											}),
										_1: {ctor: '[]'}
									}),
								_1: {
									ctor: '::',
									_0: A2(
										_elm_lang$html$Html$li,
										{ctor: '[]'},
										{
											ctor: '::',
											_0: A2(
												_elm_lang$html$Html$a,
												{
													ctor: '::',
													_0: _elm_lang$html$Html_Events$onClick(
														_user$project$Main$Navigate(_user$project$Main$GalleryPage)),
													_1: {ctor: '[]'}
												},
												{
													ctor: '::',
													_0: _elm_lang$html$Html$text('Gallery'),
													_1: {ctor: '[]'}
												}),
											_1: {ctor: '[]'}
										}),
									_1: {
										ctor: '::',
										_0: A2(
											_elm_lang$html$Html$li,
											{ctor: '[]'},
											{
												ctor: '::',
												_0: A2(
													_elm_lang$html$Html$a,
													{
														ctor: '::',
														_0: _elm_lang$html$Html_Events$onClick(
															_user$project$Main$Navigate(_user$project$Main$AddArtworkPage)),
														_1: {ctor: '[]'}
													},
													{
														ctor: '::',
														_0: _elm_lang$html$Html$text('Add Artwork'),
														_1: {ctor: '[]'}
													}),
												_1: {ctor: '[]'}
											}),
										_1: {ctor: '[]'}
									}
								}
							}),
						_1: {
							ctor: '::',
							_0: A2(
								_elm_lang$html$Html$ul,
								{
									ctor: '::',
									_0: _elm_lang$html$Html_Attributes$class('nav navbar-nav navbar-right'),
									_1: {ctor: '[]'}
								},
								{
									ctor: '::',
									_0: A2(
										_elm_lang$html$Html$li,
										{ctor: '[]'},
										{
											ctor: '::',
											_0: A2(
												_elm_lang$html$Html$a,
												{
													ctor: '::',
													_0: _elm_lang$html$Html_Events$onClick(_user$project$Main$Logout),
													_1: {ctor: '[]'}
												},
												{
													ctor: '::',
													_0: _elm_lang$html$Html$text('Logout'),
													_1: {ctor: '[]'}
												}),
											_1: {ctor: '[]'}
										}),
									_1: {
										ctor: '::',
										_0: A2(
											_elm_lang$html$Html$li,
											{ctor: '[]'},
											{
												ctor: '::',
												_0: A2(
													_elm_lang$html$Html$span,
													{
														ctor: '::',
														_0: _elm_lang$html$Html_Events$onClick(_user$project$Main$SearchDisplay),
														_1: {
															ctor: '::',
															_0: _elm_lang$html$Html_Attributes$class('glyphicon glyphicon-search navbar__search-icon'),
															_1: {ctor: '[]'}
														}
													},
													{ctor: '[]'}),
												_1: {ctor: '[]'}
											}),
										_1: {ctor: '[]'}
									}
								}),
							_1: {ctor: '[]'}
						}
					}),
				_1: {ctor: '[]'}
			}) : A2(
			_elm_lang$html$Html$header,
			{
				ctor: '::',
				_0: _elm_lang$html$Html_Attributes$class('container-fluid'),
				_1: {ctor: '[]'}
			},
			{
				ctor: '::',
				_0: A2(
					_elm_lang$html$Html$nav,
					{
						ctor: '::',
						_0: _elm_lang$html$Html_Attributes$class('navbar'),
						_1: {ctor: '[]'}
					},
					{
						ctor: '::',
						_0: A2(
							_elm_lang$html$Html$ul,
							{
								ctor: '::',
								_0: _elm_lang$html$Html_Attributes$class('nav navbar-nav navbar-left'),
								_1: {ctor: '[]'}
							},
							{
								ctor: '::',
								_0: A2(
									_elm_lang$html$Html$li,
									{ctor: '[]'},
									{
										ctor: '::',
										_0: A2(
											_elm_lang$html$Html$a,
											{
												ctor: '::',
												_0: _elm_lang$html$Html_Attributes$class('a-img'),
												_1: {
													ctor: '::',
													_0: _elm_lang$html$Html_Events$onClick(
														_user$project$Main$Navigate(_user$project$Main$HomePage)),
													_1: {ctor: '[]'}
												}
											},
											{
												ctor: '::',
												_0: A2(
													_elm_lang$html$Html$img,
													{
														ctor: '::',
														_0: _elm_lang$html$Html_Attributes$class('nav__img'),
														_1: {
															ctor: '::',
															_0: _elm_lang$html$Html_Attributes$src('dist/img/houseable-logo.svg'),
															_1: {ctor: '[]'}
														}
													},
													{ctor: '[]'}),
												_1: {ctor: '[]'}
											}),
										_1: {ctor: '[]'}
									}),
								_1: {ctor: '[]'}
							}),
						_1: {
							ctor: '::',
							_0: A2(
								_elm_lang$html$Html$ul,
								{
									ctor: '::',
									_0: _elm_lang$html$Html_Attributes$class('nav navbar-nav navbar-right'),
									_1: {ctor: '[]'}
								},
								{
									ctor: '::',
									_0: A2(
										_elm_lang$html$Html$li,
										{ctor: '[]'},
										{
											ctor: '::',
											_0: A2(
												_elm_lang$html$Html$a,
												{
													ctor: '::',
													_0: _elm_lang$html$Html_Events$onClick(
														_user$project$Main$Navigate(_user$project$Main$LoginPage)),
													_1: {ctor: '[]'}
												},
												{
													ctor: '::',
													_0: _elm_lang$html$Html$text('Login'),
													_1: {ctor: '[]'}
												}),
											_1: {ctor: '[]'}
										}),
									_1: {
										ctor: '::',
										_0: A2(
											_elm_lang$html$Html$li,
											{ctor: '[]'},
											{
												ctor: '::',
												_0: A2(
													_elm_lang$html$Html$a,
													{
														ctor: '::',
														_0: _elm_lang$html$Html_Events$onClick(
															_user$project$Main$Navigate(_user$project$Main$SignupPage)),
														_1: {ctor: '[]'}
													},
													{
														ctor: '::',
														_0: _elm_lang$html$Html$text('Signup'),
														_1: {ctor: '[]'}
													}),
												_1: {ctor: '[]'}
											}),
										_1: {
											ctor: '::',
											_0: A2(
												_elm_lang$html$Html$li,
												{ctor: '[]'},
												{
													ctor: '::',
													_0: A2(
														_elm_lang$html$Html$span,
														{
															ctor: '::',
															_0: _elm_lang$html$Html_Events$onClick(_user$project$Main$SearchDisplay),
															_1: {
																ctor: '::',
																_0: _elm_lang$html$Html_Attributes$class('glyphicon glyphicon-search navbar__search-icon'),
																_1: {ctor: '[]'}
															}
														},
														{ctor: '[]'}),
													_1: {ctor: '[]'}
												}),
											_1: {ctor: '[]'}
										}
									}
								}),
							_1: {ctor: '[]'}
						}
					}),
				_1: {ctor: '[]'}
			});
	};
	var _user$project$Main$view = function (model) {
		var page = function () {
			var _p30 = model.page;
			switch (_p30.ctor) {
				case 'HomePage':
					return A2(
						_elm_lang$html$Html$map,
						_user$project$Main$HomeMsg,
						_user$project$Home$view(model.home));
				case 'SignupPage':
					return A2(
						_elm_lang$html$Html$map,
						_user$project$Main$SignupMsg,
						_user$project$Signup$view(model.signup));
				case 'GalleryPage':
					return A2(
						_elm_lang$html$Html$map,
						_user$project$Main$GalleryMsg,
						_user$project$Gallery$view(model.gallery));
				case 'LoginPage':
					return A2(
						_elm_lang$html$Html$map,
						_user$project$Main$LoginMsg,
						_user$project$Login$view(model.login));
				case 'AddArtworkPage':
					return A2(
						_elm_lang$html$Html$map,
						_user$project$Main$AddArtworkMsg,
						_user$project$AddArtwork$view(model.addArtwork));
				case 'ArtworkPage':
					return A2(
						_elm_lang$html$Html$map,
						_user$project$Main$ArtworkMsg,
						_user$project$Artwork$view(model.artwork));
				default:
					return A2(
						_elm_lang$html$Html$div,
						{
							ctor: '::',
							_0: _elm_lang$html$Html_Attributes$class('main'),
							_1: {ctor: '[]'}
						},
						{
							ctor: '::',
							_0: A2(
								_elm_lang$html$Html$h1,
								{ctor: '[]'},
								{
									ctor: '::',
									_0: _elm_lang$html$Html$text('Page Not Found!'),
									_1: {ctor: '[]'}
								}),
							_1: {ctor: '[]'}
						});
			}
		}();
		return model.searchDisplay ? A2(
			_elm_lang$html$Html$div,
			{ctor: '[]'},
			{
				ctor: '::',
				_0: _user$project$Main$pageHeader(model),
				_1: {
					ctor: '::',
					_0: _user$project$Main$searchResults(model),
					_1: {
						ctor: '::',
						_0: page,
						_1: {ctor: '[]'}
					}
				}
			}) : A2(
			_elm_lang$html$Html$div,
			{ctor: '[]'},
			{
				ctor: '::',
				_0: _user$project$Main$pageHeader(model),
				_1: {
					ctor: '::',
					_0: page,
					_1: {ctor: '[]'}
				}
			});
	};
	var _user$project$Main$main = A2(
		_elm_lang$navigation$Navigation$programWithFlags,
		_user$project$Main$locationToMsg,
		{init: _user$project$Main$init, update: _user$project$Main$update, view: _user$project$Main$view, subscriptions: _user$project$Main$subscriptions})(
		A2(
			_elm_lang$core$Json_Decode$andThen,
			function (fbLoggedIn) {
				return _elm_lang$core$Json_Decode$succeed(
					{fbLoggedIn: fbLoggedIn});
			},
			A2(
				_elm_lang$core$Json_Decode$field,
				'fbLoggedIn',
				_elm_lang$core$Json_Decode$oneOf(
					{
						ctor: '::',
						_0: _elm_lang$core$Json_Decode$null(_elm_lang$core$Maybe$Nothing),
						_1: {
							ctor: '::',
							_0: A2(_elm_lang$core$Json_Decode$map, _elm_lang$core$Maybe$Just, _elm_lang$core$Json_Decode$string),
							_1: {ctor: '[]'}
						}
					}))));
	
	var Elm = {};
	Elm['Main'] = Elm['Main'] || {};
	if (typeof _user$project$Main$main !== 'undefined') {
	    _user$project$Main$main(Elm['Main'], 'Main', undefined);
	}
	
	if (typeof define === "function" && define['amd'])
	{
	  define([], function() { return Elm; });
	  return;
	}
	
	if (typeof module === "object")
	{
	  module['exports'] = Elm;
	  return;
	}
	
	var globalElm = this['Elm'];
	if (typeof globalElm === "undefined")
	{
	  this['Elm'] = Elm;
	  return;
	}
	
	for (var publicModule in Elm)
	{
	  if (publicModule in globalElm)
	  {
	    throw new Error('There are two Elm modules called `' + publicModule + '` on this page! Rename one of them.');
	  }
	  globalElm[publicModule] = Elm[publicModule];
	}
	
	}).call(this);
	


/***/ },
/* 5 */
/***/ function(module, exports) {

	// removed by extract-text-webpack-plugin

/***/ },
/* 6 */
/***/ function(module, exports, __webpack_require__) {

	/**
	 * Root reference for iframes.
	 */
	
	var root;
	if (typeof window !== 'undefined') { // Browser window
	  root = window;
	} else if (typeof self !== 'undefined') { // Web Worker
	  root = self;
	} else { // Other environments
	  console.warn("Using browser-only version of superagent in non-browser environment");
	  root = this;
	}
	
	var Emitter = __webpack_require__(3);
	var RequestBase = __webpack_require__(8);
	var isObject = __webpack_require__(1);
	var isFunction = __webpack_require__(7);
	var ResponseBase = __webpack_require__(9);
	var shouldRetry = __webpack_require__(10);
	
	/**
	 * Noop.
	 */
	
	function noop(){};
	
	/**
	 * Expose `request`.
	 */
	
	var request = exports = module.exports = function(method, url) {
	  // callback
	  if ('function' == typeof url) {
	    return new exports.Request('GET', method).end(url);
	  }
	
	  // url first
	  if (1 == arguments.length) {
	    return new exports.Request('GET', method);
	  }
	
	  return new exports.Request(method, url);
	}
	
	exports.Request = Request;
	
	/**
	 * Determine XHR.
	 */
	
	request.getXHR = function () {
	  if (root.XMLHttpRequest
	      && (!root.location || 'file:' != root.location.protocol
	          || !root.ActiveXObject)) {
	    return new XMLHttpRequest;
	  } else {
	    try { return new ActiveXObject('Microsoft.XMLHTTP'); } catch(e) {}
	    try { return new ActiveXObject('Msxml2.XMLHTTP.6.0'); } catch(e) {}
	    try { return new ActiveXObject('Msxml2.XMLHTTP.3.0'); } catch(e) {}
	    try { return new ActiveXObject('Msxml2.XMLHTTP'); } catch(e) {}
	  }
	  throw Error("Browser-only verison of superagent could not find XHR");
	};
	
	/**
	 * Removes leading and trailing whitespace, added to support IE.
	 *
	 * @param {String} s
	 * @return {String}
	 * @api private
	 */
	
	var trim = ''.trim
	  ? function(s) { return s.trim(); }
	  : function(s) { return s.replace(/(^\s*|\s*$)/g, ''); };
	
	/**
	 * Serialize the given `obj`.
	 *
	 * @param {Object} obj
	 * @return {String}
	 * @api private
	 */
	
	function serialize(obj) {
	  if (!isObject(obj)) return obj;
	  var pairs = [];
	  for (var key in obj) {
	    pushEncodedKeyValuePair(pairs, key, obj[key]);
	  }
	  return pairs.join('&');
	}
	
	/**
	 * Helps 'serialize' with serializing arrays.
	 * Mutates the pairs array.
	 *
	 * @param {Array} pairs
	 * @param {String} key
	 * @param {Mixed} val
	 */
	
	function pushEncodedKeyValuePair(pairs, key, val) {
	  if (val != null) {
	    if (Array.isArray(val)) {
	      val.forEach(function(v) {
	        pushEncodedKeyValuePair(pairs, key, v);
	      });
	    } else if (isObject(val)) {
	      for(var subkey in val) {
	        pushEncodedKeyValuePair(pairs, key + '[' + subkey + ']', val[subkey]);
	      }
	    } else {
	      pairs.push(encodeURIComponent(key)
	        + '=' + encodeURIComponent(val));
	    }
	  } else if (val === null) {
	    pairs.push(encodeURIComponent(key));
	  }
	}
	
	/**
	 * Expose serialization method.
	 */
	
	 request.serializeObject = serialize;
	
	 /**
	  * Parse the given x-www-form-urlencoded `str`.
	  *
	  * @param {String} str
	  * @return {Object}
	  * @api private
	  */
	
	function parseString(str) {
	  var obj = {};
	  var pairs = str.split('&');
	  var pair;
	  var pos;
	
	  for (var i = 0, len = pairs.length; i < len; ++i) {
	    pair = pairs[i];
	    pos = pair.indexOf('=');
	    if (pos == -1) {
	      obj[decodeURIComponent(pair)] = '';
	    } else {
	      obj[decodeURIComponent(pair.slice(0, pos))] =
	        decodeURIComponent(pair.slice(pos + 1));
	    }
	  }
	
	  return obj;
	}
	
	/**
	 * Expose parser.
	 */
	
	request.parseString = parseString;
	
	/**
	 * Default MIME type map.
	 *
	 *     superagent.types.xml = 'application/xml';
	 *
	 */
	
	request.types = {
	  html: 'text/html',
	  json: 'application/json',
	  xml: 'application/xml',
	  urlencoded: 'application/x-www-form-urlencoded',
	  'form': 'application/x-www-form-urlencoded',
	  'form-data': 'application/x-www-form-urlencoded'
	};
	
	/**
	 * Default serialization map.
	 *
	 *     superagent.serialize['application/xml'] = function(obj){
	 *       return 'generated xml here';
	 *     };
	 *
	 */
	
	 request.serialize = {
	   'application/x-www-form-urlencoded': serialize,
	   'application/json': JSON.stringify
	 };
	
	 /**
	  * Default parsers.
	  *
	  *     superagent.parse['application/xml'] = function(str){
	  *       return { object parsed from str };
	  *     };
	  *
	  */
	
	request.parse = {
	  'application/x-www-form-urlencoded': parseString,
	  'application/json': JSON.parse
	};
	
	/**
	 * Parse the given header `str` into
	 * an object containing the mapped fields.
	 *
	 * @param {String} str
	 * @return {Object}
	 * @api private
	 */
	
	function parseHeader(str) {
	  var lines = str.split(/\r?\n/);
	  var fields = {};
	  var index;
	  var line;
	  var field;
	  var val;
	
	  lines.pop(); // trailing CRLF
	
	  for (var i = 0, len = lines.length; i < len; ++i) {
	    line = lines[i];
	    index = line.indexOf(':');
	    field = line.slice(0, index).toLowerCase();
	    val = trim(line.slice(index + 1));
	    fields[field] = val;
	  }
	
	  return fields;
	}
	
	/**
	 * Check if `mime` is json or has +json structured syntax suffix.
	 *
	 * @param {String} mime
	 * @return {Boolean}
	 * @api private
	 */
	
	function isJSON(mime) {
	  return /[\/+]json\b/.test(mime);
	}
	
	/**
	 * Initialize a new `Response` with the given `xhr`.
	 *
	 *  - set flags (.ok, .error, etc)
	 *  - parse header
	 *
	 * Examples:
	 *
	 *  Aliasing `superagent` as `request` is nice:
	 *
	 *      request = superagent;
	 *
	 *  We can use the promise-like API, or pass callbacks:
	 *
	 *      request.get('/').end(function(res){});
	 *      request.get('/', function(res){});
	 *
	 *  Sending data can be chained:
	 *
	 *      request
	 *        .post('/user')
	 *        .send({ name: 'tj' })
	 *        .end(function(res){});
	 *
	 *  Or passed to `.send()`:
	 *
	 *      request
	 *        .post('/user')
	 *        .send({ name: 'tj' }, function(res){});
	 *
	 *  Or passed to `.post()`:
	 *
	 *      request
	 *        .post('/user', { name: 'tj' })
	 *        .end(function(res){});
	 *
	 * Or further reduced to a single call for simple cases:
	 *
	 *      request
	 *        .post('/user', { name: 'tj' }, function(res){});
	 *
	 * @param {XMLHTTPRequest} xhr
	 * @param {Object} options
	 * @api private
	 */
	
	function Response(req) {
	  this.req = req;
	  this.xhr = this.req.xhr;
	  // responseText is accessible only if responseType is '' or 'text' and on older browsers
	  this.text = ((this.req.method !='HEAD' && (this.xhr.responseType === '' || this.xhr.responseType === 'text')) || typeof this.xhr.responseType === 'undefined')
	     ? this.xhr.responseText
	     : null;
	  this.statusText = this.req.xhr.statusText;
	  var status = this.xhr.status;
	  // handle IE9 bug: http://stackoverflow.com/questions/10046972/msie-returns-status-code-of-1223-for-ajax-request
	  if (status === 1223) {
	      status = 204;
	  }
	  this._setStatusProperties(status);
	  this.header = this.headers = parseHeader(this.xhr.getAllResponseHeaders());
	  // getAllResponseHeaders sometimes falsely returns "" for CORS requests, but
	  // getResponseHeader still works. so we get content-type even if getting
	  // other headers fails.
	  this.header['content-type'] = this.xhr.getResponseHeader('content-type');
	  this._setHeaderProperties(this.header);
	
	  if (null === this.text && req._responseType) {
	    this.body = this.xhr.response;
	  } else {
	    this.body = this.req.method != 'HEAD'
	      ? this._parseBody(this.text ? this.text : this.xhr.response)
	      : null;
	  }
	}
	
	ResponseBase(Response.prototype);
	
	/**
	 * Parse the given body `str`.
	 *
	 * Used for auto-parsing of bodies. Parsers
	 * are defined on the `superagent.parse` object.
	 *
	 * @param {String} str
	 * @return {Mixed}
	 * @api private
	 */
	
	Response.prototype._parseBody = function(str){
	  var parse = request.parse[this.type];
	  if(this.req._parser) {
	    return this.req._parser(this, str);
	  }
	  if (!parse && isJSON(this.type)) {
	    parse = request.parse['application/json'];
	  }
	  return parse && str && (str.length || str instanceof Object)
	    ? parse(str)
	    : null;
	};
	
	/**
	 * Return an `Error` representative of this response.
	 *
	 * @return {Error}
	 * @api public
	 */
	
	Response.prototype.toError = function(){
	  var req = this.req;
	  var method = req.method;
	  var url = req.url;
	
	  var msg = 'cannot ' + method + ' ' + url + ' (' + this.status + ')';
	  var err = new Error(msg);
	  err.status = this.status;
	  err.method = method;
	  err.url = url;
	
	  return err;
	};
	
	/**
	 * Expose `Response`.
	 */
	
	request.Response = Response;
	
	/**
	 * Initialize a new `Request` with the given `method` and `url`.
	 *
	 * @param {String} method
	 * @param {String} url
	 * @api public
	 */
	
	function Request(method, url) {
	  var self = this;
	  this._query = this._query || [];
	  this.method = method;
	  this.url = url;
	  this.header = {}; // preserves header name case
	  this._header = {}; // coerces header names to lowercase
	  this.on('end', function(){
	    var err = null;
	    var res = null;
	
	    try {
	      res = new Response(self);
	    } catch(e) {
	      err = new Error('Parser is unable to parse the response');
	      err.parse = true;
	      err.original = e;
	      // issue #675: return the raw response if the response parsing fails
	      if (self.xhr) {
	        // ie9 doesn't have 'response' property
	        err.rawResponse = typeof self.xhr.responseType == 'undefined' ? self.xhr.responseText : self.xhr.response;
	        // issue #876: return the http status code if the response parsing fails
	        err.status = self.xhr.status ? self.xhr.status : null;
	        err.statusCode = err.status; // backwards-compat only
	      } else {
	        err.rawResponse = null;
	        err.status = null;
	      }
	
	      return self.callback(err);
	    }
	
	    self.emit('response', res);
	
	    var new_err;
	    try {
	      if (!self._isResponseOK(res)) {
	        new_err = new Error(res.statusText || 'Unsuccessful HTTP response');
	        new_err.original = err;
	        new_err.response = res;
	        new_err.status = res.status;
	      }
	    } catch(e) {
	      new_err = e; // #985 touching res may cause INVALID_STATE_ERR on old Android
	    }
	
	    // #1000 don't catch errors from the callback to avoid double calling it
	    if (new_err) {
	      self.callback(new_err, res);
	    } else {
	      self.callback(null, res);
	    }
	  });
	}
	
	/**
	 * Mixin `Emitter` and `RequestBase`.
	 */
	
	Emitter(Request.prototype);
	RequestBase(Request.prototype);
	
	/**
	 * Set Content-Type to `type`, mapping values from `request.types`.
	 *
	 * Examples:
	 *
	 *      superagent.types.xml = 'application/xml';
	 *
	 *      request.post('/')
	 *        .type('xml')
	 *        .send(xmlstring)
	 *        .end(callback);
	 *
	 *      request.post('/')
	 *        .type('application/xml')
	 *        .send(xmlstring)
	 *        .end(callback);
	 *
	 * @param {String} type
	 * @return {Request} for chaining
	 * @api public
	 */
	
	Request.prototype.type = function(type){
	  this.set('Content-Type', request.types[type] || type);
	  return this;
	};
	
	/**
	 * Set Accept to `type`, mapping values from `request.types`.
	 *
	 * Examples:
	 *
	 *      superagent.types.json = 'application/json';
	 *
	 *      request.get('/agent')
	 *        .accept('json')
	 *        .end(callback);
	 *
	 *      request.get('/agent')
	 *        .accept('application/json')
	 *        .end(callback);
	 *
	 * @param {String} accept
	 * @return {Request} for chaining
	 * @api public
	 */
	
	Request.prototype.accept = function(type){
	  this.set('Accept', request.types[type] || type);
	  return this;
	};
	
	/**
	 * Set Authorization field value with `user` and `pass`.
	 *
	 * @param {String} user
	 * @param {String} [pass] optional in case of using 'bearer' as type
	 * @param {Object} options with 'type' property 'auto', 'basic' or 'bearer' (default 'basic')
	 * @return {Request} for chaining
	 * @api public
	 */
	
	Request.prototype.auth = function(user, pass, options){
	  if (typeof pass === 'object' && pass !== null) { // pass is optional and can substitute for options
	    options = pass;
	  }
	  if (!options) {
	    options = {
	      type: 'function' === typeof btoa ? 'basic' : 'auto',
	    }
	  }
	
	  switch (options.type) {
	    case 'basic':
	      this.set('Authorization', 'Basic ' + btoa(user + ':' + pass));
	    break;
	
	    case 'auto':
	      this.username = user;
	      this.password = pass;
	    break;
	      
	    case 'bearer': // usage would be .auth(accessToken, { type: 'bearer' })
	      this.set('Authorization', 'Bearer ' + user);
	    break;  
	  }
	  return this;
	};
	
	/**
	 * Add query-string `val`.
	 *
	 * Examples:
	 *
	 *   request.get('/shoes')
	 *     .query('size=10')
	 *     .query({ color: 'blue' })
	 *
	 * @param {Object|String} val
	 * @return {Request} for chaining
	 * @api public
	 */
	
	Request.prototype.query = function(val){
	  if ('string' != typeof val) val = serialize(val);
	  if (val) this._query.push(val);
	  return this;
	};
	
	/**
	 * Queue the given `file` as an attachment to the specified `field`,
	 * with optional `options` (or filename).
	 *
	 * ``` js
	 * request.post('/upload')
	 *   .attach('content', new Blob(['<a id="a"><b id="b">hey!</b></a>'], { type: "text/html"}))
	 *   .end(callback);
	 * ```
	 *
	 * @param {String} field
	 * @param {Blob|File} file
	 * @param {String|Object} options
	 * @return {Request} for chaining
	 * @api public
	 */
	
	Request.prototype.attach = function(field, file, options){
	  if (file) {
	    if (this._data) {
	      throw Error("superagent can't mix .send() and .attach()");
	    }
	
	    this._getFormData().append(field, file, options || file.name);
	  }
	  return this;
	};
	
	Request.prototype._getFormData = function(){
	  if (!this._formData) {
	    this._formData = new root.FormData();
	  }
	  return this._formData;
	};
	
	/**
	 * Invoke the callback with `err` and `res`
	 * and handle arity check.
	 *
	 * @param {Error} err
	 * @param {Response} res
	 * @api private
	 */
	
	Request.prototype.callback = function(err, res){
	  // console.log(this._retries, this._maxRetries)
	  if (this._maxRetries && this._retries++ < this._maxRetries && shouldRetry(err, res)) {
	    return this._retry();
	  }
	
	  var fn = this._callback;
	  this.clearTimeout();
	
	  if (err) {
	    if (this._maxRetries) err.retries = this._retries - 1;
	    this.emit('error', err);
	  }
	
	  fn(err, res);
	};
	
	/**
	 * Invoke callback with x-domain error.
	 *
	 * @api private
	 */
	
	Request.prototype.crossDomainError = function(){
	  var err = new Error('Request has been terminated\nPossible causes: the network is offline, Origin is not allowed by Access-Control-Allow-Origin, the page is being unloaded, etc.');
	  err.crossDomain = true;
	
	  err.status = this.status;
	  err.method = this.method;
	  err.url = this.url;
	
	  this.callback(err);
	};
	
	// This only warns, because the request is still likely to work
	Request.prototype.buffer = Request.prototype.ca = Request.prototype.agent = function(){
	  console.warn("This is not supported in browser version of superagent");
	  return this;
	};
	
	// This throws, because it can't send/receive data as expected
	Request.prototype.pipe = Request.prototype.write = function(){
	  throw Error("Streaming is not supported in browser version of superagent");
	};
	
	/**
	 * Compose querystring to append to req.url
	 *
	 * @api private
	 */
	
	Request.prototype._appendQueryString = function(){
	  var query = this._query.join('&');
	  if (query) {
	    this.url += (this.url.indexOf('?') >= 0 ? '&' : '?') + query;
	  }
	
	  if (this._sort) {
	    var index = this.url.indexOf('?');
	    if (index >= 0) {
	      var queryArr = this.url.substring(index + 1).split('&');
	      if (isFunction(this._sort)) {
	        queryArr.sort(this._sort);
	      } else {
	        queryArr.sort();
	      }
	      this.url = this.url.substring(0, index) + '?' + queryArr.join('&');
	    }
	  }
	};
	
	/**
	 * Check if `obj` is a host object,
	 * we don't want to serialize these :)
	 *
	 * @param {Object} obj
	 * @return {Boolean}
	 * @api private
	 */
	Request.prototype._isHost = function _isHost(obj) {
	  // Native objects stringify to [object File], [object Blob], [object FormData], etc.
	  return obj && 'object' === typeof obj && !Array.isArray(obj) && Object.prototype.toString.call(obj) !== '[object Object]';
	}
	
	/**
	 * Initiate request, invoking callback `fn(res)`
	 * with an instanceof `Response`.
	 *
	 * @param {Function} fn
	 * @return {Request} for chaining
	 * @api public
	 */
	
	Request.prototype.end = function(fn){
	  if (this._endCalled) {
	    console.warn("Warning: .end() was called twice. This is not supported in superagent");
	  }
	  this._endCalled = true;
	
	  // store callback
	  this._callback = fn || noop;
	
	  // querystring
	  this._appendQueryString();
	
	  return this._end();
	};
	
	Request.prototype._end = function() {
	  var self = this;
	  var xhr = this.xhr = request.getXHR();
	  var data = this._formData || this._data;
	
	  this._setTimeouts();
	
	  // state change
	  xhr.onreadystatechange = function(){
	    var readyState = xhr.readyState;
	    if (readyState >= 2 && self._responseTimeoutTimer) {
	      clearTimeout(self._responseTimeoutTimer);
	    }
	    if (4 != readyState) {
	      return;
	    }
	
	    // In IE9, reads to any property (e.g. status) off of an aborted XHR will
	    // result in the error "Could not complete the operation due to error c00c023f"
	    var status;
	    try { status = xhr.status } catch(e) { status = 0; }
	
	    if (!status) {
	      if (self.timedout || self._aborted) return;
	      return self.crossDomainError();
	    }
	    self.emit('end');
	  };
	
	  // progress
	  var handleProgress = function(direction, e) {
	    if (e.total > 0) {
	      e.percent = e.loaded / e.total * 100;
	    }
	    e.direction = direction;
	    self.emit('progress', e);
	  }
	  if (this.hasListeners('progress')) {
	    try {
	      xhr.onprogress = handleProgress.bind(null, 'download');
	      if (xhr.upload) {
	        xhr.upload.onprogress = handleProgress.bind(null, 'upload');
	      }
	    } catch(e) {
	      // Accessing xhr.upload fails in IE from a web worker, so just pretend it doesn't exist.
	      // Reported here:
	      // https://connect.microsoft.com/IE/feedback/details/837245/xmlhttprequest-upload-throws-invalid-argument-when-used-from-web-worker-context
	    }
	  }
	
	  // initiate request
	  try {
	    if (this.username && this.password) {
	      xhr.open(this.method, this.url, true, this.username, this.password);
	    } else {
	      xhr.open(this.method, this.url, true);
	    }
	  } catch (err) {
	    // see #1149
	    return this.callback(err);
	  }
	
	  // CORS
	  if (this._withCredentials) xhr.withCredentials = true;
	
	  // body
	  if (!this._formData && 'GET' != this.method && 'HEAD' != this.method && 'string' != typeof data && !this._isHost(data)) {
	    // serialize stuff
	    var contentType = this._header['content-type'];
	    var serialize = this._serializer || request.serialize[contentType ? contentType.split(';')[0] : ''];
	    if (!serialize && isJSON(contentType)) {
	      serialize = request.serialize['application/json'];
	    }
	    if (serialize) data = serialize(data);
	  }
	
	  // set header fields
	  for (var field in this.header) {
	    if (null == this.header[field]) continue;
	    xhr.setRequestHeader(field, this.header[field]);
	  }
	
	  if (this._responseType) {
	    xhr.responseType = this._responseType;
	  }
	
	  // send stuff
	  this.emit('request', this);
	
	  // IE11 xhr.send(undefined) sends 'undefined' string as POST payload (instead of nothing)
	  // We need null here if data is undefined
	  xhr.send(typeof data !== 'undefined' ? data : null);
	  return this;
	};
	
	/**
	 * GET `url` with optional callback `fn(res)`.
	 *
	 * @param {String} url
	 * @param {Mixed|Function} [data] or fn
	 * @param {Function} [fn]
	 * @return {Request}
	 * @api public
	 */
	
	request.get = function(url, data, fn){
	  var req = request('GET', url);
	  if ('function' == typeof data) fn = data, data = null;
	  if (data) req.query(data);
	  if (fn) req.end(fn);
	  return req;
	};
	
	/**
	 * HEAD `url` with optional callback `fn(res)`.
	 *
	 * @param {String} url
	 * @param {Mixed|Function} [data] or fn
	 * @param {Function} [fn]
	 * @return {Request}
	 * @api public
	 */
	
	request.head = function(url, data, fn){
	  var req = request('HEAD', url);
	  if ('function' == typeof data) fn = data, data = null;
	  if (data) req.send(data);
	  if (fn) req.end(fn);
	  return req;
	};
	
	/**
	 * OPTIONS query to `url` with optional callback `fn(res)`.
	 *
	 * @param {String} url
	 * @param {Mixed|Function} [data] or fn
	 * @param {Function} [fn]
	 * @return {Request}
	 * @api public
	 */
	
	request.options = function(url, data, fn){
	  var req = request('OPTIONS', url);
	  if ('function' == typeof data) fn = data, data = null;
	  if (data) req.send(data);
	  if (fn) req.end(fn);
	  return req;
	};
	
	/**
	 * DELETE `url` with optional `data` and callback `fn(res)`.
	 *
	 * @param {String} url
	 * @param {Mixed} [data]
	 * @param {Function} [fn]
	 * @return {Request}
	 * @api public
	 */
	
	function del(url, data, fn){
	  var req = request('DELETE', url);
	  if ('function' == typeof data) fn = data, data = null;
	  if (data) req.send(data);
	  if (fn) req.end(fn);
	  return req;
	};
	
	request['del'] = del;
	request['delete'] = del;
	
	/**
	 * PATCH `url` with optional `data` and callback `fn(res)`.
	 *
	 * @param {String} url
	 * @param {Mixed} [data]
	 * @param {Function} [fn]
	 * @return {Request}
	 * @api public
	 */
	
	request.patch = function(url, data, fn){
	  var req = request('PATCH', url);
	  if ('function' == typeof data) fn = data, data = null;
	  if (data) req.send(data);
	  if (fn) req.end(fn);
	  return req;
	};
	
	/**
	 * POST `url` with optional `data` and callback `fn(res)`.
	 *
	 * @param {String} url
	 * @param {Mixed} [data]
	 * @param {Function} [fn]
	 * @return {Request}
	 * @api public
	 */
	
	request.post = function(url, data, fn){
	  var req = request('POST', url);
	  if ('function' == typeof data) fn = data, data = null;
	  if (data) req.send(data);
	  if (fn) req.end(fn);
	  return req;
	};
	
	/**
	 * PUT `url` with optional `data` and callback `fn(res)`.
	 *
	 * @param {String} url
	 * @param {Mixed|Function} [data] or fn
	 * @param {Function} [fn]
	 * @return {Request}
	 * @api public
	 */
	
	request.put = function(url, data, fn){
	  var req = request('PUT', url);
	  if ('function' == typeof data) fn = data, data = null;
	  if (data) req.send(data);
	  if (fn) req.end(fn);
	  return req;
	};


/***/ },
/* 7 */
/***/ function(module, exports, __webpack_require__) {

	/**
	 * Check if `fn` is a function.
	 *
	 * @param {Function} fn
	 * @return {Boolean}
	 * @api private
	 */
	var isObject = __webpack_require__(1);
	
	function isFunction(fn) {
	  var tag = isObject(fn) ? Object.prototype.toString.call(fn) : '';
	  return tag === '[object Function]';
	}
	
	module.exports = isFunction;


/***/ },
/* 8 */
/***/ function(module, exports, __webpack_require__) {

	/**
	 * Module of mixed-in functions shared between node and client code
	 */
	var isObject = __webpack_require__(1);
	
	/**
	 * Expose `RequestBase`.
	 */
	
	module.exports = RequestBase;
	
	/**
	 * Initialize a new `RequestBase`.
	 *
	 * @api public
	 */
	
	function RequestBase(obj) {
	  if (obj) return mixin(obj);
	}
	
	/**
	 * Mixin the prototype properties.
	 *
	 * @param {Object} obj
	 * @return {Object}
	 * @api private
	 */
	
	function mixin(obj) {
	  for (var key in RequestBase.prototype) {
	    obj[key] = RequestBase.prototype[key];
	  }
	  return obj;
	}
	
	/**
	 * Clear previous timeout.
	 *
	 * @return {Request} for chaining
	 * @api public
	 */
	
	RequestBase.prototype.clearTimeout = function _clearTimeout(){
	  clearTimeout(this._timer);
	  clearTimeout(this._responseTimeoutTimer);
	  delete this._timer;
	  delete this._responseTimeoutTimer;
	  return this;
	};
	
	/**
	 * Override default response body parser
	 *
	 * This function will be called to convert incoming data into request.body
	 *
	 * @param {Function}
	 * @api public
	 */
	
	RequestBase.prototype.parse = function parse(fn){
	  this._parser = fn;
	  return this;
	};
	
	/**
	 * Set format of binary response body.
	 * In browser valid formats are 'blob' and 'arraybuffer',
	 * which return Blob and ArrayBuffer, respectively.
	 *
	 * In Node all values result in Buffer.
	 *
	 * Examples:
	 *
	 *      req.get('/')
	 *        .responseType('blob')
	 *        .end(callback);
	 *
	 * @param {String} val
	 * @return {Request} for chaining
	 * @api public
	 */
	
	RequestBase.prototype.responseType = function(val){
	  this._responseType = val;
	  return this;
	};
	
	/**
	 * Override default request body serializer
	 *
	 * This function will be called to convert data set via .send or .attach into payload to send
	 *
	 * @param {Function}
	 * @api public
	 */
	
	RequestBase.prototype.serialize = function serialize(fn){
	  this._serializer = fn;
	  return this;
	};
	
	/**
	 * Set timeouts.
	 *
	 * - response timeout is time between sending request and receiving the first byte of the response. Includes DNS and connection time.
	 * - deadline is the time from start of the request to receiving response body in full. If the deadline is too short large files may not load at all on slow connections.
	 *
	 * Value of 0 or false means no timeout.
	 *
	 * @param {Number|Object} ms or {response, read, deadline}
	 * @return {Request} for chaining
	 * @api public
	 */
	
	RequestBase.prototype.timeout = function timeout(options){
	  if (!options || 'object' !== typeof options) {
	    this._timeout = options;
	    this._responseTimeout = 0;
	    return this;
	  }
	
	  for(var option in options) {
	    switch(option) {
	      case 'deadline':
	        this._timeout = options.deadline;
	        break;
	      case 'response':
	        this._responseTimeout = options.response;
	        break;
	      default:
	        console.warn("Unknown timeout option", option);
	    }
	  }
	  return this;
	};
	
	/**
	 * Set number of retry attempts on error.
	 *
	 * Failed requests will be retried 'count' times if timeout or err.code >= 500.
	 *
	 * @param {Number} count
	 * @return {Request} for chaining
	 * @api public
	 */
	
	RequestBase.prototype.retry = function retry(count){
	  // Default to 1 if no count passed or true
	  if (arguments.length === 0 || count === true) count = 1;
	  if (count <= 0) count = 0;
	  this._maxRetries = count;
	  this._retries = 0;
	  return this;
	};
	
	/**
	 * Retry request
	 *
	 * @return {Request} for chaining
	 * @api private
	 */
	
	RequestBase.prototype._retry = function() {
	  this.clearTimeout();
	
	  // node
	  if (this.req) {
	    this.req = null;
	    this.req = this.request();
	  }
	
	  this._aborted = false;
	  this.timedout = false;
	
	  return this._end();
	};
	
	/**
	 * Promise support
	 *
	 * @param {Function} resolve
	 * @param {Function} [reject]
	 * @return {Request}
	 */
	
	RequestBase.prototype.then = function then(resolve, reject) {
	  if (!this._fullfilledPromise) {
	    var self = this;
	    if (this._endCalled) {
	      console.warn("Warning: superagent request was sent twice, because both .end() and .then() were called. Never call .end() if you use promises");
	    }
	    this._fullfilledPromise = new Promise(function(innerResolve, innerReject){
	      self.end(function(err, res){
	        if (err) innerReject(err); else innerResolve(res);
	      });
	    });
	  }
	  return this._fullfilledPromise.then(resolve, reject);
	}
	
	RequestBase.prototype.catch = function(cb) {
	  return this.then(undefined, cb);
	};
	
	/**
	 * Allow for extension
	 */
	
	RequestBase.prototype.use = function use(fn) {
	  fn(this);
	  return this;
	}
	
	RequestBase.prototype.ok = function(cb) {
	  if ('function' !== typeof cb) throw Error("Callback required");
	  this._okCallback = cb;
	  return this;
	};
	
	RequestBase.prototype._isResponseOK = function(res) {
	  if (!res) {
	    return false;
	  }
	
	  if (this._okCallback) {
	    return this._okCallback(res);
	  }
	
	  return res.status >= 200 && res.status < 300;
	};
	
	
	/**
	 * Get request header `field`.
	 * Case-insensitive.
	 *
	 * @param {String} field
	 * @return {String}
	 * @api public
	 */
	
	RequestBase.prototype.get = function(field){
	  return this._header[field.toLowerCase()];
	};
	
	/**
	 * Get case-insensitive header `field` value.
	 * This is a deprecated internal API. Use `.get(field)` instead.
	 *
	 * (getHeader is no longer used internally by the superagent code base)
	 *
	 * @param {String} field
	 * @return {String}
	 * @api private
	 * @deprecated
	 */
	
	RequestBase.prototype.getHeader = RequestBase.prototype.get;
	
	/**
	 * Set header `field` to `val`, or multiple fields with one object.
	 * Case-insensitive.
	 *
	 * Examples:
	 *
	 *      req.get('/')
	 *        .set('Accept', 'application/json')
	 *        .set('X-API-Key', 'foobar')
	 *        .end(callback);
	 *
	 *      req.get('/')
	 *        .set({ Accept: 'application/json', 'X-API-Key': 'foobar' })
	 *        .end(callback);
	 *
	 * @param {String|Object} field
	 * @param {String} val
	 * @return {Request} for chaining
	 * @api public
	 */
	
	RequestBase.prototype.set = function(field, val){
	  if (isObject(field)) {
	    for (var key in field) {
	      this.set(key, field[key]);
	    }
	    return this;
	  }
	  this._header[field.toLowerCase()] = val;
	  this.header[field] = val;
	  return this;
	};
	
	/**
	 * Remove header `field`.
	 * Case-insensitive.
	 *
	 * Example:
	 *
	 *      req.get('/')
	 *        .unset('User-Agent')
	 *        .end(callback);
	 *
	 * @param {String} field
	 */
	RequestBase.prototype.unset = function(field){
	  delete this._header[field.toLowerCase()];
	  delete this.header[field];
	  return this;
	};
	
	/**
	 * Write the field `name` and `val`, or multiple fields with one object
	 * for "multipart/form-data" request bodies.
	 *
	 * ``` js
	 * request.post('/upload')
	 *   .field('foo', 'bar')
	 *   .end(callback);
	 *
	 * request.post('/upload')
	 *   .field({ foo: 'bar', baz: 'qux' })
	 *   .end(callback);
	 * ```
	 *
	 * @param {String|Object} name
	 * @param {String|Blob|File|Buffer|fs.ReadStream} val
	 * @return {Request} for chaining
	 * @api public
	 */
	RequestBase.prototype.field = function(name, val) {
	
	  // name should be either a string or an object.
	  if (null === name ||  undefined === name) {
	    throw new Error('.field(name, val) name can not be empty');
	  }
	
	  if (this._data) {
	    console.error(".field() can't be used if .send() is used. Please use only .send() or only .field() & .attach()");
	  }
	
	  if (isObject(name)) {
	    for (var key in name) {
	      this.field(key, name[key]);
	    }
	    return this;
	  }
	
	  if (Array.isArray(val)) {
	    for (var i in val) {
	      this.field(name, val[i]);
	    }
	    return this;
	  }
	
	  // val should be defined now
	  if (null === val || undefined === val) {
	    throw new Error('.field(name, val) val can not be empty');
	  }
	  if ('boolean' === typeof val) {
	    val = '' + val;
	  }
	  this._getFormData().append(name, val);
	  return this;
	};
	
	/**
	 * Abort the request, and clear potential timeout.
	 *
	 * @return {Request}
	 * @api public
	 */
	RequestBase.prototype.abort = function(){
	  if (this._aborted) {
	    return this;
	  }
	  this._aborted = true;
	  this.xhr && this.xhr.abort(); // browser
	  this.req && this.req.abort(); // node
	  this.clearTimeout();
	  this.emit('abort');
	  return this;
	};
	
	/**
	 * Enable transmission of cookies with x-domain requests.
	 *
	 * Note that for this to work the origin must not be
	 * using "Access-Control-Allow-Origin" with a wildcard,
	 * and also must set "Access-Control-Allow-Credentials"
	 * to "true".
	 *
	 * @api public
	 */
	
	RequestBase.prototype.withCredentials = function(on){
	  // This is browser-only functionality. Node side is no-op.
	  if(on==undefined) on = true;
	  this._withCredentials = on;
	  return this;
	};
	
	/**
	 * Set the max redirects to `n`. Does noting in browser XHR implementation.
	 *
	 * @param {Number} n
	 * @return {Request} for chaining
	 * @api public
	 */
	
	RequestBase.prototype.redirects = function(n){
	  this._maxRedirects = n;
	  return this;
	};
	
	/**
	 * Convert to a plain javascript object (not JSON string) of scalar properties.
	 * Note as this method is designed to return a useful non-this value,
	 * it cannot be chained.
	 *
	 * @return {Object} describing method, url, and data of this request
	 * @api public
	 */
	
	RequestBase.prototype.toJSON = function(){
	  return {
	    method: this.method,
	    url: this.url,
	    data: this._data,
	    headers: this._header
	  };
	};
	
	
	/**
	 * Send `data` as the request body, defaulting the `.type()` to "json" when
	 * an object is given.
	 *
	 * Examples:
	 *
	 *       // manual json
	 *       request.post('/user')
	 *         .type('json')
	 *         .send('{"name":"tj"}')
	 *         .end(callback)
	 *
	 *       // auto json
	 *       request.post('/user')
	 *         .send({ name: 'tj' })
	 *         .end(callback)
	 *
	 *       // manual x-www-form-urlencoded
	 *       request.post('/user')
	 *         .type('form')
	 *         .send('name=tj')
	 *         .end(callback)
	 *
	 *       // auto x-www-form-urlencoded
	 *       request.post('/user')
	 *         .type('form')
	 *         .send({ name: 'tj' })
	 *         .end(callback)
	 *
	 *       // defaults to x-www-form-urlencoded
	 *      request.post('/user')
	 *        .send('name=tobi')
	 *        .send('species=ferret')
	 *        .end(callback)
	 *
	 * @param {String|Object} data
	 * @return {Request} for chaining
	 * @api public
	 */
	
	RequestBase.prototype.send = function(data){
	  var isObj = isObject(data);
	  var type = this._header['content-type'];
	
	  if (this._formData) {
	    console.error(".send() can't be used if .attach() or .field() is used. Please use only .send() or only .field() & .attach()");
	  }
	
	  if (isObj && !this._data) {
	    if (Array.isArray(data)) {
	      this._data = [];
	    } else if (!this._isHost(data)) {
	      this._data = {};
	    }
	  } else if (data && this._data && this._isHost(this._data)) {
	    throw Error("Can't merge these send calls");
	  }
	
	  // merge
	  if (isObj && isObject(this._data)) {
	    for (var key in data) {
	      this._data[key] = data[key];
	    }
	  } else if ('string' == typeof data) {
	    // default to x-www-form-urlencoded
	    if (!type) this.type('form');
	    type = this._header['content-type'];
	    if ('application/x-www-form-urlencoded' == type) {
	      this._data = this._data
	        ? this._data + '&' + data
	        : data;
	    } else {
	      this._data = (this._data || '') + data;
	    }
	  } else {
	    this._data = data;
	  }
	
	  if (!isObj || this._isHost(data)) {
	    return this;
	  }
	
	  // default to json
	  if (!type) this.type('json');
	  return this;
	};
	
	
	/**
	 * Sort `querystring` by the sort function
	 *
	 *
	 * Examples:
	 *
	 *       // default order
	 *       request.get('/user')
	 *         .query('name=Nick')
	 *         .query('search=Manny')
	 *         .sortQuery()
	 *         .end(callback)
	 *
	 *       // customized sort function
	 *       request.get('/user')
	 *         .query('name=Nick')
	 *         .query('search=Manny')
	 *         .sortQuery(function(a, b){
	 *           return a.length - b.length;
	 *         })
	 *         .end(callback)
	 *
	 *
	 * @param {Function} sort
	 * @return {Request} for chaining
	 * @api public
	 */
	
	RequestBase.prototype.sortQuery = function(sort) {
	  // _sort default to true but otherwise can be a function or boolean
	  this._sort = typeof sort === 'undefined' ? true : sort;
	  return this;
	};
	
	/**
	 * Invoke callback with timeout error.
	 *
	 * @api private
	 */
	
	RequestBase.prototype._timeoutError = function(reason, timeout, errno){
	  if (this._aborted) {
	    return;
	  }
	  var err = new Error(reason + timeout + 'ms exceeded');
	  err.timeout = timeout;
	  err.code = 'ECONNABORTED';
	  err.errno = errno;
	  this.timedout = true;
	  this.abort();
	  this.callback(err);
	};
	
	RequestBase.prototype._setTimeouts = function() {
	  var self = this;
	
	  // deadline
	  if (this._timeout && !this._timer) {
	    this._timer = setTimeout(function(){
	      self._timeoutError('Timeout of ', self._timeout, 'ETIME');
	    }, this._timeout);
	  }
	  // response timeout
	  if (this._responseTimeout && !this._responseTimeoutTimer) {
	    this._responseTimeoutTimer = setTimeout(function(){
	      self._timeoutError('Response timeout of ', self._responseTimeout, 'ETIMEDOUT');
	    }, this._responseTimeout);
	  }
	}


/***/ },
/* 9 */
/***/ function(module, exports, __webpack_require__) {

	
	/**
	 * Module dependencies.
	 */
	
	var utils = __webpack_require__(11);
	
	/**
	 * Expose `ResponseBase`.
	 */
	
	module.exports = ResponseBase;
	
	/**
	 * Initialize a new `ResponseBase`.
	 *
	 * @api public
	 */
	
	function ResponseBase(obj) {
	  if (obj) return mixin(obj);
	}
	
	/**
	 * Mixin the prototype properties.
	 *
	 * @param {Object} obj
	 * @return {Object}
	 * @api private
	 */
	
	function mixin(obj) {
	  for (var key in ResponseBase.prototype) {
	    obj[key] = ResponseBase.prototype[key];
	  }
	  return obj;
	}
	
	/**
	 * Get case-insensitive `field` value.
	 *
	 * @param {String} field
	 * @return {String}
	 * @api public
	 */
	
	ResponseBase.prototype.get = function(field){
	    return this.header[field.toLowerCase()];
	};
	
	/**
	 * Set header related properties:
	 *
	 *   - `.type` the content type without params
	 *
	 * A response of "Content-Type: text/plain; charset=utf-8"
	 * will provide you with a `.type` of "text/plain".
	 *
	 * @param {Object} header
	 * @api private
	 */
	
	ResponseBase.prototype._setHeaderProperties = function(header){
	    // TODO: moar!
	    // TODO: make this a util
	
	    // content-type
	    var ct = header['content-type'] || '';
	    this.type = utils.type(ct);
	
	    // params
	    var params = utils.params(ct);
	    for (var key in params) this[key] = params[key];
	
	    this.links = {};
	
	    // links
	    try {
	        if (header.link) {
	            this.links = utils.parseLinks(header.link);
	        }
	    } catch (err) {
	        // ignore
	    }
	};
	
	/**
	 * Set flags such as `.ok` based on `status`.
	 *
	 * For example a 2xx response will give you a `.ok` of __true__
	 * whereas 5xx will be __false__ and `.error` will be __true__. The
	 * `.clientError` and `.serverError` are also available to be more
	 * specific, and `.statusType` is the class of error ranging from 1..5
	 * sometimes useful for mapping respond colors etc.
	 *
	 * "sugar" properties are also defined for common cases. Currently providing:
	 *
	 *   - .noContent
	 *   - .badRequest
	 *   - .unauthorized
	 *   - .notAcceptable
	 *   - .notFound
	 *
	 * @param {Number} status
	 * @api private
	 */
	
	ResponseBase.prototype._setStatusProperties = function(status){
	    var type = status / 100 | 0;
	
	    // status / class
	    this.status = this.statusCode = status;
	    this.statusType = type;
	
	    // basics
	    this.info = 1 == type;
	    this.ok = 2 == type;
	    this.redirect = 3 == type;
	    this.clientError = 4 == type;
	    this.serverError = 5 == type;
	    this.error = (4 == type || 5 == type)
	        ? this.toError()
	        : false;
	
	    // sugar
	    this.accepted = 202 == status;
	    this.noContent = 204 == status;
	    this.badRequest = 400 == status;
	    this.unauthorized = 401 == status;
	    this.notAcceptable = 406 == status;
	    this.forbidden = 403 == status;
	    this.notFound = 404 == status;
	};


/***/ },
/* 10 */
/***/ function(module, exports) {

	var ERROR_CODES = [
	  'ECONNRESET',
	  'ETIMEDOUT',
	  'EADDRINFO',
	  'ESOCKETTIMEDOUT'
	];
	
	/**
	 * Determine if a request should be retried.
	 * (Borrowed from segmentio/superagent-retry)
	 *
	 * @param {Error} err
	 * @param {Response} [res]
	 * @returns {Boolean}
	 */
	module.exports = function shouldRetry(err, res) {
	  if (err && err.code && ~ERROR_CODES.indexOf(err.code)) return true;
	  if (res && res.status && res.status >= 500) return true;
	  // Superagent timeout
	  if (err && 'timeout' in err && err.code == 'ECONNABORTED') return true;
	  return false;
	};

/***/ },
/* 11 */
/***/ function(module, exports) {

	
	/**
	 * Return the mime type for the given `str`.
	 *
	 * @param {String} str
	 * @return {String}
	 * @api private
	 */
	
	exports.type = function(str){
	  return str.split(/ *; */).shift();
	};
	
	/**
	 * Return header field parameters.
	 *
	 * @param {String} str
	 * @return {Object}
	 * @api private
	 */
	
	exports.params = function(str){
	  return str.split(/ *; */).reduce(function(obj, str){
	    var parts = str.split(/ *= */);
	    var key = parts.shift();
	    var val = parts.shift();
	
	    if (key && val) obj[key] = val;
	    return obj;
	  }, {});
	};
	
	/**
	 * Parse Link header fields.
	 *
	 * @param {String} str
	 * @return {Object}
	 * @api private
	 */
	
	exports.parseLinks = function(str){
	  return str.split(/ *, */).reduce(function(obj, str){
	    var parts = str.split(/ *; */);
	    var url = parts[0].slice(1, -1);
	    var rel = parts[1].split(/ *= */)[1].slice(1, -1);
	    obj[rel] = url;
	    return obj;
	  }, {});
	};
	
	/**
	 * Strip content related fields from `header`.
	 *
	 * @param {Object} header
	 * @return {Object} header
	 * @api private
	 */
	
	exports.cleanHeader = function(header, shouldStripCookie){
	  delete header['content-type'];
	  delete header['content-length'];
	  delete header['transfer-encoding'];
	  delete header['host'];
	  if (shouldStripCookie) {
	    delete header['cookie'];
	  }
	  return header;
	};

/***/ },
/* 12 */
/***/ function(module, exports, __webpack_require__) {

	/* global firebase */
	const config = __webpack_require__(2).firebase
	var fbApp = firebase.initializeApp(config)
	const fbAuth = firebase.auth()
	const database = fbApp.database()
	
	const firebaseHelper = {
	  fetchUser: function (userToFetch) {
	    console.log(userToFetch)
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
	    console.log(user, displayNameToSave)
	    user.updateProfile({
	      displayName: displayNameToSave
	    })
	      .then(function () {
	        console.log('display name saved')
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
	    console.log(artworkToAdd)
	    return fbApp.database()
	      .ref('artwork')
	      .push(artworkToAdd)
	  }, // end addArtwork()
	  addArtworkToUserGallery: function (uidAndArtworkId) {
	    console.log(uidAndArtworkId)
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
	    console.log(artworkId, artworkToEdit)
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
	          Object.keys(fbSnapshot).reduce(function (previous, key) {
	            if (fbSnapshot[key] === artworkId) {
	              return key
	            }
	          })
	        return database.ref('/userGalleries/' + userId + '/' + artworkIdToDelete).remove()
	      })
	  } // end deleteArtworkFromUserGallery()
	}
	
	module.exports = firebaseHelper


/***/ }
/******/ ]);