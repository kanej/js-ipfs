'use strict'

const configure = require('../lib/configure')
const multipartRequest = require('../lib/multipart-request')
const hat = require('hat')

module.exports = configure(({ ky }) => {
  return async (path, input, options) => {
    options = options || {}
    options.headers = options.headers || {}

    const searchParams = new URLSearchParams(options.searchParams)
    searchParams.set('arg', path)
    searchParams.set('stream-channels', true)
    if (options.cidVersion) searchParams.set('cid-version', options.cidVersion)
    if (options.create != null) searchParams.set('create', options.create)
    if (options.hashAlg) searchParams.set('hash', options.hashAlg)
    if (options.length != null) searchParams.set('length', options.length)
    if (options.offset != null) searchParams.set('offset', options.offset)
    if (options.parents != null) searchParams.set('parents', options.parents)
    if (options.rawLeaves != null) searchParams.set('raw-leaves', options.rawLeaves)
    if (options.truncate != null) searchParams.set('truncate', options.truncate)
    if (options.shardSplitThreshold != null) searchParams.set('shard-split-threshold', options.shardSplitThreshold)

    const boundary = hat()

    options.headers['Content-Type'] = `multipart/form-data; boundary=${boundary}`

    const res = await ky.post('files/write', {
      timeout: options.timeout,
      signal: options.signal,
      headers: options.headers,
      searchParams,
      body: multipartRequest([{
        content: input,
        path: path,
        mode: options.mode,
        mtime: options.mtime
      }], boundary)
    })

    return res.text()
  }
})
