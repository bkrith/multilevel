# multilevel

Expose a levelDB over the network, to be used by multiple process.

## Installing

```bash
npm install @bkrith/multilevel
```

## Usage

Create a Server and start listening:

```javascript
const multilevel = require('@bkrith/multilevel');

const db = new multilevel();

db.level('./myDB');

db.listen({ port: 22500 });
```

Connect from the client and use all the leveldb commands as promises:

```javascript
const multilevel = require('@bkrith/multilevel');

const db = new multilevel();

db.connect({
    address: '127.0.0.1',
    port: 22500
});

db.get('foo')
.then((value) => {
    console.log(value);
})
.catch((err) => {
    console.log(err);
});
```

And at last you can close the connection and the database:

```javascript
db.stop();
```

### Select level module

By default multilevel use level module:

```javascript
db.level(location[, options[, callback]]);
```

But you can change through "levelModule" the database instance, for example:

```javascript
db.levelModule = levelup(leveldown('./myDB'));
```

### TCP Socket

You have access on TCP Socket events:

```javascript
// Server side connection
db.on('connect', (socket) => {
    console.log('client connected', socket.remoteAddress, ':', socket.remotePort);
});

db.on('listen', (port) => {
    console.log('listen on', port);
});

// Client side connection
db.on('client', (socket) => {
    console.log('connected on Server', socket.remoteAddress, ':', socket.remotePort);
});

db.on('close', (socket) => {
    console.log('close');
});

db.on('error', (err) => {
    console.log(err);
});

db.on('data', (data) => {
  console.log(data);
});

```

Notice: Event 'data' returns Buffer object which is coded and not processed yet by the stream.

## level API

For options specific to [`leveldown`][leveldown] and [`level-js`][level-js] ("underlying store" from here on out), please see their respective READMEs.

- <a href="#ctor"><code><b>level()</b></code></a>
- <a href="#put"><code>db.<b>put()</b></code></a>
- <a href="#get"><code>db.<b>get()</b></code></a>
- <a href="#del"><code>db.<b>del()</b></code></a>
- <a href="#batch"><code>db.<b>batch()</b></code></a> _(array form)_
- <a href="#isOpen"><code>db.<b>isOpen()</b></code></a>
- <a href="#isClosed"><code>db.<b>isClosed()</b></code></a>
- <a href="#createReadStream"><code>db.<b>createReadStream()</b></code></a>
- <a href="#createKeyStream"><code>db.<b>createKeyStream()</b></code></a>
- <a href="#createValueStream"><code>db.<b>createValueStream()</b></code></a>

<a name="ctor"></a>

### `db.level(location[, options])`

The main entry point for creating a new `levelup` instance.

- `location` is a string pointing to the LevelDB location to be opened or in browsers, the name of the [`IDBDatabase`](https://developer.mozilla.org/en-US/docs/Web/API/IDBDatabase) to be opened.
- `options` is passed on to the underlying store.
- `options.keyEncoding` and `options.valueEncoding` are passed to [`encoding-down`][encoding-down], default encoding is `'utf8'`

Calling `db.level('my-db')` will also open the underlying store. This is an asynchronous operation which return a promise. 

The constructor function has a `.errors` property which provides access to the different error types from [`level-errors`](https://github.com/Level/errors#api). See example below on how to use it:

```js
db.level('my-db', { createIfMissing: false }, function (err, db) {
  if (err instanceof level.errors.OpenError) {
    console.log('failed to open database')
  }
})
```

Note that `createIfMissing` is an option specific to [`leveldown`][leveldown].

<a name="put"></a>

### `db.put(key, value[, options])`

<code>put()</code> is the primary method for inserting data into the store. Both `key` and `value` can be of any type as far as `levelup` is concerned.

- `options` is passed on to the underlying store
- `options.keyEncoding` and `options.valueEncoding` are passed to [`encoding-down`][encoding-down], allowing you to override the key- and/or value encoding for this `put` operation.

<a name="get"></a>

### `db.get(key[, options])`

<code>get()</code> is the primary method for fetching data from the store. The `key` can be of any type. If it doesn't exist in the store then the promise will receive an error. 

```js
db.get('foo')
.then((value) => {

  // .. handle `value` here
})
.catch((err) => {
  // Do something with error
});
```

- `options` is passed on to the underlying store.
- `options.keyEncoding` and `options.valueEncoding` are passed to [`encoding-down`][encoding-down], allowing you to override the key- and/or value encoding for this `get` operation.

<a name="del"></a>

### `db.del(key[, options])`

<code>del()</code> is the primary method for removing data from the store.

```js
db.del('foo')
.catch((err) {
  if (err)
    // handle I/O or other error
});
```

- `options` is passed on to the underlying store.
- `options.keyEncoding` is passed to [`encoding-down`][encoding-down], allowing you to override the key encoding for this `del` operation.

<a name="batch"></a>

### `db.batch(array[, options])` _(array form)_

<code>batch()</code> can be used for very fast bulk-write operations (both _put_ and _delete_). The `array` argument should contain a list of operations to be executed sequentially, although as a whole they are performed as an atomic operation inside the underlying store.

Each operation is contained in an object having the following properties: `type`, `key`, `value`, where the _type_ is either `'put'` or `'del'`. In the case of `'del'` the `value` property is ignored. Any entries with a `key` of `null` or `undefined` will cause an error to be returned on the `callback` and any `type: 'put'` entry with a `value` of `null` or `undefined` will return an error.

```js
var ops = [
  { type: 'del', key: 'father' },
  { type: 'put', key: 'name', value: 'Yuri Irsenovich Kim' },
  { type: 'put', key: 'dob', value: '16 February 1941' },
  { type: 'put', key: 'spouse', value: 'Kim Young-sook' },
  { type: 'put', key: 'occupation', value: 'Clown' }
]

db.batch(ops)
.then((ok) => {
  console.log('Great success dear leader!')
})
.catch((err) {
  return console.log('Ooops!', err);
});
```

- `options` is passed on to the underlying store.
- `options.keyEncoding` and `options.valueEncoding` are passed to [`encoding-down`][encoding-down], allowing you to override the key- and/or value encoding of operations in this batch.

<a name="isOpen"></a>

### `db.isOpen()`

A `levelup` instance can be in one of the following states:

- _"new"_     - newly created, not opened or closed
- _"opening"_ - waiting for the underlying store to be opened
- _"open"_    - successfully opened the store, available for use
- _"closing"_ - waiting for the store to be closed
- _"closed"_  - store has been successfully closed, should not be used

`isOpen()` will return `true` as promise only when the state is "open".

<a name="isClosed"></a>

### `db.isClosed()`

`isClosed()` will return `true` as promise only when the state is "closing" _or_ "closed", it can be useful for determining if read and write operations are permissible.

<a name="createReadStream"></a>

### `db.createReadStream([options])`

Returns a [Readable Stream](https://nodejs.org/docs/latest/api/stream.html#stream_readable_streams) of key-value pairs. A pair is an object with `key` and `value` properties. By default it will stream all entries in the underlying store from start to end. Use the options described below to control the range, direction and results.

```js
db.createReadStream()
  .on('data', function (data) {
    console.log(data.key, '=', data.value)
  })
  .on('error', function (err) {
    console.log('Oh my!', err)
  })
  .on('close', function () {
    console.log('Stream closed')
  })
  .on('end', function () {
    console.log('Stream ended')
  })
```

You can supply an options object as the first parameter to `createReadStream()` with the following properties:

- `gt` (greater than), `gte` (greater than or equal) define the lower bound of the range to be streamed. Only entries where the key is greater than (or equal to) this option will be included in the range. When `reverse=true` the order will be reversed, but the entries streamed will be the same.

- `lt` (less than), `lte` (less than or equal) define the higher bound of the range to be streamed. Only entries where the key is less than (or equal to) this option will be included in the range. When `reverse=true` the order will be reversed, but the entries streamed will be the same.

- `reverse` _(boolean, default: `false`)_: stream entries in reverse order. Beware that due to the way that stores like LevelDB work, a reverse seek can be slower than a forward seek.

- `limit` _(number, default: `-1`)_: limit the number of entries collected by this stream. This number represents a _maximum_ number of entries and may not be reached if you get to the end of the range first. A value of `-1` means there is no limit. When `reverse=true` the entries with the highest keys will be returned instead of the lowest keys.

- `keys` _(boolean, default: `true`)_: whether the results should contain keys. If set to `true` and `values` set to `false` then results will simply be keys, rather than objects with a `key` property. Used internally by the `createKeyStream()` method.

- `values` _(boolean, default: `true`)_: whether the results should contain values. If set to `true` and `keys` set to `false` then results will simply be values, rather than objects with a `value` property. Used internally by the `createValueStream()` method.

Legacy options:

- `start`: instead use `gte`

- `end`: instead use `lte`

Underlying stores may have additional options.

<a name="createKeyStream"></a>

### `db.createKeyStream([options])`

Returns a [Readable Stream](https://nodejs.org/docs/latest/api/stream.html#stream_readable_streams) of keys rather than key-value pairs. Use the same options as described for <a href="#createReadStream"><code>createReadStream</code></a> to control the range and direction.

You can also obtain this stream by passing an options object to `createReadStream()` with `keys` set to `true` and `values` set to `false`. The result is equivalent; both streams operate in [object mode](https://nodejs.org/docs/latest/api/stream.html#stream_object_mode).

```js
db.createKeyStream()
  .on('data', function (data) {
    console.log('key=', data)
  })

// same as:
db.createReadStream({ keys: true, values: false })
  .on('data', function (data) {
    console.log('key=', data)
  })
```

<a name="createValueStream"></a>

### `db.createValueStream([options])`

Returns a [Readable Stream](https://nodejs.org/docs/latest/api/stream.html#stream_readable_streams) of values rather than key-value pairs. Use the same options as described for <a href="#createReadStream"><code>createReadStream</code></a> to control the range and direction.

You can also obtain this stream by passing an options object to `createReadStream()` with `values` set to `true` and `keys` set to `false`. The result is equivalent; both streams operate in [object mode](https://nodejs.org/docs/latest/api/stream.html#stream_object_mode).

```js
db.createValueStream()
  .on('data', function (data) {
    console.log('value=', data)
  })

// same as:
db.createReadStream({ keys: false, values: true })
  .on('data', function (data) {
    console.log('value=', data)
  })
```

## Author

* **Vassilis Kritharakis** - *Initial work* - [bkrith](https://github.com/bkrith)

## Licenses

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details

