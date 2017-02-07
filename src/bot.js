/* dependencies */
const twit = require('twit');
const ura = require('unique-random-array');
const config = require('./config');
const strings = require('./helpers/strings');

const Twitter = new twit({
  consumer_key: config.twitter.consumerKey,
  consumer_secret: config.twitter.consumerSecret,
  access_token: config.twitter.accessToken,
  access_token_secret: config.twitter.accessTokenSecret,
});

/* frequencies */
const retweetFrequency = config.twitter.retweet;
const favoriteFrequency = config.twitter.favorite;
const username = config.twitter.username;

/* query strings */
const qs = ura(strings.queryString);
const qsSq = ura(strings.queryStringSubQuery);
const rt = ura(strings.resultType);
const rs = ura(strings.responseString);

/* follow event */
function onFollow(event) {
  console.log('follow event is now running...');

  const screenName = event.source.screen_name;

  let response = rs();
  const find = 'screenName';
  const regex = new RegExp(find, 'g');
  response = response.replace(regex, screenName);

  /* reply to every user that follows this account */
  postTweet(response);
}

/* post tweet */
function postTweet(text) {
  const tweet = {
    status: text
  };

  const screenName = text.search(username);

  if (screenName !== -1) {
    console.log('[tweet][error] cannot reply to self – skipping');
  } else {
    Twitter.post('statuses/update', tweet, function(err, data, response) {
      if (err) {
        console.log('[tweet][error] cannot reply to follower – ' + err.message);
      } else {
        console.log('[tweet][success] replied');
      }
    });
  }
}

/* favorite tweet */
function favoriteTweet() {
  let paramQS = qs();
  paramQS += qsSq();
  const paramRT = rt();
  const params = {
    q: paramQS,
    result_type: paramRT,
    lang: 'en'
  };

  Twitter.get('search/tweets', params, function(err, data) {
    const randomTweet = selectTweet(data.statuses);

    if (typeof randomTweet != 'undefined') {
      Twitter.post('favorites/create', {
        id: randomTweet.id_str
      }, function(err, response) {
        if (err) {
          console.log('[favorite][error] ' + err.message + ' query: ' + paramQS)
        } else {
          console.log('[favorite][success] query: ' + paramQS)
        }
      });
    }
  });
}

/* post a retweet */
function retweet() {
  let paramQS = qs();
  paramQS += qsSq();
  const paramRT = rt();
  const params = {
    q: paramQS,
    result_type: paramRT,
    lang: 'en'
  };

  Twitter.get('search/tweets', params, function(err, data) {
    if (!err) {
      try {
        var retweetId = data.statuses[0].id_str;
      } catch (e) {
        console.log('[retweet][error] ' + err.message + ' query: ' + paramQS);
        return;
      }

      Twitter.post('statuses/retweet/:id', {
        id: retweetId
      }, function(err, response) {
        if (err) {
          console.log('[retweet][error] ' + err.message + ' query: ' + paramQS);
        } else {
          console.log('[retweet][success] query: ' + paramQS);
        }
      });
    } else {
      console.log('[retweet][error] search error');
    }
  });
}

/* select a random tweet */
function selectTweet(tweets) {
  const index = Math.floor(Math.random() * tweets.length)
  return tweets[index];
}

/* retweet on bot start */
retweet();

/* retweet in every x minutes */
setInterval(retweet, 60000 * retweetFrequency);

/* favorite on bot start */
favoriteTweet();

/* favorite in every x minutes */
setInterval(favoriteTweet, 60000 * favoriteFrequency);

/* start the user stream */
const stream = Twitter.stream('user');

/* listen for follows */
stream.on('follow', onFollow);
