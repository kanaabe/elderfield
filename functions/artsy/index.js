var alexa = require('alexa-app');
var app = new alexa.app('artsy');
var xapp = require('./models/xapp');
var api = require('./models/api');
var _ = require('underscore');
var removeMd = require('remove-markdown');

console.log('Loaded artsy.');

module.change_code = 1; // allow this module to be reloaded by hotswap when changed

var helpText = "Say help if you need help or exit any time to exit. What artist would you like to hear about?"

app.launch(function(req, res) {
    console.log('app.launch');
    res
        .say("Welcome to Artsy! Ask me about an artist.")
        .shouldEndSession(false, helpText)
        .send();
});

app.intent('AMAZON.StopIntent', {
        "slots": {},
        "utterances": [
            "stop"
        ]
    },
    function(req, res) {
        console.log('app.AMAZON.StopIntent');
        res.say("Find out more at artsy.net. Goodbye.");
        res.send();
    }
);

app.intent('AMAZON.CancelIntent', {
        "slots": {},
        "utterances": [
            "cancel"
        ]
    },
    function(req, res) {
        console.log('app.AMAZON.CancelIntent');
        res.say("Find out more at artsy.net. Goodbye.");
        res.send();
    }
);

app.intent('AMAZON.HelpIntent', {
        "slots": {},
        "utterances": [
            "help"
        ]
    },
    function(req, res) {
        console.log('app.AMAZON.HelpIntent');
        res.say("Artsy’s mission is to make all the world’s art accessible to anyone with an Internet connection. You can ask Artsy about an artist. For example say ask Artsy about Norman Rockwell. What artist would you like to hear about?");
        res.shouldEndSession(false);
        res.send();
    }
);

app.intent('AboutIntent', {
        "slots": {
            "VALUE": "NAME"
        },
        "utterances": [
            "about {-|VALUE}"
        ]
    },
    function(req, res) {
        var value = req.slot('VALUE');
        console.log('app.AboutIntent: ' + value);

        if (!value) {
            res.say("Sorry, I didn't get that artist name. Try again?");
            return res.shouldEndSession(false, helpText);
        } else {
            api.instance().then(function(api) {
                api.matchArtist(value).then(function(artist) {
                    var message = []

                    if (artist.hometown || artist.birthday) {
                        message.push(_.compact([
                            artist.nationality ? artist.nationality : 'The',
                            "artist",
                            artist.name,
                            "was born",
                            artist.hometown ? "in " + _.first(artist.hometown.split(',')) : null,
                            artist.birthday ? "in " + _.last(artist.birthday.split(',')) : null,
                            artist.deathday ? "and died in " + _.last(artist.deathday.split(',')) : null
                        ]).join(' '));
                    }

                    if (artist.blurb || artist.biography) {
                        message.push(artist.blurb || artist.biography);
                    }

                    if (message.length > 0) {
                        res.say(removeMd(message.join('. ')));
                        res.shouldEndSession(true);
                    } else {
                        res.say("Sorry, I don't know much about " + value + ". Try again?");
                        res.shouldEndSession(false);
                    }

                    res.send();
                }).fail(function(error) {
                    res.say("Sorry, I couldn't find an artist " + value + ". Try again?");
                    res.shouldEndSession(false);
                    res.send();
                });
            }).fail(function(error) {
                res.say("Sorry, I couldn't connect to Artsy. Try again?");
                res.shouldEndSession(false);
                res.send();
            });

            return false;
        }
    }
);

app.intent('BirthIntent', {
        "slots": {
            "VALUE": "NAME"
        },
        "utterances": [
            "when was {-|VALUE} born"
        ]
    },
    function(req, res) {
        var value = req.slot('VALUE');
        console.log('app.BirthIntent: ' + value);

        if (!value) {
            res.say("Sorry, I didn't get that artist name. Try again?");
            return res.shouldEndSession(false, helpText);
        } else {
            api.instance().then(function(api) {
                api.matchArtist(value).then(function(artist) {
                    var message = []

                    if (artist.birthday) {
                        message.push(_.compact([
                            artist.nationality ? artist.nationality : 'The',
                            "artist",
                            artist.name,
                            "was born",
                            artist.hometown ? "in " + _.first(artist.hometown.split(',')) : null,
                            artist.birthday ? "in " + _.last(artist.birthday.split(',')) : null,
                            artist.deathday ? "and died in " + _.last(artist.deathday.split(',')) : null
                        ]).join(' '));
                    }

                    if (artist.blurb || artist.biography) {
                        message.push(artist.blurb || artist.biography);
                    }

                    if (message.length > 0) {
                        res.say(removeMd(message.join('. ')));
                        res.shouldEndSession(true);
                    } else {
                        res.say("Sorry, I don't know much about " + value + ". Try again?");
                        res.shouldEndSession(false);
                    }

                    res.send();
                }).fail(function(error) {
                    res.say("Sorry, I couldn't find an artist " + value + ". Try again?");
                    res.shouldEndSession(false);
                    res.send();
                });
            }).fail(function(error) {
                res.say("Sorry, I couldn't connect to Artsy. Try again?");
                res.shouldEndSession(false);
                res.send();
            });

            return false;
        }
    }
);


if (process.env['ENV'] == 'lambda') {
    console.log("Starting Artsy Alexa on AWS lambda.")
    exports.handle = app.lambda();
} else if (process.env['ENV'] == 'development') {
    console.log("Starting Artsy Alexa in development mode.")
    module.exports = app;
} else {
    var fs = require('fs');
    fs.writeFileSync('schema.json', app.schema());
    fs.writeFileSync('utterances.txt', app.utterances());
    console.log('Schema and utterances exported.');
}
