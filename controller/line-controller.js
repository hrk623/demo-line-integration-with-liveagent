var bot = require("../libs/bot");
var liveagent = require("../libs/liveagent");
var util = require("../libs/utilities");

exports.processRequest = function(req) {
  req.body.events.forEach(function(event) {
    var line = {
      channelId: process.env.LINE_CHANNEL_ID,
      secret: process.env.LINE_CHANNEL_SECRET,
      token: process.env.LINE_CHANNEL_ACCESS_TOKEN,
      user: {
        id: event.source.userId || event.source.groupId || event.source.roomId
      },
      event: event
    };

    util.getUserProfile(line, function(user) {
      line.user = user;
      var responder = util.getResponder();
      console.log(responder);

         switch (responder.name) {
          case 'BOT':          
            routeEventToBot(line, event);
            break;
          case 'LIVEAGENT':
            routeEventToLiveagent(line, event);
            break;
          default:
            break;
        }
    });
  });
};

function routeEventToBot(line, event) {
  bot.onEventRecieved(line, event);
  if (event.type === "postback") {
    var params = util.parseQuery(event.postback.data);
    if (params.target === "liveagent" && params.action === "start") {
      liveagent.startSessionWithLine(line);
    }
  }
}

function routeEventToLiveagent(line, event) {
  liveagent.onEventRecieved(line, event);
}

function handleError(error, body) {
  console.error(body.message);
  if (body.details && body.details.length > 0) {
    body.details.forEach(function(detail) {
      console.error(detail.property + ": " + detail.message);
    });
  }
}

/*
transaction = {
  line: {
    channelId: String,
    secret: String,
    token: String,
    user: {
      id: String,
      name: String,
      imageUrl: String
    },
    event: {
      type: String
    }
  },
  liveagent: {
    laPod: String,
    orgId: String,
    deploymentId: String,
    buttonId: String,
    session: {
      sessionId: String,
      sessionKey: String,
      affinity: String,
      sequence: Number,
      ack: Number
    },
    file: {
      uploadServletUrl: String,
      fileToken: String,
      cdmServletUrl: String
    }
  },
  transcripts: []
}
*/
