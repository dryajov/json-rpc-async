'use strict'

const debug = require('debug')

const VERSION = '2.0'

const log = debug('json-rpc-async:verbose')

exports.request = (id, name, args) => {
  const payload = {
    jsonrpc: `"${VERSION}"`,
    id: id,
    method: name,
    params: args
  }

  return JSON.stringify(payload)
}

exports.response = (id, res, err) => {
  const payload = {
    jsonrpc: `"${VERSION}"`,
    id: id
  }

  if (res) payload.result = res
  if (err) payload.error = err

  return JSON.stringify(payload)
}

exports.parse = (res) => {
  try {
    return JSON.parse(res.toString())
  } catch (e) {
    log(e)
  }
}
