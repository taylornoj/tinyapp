const express = require("express");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const PORT = 8080;

// --- MIDDLEWARE
const app = express();
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());
app.set("view engine", "ejs");

// --- DATABASES
const urlDatabase = {
  "b2xVn2": {
    longURL: "http://www.lighthouselabs.ca",
    userID: "aJ48lW"
  },
  "9sm5xK": {
    longURL: "http://www.google.com",
    userID: "aJ48lW"
  }
};

const users = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur"
  },
  "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk"
  }
};

// --- HELPER FUNCTIONS
function generateRandomString() {
  let result = '';
  let characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz1234567890';
  while (result.length < 6) {
   result += characters.charAt(Math.floor(Math.random() * 62));
  }
  return result;
};

const emailInUsers = (email) => {
  for (id in users) {
    if (users[id].email === email) {
      return id;
    }
  }
  return false;
};

const urlsForUser = (id) => {
  let userShortUrl = {};
  for (let url in urlDatabase) {
    if (id === urlDatabase[url].userID) {
      userShortUrl[url] = urlDatabase[url];
    }
  }
  return userShortUrl;
};

// --- ROOT
app.get("/", (req, res) => {
  const templateVars = {
    urls: urlDatabase,
    user_id: req.cookies["user_id"],
    users
  };
  //console.log("usercookieid", templateVars.user_id);
  res.render("urls_index", templateVars);
});


// --- URL LIST
app.get("/urls", (req, res) => {
  const userShortUrl = urlsForUser(req.cookies["user_id"])
  const templateVars = {
    urls: userShortUrl,     //urlDatabase
    user_id: req.cookies["user_id"],
    users
  };
  res.render("urls_index", templateVars);
});

// --- CREATE URL
app.get("/urls/new", (req, res) => {
  const templateVars = {
    urls: urlDatabase,
    user_id: req.cookies["user_id"],
    users
  };
  res.render("urls_new", templateVars);
});

// --- TINYURL
app.post("/urls", (req, res) => {
  console.log(req.body);
  if (!req.cookies.user_id) {
    res.redirect("/login");
  } else if (req.cookies.user_id) {
    const shortString = generateRandomString();
    //urlDatabase[shortString] = req.body.longURL;
    urlDatabase[shortString] = {};
    urlDatabase[shortString].longURL = req.body.longURL;
    urlDatabase[shortString].userID = req.cookies["user_id"];
  res.redirect(`/urls/${shortString}`);
  }
});

// --- TINY W/ EDIT
app.get("/urls/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  let haveAccess = false;

  const user_id = req.cookies["user_id"]
  if (urlDatabase[shortURL].userID === user_id) {
    haveAccess = true;
  }
  console.log(shortURL);
  const templateVars = {
    shortURL: req.params.shortURL,
    longURL: urlDatabase[shortURL].longURL,
    user_id: req.cookies["user_id"],
    users,  
    haveAccess
  };
  res.render("urls_show", templateVars);
});

// EDIT 
app.post("/urls/:id", (req, res) => {
  const shortURL = req.params.id;
  const longURL = req.body.newURL;

  const userid = req.cookies["user_id"];
  if(urlDatabase[shortURL].userID !== userid) {
    return res.status(400).send("Denied");
  } 
  urlDatabase[shortURL] = {
    longURL,
    userID: req.cookies["user_id"]
  };
  res.redirect('/urls');
});

// --- DELETE FUNCTION
app.post("/urls/:shortURL/delete", (req, res) => {
  const shortURL = req.params.shortURL;
  const userid = req.cookies["user_id"];
  if(urlDatabase[shortURL].userID !== userid) {
    return res.status(400).send("Denied Permissions to Delete");
  }
  delete urlDatabase[shortURL];
  res.redirect('/urls');
});

// --- REGISTER PAGE - EJS FILE
app.get("/register", (req, res) => {
  const templateVars = {
    urls: urlDatabase,
    user_id: req.cookies["user_id"],
    users
  };
  res.render("urls_registration", templateVars);
});

// --- REGISTER W/ ERROR MESSAGES
app.post("/register", (req, res) => {
  const enteredEmail = req.body.email;
  const enteredPassword = req.body.password;

  if (!enteredEmail || !enteredPassword) {
    res.status(400).send("400: Invalid email/password");
  } else if (emailInUsers(enteredEmail, users)) {
    res.status(400).send("400: Account already exists");
  } else {
    const user = {
      id: generateRandomString(),
      email: req.body.email,
      password: req.body.password,
    };
    users[user.id] = user;
    console.log(users);
    res.cookie("user_id", user.id);
    res.redirect('/urls');
}
});

// --- LOGIN W/ ERROR MESSAGES
app.post("/login", (req, res) => {
  const enteredEmail = req.body.email;
  const enteredPassword = req.body.password;
  if (!enteredEmail) {
    return res.status(403).send("403: Email not found");
  } else if (emailInUsers(enteredEmail, users)) {
    const user = emailInUsers(enteredEmail, users);
    if (enteredPassword !== users[user].password) {
      return res.status(403).send("403: Invalid Username/Password");
    } else {
      res.cookie("user_id", user);
      res.redirect('/urls');
    }
  } else {
    return res.status(400).send("Email not found");
  }
});

// --- LOGIN PAGE - EJS FILE
app.get("/login", (req, res) => {
  const templateVars = {
    urls: urlDatabase,
    user_id: req.cookies["user_id"],
    users
  };
  res.render("urls_login", templateVars);
});

// --- LOGOUT WITH REDIRECT
app.post("/logout", (req, res) => {
  res.clearCookie('user_id', req.body.user);
  res.redirect('urls');
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

