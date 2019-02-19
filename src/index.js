'use strict'

const debug = require('debug')
const hat = require('hat')

const log = debug('json-rpc-async')

const {request, response, parse} = require('./utils')

const DEFAULT_TIMEOUT = 1000 * 60 // 1 minute

const createRpc = ({stream, methods, timeout}) => {
  const outstanding = {}
  const rpcMethods = {}
  timeout = timeout || DEFAULT_TIMEOUT

  Object.getOwnPropertyNames(methods).forEach((name) => {
    rpcMethods[name] = (...args) => {
      const id = hat()
      return new Promise((resolve, reject) => {
        outstanding[id] = {resolve,
          reject,
          timeout: (() => setTimeout(() => {
            reject(new Error(`request ${id} timed out`))
          }, timeout))()}
        stream.push(request(id, name, args))
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
        const res = await m.call(m, ...payload.params)
        if (payload.id) {
          stream.push(response(payload.id, res))
        }
      } catch (e) {
        stream.push()
      }
    } else {
      payload = Array.isArray(payload) ? payload : [payload]
      payload.forEach((r) => {
        const { resolve, reject, timeout } = outstanding[r.id]
        clearTimeout(timeout)
        if (r.error) {
          return reject(r.error)
        }
        resolve(r.result)
      })
    }
  })

  return rpcMethods
}

module.exports = createRpc
