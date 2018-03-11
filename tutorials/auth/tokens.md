# Tutorial: JWT Tokens
Mock JWT tokens used to identify the user to a Firebase service.

##### Source
```js
function clientLogic() {
  firebase.auth().currentUser.getIdToken().then(function(token) {
    // make request to firebase service using token
    console.log(token);
  });
}

function serverLogic(token) {
  firebase.auth().verifyIdToken(token).then(function(user) {
    // do something with the user
    console.log(user.uid);
  });
}
```

##### Test
```js
mocksdk.auth().autoFlush();

// create user
mocksdk.auth().createUser({
  uid: '123',
  email: 'test@test.com',
  password 'abc123'
}).then(function(user) {
  // set user as current user for client logic
  mocksdk.auth().changeAuthState(user);
});

clientLogic();
// token has been logged

mocksdk.auth().getUser('123').then(function(user) {
  user.getIdToken().then(function(token) {
    serverLogic(token);
    // uid has been logged
  });
});
```
