var express = require('express');
var bodyParser = require('body-parser');
var app = express();
var path = require('path')
var jwt = require('jsonwebtoken');  
var expressJwt = require('express-jwt'); 
var cookieParser = require('cookie-parser');

const cors = require('cors');

var xlsx = require('node-xlsx');
var urlencodedParser = bodyParser.urlencoded({ extended: true });

var fs = require('fs');
const config = require('./config.js');
const multer = require('multer');

app.use(cookieParser());
app.use(express.json());
app.use(express.static('public'))

//prepare for file upload and setting condition for  excel and single file 
var storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, 'public/')
    },
    filename: (req, file, cb) => {
      cb(null, file.originalname)
    }
});
var upload = multer({ 
    storage: storage,
    fileFilter: function (req, file, callback) {
        var ext = path.extname(file.originalname);
        if(ext !== '.xls' && ext !== '.xlsx') {
            return callback(new Error('Only excel file are allowed'))
        }
        callback(null, true)
    },
    limits:{
    	files: 1,
        fileSize: 9024 * 1024
    }
});





app.use(checktoken)


app.get('/file', function (req, res) {

   res.sendFile( __dirname + "/" + "fileconvert.html" );
})
//to upload and convert file 
app.post('/file',upload.single('file-to-upload'), function (req, res) {

	//file uploaded  

	//to convert file
var filename_upload=req.file.filename;

var delimiter=req.body.delimiter;
var xlsx = require('node-xlsx');
var fs = require('fs');
var obj = xlsx.parse(__dirname +'/public/'+filename_upload); // parses a file
var rows = [];
var writeStr = "";
 
//looping through all sheets
for(var i = 0; i < obj.length; i++)
{
    var sheet = obj[i];
    //loop through all rows in the sheet
    for(var j = 0; j < sheet['data'].length; j++)
    {
            //add the row to the rows array
            rows.push(sheet['data'][j]);
    }
}

//creates the csv string to write it to a file
for(var i = 0; i < rows.length; i++)
{
    writeStr += rows[i].join(delimiter) + "\n";
}

//writes to a file,
fs.writeFile(__dirname + '/public/'+filename_upload+'.csv', writeStr, function(err) {
    if(err) {
        return console.log(err);
    }
    console.log("file was saved in the current directory!");
    // res.redirect('/download');
     res.send("<a href='/"+filename_upload+".csv' download>download the csv file</a>");
});
  })

app.post('/afterlogin',verifyJwtToken, function(req,res){  //for testing pupose only ! not included in this website 
	jwt.verify(req.token,config.secretkey,(err,authData) => {
		if(err){
			res.sendStatus(403);
		}
		else{
			res.json( {message :"verify worked",
			authData });
		}
	});

})

app.get('/', function (req, res) {  //home page
   res.sendFile( __dirname + "/" + "signup.html" );
}) 
app.get('/check', function (req, res) { //for testing pupose only ! not included int this website 
   res.send(req.cookies.token);
})
app.get('/download', function (req, res) {  //file download link present
   res.sendFile( __dirname + "/" + "filedownload.html" );
})

app.post('/login',urlencodedParser, function (req, res) {
  var n=req.body.username;
  var p=req.body.password;

  if((n == 'naren' && p == '123456') || (n == 'pratik' && p =='abcde'))
  {

  let token = jwt.sign({username: n},config.secretkey,{expiresIn: 260*24}); // expires in 24 hour ,here we set the token in httoonly cookie
   res.cookie('token',token ,{secure:false,httpOnly:true ,maxAge: 360*24});
   res.redirect('/file');
}
else {
res.send("Aunthentication failed ! plz check userid/password");

}
})








function verifyJwtToken(req,res,next){ // this while making api calls not used here in website

	const bh=req.headers['authorization'];
	if(typeof bh!=='undefined')
	{
 		const bearToken=(bh.split(' '))[1];
 		req.token=bearToken;
 		next();
	}
	else {
		res.sendStatus(403);
	}


}

function checktoken(req,res,next){  //this middleware is called to check token at every request
	console.log("current url  "+req.originalUrl);
	if((req.originalUrl!='/') && (typeof(req.cookies.token)!='undefined'))   //first login  page wont have token before login 
	{
	var coktoken=req.cookies.token;   
console.log("inside token check"+coktoken);
if(coktoken){

jwt.verify(coktoken,config.secretkey,(err,authData) => { //verify the token 
		if(err){
			res.send("token verification failed");
		}
		else {
			console.log("iverfiied token "+coktoken);
		}
	
	});
	

console.log("verfied token "+coktoken);
} 
else {
	res.send("token expired /"+coktoken );
}

}
else {
	console.log("token is undfined or in login page");
	
}
next();
}


app.listen(8080, function () {
  console.log('listening on http://localhost:8080');
});