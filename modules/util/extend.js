import inherits from './inherits'

export default function extend(ctor, superCtor) {
	inherits(ctor, superCtor)

	function _extended() {
		superCtor.apply(this, arguments)
		ctor.apply(this, arguments)
	}

	inherits(_extended, ctor)

	// _extended.prototype.constructor.name = ctor.name

	Object.defineProperty(_extended.prototype.constructor, 'name', {
		value: ctor.name
	})

	return _extended
}
