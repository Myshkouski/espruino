Array.prototype.concat = function concat() {
    const concatenated = []

    for (let i in this) {
        concatenated.push(this[i])
    }

    for (let i in arguments) {
        for (let j in arguments[i]) {
            concatenated.push(arguments[i][j])
        }
    }

    return concatenated
}
