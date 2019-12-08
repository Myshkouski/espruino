if (!global.clearImmediate) {
    global.clearImmediate = immediate => clearTimeout(immediate)
}