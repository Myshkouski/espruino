var assert = require('assert')
const bitUrl = 'https://node.bitsrc.io'

console.log(process.argv)

try {
    const test = ~process.env.npm_config__bit_registry.indexOf(bitUrl)
    assert.ok(test)
} catch(error) {
    console.error('\x1b[1;31m%s\x1b[1;36m%s\x1b[1;31m%s\x1b[0m', 'It seems that npm is not configured with Bit. Please run ', 'npm config set @bit:registry ' + bitUrl, '.')
    process.exit(1)
}
