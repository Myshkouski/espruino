export default (value, encodingOrOffset, length) => {
	if (typeof value === 'number') {
		throw new TypeError('"value" argument must not be a number')
	}

	if (ArrayBuffer.isView(value)) {
		encodingOrOffset >>>= 0

		var maxLength = value.byteLength - encodingOrOffset

		if (maxLength < 0) {
			throw new RangeError("'offset' is out of bounds")
		}

		if (length === undefined) {
			length = maxLength
		} else {
			length >>>= 0

			if (length > maxLength) {
				throw new RangeError("'length' is out of bounds")
			}
		}

		return E.toUint8Array(value.slice(encodingOrOffset, encodingOrOffset + length))
	}

	if (typeof value === 'string') {
		if (typeof encodingOrOffset !== 'string' || encodingOrOffset === '') {
			encodingOrOffset = 'utf8'
		}

		if (encodingOrOffset !== 'utf8' && encodingOrOffset !== 'ascii') {
			throw new TypeError('"encoding" must be a valid string encoding')
		}

		return E.toUint8Array(value)
	}

	return E.toUint8Array(value)
}