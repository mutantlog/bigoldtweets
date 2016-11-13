var Twit  = require('twit'); // Twitter module
var webshot = require('webshot');
var fs = require('fs');

var T = new Twit(require('./config.js')); // Import Twitter keys

var stream = T.stream('user'); // Open up a stream of your follower's tweets. You need to be following anyone you're going to be replying/faving
// Note: this could use the statuses/filter endpoint and pass a list of userid if you didn't want to follow them.


var strings = [ // And an array of a bunch of Tweets for the bot to post
"Big if true",
"Whoa, if true",
"Wow, if true",
"huge if true"
];


stream.on('tweet', function (tweet) { // Call this every time a tweet is received by the stream
	console.log(tweet);
	var tweet_url = "https://twitter.com/" + tweet.user.screen_name + "/status/" + tweet.id_str;
	var tweet_pic = webshot(tweet_url, {userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_7_2) AppleWebKit/535.11 (KHTML, like Gecko) Chrome/17.0.963.79 Safari/535.11', captureSelector: '.permalink-inner .tweet', streamType: 'png'});
	var picdata = '';
	tweet_pic.on('data', function (data) {
		picdata += data.toString('base64');
	});
	tweet_pic.on('end', function () {
		T.post('media/upload', {media_data: picdata}, function (err, tweetdata, response) {
			if (err) {
				console.log("Pic data");
				console.log(picdata);
				console.log('Failed to upload pic ',err);
			} else {
				var tweetIdStr = tweetdata.media_id_string;
				var tweet_meta_params = { media_id: tweetIdStr, alt_text: { text: tweet.text } };
				T.post('media/metadata/create', tweet_meta_params, function(err, data, response) {
					if (err) {
						console.log('Failed to create meta data ',err);
					} else {
						var tweet_params = { status : strings[Math.floor(Math.random() * strings.length)], media_ids: tweetIdStr };
						console.log(tweet_params);
						T.post('statuses/update', tweet_params, function (err, data, response) {
							if (err) {
								console.log('There was an error with Twitter:', err);
							}
						});
					}
				});
			}
		});
	});
});