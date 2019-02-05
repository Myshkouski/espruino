import Stream from './_stream'
import BufferState from './_bufferState'

const encodings = {
  BINARY: 'binary',
  UTF8: 'utf8'
}

function toString(binary) {
  return String.fromCharCode.apply(null, binary)
}

function _flow() {
  if (this.readableFlowing) {
    const node = this._readableState.shift()

    if (node && node.chunk && node.chunk.length) {
      let {
        chunk
      } = node
      if (this._readableState.defaultEncoding === encodings.UTF8) {
        chunk = toString(node.chunk)
      }

      setImmediate(() => {
        this.emit('data', chunk, this._readableState.defaultEncoding)
      })
    }

    if (this._readableState.flowing) {
      this._readableState.flowing = false
      setImmediate(() => {
        this._readableState.flowing = true
        if (!this._readableState.ended) {
          this._read()
        }
      })
    }
  }
}

function _end() {
  this.readableFlowing = null
  this._readableState.ended = true

  this.emit('end')
}

function Readable(options = {}) {
  Stream.call(this, options)

  this._readableState = new BufferState({
    flowing: true,
    ended: false,
    defaultEncoding: encodings.BINARY
  })

  this.readableFlowing = null
  this.pipes = []
  options.read && (this._read = options.read)
}

Readable.prototype = Object.create(Stream.prototype)
Readable.prototype.constructor = Readable

Readable.prototype._read = function _read() {
  this.emit('error', new Error('The _read() method is not implemented'))
}

Readable.prototype.pause = function pause() {
  if (this.readableFlowing !== false) {
    this.readableFlowing = false
    this.emit('pause')
  }

  return this
}

Readable.prototype.resume = function resume() {
  if (!this.readableFlowing) {
    this.readableFlowing = true
    this.emit('resume')
    _flow.call(this)
  }

  return this
}

Readable.prototype.read = function read(length) {
  if (length < 0) {
    throw new Error('"length" must be more than 0')
  }

  if (!this._readableState.ended) {
    if (length === undefined) {
      if (this._readableState.length < this.options.highWaterMark) {
        this._read(this.options.highWaterMark - this._readableState.length)
      }
    } else if (length > this._readableState.length) {
      this._read(length - this._readableState.length)
    }
  }

  if (this._readableState.ended) {
    if (this._readableState.length) {
      return this._readableState.buffer()
    }

    return null
  }

  if (length !== undefined && this._readableState.length < length) {
    return null
  }

  return this._readableState.buffer(length)
}

Readable.prototype.push = function push(chunk) {
  if (this._readableState.ended) {
    this.emit('error', new Error('stream.push() after EOF'))
    return false
  }

  if (chunk === null) {
    _end.call(this)
    return false
  }

  this._readableState.push(chunk)

  const overflow = this._readableState.length > this.options.highWaterMark

  if (!overflow) {
    _flow.call(this)
  }

  return !overflow
}

function _onData(pipe, data) {
  const {
    writable
  } = pipe

  if (!writable.write(data)) {
    pipe.stopped = true
    this.pause()

    writable.once('drain', pipe.onceDrain)
  }
}

function _onceDrain(pipe) {
  this.removeListener('drain', pipe.onceDrain)
  this.resume()
}

Readable.prototype.pipe = function pipe(writable) {
  if (!this.pipes.some(pipe => pipe.writable === writable)) {
    const pipe = {
      writable,
      stopped: undefined
    }

    pipe.onData = _onData.bind(this, pipe)
    pipe.onceDrain = _onceDrain.bind(this, pipe)

    this.pipes.push(pipe)
    this.on('data', pipe.onData)
    writable.emit('pipe')
  }

  return writable
}

Readable.prototype.unpipe = function unpipe(writable) {
  let pipes = []

  if (writable) {
    const index = this.pipes.indexOf(writable)

    if (~index) {
      pipes = this.pipes.splice(index, 1)
    }
  } else {
    pipes = this.pipes.splice(0, this.pipes.length)
  }

  if (pipes.length) {
    for (let index in pipes) {
      const {
        onData,
        onceDrain
      } = pipes[index]

      this.removeListener('data', onData)
      this.removeListener('drain', onceDrain)
    }
  }
}

Readable.prototype.on = function on(event) {
  if (event === 'data') {
    this.resume()
  }

  return Stream.prototype.on.apply(this, arguments)
}

Readable.prototype.removeListener = function removeListener(event, listener) {
  if (event === 'data') {
    this.pause()
  }

  return Stream.prototype.removeListener.apply(this, arguments)
}

Readable.prototype.isPaused = function isPaused() {
  return !this.readableFlowing
}

export default Readable