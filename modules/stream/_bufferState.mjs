/**
 * Buffer.from() from node.js
 *  
 * @return  {function}
 */
import bufferFrom from 'buffer-from'

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
  })
}

function createNode(chunk) {
  return {
    chunk: bufferFrom(chunk),
    encoding: 'binary',
    next: null
  }
}

BufferState.prototype = {
  push(chunk) {
    if (chunk && chunk.length) {
      const node = createNode(chunk)

      if (this._buffer.length) {
        this._buffer[this._buffer.length - 1].next = node
      }

      this._buffer.push(node)
      this.length += node.chunk.length
    }

    return this.length
  },

  unshift(chunk) {
    const node = createNode(chunk)

    if (this._buffer.length) {
      node.next = this._buffer[0]
    }

    this._buffer.unshift(node)
    this.length += node.chunk.length

    return this.length
  },

  nodes(count) {
    const nodes = this._buffer.splice(0, count)
    nodes.forEach(node => this.length -= node.chunk.length)

    return nodes
  },

  shift() {
    return this.nodes(1)[0]
  },

  at(index) {
    if (index >= this.length || index < 0) {
      return
    }

    for (let nodeIndex = 0; nodeIndex < this._buffer.length; nodeIndex++) {
      const chunk = this._buffer[nodeIndex].chunk
      if (index < chunk.length) {
        return {
          index,
          nodeIndex,
          value: chunk[index]
        }
      }

      index -= chunk.length
    }
  },

  for (from, to, callee) {
    const firstNode = this._buffer[from.nodeIndex]
    for (let index = from.nodeIndex; index < firstNode.chunk.length; index++) {
      callee.call(this, firstNode.chunk[index])
    }

    for (let nodeIndex = 1 + from.nodeIndex; nodeIndex < to.nodeIndex; nodeIndex++) {
      const node = this._buffer[nodeIndex]
      for (let index = 0; index < node.chunk.length; index++) {
        callee.call(this, node.chunk[index])
      }
    }

    if (from.nodeIndex < to.nodeIndex) {
      const lastNode = this._buffer[to.nodeIndex]
      for (let index = 0; index <= to.index; index++) {
        callee.call(this, lastNode.chunk[index])
      }
    }
  },

  slice(length) {
    if (length === undefined) {
      length = this.length
    }

    if (!length) {
      return bufferFrom([])
    }

    if (length > this.length) {
      length = this.length
    }

    let to

    if (length) {
      to = this.at(length)
    }

    if (!to) {
      to = {
        index: this.length - 1,
        nodeIndex: this._buffer.length - 1
      }
    }

    let array = []

    const offset = this._buffer.slice(to.nodeIndex - 1).reduce((offset, node) => {
      array = array.concat(node.chunk)
      return offset + node.chunk.length
    }, 0)

    if (offset < length) {
      const node = this._buffer[to.nodeIndex]

      array = array.concat(node.chunk.slice(0, length - offset))
    }

    return bufferFrom(Aarray)
  },

  buffer(length) {
    if (length === undefined) {
      length = this.length
    }

    if (!length) {
      return bufferFrom([])
    }

    if (length > this.length) {
      length = this.length
    }

    let to

    if (length) {
      to = this.at(length)
    }

    if (!to) {
      to = {
        index: this.length - 1,
        nodeIndex: this._buffer.length - 1
      }
    }

    let array = []

    const offset = this.nodes(to.nodeIndex).reduce((offset, node) => {
      array = array.concat(node.chunk)
      return offset + node.chunk.length
    }, 0)

    if (offset < length) {
      const node = this.shift()

      array = array.concat(node.chunk.slice(0, length - offset))
      if (length - offset < node.chunk.length) {
        node.chunk = node.chunk.slice(length - offset)

        this.unshift(node.chunk)
      }
    }

    return bufferFrom(array)
  }
}

export default BufferState