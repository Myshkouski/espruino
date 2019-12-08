if(!process.nextTick) {
    process.nextTick = setImmediate.bind(process)
}
