var SimpleBot = require('./simplebot');
var LiveAgent = require('./liveagentchat');
var Line = require('./line');
var DB = require('../db/mongodb');

var SERVICE = {
  LINE: 0,
  LIVEAGNET: 1,
  SIMPLEBOT: 2,
};

var COLLECTION_NAME = 'router_DEBUG';


var TEMPLATE_ROUTE = {
  requester {
    id: 'DEADBEEF',
    service: SERVICE.LINE,
  },
  responder: {
    id: 'DEADBEEF',
    service: SERVICE.SIMPLEBOT,
  }
}

var context = {
  requester: {
    id: '',
    service: SERVICE.LINE,
  },
  content: {

  },
}

exports.routeContext(ctx) {
  var requesterId = ctx.requester.id;

  var Route = DB.collection(COLLECTION_NAME);
  Route.findOne({
      $or: [{
        'requester.id': requesterId
      }, {
        'responder.id': requesterId
      }]
    })
    .then(function(route) {
      var service = route.requester.id === requesterId ? route.responder.service : route.requester.service;
      if (responder.service === SERVICE.SIMPLEBOT) {
        SimpleBot.sendMessage(ctx);
      } else if (responder.service === SERVICE.LIVEAGNET) {
        LiveAgent.sendMessage(ctx);
      } else if (responder.service === SERVICE.LINE) {
        Line.sendMessage(ctx);
      }
    });
}

exports.switchRoute(ctx, to) {
  var requesterId = ctx.requester.id;
}

function initRoute(ctx) {
  SimpleBot.initSimpleBot()
    .then(function(botId) {
      var routes = {
        requester {
          id: ctx.requester.id,
          service: ctx.requester.service,
        },
        responder: {
          id: botId,
          service: SERVICE.SIMPLEBOT,
        }
      }
      return Route.insertOne(route);
    })
    .then(function(result) {

    });
}
