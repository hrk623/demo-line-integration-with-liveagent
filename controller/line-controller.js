var bot = require("../libs/bot");
var liveagent = require("../libs/liveagent");
var util = require("../libs/utilities");


// LINE からのリクエストを発信したユーザーの情報を取得する
exports.processRequest = function(req) {
  req.body.events.forEach(function(event) {
    var line = util.getLineConnection();
    var userId = event.source.userId || event.source.groupId || event.source.roomId;
    util.getUserProfile(line, userId, function(user) {
      line.user = user;
      util.setLineConnection(line);
      routeEvent(event);
    });
  });
};

// 現在の対応者(BOT or オペレータ)を取得し、イベントを渡す。
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

// BOT にイベントを渡す。
// Liveagent 開始の Postback であった場合は、Liveagent Session を開始する
function routeEventToBot(event) {
  bot.onEventRecieved(event);
  if (event.type === "postback") {
    var params = util.parseQuery(event.postback.data);
    if (params.target === "liveagent" && params.action === "start") {
      liveagent.startSessionWithLine();
    }
  }
}

// オペレータにイベントを渡す
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
