const ERROR_EVENT_TYPE = 'error'
const ONERROR_PROP = '#on' + ERROR_EVENT_TYPE

function EventEmitter() {
	this._listeners = {}
}

function _duplicateEvent(event) {
	if (event) {
		if (`#${ event }` in this) {
			this._listeners[event] = this[`#${ event }`]
		} else {
			delete this._listeners[event]
		}
	}
}

EventEmitter.prototype = {
	emit(event, error) {
		if (event === ERROR_EVENT_TYPE && !(this[ONERROR_PROP] || this._events[ERROR_EVENT_TYPE])) {
			throw error
		}

		return EventEmitter.prototype.emit.apply(this, arguments)
	},

	on(event, listener) {
		Object.prototype.on.call(this, event, listener)
		_duplicateEvent.call(this, event)

		// this._listeners[event]
		//   ? this._listeners[event].push(listener)
		//   : this._listeners[event] = [listener]

		return this
	},

	removeListener(event, listener) {
		Object.prototype.on.call(this, event, listener)
		_duplicateEvent.call(this, event)
		// if(!event) {
		//   this._listeners = {}
		// } else {
		//   if(listener && this._listeners[event]) {
		//     const index = this._listeners[event].indexOf(listener)
		//
		//     if(~index) {
		//       this._listeners[event].splice(index, 1)
		//     }
		//   }
		//
		//   if(!listener || !this._listeners[event]) {
		//     delete this._listeners[event]
		//   }
		// }
		return this
	},

	once(event, listener) {
		function once() {
			this.removeListener(event, _listener)
			return listener.apply(this, arguments)
		}

		return this.on(event, once)
	}
}

module.exports = EventEmitter
