const EVENT_PREFIX = '#on'

function EventEmitter() {}

EventEmitter.prototype = Object.create({
	emit(event) {
		if (event == 'error' && !this[EVENT_PREFIX + event]) {
			throw new Error('Unhandled "error" event')
		}

		Object.prototype.emit.apply(this, arguments)

		return this
	},

	on() {
		Object.prototype.on.apply(this, arguments)

		return this
	},

	once(event, listener) {
		const once = () => {
			this.removeListener(event, once)
			return listener.apply(this, arguments)
		}

		return this.on(event, once)
	},

	removeListener(event, listener) {
		Object.prototype.removeListener.call(this, event, listener)

		return this
	},

	removeAllListeners(event) {
		Object.prototype.removeAllListeners.call(this, event)

		return this
	}
})

export default EventEmitter