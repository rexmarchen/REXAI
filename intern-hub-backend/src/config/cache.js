const NodeCache = require('node-cache');
const config = require('./index');

const cache = new NodeCache({ stdTTL: config.cache.ttl });

module.exports = cache;