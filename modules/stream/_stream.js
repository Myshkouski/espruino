import EventEmitter from 'events'

const DEFAULT_HIGHWATERMARK = 128

function Stream(options = {}) {
	EventEmitter.call(this)

	this.options = {
		highWaterMark: options.highWaterMark || DEFAULT_HIGHWATERMARK
	}
}

Stream.prototype = Object.create(EventEmitter.prototype)
Stream.prototype.constructor = Stream

export default Stream
