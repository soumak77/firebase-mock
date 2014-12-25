# Tutorial: Authentication

MockFirebase replaces most of Firebase's authentication method with simple mocks. Authentication methods will always succeed unless an error is specifically specified using [`failNext`](../API.md#failnextmethod-err---undefined). You can still use methods like `createUser`. Instead of storing new users remotely, MockFirebase will maintain a local list of users and simulate normal Firebase behavior (e.g. prohibiting duplicate email addresses).

## Creating Users

In this example, we'll create a new user via our source code and test that he is written to Firebase.

##### Source

```js
var users = {
  ref: function () {
    return new Firebase('https://example.firebaseio.com');
  }
  create: function (credentials, callback) {
    users.ref().createUser(credentials, callback);
  }
};
```

##### Test

```js
MockFirebase.override();
var ref = users.ref();
users.create({
  email: 'ben@example.com',
  password: 'examplePass'
});
users.flush();
console.assert(users.getEmailUser('ben@example.com'), 'ben was created');
```

## Manually Changing Authentication State

MockFirebase provides a special `changeAuthState` method on references to aid in unit testing code that reacts to new user data. `changeAuthState` allows us to simulate a variety of authentication scenarios such as a new user logging in or a user logging out. 

In this example, we want to redirect to an admin dashboard when a user is an administrator. To accomplish this, we'll use custom authentication data.

##### Source

```js
users.ref().onAuth(function (authData) {
  if (authData.auth.isAdmin) {
    document.location.href = '#/admin';
  }
});
```

##### Test

```js
ref.changeAuthState({
  uid: 'testUid',
  provider: 'custom',
  token: 'authToken',
  expires: Math.floor(new Date() / 1000) + 24 * 60 * 60,
  auth: {
    isAdmin: true
  }
});
ref.flush();
console.assert(document.location.href === '#/admin', 'redirected to admin');
```