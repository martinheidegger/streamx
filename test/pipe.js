const tape = require('tape')
const compat = require('stream')
const { Readable, Writable, Stream } = require('../')

tape('pipe to node stream', function (t) {
  const expected = [
    'hi',
    'ho'
  ]

  const r = new Readable()
  const w = new compat.Writable({
    objectMode: true,
    write (data, enc, cb) {
      t.same(data, expected.shift())
      cb(null)
    }
  })

  r.push('hi')
  r.push('ho')
  r.push(null)

  r.pipe(w)

  w.on('finish', function () {
    t.same(expected.length, 0)
    t.end()
  })
})

tape('pipe with callback - error case', function (t) {
  const r = new Readable()
  const w = new Writable({
    write (data, cb) {
      cb(new Error('blerg'))
    }
  })

  r.pipe(w, function (err) {
    t.pass('callback called')
    t.same(err, new Error('blerg'))
    t.end()
  })

  r.push('hello')
  r.push('world')
  r.push(null)
})

tape('pipe with callback - error case with destroy', function (t) {
  const r = new Readable()
  const w = new Writable({
    write (data, cb) {
      w.destroy(new Error('blerg'))
      cb(null)
    }
  })

  r.pipe(w, function (err) {
    t.pass('callback called')
    t.same(err, new Error('blerg'))
    t.end()
  })

  r.push('hello')
  r.push('world')
})

tape('pipe with callback - error case node stream', function (t) {
  const r = new Readable()
  const w = new compat.Writable({
    write (data, enc, cb) {
      cb(new Error('blerg'))
    }
  })

  r.pipe(w, function (err) {
    t.pass('callback called')
    t.same(err, new Error('blerg'))
    t.end()
  })

  r.push('hello')
  r.push('world')
  r.push(null)
})

tape('simple pipe', function (t) {
  const buffered = []

  const r = new Readable()
  const w = new Writable({
    write (data, cb) {
      buffered.push(data)
      cb(null)
    },

    final (_) {
      t.pass('final called')
      t.same(buffered, ['hello', 'world'])
      t.end()
    }
  })

  r.pipe(w)

  r.push('hello')
  r.push('world')
  r.push(null)
})

tape('pipe with callback', function (t) {
  const buffered = []

  const r = new Readable()
  const w = new Writable({
    write (data, cb) {
      buffered.push(data)
      cb(null)
    }
  })

  r.pipe(w, function (err) {
    t.pass('callback called')
    t.same(err, null)
    t.same(buffered, ['hello', 'world'])
    t.end()
  })

  r.push('hello')
  r.push('world')
  r.push(null)
})

tape('pipe to an output object', function (t) {
  const buffered = []
  Stream.from(['hello', 'world']).pipe({
    write (data, cb) {
      buffered.push(data)
      cb()
    },
    final (cb) {
      t.same(buffered, ['hello', 'world'])
      cb()
      t.end()
    }
  })
})

tape('pipe to a transform object', function (t) {
  const buffered = []
  Stream.from(['foo', 'bar']).pipe({
    transform (data, cb) {
      cb(null, `${data}x`)
    }
  })
    .pipe({
      write (data, cb) {
        buffered.push(data)
        cb()
      },
      final (cb) {
        t.same(buffered, ['foox', 'barx'])
        cb()
        t.end()
      }
    })
})

tape('pipe to async transform', function (t) {
  const buffered = []
  Stream.from(['foo', 'bar'])
    .pipe({
      transform: async (data) => `${data}x`
    })
    .pipe({
      write: async (data) => {
        buffered.push(data)
      },
      final: async () => {
        t.same(buffered, ['foox', 'barx'])
        t.end()
      }
    })
})
