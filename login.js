


var secret = 'This is the secret for signing tokens';

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use('/', express.static(__dirname + '/'));


app.post('/login', function(req, res) {
  if (!(req.body.username === 'john.doe' && req.body.password === 'foobar')) {
    res.status(401).send('Wrong user or password');
    console.log('failed login');
    return;
  }
  console.log('successful login');
  // We are sending the profile inside the token
  var token = jwt.sign({ firstname: 'John', lastname: 'Doe'}, secret, { expiresIn: 5 * 60 });
  res.json({ token: token });
});
app.get('/convert', function (req, res) {
   res.sendFile( __dirname + "/" + "login.js" );
})
// We are going to protect /api routes with JWT
app.use('/api', expressJwt({secret: secret}));

app.use(function(err, req, res, next){
  if (err.constructor.name === 'UnauthorizedError') {
    res.status(401).send('Unauthorized');
  }
});

app.get('/api/profile', function (req, res) {
  console.log('user ' + req.user.firstname + ' is calling /api/profile');
  res.json({
    name: req.user.firstname
  });
});



