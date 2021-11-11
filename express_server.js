const express = require("express");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const PORT = 8080; // default port 8080


const app = express();
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());
app.set("view engine", "ejs");

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
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
}

// const emailLookupError = function(email, userDB) {
//   for (let user in userDB) {
//     if (userDB[user].email === email) {
//       return true;
//     }
//   }
//   return false;
// }
const emailInUsers = (email) => {
  for (id in users) {
    if (users[id].email === email) {
      return id;
    }
  }
  return false;
};

const existingPassword = (password, email) => {
  const id = emailInUsers(email);
  if (!id) {
    return false;
  }
  if (users[id].password === password) {
    return id;
  }
  return false;
};


app.get("/", (req, res) => {
  const templateVars = {
    urls: urlDatabase,
    user: req.cookies["user_id"]
  };
  res.render("urls_index", templateVars);
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/urls", (req, res) => {
  const templateVars = { 
    urls: urlDatabase,
    user: req.cookies["user_id"], 
  };
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => { //template vars are not being handed down
  const templateVars = {
    user: req.cookies["user_id"],
  };
  res.render("urls_new", templateVars);
});

app.post("/urls", (req, res) => {
  console.log(req.body);  // Log the POST request body to the console
  const shortString = generateRandomString();
  urlDatabase[shortString] = req.body.longURL;
  res.redirect(`/urls/${shortString}`);        
});

app.get("/urls/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  const templateVars = { 
    shortURL, 
    longURL: urlDatabase[shortURL],
    user: req.cookies["user_id"]
   };
  res.render("urls_show", templateVars);
});

app.post("/urls/:id", (req, res) => {
  const shortURL = req.params.id;
  const longURL = req.body.newURL;
  urlDatabase[shortURL] = longURL;
  res.redirect('/urls');
});

app.post("/urls/:shortURL/delete", (req, res) => {
  const shortURL = req.params.shortURL;
  delete urlDatabase[shortURL];
  res.redirect('/urls');
});


app.get("/register", (req, res) => {
  const templateVars = {
    user: req.cookies["user_id"],
  }
  res.render("urls_registration", templateVars);
});

//
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
  res.cookie("user_id", user);
  res.redirect('/urls');
}
});

app.post("/login", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  const userId = emailInUsers(email);
  if (!userId) {
    return res.status(403).send("403: Email not found");
  }
  if (!existingPassword(password, email)) {
    return res.status(403).send("403: Invalid username/password");
  }
  res.cookie("user_id", userId);
  res.redirect('/urls');
});

app.get("/login", (req, res) => {
  const userId = req.cookies["user_id"];
  if(userId) {
    res.redirect("/urls");
  }
  const templateVars = {
    user: null,
  };
  
  res.render("urls_login", templateVars);
});

app.post("/logout", (req, res) => {
  res.clearCookie('user_id', req.body.user);
  res.redirect('urls');
});

app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL];
  res.redirect(longURL);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

function generateRandomString() {
  let result = '';
  let characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz1234567890';
  while (result.length < 6) {
      result += characters.charAt(Math.floor(Math.random() * 62));
  }
  return result;
};