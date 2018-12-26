import Transform from './_transform'

function _transform(data, encoding, cb) {
  this.push(data, encoding)
  cb()
}

function PassThrough(options = {}) {
  Transform.call(this, {
    // @ts-ignore
    transform: 'transform' in options ? options.transform : _transform
  })
}

PassThrough.prototype = Object.create(Transform.prototype)
PassThrough.prototype.constructor = PassThrough

export default PassThrough