Promise.race = function race(promises) {
    var Class = this

    if (!(promises instanceof Array)) {
        throw new TypeError('You must pass an array to Promise.race().')
    }

    return new Class((resolve, reject) => {
        for (var i = 0, promise; i < promises.length; i++) {
            promise = promises[i]

            if (promise && promise.then instanceof Function) {
                promise.then(resolve, reject)
            } else {
                resolve(promise)
            }
        }
    })
}

export default Promise
