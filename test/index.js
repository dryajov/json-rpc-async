'use strict'

const test = require('tape-await')
const createRpc = require('../src')

const Duplex = require('stream').Duplex

test('send without params', async (t) => {
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
  console.dir(res)
  t.equal(res, 'Hello World!')
})

test('send with positional params', async (t) => {
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
  console.dir(res)
  t.equal(res, 'Hello World Bob!')
})

test('send with named params', async (t) => {
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
  console.dir(res)
  t.equal(res, 'Hello World Bob!')
})
