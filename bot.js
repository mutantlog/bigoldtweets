
var Twit  = require('twit'); // Twitter module
var webshot = require('webshot');
var fs = require('fs');

var T = new Twit(require('./config.js')); // Import Twitter keys

var stream = T.stream('user'); // Open up a stream of your follower's tweets. You need to be following anyone you're going to be capping and tweeting
// Note: this could use the statuses/filter endpoint and pass a list of userid if you didn't want to follow them.
// In fact, that might have even been the better option and eliminated some excess code in here, but I'm leaving it as is for uh, reasons.
// Those reasons are, well, uh, I'm not sure actually


var strings = [ // And an array of a bunch of Tweets for the bot to post
"Big if true",
"Whoa, if true",
"Wow, if true",
"huge if true"
];

var my_account_name; // We need to know who we are to avoid some issues later on in the code
T.get('account/verify_credentials', { skip_status: true }) // This is cut and pasted code from elsewhere, hence the style difference from the rest of the code
  .catch(function (err) {
    console.log('caught error', err.stack);
  })
  .then(function (result) {
    // `result` is an Object with keys "data" and "resp".
    // `data` and `resp` are the same objects as the ones passed
    // to the callback.
    // See https://github.com/ttezel/twit#tgetpath-params-callback
    // for details.

   my_account_name=result.data.screen_name;
  });


stream.on('tweet', function (tweet) { // Call this every time a tweet is received by the stream
	var mentions = [];
	if (tweet.entities.user_mentions) { // When streaming a user timeline, mentions of the user show up automatically, and there can be multiple mentions in a tweet
		for (var i = 0; i < tweet.entities.user_mentions.length; i++) {
			mentions.push(tweet.entities.user_mentions[i].screen_name); // So we'll stuff them into an array
		}
	}
	if (tweet.user.screen_name != my_account_name && !(mentions.includes(my_account_name))) { // Your own tweets also show up in the user stream, so let's make sure we don't have an infinite loop until we hit the Twitter posting limits, not that I learned this the hard way or anything and you shouldn't look to the beginning of @bigoldtweets or anything
		// console.log(tweet); // Debug info of the tweet 
		var tweet_url = "https://twitter.com/" + tweet.user.screen_name + "/status/" + tweet.id_str; // Re-create the URL of the tweet
		var tweet_pic = webshot(tweet_url, {userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_7_2) AppleWebKit/535.11 (KHTML, like Gecko) Chrome/17.0.963.79 Safari/535.11', captureSelector: '.permalink-inner .tweet', streamType: 'png'}); // Use webshot to capture a png of the tweet
		var picdata = ''; // Initialize the picture variable because we're going to stream it rather than writing it to disk and reading it back
		tweet_pic.on('data', function (data) { // The image data may arrive in multiple chunks, so they need to be concatenated
			picdata += data.toString('base64');
		});
		tweet_pic.on('end', function () { // Once the picture is done streaming we can upload it to Twitter
			T.post('media/upload', {media_data: picdata}, function (err, tweetdata, response) {
				if (err) {
					console.log("Pic data");
					console.log(picdata);
					console.log('Failed to upload pic ',err);
				} else { // If the image data is successfully updated
					var tweetIdStr = tweetdata.media_id_string; // Get the image identifier
					var tweet_meta_params = { media_id: tweetIdStr, alt_text: { text: tweet.text } }; // The alt text is just the text of the tweet we're posting. I could include the user name who posted that. Maybe I'll open an issue on that later
					T.post('media/metadata/create', tweet_meta_params, function(err, data, response) { // Create the metadata to contain the alt text for the image
						if (err) {
							console.log('Failed to create meta data ',err);
						} else { // Ok, we're ready to tweet the image
							var tweet_params = { status : strings[Math.floor(Math.random() * strings.length)], media_ids: tweetIdStr }; // Pick one of the canned tweets to include
							// console.log(tweet_params); // More debug code
							T.post('statuses/update', tweet_params, function (err, data, response) { // And let's post the tweet
								if (err) {
									console.log('There was an error with Twitter:', err);
								}
							});
						}
					});
				}
			});
		});
	} else {
		// console.log("I'm ignoring this tweet from " + tweet.user.screen_name); Another bit of debugging if tweets are mentions or from yourself
	}
});
