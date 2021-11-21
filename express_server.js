const express = require("express");
const bodyParser = require("body-parser");
const bcrypt = require("bcryptjs");
const morgan = require("morgan");
const cookieSession = require("cookie-session");
const PORT = 8080;

// --- MIDDLEWARE
const app = express();
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended: true}));
app.use(morgan("dev"));
app.use(cookieSession({
  name: "session",
  keys: ["key1", "key2"]
}));

// --- HELPER.JS
const { generateRandomString, urlsForUser, getUserByEmail, urlDatabase, users } = require("./helpers");

// --- ROOT
app.get("/", (req, res) => {
  res.redirect("/urls");
});

// --- USER URL LIST or REDIRECT FOR NON USER
app.get("/urls", (req, res) => {
  const userId = req.session.user_id;
  if (!userId) {
    res.redirect("/login");
    return;
  }
  const user = users[userId];
  const userShortUrl = urlsForUser(userId);
  const templateVars = {
    urls: userShortUrl,     
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
  if (!userId) {
    return res.redirect("/login");
  }
  res.render("urls_new", templateVars);
});

// --- GENERATE SHORT URL or REDIRECT FOR NON USER
app.post("/urls", (req, res) => {
  if (!req.session.user_id) {
    res.redirect("/login");
  } else if (req.session.user_id) {
    const shortString = generateRandomString();
    urlDatabase[shortString] = {};
    urlDatabase[shortString].longURL = req.body.longURL;
    urlDatabase[shortString].userID = req.session.user_id;
    res.redirect(`/urls/${shortString}`);
  }
});

// --- SHORTURL INFO PAGE WITH EDIT OPTION
app.get("/urls/:shortURL", (req, res) => {
  const userId = req.session.user_id;
  const user = users[userId];
  const shortURL = req.params.shortURL;
  const urlObject = urlDatabase[shortURL];
  if (!urlObject) {
    return res.send("400: URL Does Not Exist");
  }
  if (urlObject.userID !== userId) {
    return res.send("401: Access to URL Information page Denied");
  }
  if (urlObject.userID === userId) {
    const templateVars = {
      shortURL,
      longURL: urlObject.longURL,
      user
    };
    res.render("urls_show", templateVars);
  }
});

// EDIT
app.post("/urls/:id", (req, res) => {
  const shortURL = req.params.id;
  const longURL = req.body.newURL;
  const userid = req.session.user_id;
  if (urlDatabase[shortURL].userID !== userid) {
    return res.status(400).send("400: Denied");
  }
  urlDatabase[shortURL] = {
    longURL,
    userID: req.session.user_id
  };
  res.redirect("/urls");
});

// --- DELETE FUNCTION
app.post("/urls/:shortURL/delete", (req, res) => {
  const shortURL = req.params.shortURL;
  const userid = req.session.user_id;
  if (urlDatabase[shortURL].userID !== userid) {
    return res.status(400).send("400: Denied Permissions to Delete");
  }
  delete urlDatabase[shortURL];
  res.redirect("/urls");
});

// --- REGISTER PAGE
app.get("/register", (req, res) => {
  if (req.session.user_id) {
    return res.redirect('/urls');
  }
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
  } else if (getUserByEmail(enteredEmail, users)) {
    res.status(400).send("400: Account already exists");
  } else {
    const user = {
      id: generateRandomString(),
      email: req.body.email,
      password,
    };
    users[user.id] = user;
    req.session.user_id = user.id;
    res.redirect("/urls");
  }
});

// --- LOGIN PAGE W/ ERROR MESSAGES & BCRYPT APPLIED
app.post("/login", (req, res) => {
  const enteredEmail = req.body.email;
  const enteredPassword = req.body.password;
  if (!enteredEmail) {
    return res.status(403).send("403: Email not Found");
  } else if (getUserByEmail(enteredEmail, users)) { //
    const userID = getUserByEmail(enteredEmail, users);
    const user = users[userID];
    if (!bcrypt.compareSync(enteredPassword, user.password)) {
      return res.status(403).send("Invalid Username/Password");
    } else {
      req.session.user_id = userID;
      res.redirect("/urls");
    }
  } else {
    return res.status(400).send("400: Email not found");
  }
});

// --- LOGIN PAGE
app.get("/login", (req, res) => {
  if (req.session.user_id) {
    return res.redirect('/urls');
  }
  const templateVars = {
    user: null
  };
  res.render("urls_login", templateVars);
});

// --- REPONSE TO /u/SHORTURL - ERROR or REDIRECT
app.get("/u/:shortURL", (req, res) => {
  if (urlDatabase[req.params.shortURL] === undefined) {
    res.status(404).send("404: Page Not Found");
  } else {
    const longURL = urlDatabase[req.params.shortURL].longURL;
    res.redirect(longURL);
  }
});

// --- LOGOUT, DELETE COOKIE AND REDIRECT
app.post("/logout", (req, res) => {
  req.session.user_id = null;
  res.clearCookie("user_id");
  res.redirect("/urls");
});

// --- URL DATABASE JSON
app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

// --- SERVER LISTEN
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});