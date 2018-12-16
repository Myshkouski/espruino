import Duplex from './_duplex'

function Transform(options = {}) {
	Duplex.call(this, {
		read() {},
		write: options.transform
	})
}

Transform.prototype = Object.create(Duplex.prototype)
Transform.prototype.constructor = Transform

export default Transform
