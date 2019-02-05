export default function setImmediate(cb) {
  return setTimeout(cb, 0)
}
