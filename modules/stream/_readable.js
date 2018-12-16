import Stream from './_stream'
import BufferState from './_bufferState'

const encodings = {
  BINARY: 'binary',
  UTF8: 'utf8'
}

function toString(binary) {
  let str = ''
  for (let i = 0; i < binary.length; i++) {
    str += String.fromCharCode(binary[i])
  }
  return str
}

function _flow() {
  if (this._readableState.flowing) {
    let chunk = this.read()
    if (chunk && chunk.length) {
      if (this._readableState.defaultEncoding === encodings.UTF8) {
        chunk = toString(chunk)
      }

      process.nextTick(() => {
        this.emit('data', chunk, this._readableState.defaultEncoding)
      })
    }
  }
}

function _end() {
  this._readableState.flowing = null
  this._readableState.ended = true
}

function Readable(options = {}) {
  this._readableState = new BufferState({
    flowing: null,
    ended: false,
    defaultEncoding: encodings.BINARY
  })

  /**
   * @property
   * @type array
   */
  this.pipes = []

  this._read = options.read.bind(this)

  if (!this._read) {
    throw new TypeError('_read() is not implemented')
  }

  if (!(this._read instanceof Function)) {
    throw new TypeError('\'options.read\' should be a function, passed ' + typeof options.read)
  }
}

Readable.prototype = Object.create(Stream)
Readable.prototype.constructor = Readable

Readable.prototype.pause = function pause() {
  if (this._readableState.flowing !== false) {
    this._readableState.flowing = false
    this.emit('pause')
  }

  return this
}

Readable.prototype.resume = function resume() {
  if (!this._readableState.flowing) {
    this._readableState.flowing = true
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
  if (chunk === null) {
    _end.call(this)
    return false
  }

  const overflow = this._readableState.push(chunk) > this.options.highWaterMark

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

  if(pipes.length) {
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
  return !this._readableState.flowing
}

export default Readable