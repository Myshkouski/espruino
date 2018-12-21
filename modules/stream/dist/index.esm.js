import EventEmitter from 'events';
import bufferFrom from 'buffer-from';

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

    const buffer = bufferFrom(Array(length));

    const offset = this._buffer.slice(to.nodeIndex - 1).reduce((offset, node) => {
      buffer.set(node.chunk, offset);
      return offset + node.chunk.length;
    }, 0);

    if (offset < length) {
      const node = this._buffer[to.nodeIndex];
      buffer.set(node.chunk.slice(0, length - offset), offset);
    }

    return buffer;
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

    const buffer = bufferFrom(Array(length));
    const offset = this.nodes(to.nodeIndex).reduce((offset, node) => {
      buffer.set(node.chunk, offset);
      return offset + node.chunk.length;
    }, 0);

    if (offset < length) {
      const node = this.nodes(1)[0];
      buffer.set(node.chunk.slice(0, length - offset), offset);

      if (length - offset < node.chunk.length) {
        node.chunk = node.chunk.slice(length - offset);
        this.unshift(node.chunk);
      }
    }

    return buffer;
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
  if (this._readableState.flowing) {
    let chunk = this.read();

    if (chunk && chunk.length) {
      if (this._readableState.defaultEncoding === encodings.UTF8) {
        chunk = toString(chunk);
      }

      process.nextTick(() => {
        this.emit('data', chunk, this._readableState.defaultEncoding);
      });
    }
  }
}

function _end() {
  this._readableState.flowing = null;
  this._readableState.ended = true;
}

function Readable(options = {}) {
  this._readableState = new BufferState({
    flowing: null,
    ended: false,
    defaultEncoding: encodings.BINARY
  });
  /**
   * @property
   * @type array
   */

  this.pipes = [];
  this._read = options.read.bind(this);

  if (!this._read) {
    throw new TypeError('_read() is not implemented');
  }

  if (!(this._read instanceof Function)) {
    throw new TypeError('\'options.read\' should be a function, passed ' + typeof options.read);
  }
}

Readable.prototype = Object.create(Stream);
Readable.prototype.constructor = Readable;

Readable.prototype.pause = function pause() {
  if (this._readableState.flowing !== false) {
    this._readableState.flowing = false;
    this.emit('pause');
  }

  return this;
};

Readable.prototype.resume = function resume() {
  if (!this._readableState.flowing) {
    this._readableState.flowing = true;
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
  if (chunk === null) {
    _end.call(this);

    return false;
  }

  const overflow = this._readableState.push(chunk) > this.options.highWaterMark;

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
  return !this._readableState.flowing;
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
  this._write = options.write.bind(this);
  this._writableState = new BufferState({
    getBuffer: () => this._writableState._buffer,
    corked: 0,
    consumed: true,
    needDrain: false,
    ended: false,
    decodeStrings: true
  });
}

Writable.prototype = Object.create(Stream);
Writable.prototype.constructor = Writable;

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

export { Readable, Writable, Duplex, Transform, PassThrough };
