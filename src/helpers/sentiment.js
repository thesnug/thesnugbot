const unirest = require('unirest')
const config = require('../config');
const apiKey = config.Sentiment;

const sentiment = {}

sentiment.init = function () {
  return unirest.post('https://community-sentiment.p.mashape.com/text/')
  .header('X-Mashape-Key', apiKey)
  .header('Content-Type', 'application/x-www-form-urlencoded')
  .header('Accept', 'application/json');
}

module.exports = sentiment
