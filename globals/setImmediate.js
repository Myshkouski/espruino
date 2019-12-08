if (!global.setImmediate) {
    global.setImmediate = cb => setTimeout(cb, 0)
}
