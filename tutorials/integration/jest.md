# Tutorial: Integrating with jest

## Examples

### RTDB

#### Source
```js
// ./mySrc.js
import firebase from '../path-to-firebase-init';

var ref = firebase.database().ref('myRefUrl');
ref.on('value', function (snapshot) {
  console.log(snapshot.val());
});
```

#### Test
```js
var jest = require('jest');

jest.mock('../path-to-firebase-init', () => {
  return mocksdk;
});

mocksdk.database().flush();
// data is logged
```

### Firestore

#### Source

```js
// ./mySrc.js
import firebase from '../path-to-firebase-init';

var ref = firebase.firestore().doc('users/123');
ref.get().then(function(doc) {
  console.log(doc.data());
}).catch(function(err) {
  console.error(err);
});
```

#### Test

```js
var jest = require('jest');

jest.mock('../path-to-firebase-init', () => {
  return mocksdk;
});

mocksdk.firestore().flush();
// data is logged
```
