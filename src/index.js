'use strict'

const hat = require('hat')
const assert = require('assert')
const isStream = require('is-stream')

const {request, response, parse} = require('./utils')

const DEFAULT_TIMEOUT = 1000 * 60 // 1 minute

function getAllFuncs (obj) {
  let props = []

  do {
    props = props.concat(Object.getOwnPropertyNames(obj).sort()
      .filter(function (e, i, arr) {
        return (typeof obj[e] === 'function' && e !== 'constructor')
      }))

  } while ((obj = Object.getPrototypeOf(obj)) && obj !== Object.prototype) // eslint-disable-line

  return props.sort().filter(function (e, i, arr) {
    return e !== arr[i + 1]
  })
}

const createRpc = ({stream, methods, timeout}) => {
  const outstanding = {}
  const rpcMethods = {}
  timeout = timeout || DEFAULT_TIMEOUT

  assert(isStream.duplex(stream), '`stream` should be a duplex stream')
  assert((typeof methods === 'function' || typeof methods === 'object'),
    '`methods` should be a class instance or an object literal')

  getAllFuncs(methods).forEach((name) => {
    if (name.startsWith('_')) return
    rpcMethods[name] = (...args) => {
      const id = hat()
      return new Promise((resolve, reject) => {
        outstanding[id] = {
          resolve,
          reject,
          timeout: (() => setTimeout(() => {
            delete outstanding[id] // cleanup
            reject(new Error(`request ${id} timed out`))
          }, timeout))()
        }
        stream.write(request(id, name, args))
      })
    }
  })

  stream.on('data', async (chunk) => {
    let payload = parse(chunk)

    // no payload in chunk
    if (!payload) return

    // process request
    if (typeof payload.method !== 'undefined') {
      try {
        const m = methods[payload.method]
        const res = await m.call(methods, ...payload.params)
        if (payload.id) {
          stream.write(response(payload.id, res))
        }
      } catch (e) {
        stream.write()
      }
    } else {
      payload = Array.isArray(payload) ? payload : [payload]
      payload.forEach((r) => {
        try {
          const { resolve, reject, timeout } = outstanding[r.id]
          clearTimeout(timeout)
          if (r.error) {
            return reject(r.error)
          }
          resolve(r.result)
        } finally {
          delete outstanding[r.id]
        }
      })
    }
  })

  return rpcMethods
}

module.exports = createRpc
