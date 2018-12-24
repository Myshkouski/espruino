'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var EventEmitter = _interopDefault(require('@bit/myshkouski.espruino.modules.events'));
var bufferFrom = _interopDefault(require('@bit/myshkouski.espruino.modules.buffer-from'));

var DEFAULT_HIGHWATERMARK = 128;

function Stream() {
  var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
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

function BufferState() {
  var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
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
  push: function (chunk) {
    if (chunk.length) {
      var node = createNode(chunk);

      if (this._buffer.length) {
        this._buffer[this._buffer.length - 1].next = node;
      }

      this._buffer.push(node);

      this.length += node.chunk.length;
    }

    return this.length;
  },
  unshift: function (chunk) {
    var node = createNode(chunk);

    if (this._buffer.length) {
      node.next = this._buffer[0];
    }

    this._buffer.unshift(node);

    this.length += node.chunk.length;
    return this.length;
  },
  nodes: function (count) {
    var nodes = this._buffer.splice(0, count);

    nodes.forEach(node => this.length -= node.chunk.length);
    return nodes;
  },
  at: function (index) {
    if (index >= this.length || index < 0) {
      return;
    }

    for (var nodeIndex = 0; nodeIndex < this._buffer.length; nodeIndex++) {
      var chunk = this._buffer[nodeIndex].chunk;

      if (index < chunk.length) {
        return {
          index: index,
          nodeIndex: nodeIndex,
          value: chunk[index]
        };
      }

      index -= chunk.length;
    }
  },
  for: function (from, to, callee) {
    var firstNode = this._buffer[from.nodeIndex];

    for (var index = from.nodeIndex; index < firstNode.chunk.length; index++) {
      callee.call(this, firstNode.chunk[index]);
    }

    for (var nodeIndex = 1 + from.nodeIndex; nodeIndex < to.nodeIndex; nodeIndex++) {
      var node = this._buffer[nodeIndex];

      for (var _index = 0; _index < node.chunk.length; _index++) {
        callee.call(this, node.chunk[_index]);
      }
    }

    if (from.nodeIndex < to.nodeIndex) {
      var lastNode = this._buffer[to.nodeIndex];

      for (var _index2 = 0; _index2 <= to.index; _index2++) {
        callee.call(this, lastNode.chunk[_index2]);
      }
    }
  },
  slice: function (length) {
    if (length === undefined) {
      length = this.length;
    }

    if (!length) {
      return bufferFrom([]);
    }

    if (length > this.length) {
      length = this.length;
    }

    var to;

    if (length) {
      to = this.at(length);
    }

    if (!to) {
      to = {
        index: this.length - 1,
        nodeIndex: this._buffer.length - 1
      };
    }

    var buffer = bufferFrom(Array(length));

    var offset = this._buffer.slice(to.nodeIndex - 1).reduce((offset, node) => {
      buffer.set(node.chunk, offset);
      return offset + node.chunk.length;
    }, 0);

    if (offset < length) {
      var node = this._buffer[to.nodeIndex];
      buffer.set(node.chunk.slice(0, length - offset), offset);
    }

    return buffer;
  },
  buffer: function (length) {
    if (length === undefined) {
      length = this.length;
    }

    if (!length) {
      return bufferFrom([]);
    }

    if (length > this.length) {
      length = this.length;
    }

    var to;

    if (length) {
      to = this.at(length);
    }

    if (!to) {
      to = {
        index: this.length - 1,
        nodeIndex: this._buffer.length - 1
      };
    }

    var buffer = bufferFrom(Array(length));
    var offset = this.nodes(to.nodeIndex).reduce((offset, node) => {
      buffer.set(node.chunk, offset);
      return offset + node.chunk.length;
    }, 0);

    if (offset < length) {
      var node = this.nodes(1)[0];
      buffer.set(node.chunk.slice(0, length - offset), offset);

      if (length - offset < node.chunk.length) {
        node.chunk = node.chunk.slice(length - offset);
        this.unshift(node.chunk);
      }
    }

    return buffer;
  }
};

var encodings = {
  BINARY: 'binary',
  UTF8: 'utf8'
};

function toString(binary) {
  var str = '';

  for (var i = 0; i < binary.length; i++) {
    str += String.fromCharCode(binary[i]);
  }

  return str;
}

function _flow() {
  if (this._readableState.flowing) {
    var chunk = this.read();

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

function Readable() {
  var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
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

  if (!this._read) {
    throw new TypeError('_read() is not implemented');
  }

  if (!(this._read instanceof Function)) {
    throw new TypeError('\'options.read\' should be a function, passed ' + typeof options.read);
  }
}

Readable.prototype = Object.create(Stream);
Readable.prototype.constructor = Readable;

Readable.prototype._read = function _read() {
  this.emit('error', new Error('The _read() method is not implemented'));
};

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

  var overflow = this._readableState.push(chunk) > this.options.highWaterMark;

  if (!overflow) {
    _flow.call(this);
  }

  return !overflow;
};

function _onData(pipe, data) {
  var writable = pipe.writable;

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
    var _pipe = {
      writable: writable,
      stopped: undefined
    };
    _pipe.onData = _onData.bind(this, _pipe);
    _pipe.onceDrain = _onceDrain.bind(this, _pipe);
    this.pipes.push(_pipe);
    this.on('data', _pipe.onData);
    writable.emit('pipe');
  }

  return writable;
};

Readable.prototype.unpipe = function unpipe(writable) {
  var pipes = [];

  if (writable) {
    var index = this.pipes.indexOf(writable);

    if (~index) {
      pipes = this.pipes.splice(index, 1);
    }
  } else {
    pipes = this.pipes.splice(0, this.pipes.length);
  }

  if (pipes.length) {
    for (var _index in pipes) {
      var _pipes$_index = pipes[_index],
          onData = _pipes$_index.onData,
          onceDrain = _pipes$_index.onceDrain;
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

function _readFromInternalBuffer() {
  var _this$_writableState;

  var spliced = (_this$_writableState = this._writableState).nodes.apply(_this$_writableState, arguments);

  if (this._writableState.needDrain && this._writableState.length < this.options.highWaterMark) {
    this._writableState.needDrain = false;
    this.emit('drain');
  }

  return spliced;
}

function _flush() {
  var _writableState = this._writableState;
  if (_writableState.corked) return;

  if (!_writableState.length) {
    if (_writableState.ended) {
      this.emit('finish');
    }

    return;
  }

  var cb = err => {
    if (err) this.emit('error', err);
    _writableState.consumed = true;
    process.nextTick(() => {
      _flush.call(this);
    });
  };

  if (!_writableState.corked && _writableState.consumed) {
    _writableState.consumed = false;

    if (this._writev) {
      var nodes = _readFromInternalBuffer.call(this);

      this._writev(nodes, cb);
    } else {
      var node = _readFromInternalBuffer.call(this, 1)[0];

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


function Writable() {
  var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
  Stream.call(this, options);
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

Writable.prototype._write = function _write() {
  this.emit('error', new Error('The _write() method is not implemented'));
};

Writable.prototype.write = function write(chunk, encoding, cb) {
  var _writableState = this._writableState,
      buffer = _writableState.buffer;

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

function Duplex() {
  var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
  Readable.call(this, options);
  Writable.call(this, options);
}

Duplex.prototype = Object.create(Readable.prototype);
Object.assign(Duplex.prototype, Writable.prototype);
Duplex.prototype.constructor = Duplex;

function Transform() {
  var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
  Duplex.call(this, {
    read: function () {},
    write: options.transform
  });
}

Transform.prototype = Object.create(Duplex.prototype);
Transform.prototype.constructor = Transform;

function _transform(data, encoding, cb) {
  this.push(data, encoding);
  cb();
}

function PassThrough() {
  var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
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
