'use strict'

const test = require('tape-await')
const createRpc = require('../src')

const Duplex = require('stream').Duplex

const createDuplex = () => {
  const duplex1 = new Duplex({
    read: () => { },
    write: function (chunk, _, next) {
      duplex2.push(chunk)
      next()
    }
  })

  const duplex2 = new Duplex({
    read: () => { },
    write: function (chunk, _, next) {
      duplex1.push(chunk)
      next()
    }
  })

  return [duplex1, duplex2]
}

test('is valid stream', (t) => {
  t.throws(() => createRpc({ stream: '' }), /`stream` should be a duplex stream/)
})

test('is valid methods list', (t) => {
  const [stream] = createDuplex()
  t.throws(() => createRpc({ stream, methods: '' }), /`methods` should be a class instance or an object literal/)
})

test('call without params', async (t) => {
  const [stream1, stream2] = createDuplex()

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

test('works with stubs', async (t) => {
  const [stream1, stream2] = createDuplex()

  const methods = {
    a: async () => {
      return 'Hello World!'
    }
  }

  const stubs = {
    a: async () => {} // stub
  }

  const clientRpc = createRpc({ stream: stream1, methods: stubs })
  // server rpc
  createRpc({ stream: stream2, methods })

  const res = await clientRpc.a()
  t.equal(res, 'Hello World!')
})

test('call with positional params', async (t) => {
  const [stream1, stream2] = createDuplex()

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
  const [stream1, stream2] = createDuplex()

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
  const [stream1, stream2] = createDuplex()

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
  const [stream1, stream2] = createDuplex()

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
  const [stream1, stream2] = createDuplex()

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

test('class instance', async (t) => {
  const [stream1, stream2] = createDuplex()

  class Methods {
    constructor (name) {
      this.name = name
    }

    getName () {
      return this.name
    }
  }

  const methods = new Methods('Bob')

  const clientRpc = createRpc({ stream: stream1, methods: methods })
  // server rpc
  createRpc({ stream: stream2, methods })

  let res
  res = await clientRpc.getName()
  t.equal(res, 'Bob')
})

test('class instance with inherited methods', async (t) => {
  const [stream1, stream2] = createDuplex()

  class Methods {
    constructor (name) {
      this.name = name
    }

    getName () {
      return this.name
    }
  }

  class Methods2 extends Methods {
    constructor (name1, name2) {
      super(name1)
      this.name2 = name2
    }

    getName2 () {
      return this.name2
    }
  }

  const methods = new Methods2('Bob', 'Sam')

  const clientRpc = createRpc({ stream: stream1, methods: methods })
  // server rpc
  createRpc({ stream: stream2, methods })

  let res
  res = await clientRpc.getName()
  t.equal(res, 'Bob')

  res = await clientRpc.getName2()
  t.equal(res, 'Sam')
})

test('class instance with overrides', async (t) => {
  const [stream1, stream2] = createDuplex()

  class Methods {
    constructor (name) {
      this.name = name
    }

    getName () {
      return this.name
    }
  }

  class Methods2 extends Methods {
    getName () {
      return this.name + 'Sam'
    }
  }

  const methods = new Methods2('Bob')

  const clientRpc = createRpc({ stream: stream1, methods: methods })
  // server rpc
  createRpc({ stream: stream2, methods })

  let res
  res = await clientRpc.getName()
  t.equal(res, 'BobSam')
})

test('pass argument data', async (t) => {
  t.plan(2)

  const [stream1, stream2] = createDuplex()

  const methods = {
    sendData: async (data) => {
      t.equal(data, 'Bob')
      return 'Sam'
    }
  }

  const clientRpc = createRpc({ stream: stream1, methods: methods })
  // server rpc
  createRpc({ stream: stream2, methods })

  const res = await clientRpc.sendData('Bob')
  t.equal(res, 'Sam')
})
