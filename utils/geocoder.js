const NodeGeocoder = require('node-geocoder');

const options = {
  provider: process.env.GEOCODER_PROVIDER,
  httpAdapter: 'http',
  apiKey: process.env.GEOCODER_API_KEY,
  formatter: null
};

console.log(process.env.GEOCODER_API_KEY)

const geocoder = NodeGeocoder(options);

module.exports = geocoder;
