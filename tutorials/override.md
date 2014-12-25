# Tutorial: Override

When writing unit tests, you'll probably want to replace calls to `Firebase` in your source code with `MockFirebase`.

When `Firebase` is attached to the `window`, you can replace it using the `override` method:

```js
MockFirebase.override();
```

Now all future calls to `Firebase` will actually call `MockFirebase`. Make sure you call `override` before calling `Firebase` in your source, otherwise the reference will be created before the override is performed.