'use strict'

const test = require('tape-await')
const createRpc = require('../src')

const Duplex = require('stream').Duplex

test('call without params', async (t) => {
  const stream1 = new Duplex({ read: () => { }, write: () => { } })
  const stream2 = new Duplex({ read: () => { }, write: () => { } })
  stream1.pipe(stream2).pipe(stream1)

  const methods = {
    a: async () => {
      return 'Hello World!'
    }
  }

  const clientRpc = createRpc({ stream: stream1, methods })
  // server rpc
  createRpc({ stream: stream2, methods })

  const res = await clientRpc.a()
  t.equal(res, 'Hello World!')
})

test('call with positional params', async (t) => {
  const stream1 = new Duplex({ read: () => { }, write: () => { } })
  const stream2 = new Duplex({ read: () => { }, write: () => { } })
  stream1.pipe(stream2).pipe(stream1)

  const methods = {
    a: async (b) => {
      return `Hello World ${b}!`
    }
  }

  const clientRpc = createRpc({ stream: stream1, methods })
  // server rpc
  createRpc({ stream: stream2, methods })

  const res = await clientRpc.a('Bob')
  t.equal(res, 'Hello World Bob!')
})

test('call with named params', async (t) => {
  const stream1 = new Duplex({ read: () => { }, write: () => { } })
  const stream2 = new Duplex({ read: () => { }, write: () => { } })
  stream1.pipe(stream2).pipe(stream1)

  const methods = {
    a: async ({b}) => {
      return `Hello World ${b}!`
    }
  }

  const clientRpc = createRpc({ stream: stream1, methods })
  // server rpc
  createRpc({ stream: stream2, methods })

  const res = await clientRpc.a({b: 'Bob'})
  t.equal(res, 'Hello World Bob!')
})

test('call more than once', async (t) => {
  const stream1 = new Duplex({ read: () => { }, write: () => { } })
  const stream2 = new Duplex({ read: () => { }, write: () => { } })
  stream1.pipe(stream2).pipe(stream1)

  const methods = {
    a: async ({b}) => {
      return `Hello World ${b}!`
    }
  }

  const clientRpc = createRpc({ stream: stream1, methods })
  // server rpc
  createRpc({ stream: stream2, methods })

  let res = await clientRpc.a({b: 'Bob'})
  t.equal(res, 'Hello World Bob!')

  res = await clientRpc.a({b: 'Sam'})
  t.equal(res, 'Hello World Sam!')
})

test('call from both ends', async (t) => {
  const stream1 = new Duplex({ read: () => { }, write: () => { } })
  const stream2 = new Duplex({ read: () => { }, write: () => { } })
  stream1.pipe(stream2).pipe(stream1)

  const methods = {
    a: async ({b}) => {
      return `Hello World ${b}!`
    }
  }

  const clientRpc = createRpc({ stream: stream1, methods })
  // server rpc
  const serverRpc = createRpc({ stream: stream2, methods })

  let res = await clientRpc.a({b: 'Bob'})
  t.equal(res, 'Hello World Bob!')

  res = await serverRpc.a({b: 'Sam'})
  t.equal(res, 'Hello World Sam!')
})

test('call from both ends more than once', async (t) => {
  const stream1 = new Duplex({ read: () => { }, write: () => { } })
  const stream2 = new Duplex({ read: () => { }, write: () => { } })
  stream1.pipe(stream2).pipe(stream1)

  const methods = {
    a: async ({ b }) => {
      return `Hello World ${b}!`
    }
  }

  const clientRpc = createRpc({ stream: stream1, methods })
  // server rpc
  const serverRpc = createRpc({ stream: stream2, methods })

  let res
  res = await clientRpc.a({ b: 'Bob1' })
  t.equal(res, 'Hello World Bob1!')

  res = await serverRpc.a({ b: 'Sam1' })
  t.equal(res, 'Hello World Sam1!')

  res = await clientRpc.a({ b: 'Bob1' })
  t.equal(res, 'Hello World Bob1!')

  res = await serverRpc.a({ b: 'Sam1' })
  t.equal(res, 'Hello World Sam1!')
})
