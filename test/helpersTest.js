const { assert } = require('chai');

const { getUserByEmail } = require('../helpers.js');

const testUsers = {
  "userRandomID": {
    id: "userRandomID", 
    email: "a@a.com", 
    password: "123"
  },
  "user2RandomID": {
    id: "user2RandomID", 
    email: "b@b.com", 
    password: "1234"
  }
};

describe('getUserByEmail', function() {
  it('should return a user with valid email', function() {
    const user = getUserByEmail("a@a.com", testUsers)
    const expectedUserID = "userRandomID";
    assert.equal(user, expectedUserID);
  });

  it('should return undefined if email not in database', function() {
    const user = getUserByEmail("fakeemail@gmail.com", testUsers);
    const expectedOutput = undefined;
    assert.equal(user, expectedOutput);
  });
});