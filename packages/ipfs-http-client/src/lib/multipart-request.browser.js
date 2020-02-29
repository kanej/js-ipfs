'use strict'

async function multipartRequest (input, boundary) {
  let stream
  let cancelled

  async function streamData () {
    try {
      for await (const { content, name, headers } of input) {
        if (cancelled) {
          break
        }

        // create a multipart part
        stream.enqueue(`--${boundary}\r\n`)
        stream.enqueue(`Content-Disposition: form-data; name="${name}"; filename="${name}"\r\n`)

        if (!headers || !headers['Content-Type']) {
          stream.enqueue(`Content-Type: application/octet-stream\r\n`)
        }

        if (headers) {
          for (const key of headers) {
            stream.enqueue(`${key}: ${headers[key]}\r\n`)
          }
        }

        stream.enqueue(`\r\n`)

        for await (const buf of content) {
          stream.enqueue(buf)
        }

        stream.enqueue(`\r\n`)
      }

      stream.enqueue(`--${boundary}--\r\n`)
    } catch (err) {
      console.error(err)
    }

    stream.close()
  }

  setImmediate(streamData)

  return new ReadableStream({
    start (controller) {
      stream = controller
    },
    cancel () {
      cancelled = true
    }
  })
}

module.exports = multipartRequest
