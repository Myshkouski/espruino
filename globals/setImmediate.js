export default setImmediate = cb => {
    return setTimeout(cb, 0)
}
