module.exports = function (app) {
  app.post('/authenticate', function (req, res) {
    console.log(req.body)
    res.send({ token: 'did it' })
  })
}
