var bot = require("../libs/bot");
var liveagent = require("../libs/liveagent");
var util = require("../libs/utilities");

exports.processRequest = function(req) {
  req.body.events.forEach(function(event) {
    var line = util.getLineConnection();
    
    if (!line.user) {
      var userId = event.source.userId || event.source.groupId || event.source.roomId;
      util.getUserProfile(line, userId, function(user) {
        line.user = user;
        util.setLineConnection(line);
        routeEvent(event);
      });
    } else {
      routeEvent(event);
    }
  });
};

function routeEvent(event) {
  var responder = util.getResponder();
  switch (responder.name) {
    case "BOT":
      routeEventToBot(event);
      break;
    case "LIVEAGENT":
      routeEventToLiveagent(event);
      break;
    default:
      break;
  }
}

function routeEventToBot(event) {
  bot.onEventRecieved(event);
  if (event.type === "postback") {
    var params = util.parseQuery(event.postback.data);
    if (params.target === "liveagent" && params.action === "start") {
      liveagent.startSessionWithLine();
    }
  }
}

function routeEventToLiveagent(event) {
  liveagent.onEventRecieved(event);
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
