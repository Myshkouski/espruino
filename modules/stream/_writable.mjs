import Stream from './_stream.mjs'
// import BufferState from './_bufferState'

// function _readFromInternalBuffer(...args) {
//   const spliced = this._writableState.nodes(...args)

//   if (this._writableState.needDrain && (this._writableState.length < this.options.highWaterMark)) {
//     this._writableState.needDrain = false
//     this.emit('drain')
//   }

//   return spliced
// }

// function _flush() {
//   const {
//     _writableState
//   } = this

//   if (_writableState.corked)
//     return

//   if (!_writableState.length) {
//     if (_writableState.ended) {
//       this.emit('finish')
//     }

//     return
//   }

//   const cb = err => {
//     if (err)
//       this.emit('error', err)

//     _writableState.consumed = true

//     process.nextTick(() => {
//       _flush.call(this)
//     })
//   }

//   if (!_writableState.corked && _writableState.consumed) {
//     _writableState.consumed = false

//     if (this._writev) {
//       const nodes = _readFromInternalBuffer.call(this)

//       this._writev(nodes, cb)
//     } else {
//       const node = _readFromInternalBuffer.call(this, 1)[0]

//       this._write(node.chunk, node.encoding, cb)
//     }
//   }
// }

// /**
//  * Writable stream
//  *
//  * @constructor
//  * @param   {object}  [options={}]
//  */
function Writable(options = {}) {
    Stream.call(this, options)

    //   this._writableState = new BufferState({
    //     getBuffer: () => this._writableState._buffer,
    //     corked: 0,
    //     consumed: true,
    //     needDrain: false,
    //     ended: false,
    //     decodeStrings: true
    //   })

    this._writableState = {}

    this._writableState.buffer = ''
    this._writableState.consumed = true
    this._writableState.ended = false
    options.write && (this._write = options.write)
}

Writable.prototype = Object.create(Stream.prototype)
Writable.prototype.constructor = Writable

Writable.prototype._write = function _write() {
    this.emit('error', new Error('The _write() method is not implemented'))
}

// Writable.prototype.write = function write(chunk, encoding, cb) {
//     const {
//         _writableState
//     } = this, {
//         buffer
//     } = _writableState

//     if (_writableState.ended) {
//         throw new Error('Write after end')
//     }

//     this._writableState.push(chunk)

//     _flush.call(this)

//     return _writableState.length < this.options.highWaterMark
// }

// Writable.prototype.end = function end() {
//   this.write.apply(this, arguments)
//   this._writableState.ended = true
//   return this
// }

// Writable.prototype.cork = function cork() {
//   this._writableState.corked++
// }

// Writable.prototype.uncork = function uncork() {
//   if (this._writableState.corked > 0) {
//     this._writableState.corked--
//     _flush.call(this)
//   }
// }

Object.assign(Writable.prototype, {
    write(chunk, encoding) {
        if(chunk) {
            this._writableState.buffer += chunk
        }

        if (this._writableState.consumed && this._writableState.buffer) {
            this._writableState.consumed = false
            const chunk = this._writableState.buffer
            this._writableState.buffer = ''

            const cb = setImmediate.bind(global, () => {
                this._writableState.consumed = true
                this.write()
            })

            this._write(chunk, 'utf8', cb)
        }

        return this._writableState.buffer.length < this._highWaterMark
    },

    end(chunk, encoding) {
        this._writableState.ended = true
        return this.write(chunk, encoding)
    }
})

export default Writable