const express = require("express");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const bcrypt = require('bcryptjs');
const morgan = require('morgan');
const cookieSession = require('cookie-session');
const PORT = 8080;

// --- MIDDLEWARE
const app = express();
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());
app.use(morgan('dev'));
app.use(cookieSession({
  name: 'session',
  keys: ['key1', 'key2']
}))
const { generateRandomString, urlsForUser, emailInUsers, urlDatabase, users } = require("./helpers");
// --- DATABASES
// const urlDatabase = {
//   "b2xVn2": {
//     longURL: "http://www.lighthouselabs.ca",
//     userID: "aJ48lW"
//   },
//   "9sm5xK": {
//     longURL: "http://www.google.com",
//     userID: "aJ48lW"
//   }
// };
// // console.log("==========", urlDatabase["b2xVn2"]);
// const users = {
//   "userRandomID": {
//     id: "userRandomID",
//     email: "a@a.com",
//     password: bcrypt.hashSync("123", 10)
//   },
//   "user2RandomID": {
//     id: "user2RandomID",
//     email: "b@b.com",
//     password: bcrypt.hashSync("123", 10)
//   }
// };
// // console.log("==========", users["userRandomID"]);
// // --- HELPER FUNCTIONS
// function generateRandomString() {
//   let result = '';
//   let characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz1234567890';
//   while (result.length < 6) {
//    result += characters.charAt(Math.floor(Math.random() * 62));
//   }
//   return result;
// };

// const emailInUsers = (email) => {
//   for (id in users) {
//     if (users[id].email === email) {
//       return id;
//     }
//   }
//   return false;
// };

// const urlsForUser = (id) => {
//   let userShortUrl = {};
//   for (let url in urlDatabase) {
//     if (id === urlDatabase[url].userID) {
//       userShortUrl[url] = urlDatabase[url];
//     }
//   }
//   return userShortUrl;
// };

// --- ROOT
app.get("/", (req, res) => {
  const templateVars = {
    urls: urlDatabase,
    user_id: req.session.user_id,                 //eq.cookies["user_id"],
    users
  };
  //console.log("usercookieid", templateVars.user_id);
  res.render("urls_index", templateVars);
});


// --- URL LIST
app.get("/urls", (req, res) => {
  console.log("+++++++", urlDatabase);
  const userId = req.session.user_id;
  if (!userId) {
    res.redirect("/login");
    return 
  }
  
  console.log(userId);
  const user = users[userId];
  const userShortUrl = urlsForUser(userId) 
  console.log(userShortUrl);
  // console.log(users);         //req.cookies);   ////////**** 
  const templateVars = {
    urls: userShortUrl,     //urlDatabase
    user_id: req.session.user_id,
    user
  };
  res.render("urls_index", templateVars);
});

// --- CREATE URL
app.get("/urls/new", (req, res) => {
  const userId = req.session.user_id;
  const user = users[userId];
  const templateVars = {
    urls: urlDatabase,            
    user
  };
  res.render("urls_new", templateVars);
});

// --- TINYURL
app.post("/urls", (req, res) => {
  console.log(req.body);
  if (!req.session.user_id) {                     ///////** 
    res.redirect("/login");
  } else if (req.session.user_id) {              //  req.cookies.user_id) {    /////////////
    const shortString = generateRandomString();
    //urlDatabase[shortString] = req.body.longURL;
    urlDatabase[shortString] = {};
    urlDatabase[shortString].longURL = req.body.longURL;
    urlDatabase[shortString].userID = req.session.user_id;         //req.cookies["user_id"];
  res.redirect(`/urls/${shortString}`);
  }
});

// --- TINY W/ EDIT
app.get("/urls/:shortURL", (req, res) => {
  const userId = req.session.user_id;
  const user = users[userId];
  const shortURL = req.params.shortURL;
  const urlObject = urlDatabase[shortURL];
  let haveAccess = false;
  if (!urlObject) {
    console.log("invalid shortURL");
    return res.send("invalid shortURL");
  }

  if (urlObject.userID !== userId) {
    console.log("This object belongs to another user");
    return res.send("This object belongs to another user");
  }
                     
  if (urlObject.userID === userId) {
    const templateVars = {
      shortURL,
      longURL: urlObject.longURL,     
      user
    };
    res.render("urls_show", templateVars);
  }
  console.log(shortURL);
});

// EDIT 
app.post("/urls/:id", (req, res) => {
  const shortURL = req.params.id;
  const longURL = req.body.newURL;

  const userid = req.session.user_id;                   //req.cookies["user_id"];
  if(urlDatabase[shortURL].userID !== userid) {
    return res.status(400).send("Denied");
  } 
  urlDatabase[shortURL] = {
    longURL,
    userID: req.session.user_id                         //req.cookies["user_id"]
  };
  res.redirect('/urls');
});

// --- DELETE FUNCTION
app.post("/urls/:shortURL/delete", (req, res) => {
  const shortURL = req.params.shortURL;
  const userid = req.session.user_id;                     //req.cookies["user_id"];
  if(urlDatabase[shortURL].userID !== userid) {
    return res.status(400).send("Denied Permissions to Delete");
  }
  delete urlDatabase[shortURL];
  res.redirect('/urls');
});

// --- REGISTER PAGE - EJS FILE
app.get("/register", (req, res) => {
  const templateVars = {
    user: null
  };
  res.render("urls_registration", templateVars);
});

// --- REGISTER W/ ERROR MESSAGES & BCRYPT APPLIED
app.post("/register", (req, res) => {
  const enteredEmail = req.body.email;
  const enteredPassword = req.body.password;
  const password = bcrypt.hashSync(req.body.password, 10);


  if (!enteredEmail || !enteredPassword) {
    res.status(400).send("400: Invalid email/password");
  } else if (emailInUsers(enteredEmail, users)) {
    res.status(400).send("400: Account already exists");
  } else {
    const user = {
      id: generateRandomString(),
      email: req.body.email,
      password,
    };
    users[user.id] = user;
    //res.cookie("user_id", user.id);
    req.session.user_id = user.id;
    res.redirect('/urls');
}
});

// --- LOGIN W/ ERROR MESSAGES & BCRYPT APPLIED
app.post("/login", (req, res) => {
  const enteredEmail = req.body.email;
  const enteredPassword = req.body.password;
  if (!enteredEmail) {
    return res.status(403).send("403: Email not found");
  } else {
    const user = emailInUsers(enteredEmail, users);
    const userID = user.id;
    console.log(userID);
    if (users[userID] && !bcrypt.compareSync(enteredPassword, users[userID]["password"])) {
      return res.status(403).send("403: Invalid Username/Password");
    } else {
      //res.cookie("user_id", userID);
      req.session.user_id = userID;  /////
      res.redirect('/urls');
    }
  }
});

// --- LOGIN PAGE - EJS FILE
app.get("/login", (req, res) => {
  const templateVars = {
    user: null
  };
  res.render("urls_login", templateVars);
});

// --- LOGOUT WITH REDIRECT
app.post("/logout", (req, res) => {
  req.session.user_id = null;
  res.clearCookie('user_id');             //
  res.redirect('/urls');
});

// --- REPONSE TO /u/TINYURL SHORTURL
app.get("/u/:shortURL", (req, res) => {
  if (urlDatabase[req.params.shortURL] === undefined) {
    res.status(404).send("404: Page Not Found");
  } else {
  const longURL = urlDatabase[req.params.shortURL].longURL;
  res.redirect(longURL);
  }
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});