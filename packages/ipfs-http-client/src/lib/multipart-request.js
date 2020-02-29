'use strict'

const toStream = require('it-to-stream')
const normaliseInput = require('ipfs-utils/src/files/normalise-input')
const { basename } = require('path')
const mtimeToObject = require('./mtime-to-object')
const modeToString = require('./mode-to-string')
const pipe = require('it-pipe')

async function * filesRequest (input) {
  const files = normaliseInput(input)

  for await (const { content, path, mtime, mode } of files) {
    const headers = {}

    if (mtime) {
      const mtime = mtimeToObject(mtime)

      if (mtime) {
        headers.mtime = mtime.secs
        headers['mtime-nsecs'] = mtime.nsecs
      }
    }

    if (mode !== undefined && mode !== null) {
      headers.mode = modeToString(mode)
    }

    yield {
      content,
      name: 'file',
      fileName: basename(path),
      headers
    }
  }
}

async function * multipartRequest (stream, boundary) {
  for await (const { content, name, fileName, headers = {} } of stream) {
    console.info('creating part')

    // create a multipart part
    yield `--${boundary}\r\n`

    yield `Content-Disposition: form-data; name="${name}"; filename="${encodeURIComponent(fileName)}"\r\n`
    console.info('send content disposition')

    if (!headers['Content-Type']) {
      console.info('sending default content type')
      yield `Content-Type: application/octet-stream\r\n`
    }

    for (const key in headers) {
      yield `${key}: ${headers[key]}\r\n`
    }

    yield `\r\n`
    yield * content
    yield `\r\n`

    console.info('done with part')
  }

  yield `--${boundary}--\r\n`

  console.info('done with multipart')
}

module.exports = (stream, boundary) => {
  const out = pipe(
    filesRequest(stream),
    (stream) => multipartRequest(stream, boundary),
    (stream) => toStream(stream)
  )

  out.on('error', (err) => {
    console.info('hmm', err)
  })

  console.info('out', out)

  return out
}
