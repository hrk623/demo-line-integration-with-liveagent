var util = require('./utilities');

var USER_AGENT = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/56.0.2924.87 Safari/537.36';
var API_VERSION = process.env.LIVEAGENT_API_VERSION || 39;

exports.startSessionWithLine = function (line) {
  var liveagent = {
    laPod: process.env.LIVEAGENT_POD,
    orgId: process.env.LIVEAGENT_ORGANIZATION_ID,
    deploymentId: process.env.LIVEAGENT_DEPLOYMENT_ID,
    buttonId: process.env.LIVEAGENT_BUTTON_ID,
};
  createLiveAgentSession(liveagent, function(session) {
     liveagent.session = liveagent;
     createChatVisitorSession(liveagent, line);
  })
}


function createLiveAgentSession (liveagent, callback) {
  var request = require('request');
  var options = {
    url: 'https://' + liveagent.laPod + '/chat/rest/System/SessionId',
    headers: {
      'X-LIVEAGENT-API-VERSION': API_VERSION,
      'X-LIVEAGENT-AFFINITY': 'null',
      'Connection': 'keep-alive'
    },
    json: true
  };
  request.get(options, function(error, response, body) {
    if (error || response.statusCode != 200) {
        handleError(error, body)
        return;
    }
    callback({
      key: body.key,
      affinity: body.affinityToken,
      id: body.id,
      sequence: 1
    });
  });
}

function createChatVisitorSession(liveagent, line) {
  var request = require('request');
  var options = {
    url: 'https://' + liveagent.laPod + '/chat/rest/Chasitor/ChasitorInit',
    headers: {
      'X-LIVEAGENT-API-VERSION': API_VERSION,
      'X-LIVEAGENT-SESSION-KEY': session.key,
      'X-LIVEAGENT-SEQUENCE': session.sequence,
      'X-LIVEAGENT-AFFINITY': session.affinity
    },
    json: true,
    body: {
      organizationId: liveagent.orgId,
      deploymentId: liveagent.deploymentId,
      buttonId: liveagent.buttonId,
      sessionId: session.id,
      trackingId: '',
      userAgent: USER_AGENT,
      language: 'ja',
      screenResolution: '3200x1800',
      visitorName: line.userName,
      prechatDetails: [{
        label: 'ContactLineId',
        value: line.user.id,
        entityMaps: [],
        transcriptFields: [],
        displayToAgent: true,
        doKnowledgeSearch: false
      }, {
        label: 'ContactLastName',
        value: line.user.name,
        entityMaps: [],
        transcriptFields: [],
        displayToAgent: true,
        doKnowledgeSearch: false
      }],
      buttonOverrides: [],
      receiveQueueUpdates: true,
      prechatEntities: [{
        entityName: 'Contact',
        showOnCreate: true,
        linkToEntityName: null,
        linkToEntityField: null,
        saveToTranscript: 'ContactId',
        entityFieldsMaps: [{
          fieldName: 'LastName',
          label: 'ContactLastName',
          doFind: false,
          isExactMatch: false,
          doCreate: true
        }, {
          fieldName: 'LineId__c',
          label: 'ContactLineId',
          doFind: true,
          isExactMatch: true,
          doCreate: true
        }]
      }],
      isPost: true
    }
  };

  request.post(options, function(error, response, body) {
    if (error || response.statusCode != 200) {
      handleError(error, body)
      return;
    }
    liveagent.session.sequence++;
  });
}

function monitorChatActivity(liveagent) {
  liveagent.session.ack = liveagent.session.ack === undefined ? -1 : liveagent.session.ack;
  var request = require('request');
  var options = {
    url: 'https://' + liveagent.laPod + '/chat/rest/System/Messages',
    qs: {
      ack: liveagent.session.ack
    },
    headers: {
      'X-LIVEAGENT-API-VERSION': API_VERSION,
      'X-LIVEAGENT-SESSION-KEY': liveagent.session.key,
      'X-LIVEAGENT-AFFINITY': liveagent.session.affinity,
    },
    json: true
  };
  request.get(options, function(error, response, body) {
    if (error || response.statusCode != 200) {
      handleError(error, body)
    } else if (!error && response.statusCode == 204) {
       monitorChatActivity(liveagent);
    } else {
      liveagent.session.ack = body.sequence;
       monitorChatActivity(liveagent);
       body.messages.forEach(function(message) {
        onMessageRecieved(liveagent, message);
      });
    }
  });
}

function onMessageRecieved(liveagent, message) {
  switch (message.type) {
    case 'ChatMessage':
      onChatMessage(message);
      break;
    case 'AgentTyping':
      onAgentTyping();
      break;
    case 'AgentNotTyping':
      onAgentNotTyping();
      break;
    case 'AgentDisconnect':
      onAgentDisconnect();
      break;
    case 'ChasitorSessionData':
      onChasitorSessionData();
      break;
    case 'ChatEnded':
      onChatEnded();
      break;
    case 'ChatEstablished':
      onChatEstablished();
      break;
    case 'ChatRequestFail':
      onChatRequestFail();
      break;
    case 'ChatRequestSuccess':
      onChatRequestSuccess();
      break;
    case 'ChatTransferred':
      onChatTransferred();
      break;
    case 'CustomEvent':
      onCustomEvent();
      break;
    case 'NewVisitorBreadcrumb':
      onNewVisitorBreadcrumb();
      break;
    case 'QueueUpdate':
      onQueueUpdate();
      break;
    case 'FileTransfer':
      onFileTransfer();
      break
    case 'Availability':
      onAvailability();
      break
    default:
      break;
  }
}

function onChatMessage(message) {
  util.pushMessage(conn, [{
    type: 'text',
    text: msg.message.text
  }]);
}

function onAgentTyping() {}
function onAgentNotTyping() {}
function onAgentDisconnect() {}
function onChasitorSessionData() {}
function onChatEnded() {}
function onChatEstablished() {}
function onChatRequestFail() {}
function onChatRequestSuccess() {}
function onChatTransferred() {}
function onCustomEvent() {}
function onNewVisitorBreadcrumb() {}
function onQueueUpdate() {}
function onFileTransfer() {}
function onAvailability() {}


exports.onEventRecieved = function(line, event) {
   var liveagent = {
    laPod: 'd.la10.salesforceliveagent.com',
    orgId: '00D6F000001dAw8',
    deploymentId: '5726F000000PRZ1',
    buttonId: '5736F000000PRfz',
    session: {
      id: String,
      key: String,
      affinity: String,
      sequence: Number,
      ack: Number
    },
    file: {
      uploadServletUrl: String,
      fileToken: String,
      cdmServletUrl: String
    }
  };

  switch (event.type) {
    case 'message':
      switch (event.message.type) {
        case 'text':
          sendMessage(liveagent, event.message.text);
          break;
        case 'image':
          util.getContent(line, event.message, function(content) {
            uploadFile(liveagent, content);
          });

          break;
        case 'video':
          util.getContent(line, event.message, function(content) {
            uploadFile(liveagent, content);
          });
          break;
        case 'audio':
          util.getContent(line, event.message, function(content) {
            uploadFile(liveagent, content);
          });
          break;
        case 'location':

          break;
        case 'sticker':

          break;
        default:
          break;
      }
      break;
    case 'follow':
      break;
    case 'unfollow':
      break;
    case 'join':
      break;
    case 'leave':
      break;
    case 'postback':
      break;
    case 'beacon':
      break;
    default:
      break;
  }
}

function sendMessage(liveagent, text) {
  session.getSession(globalId, function(err, ses) {
    var request = require('request');
    var options = {
      url: 'https://' + liveagent.laPod + '/chat/rest/Chasitor/ChatMessage',
      headers: {
        'X-LIVEAGENT-API-VERSION': API_VERSION,
        'X-LIVEAGENT-SESSION-KEY': liveagent.session.key,
        'X-LIVEAGENT-SEQUENCE': liveagent.session.sequence,
        'X-LIVEAGENT-AFFINITY': liveagent.session.affinity
      },
      json: true,
      body: {
        text: text
      }
    };
    request.post(options, function(error, response, body) {
      if (error || response.statusCode != 200) {
        handleError(error, body)
        return;
      }
    });
  });
}

function uploadFile (options, content) {
  var request = require('request');
  var query = '?orgId=' + liveagent.laPod;
  query += '&chatKey=' + liveagent.session.key.slice(liveagent.session.key.indexOf('!'));
  query += '&fileToken=' + liveagent.file.fileToken;
  query += '&encoding=UTF-8';
  var options = {
    url: liveagent.file.uploadServletUrl + query,
    headers: {
      'Referer': liveagent.file.cdmServletUrl,
      'User-Agent': USER_AGENT
    },
    formData: {
      filename: 'test.jpg',
      file: {
        value: content.data,
        options: {
          filename: 'test.jpg',
          contentType: content.type
        }
      }
    }
  };
  request.post(options, function(error, response, body) {
    if (error || response.statusCode != 200) {
      handleError(error, body)
      return;
    }
  });
}

function handleError(error, body) {
  console.log(error);
  if (body && body.details && body.details.length > 0) {
    console.error(body.message);
    body.details.forEach(function(detail) {
      console.error(detail.property + ': ' + detail.message);
    });
  }
}
