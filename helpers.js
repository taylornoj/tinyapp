const bcrypt = require('bcryptjs');

const users = {
  "userRandomID": {
    id: "userRandomID",
    email: "a@a.com",
    password: bcrypt.hashSync("123", 10)
  },
  "user2RandomID": {
    id: "user2RandomID",
    email: "b@b.com",
    password: bcrypt.hashSync("1234", 10)
  }
};

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

function generateRandomString() {
  let result = '';
  let characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz1234567890';
  while (result.length < 6) {
    result += characters.charAt(Math.floor(Math.random() * 62));
  }
  return result;
}

const getUserByEmail = function(email, database) {
  for (const user in database) {
    if (database[user].email === email) {
      return user;
    }
  }
  return undefined;
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

module.exports = { generateRandomString, getUserByEmail, urlsForUser, urlDatabase, users };