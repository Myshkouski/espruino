'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var EventEmitter = _interopDefault(require('events'));
var bufferFrom = _interopDefault(require('buffer-from'));

const DEFAULT_HIGHWATERMARK = 128;

function Stream(options = {}) {
  EventEmitter.call(this);
  this.options = {
    highWaterMark: options.highWaterMark || DEFAULT_HIGHWATERMARK
  };
}

Stream.prototype = Object.create(EventEmitter.prototype);
Stream.prototype.constructor = Stream;

/**
 * Buffer.from() from node.js
 *  
 * @return  {function}
 */
/**
 * BufferState implements an interface for storing and manipulating data chunks
 *
 * @constructor
 * @param   {object}  [options={}]  [options description]
 */

function BufferState(options = {}) {
  Object.assign(this, options, {
    _buffer: [],
    length: 0
  });
}

function createNode(chunk) {
  return {
    chunk: bufferFrom(chunk),
    encoding: 'binary',
    next: null
  };
}

BufferState.prototype = {
  push(chunk) {
    if (chunk.length) {
      const node = createNode(chunk);

      if (this._buffer.length) {
        this._buffer[this._buffer.length - 1].next = node;
      }

      this._buffer.push(node);

      this.length += node.chunk.length;
    }

    return this.length;
  },

  unshift(chunk) {
    const node = createNode(chunk);

    if (this._buffer.length) {
      node.next = this._buffer[0];
    }

    this._buffer.unshift(node);

    this.length += node.chunk.length;
    return this.length;
  },

  nodes(count) {
    const nodes = this._buffer.splice(0, count);

    nodes.forEach(node => this.length -= node.chunk.length);
    return nodes;
  },

  shift() {
    return this.nodes(1)[0];
  },

  at(index) {
    if (index >= this.length || index < 0) {
      return;
    }

    for (let nodeIndex = 0; nodeIndex < this._buffer.length; nodeIndex++) {
      const chunk = this._buffer[nodeIndex].chunk;

      if (index < chunk.length) {
        return {
          index,
          nodeIndex,
          value: chunk[index]
        };
      }

      index -= chunk.length;
    }
  },

  for(from, to, callee) {
    const firstNode = this._buffer[from.nodeIndex];

    for (let index = from.nodeIndex; index < firstNode.chunk.length; index++) {
      callee.call(this, firstNode.chunk[index]);
    }

    for (let nodeIndex = 1 + from.nodeIndex; nodeIndex < to.nodeIndex; nodeIndex++) {
      const node = this._buffer[nodeIndex];

      for (let index = 0; index < node.chunk.length; index++) {
        callee.call(this, node.chunk[index]);
      }
    }

    if (from.nodeIndex < to.nodeIndex) {
      const lastNode = this._buffer[to.nodeIndex];

      for (let index = 0; index <= to.index; index++) {
        callee.call(this, lastNode.chunk[index]);
      }
    }
  },

  slice(length) {
    if (length === undefined) {
      length = this.length;
    }

    if (!length) {
      return bufferFrom([]);
    }

    if (length > this.length) {
      length = this.length;
    }

    let to;

    if (length) {
      to = this.at(length);
    }

    if (!to) {
      to = {
        index: this.length - 1,
        nodeIndex: this._buffer.length - 1
      };
    }

    let array = [];

    const offset = this._buffer.slice(to.nodeIndex - 1).reduce((offset, node) => {
      array = array.concat(node.chunk);
      return offset + node.chunk.length;
    }, 0);

    if (offset < length) {
      const node = this._buffer[to.nodeIndex];
      array = array.concat(node.chunk.slice(0, length - offset));
    }

    return bufferFrom(Aarray);
  },

  buffer(length) {
    if (length === undefined) {
      length = this.length;
    }

    if (!length) {
      return bufferFrom([]);
    }

    if (length > this.length) {
      length = this.length;
    }

    let to;

    if (length) {
      to = this.at(length);
    }

    if (!to) {
      to = {
        index: this.length - 1,
        nodeIndex: this._buffer.length - 1
      };
    }

    let array = [];
    const offset = this.nodes(to.nodeIndex).reduce((offset, node) => {
      array = array.concat(node.chunk);
      return offset + node.chunk.length;
    }, 0);

    if (offset < length) {
      const node = this.shift();
      array = array.concat(node.chunk.slice(0, length - offset));

      if (length - offset < node.chunk.length) {
        node.chunk = node.chunk.slice(length - offset);
        this.unshift(node.chunk);
      }
    }

    return bufferFrom(array);
  }

};

const encodings = {
  BINARY: 'binary',
  UTF8: 'utf8'
};

function toString(binary) {
  let str = '';

  for (let i = 0; i < binary.length; i++) {
    str += String.fromCharCode(binary[i]);
  }

  return str;
}

function _flow() {
  if (this.readableFlowing) {
    const node = this._readableState.shift();

    if (node && node.chunk && node.chunk.length) {
      let {
        chunk
      } = node;

      if (this._readableState.defaultEncoding === encodings.UTF8) {
        chunk = toString(node.chunk);
      }

      setImmediate(() => {
        this.emit('data', chunk, this._readableState.defaultEncoding);
      });
    }

    if (this._readableState.flowing) {
      this._readableState.flowing = false;
      setImmediate(() => {
        this._readableState.flowing = true;

        if (!this._readableState.ended) {
          this._read();
        }
      });
    }
  }
}

function _end() {
  this.readableFlowing = null;
  this._readableState.ended = true;
  this.emit('end');
}

function Readable(options = {}) {
  Stream.call(this, options);
  this._readableState = new BufferState({
    flowing: true,
    ended: false,
    defaultEncoding: encodings.BINARY
  });
  this.readableFlowing = null;
  this.pipes = [];
  options.read && (this._read = options.read);
}

Readable.prototype = Object.create(Stream.prototype);
Readable.prototype.constructor = Readable;

Readable.prototype._read = function _read() {
  this.emit('error', new Error('The _read() method is not implemented'));
};

Readable.prototype.pause = function pause() {
  if (this.readableFlowing !== false) {
    this.readableFlowing = false;
    this.emit('pause');
  }

  return this;
};

Readable.prototype.resume = function resume() {
  if (!this.readableFlowing) {
    this.readableFlowing = true;
    this.emit('resume');

    _flow.call(this);
  }

  return this;
};

Readable.prototype.read = function read(length) {
  if (length < 0) {
    throw new Error('"length" must be more than 0');
  }

  if (!this._readableState.ended) {
    if (length === undefined) {
      if (this._readableState.length < this.options.highWaterMark) {
        this._read(this.options.highWaterMark - this._readableState.length);
      }
    } else if (length > this._readableState.length) {
      this._read(length - this._readableState.length);
    }
  }

  if (this._readableState.ended) {
    if (this._readableState.length) {
      return this._readableState.buffer();
    }

    return null;
  }

  if (length !== undefined && this._readableState.length < length) {
    return null;
  }

  return this._readableState.buffer(length);
};

Readable.prototype.push = function push(chunk) {
  if (this._readableState.ended) {
    this.emit('error', new Error('stream.push() after EOF'));
    return false;
  }

  if (chunk === null) {
    _end.call(this);

    return false;
  }

  this._readableState.push(chunk);

  const overflow = this._readableState.length > this.options.highWaterMark;

  if (!overflow) {
    _flow.call(this);
  }

  return !overflow;
};

function _onData(pipe, data) {
  const {
    writable
  } = pipe;

  if (!writable.write(data)) {
    pipe.stopped = true;
    this.pause();
    writable.once('drain', pipe.onceDrain);
  }
}

function _onceDrain(pipe) {
  this.removeListener('drain', pipe.onceDrain);
  this.resume();
}

Readable.prototype.pipe = function pipe(writable) {
  if (!this.pipes.some(pipe => pipe.writable === writable)) {
    const pipe = {
      writable,
      stopped: undefined
    };
    pipe.onData = _onData.bind(this, pipe);
    pipe.onceDrain = _onceDrain.bind(this, pipe);
    this.pipes.push(pipe);
    this.on('data', pipe.onData);
    writable.emit('pipe');
  }

  return writable;
};

Readable.prototype.unpipe = function unpipe(writable) {
  let pipes = [];

  if (writable) {
    const index = this.pipes.indexOf(writable);

    if (~index) {
      pipes = this.pipes.splice(index, 1);
    }
  } else {
    pipes = this.pipes.splice(0, this.pipes.length);
  }

  if (pipes.length) {
    for (let index in pipes) {
      const {
        onData,
        onceDrain
      } = pipes[index];
      this.removeListener('data', onData);
      this.removeListener('drain', onceDrain);
    }
  }
};

Readable.prototype.on = function on(event) {
  if (event === 'data') {
    this.resume();
  }

  return Stream.prototype.on.apply(this, arguments);
};

Readable.prototype.removeListener = function removeListener(event, listener) {
  if (event === 'data') {
    this.pause();
  }

  return Stream.prototype.removeListener.apply(this, arguments);
};

Readable.prototype.isPaused = function isPaused() {
  return !this.readableFlowing;
};

function _readFromInternalBuffer(...args) {
  const spliced = this._writableState.nodes(...args);

  if (this._writableState.needDrain && this._writableState.length < this.options.highWaterMark) {
    this._writableState.needDrain = false;
    this.emit('drain');
  }

  return spliced;
}

function _flush() {
  const {
    _writableState
  } = this;
  if (_writableState.corked) return;

  if (!_writableState.length) {
    if (_writableState.ended) {
      this.emit('finish');
    }

    return;
  }

  const cb = err => {
    if (err) this.emit('error', err);
    _writableState.consumed = true;
    process.nextTick(() => {
      _flush.call(this);
    });
  };

  if (!_writableState.corked && _writableState.consumed) {
    _writableState.consumed = false;

    if (this._writev) {
      const nodes = _readFromInternalBuffer.call(this);

      this._writev(nodes, cb);
    } else {
      const node = _readFromInternalBuffer.call(this, 1)[0];

      this._write(node.chunk, node.encoding, cb);
    }
  }
}
/**
 * Writable stream
 *
 * @constructor
 * @param   {object}  [options={}]
 */


function Writable(options = {}) {
  Stream.call(this, options);
  this._writableState = new BufferState({
    getBuffer: () => this._writableState._buffer,
    corked: 0,
    consumed: true,
    needDrain: false,
    ended: false,
    decodeStrings: true
  });
  options.write && (this._write = options.write);
}

Writable.prototype = Object.create(Stream.prototype);
Writable.prototype.constructor = Writable;

Writable.prototype._write = function _write() {
  this.emit('error', new Error('The _write() method is not implemented'));
};

Writable.prototype.write = function write(chunk, encoding, cb) {
  const {
    _writableState
  } = this;

  if (_writableState.ended) {
    throw new Error('Write after end');
  }

  this._writableState.push(chunk);

  _flush.call(this);

  return _writableState.length < this.options.highWaterMark;
};

Writable.prototype.end = function end() {
  this.write.apply(this, arguments);
  this._writableState.ended = true;
  return this;
};

Writable.prototype.cork = function cork() {
  this._writableState.corked++;
};

Writable.prototype.uncork = function uncork() {
  if (this._writableState.corked > 0) {
    this._writableState.corked--;

    _flush.call(this);
  }
};

function Duplex(options = {}) {
  Readable.call(this, options);
  Writable.call(this, options);
}

Duplex.prototype = Object.create(Readable.prototype);
Object.assign(Duplex.prototype, Writable.prototype);
Duplex.prototype.constructor = Duplex;

function Transform(options = {}) {
  Duplex.call(this, {
    read() {},

    write: options.transform
  });
}

Transform.prototype = Object.create(Duplex.prototype);
Transform.prototype.constructor = Transform;

function _transform(data, encoding, cb) {
  this.push(data, encoding);
  cb();
}

function PassThrough(options = {}) {
  Transform.call(this, {
    // @ts-ignore
    transform: 'transform' in options ? options.transform : _transform
  });
}

PassThrough.prototype = Object.create(Transform.prototype);
PassThrough.prototype.constructor = PassThrough;

exports.Readable = Readable;
exports.Writable = Writable;
exports.Duplex = Duplex;
exports.Transform = Transform;
exports.PassThrough = PassThrough;
