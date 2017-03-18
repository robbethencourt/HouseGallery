module.exports = function (app) {
  // app.post('/authenticate', function (req, res) {
  //   console.log(req.body)
  //   res.send({ token: 'did it' })
  // })
  app.get('/', function (req, res) {
    res.sendFile(__dirname + './src/dist/index.html')
  }) // end app.get()
}
