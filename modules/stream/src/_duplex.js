import Readable from './_readable'
import Writable from './_writable'

function Duplex(options = {}) {
    Readable.call(this, options)
    Writable.call(this, options)
}

Duplex.prototype = Object.create(Readable.prototype)
Object.assign(Duplex.prototype, Writable.prototype)
Duplex.prototype.constructor = Duplex

export default Duplex