export default function inherits(ctor, superCtor) {
	ctor.prototype = Object.create(superCtor.prototype)
	Object.defineProperties(ctor.prototype, {
		constructor: {
			value: ctor,
			enumerable: false,
			writable: true,
			configurable: true
		}
	})
}
