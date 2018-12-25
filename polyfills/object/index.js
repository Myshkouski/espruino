Object.assign = (target, ...args) => {
  for (let i in args) {
    const obj = args[i]
    if (obj instanceof Object) {
      for (let key in obj) {
        target[key] = obj[key]
      }
    }
  }

  return target
}

Object.defineProperty = (obj, prop, descriptor) => {
  if (descriptor.get) {
    obj.value = descriptor.get()
  } else if (descriptor.value) {
    obj[prop] = descriptor.value
  }

  return obj
}

Object.defineProperties = (obj, descriptors) => {
  for (let prop in descriptors) {
    const descriptor = descriptors[prop]
    Object.defineProperty(obj, prop, descriptor)
  }
  return obj
}

export default Object
