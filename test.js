const requireContext = require('require-context')

console.log(requireContext(__dirname + '/modules', true, /.+/).keys())