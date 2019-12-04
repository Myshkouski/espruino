if(!ArrayBuffer.isView) {
    // const arrayBufferViewInstances = [
    //     Int8Array,
    //     Uint8Array,
    //     Uint8ClampedArray,
    //     Int16Array,
    //     Uint16Array,
    //     Int32Array,
    //     Uint32Array,
    //     Float32Array,
    //     Float64Array,
    //     DataView
    // ]

    // ArrayBuffer.isView = value => arrayBufferViewInstances.some( ArrayBufferViewInstance => value instanceof ArrayBufferViewInstance )
    ArrayBuffer.isView = value => typeof value == 'object' && value.buffer instanceof ArrayBuffer
}
