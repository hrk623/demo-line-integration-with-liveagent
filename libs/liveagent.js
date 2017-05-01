var util = require("./utilities");

var USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/56.0.2924.87 Safari/537.36";
var API_VERSION = process.env.LIVEAGENT_API_VERSION || 39;


// Liveagent チャットを開始する
// 1. Session key を取得
// 2. 訪問者を登録
// 3. イベントの監視をスタート
exports.startSessionWithLine = function() {
  createLiveAgentSession();
};

function createLiveAgentSession() {
  var liveagent = util.getLiveagentConnection();
  var request = require("request");
  var options = {
    url: "https://" + liveagent.laPod + "/chat/rest/System/SessionId",
    headers: {
      "X-LIVEAGENT-API-VERSION": API_VERSION,
      "X-LIVEAGENT-AFFINITY": "null",
      Connection: "keep-alive"
    },
    json: true
  };
  request.get(options, function(error, response, body) {
    if (error || response.statusCode != 200) {
      onCreateLiveAgentSessionFailed(error, body);
      return;
    }
    util.setSession({
      key: body.key,
      affinity: body.affinityToken,
      id: body.id,
      sequence: 1
    });
    createChatVisitorSession();
  });
}



function createChatVisitorSession() {
  var session = util.getSession();
  var liveagent = util.getLiveagentConnection();
  var line = util.getLineConnection();

  var request = require("request");
  var options = {
    url: "https://" + liveagent.laPod + "/chat/rest/Chasitor/ChasitorInit",
    headers: {
      "X-LIVEAGENT-API-VERSION": API_VERSION,
      "X-LIVEAGENT-SESSION-KEY": session.key,
      "X-LIVEAGENT-SEQUENCE": session.sequence,
      "X-LIVEAGENT-AFFINITY": session.affinity
    },
    json: true,
    body: {
      organizationId: liveagent.orgId,
      deploymentId: liveagent.deploymentId,
      buttonId: liveagent.buttonId,
      sessionId: session.id,
      trackingId: "",
      userAgent: USER_AGENT,
      language: "ja",
      screenResolution: "750x1334",
      visitorName: line.user.displayName,
      prechatDetails: [
        {
          label: "ContactLineId",
          value: line.user.id,
          entityMaps: [],
          transcriptFields: [],
          displayToAgent: true,
          doKnowledgeSearch: false
        },
        {
          label: "ContactLastName",
          value: line.user.name,
          entityMaps: [],
          transcriptFields: [],
          displayToAgent: true,
          doKnowledgeSearch: false
        }
      ],
      buttonOverrides: [],
      receiveQueueUpdates: true,
      prechatEntities: [
        {
          entityName: "Contact",
          showOnCreate: true,
          linkToEntityName: null,
          linkToEntityField: null,
          saveToTranscript: "ContactId",
          entityFieldsMaps: [
            {
              fieldName: "LastName",
              label: "ContactLastName",
              doFind: false,
              isExactMatch: false,
              doCreate: true
            },
            {
              fieldName: "LineId__c",
              label: "ContactLineId",
              doFind: true,
              isExactMatch: true,
              doCreate: true
            }
          ]
        }
      ],
      isPost: true
    }
  };

  request.post(options, function(error, response, body) {
    if (error || response.statusCode != 200) {
      onCreateChatVisitorSessionFailed(error, body);
      return;
    }
    session.sequence++;
    util.setSession(session);
    util.setResponder({
      name: "LIVEAGENT", // LIVEAGENT
      status: "CONNECTED", // WAITING, DISCONNECTED
      options: {}
    });
    monitorChatActivity();


    var transcripts = util.getTranscript();
    var message = '--- 直前の会話 ---\n';
    message += transcripts.join('\n');
    sendMessage(message);
  });
}

function monitorChatActivity() {
  var liveagent = util.getLiveagentConnection();
  var session = util.getSession();
  if (!session.key) return;
  session.ack = session.ack === undefined ? -1 : session.ack;
  var request = require("request");
  var options = {
    url: "https://" + liveagent.laPod + "/chat/rest/System/Messages",
    qs: {　ack: session.ack　},
    headers: {
      "X-LIVEAGENT-API-VERSION": API_VERSION,
      "X-LIVEAGENT-SESSION-KEY": session.key,
      "X-LIVEAGENT-AFFINITY": session.affinity
    },
    json: true
  };
  request.get(options, function(error, response, body) {
    console.log(body);
    if (response.statusCode === 204) {
      monitorChatActivity();
    } else if (response.statusCode === 200) {
      var session = util.getSession();
      session.ack = body.sequence;
      util.setSession(session);
      body.messages.forEach(function(message) {
        processMessage(message);
      });
      monitorChatActivity();
    } else {
      onMonitorChatActivityFailed(error, body);
      console.log(body);
    }
  });
}

function processMessage(message) {
  switch (message.type) {
    case "ChatMessage":
      onChatMessage(message);
      break;
    case "AgentTyping":
      onAgentTyping();
      break;
    case "AgentNotTyping":
      onAgentNotTyping();
      break;
    case "AgentDisconnect":
      onAgentDisconnect();
      break;
    case "ChasitorSessionData":
      onChasitorSessionData();
      break;
    case "ChatEnded":
      onChatEnded();
      break;
    case "ChatEstablished":
      onChatEstablished();
      break;
    case "ChatRequestFail":
      onChatRequestFail();
      break;
    case "ChatRequestSuccess":
      onChatRequestSuccess();
      break;
    case "ChatTransferred":
      onChatTransferred();
      break;
    case "CustomEvent":
      onCustomEvent();
      break;
    case "NewVisitorBreadcrumb":
      onNewVisitorBreadcrumb();
      break;
    case "QueueUpdate":
      onQueueUpdate();
      break;
    case "FileTransfer":
      onFileTransfer(message);
      break;
    case "Availability":
      onAvailability();
      break;
    default:
      break;
  }
}

function onChatMessage(message) {
  var line = util.getLineConnection();
  util.pushMessage(line, [
    {
      type: "text",
      text: message.message.text
    }
  ]);
}

function onAgentTyping() {}
function onAgentNotTyping() {}
function onAgentDisconnect() {
  util.initSession();
  util.initResponder();
  var line = util.getLineConnection();
  util.pushMessage(line, [
    {
      type: "text",
      text: '[AUTO] チャットが終了しました。'
    }
  ]);
}
function onChasitorSessionData() {}
function onChatEnded() {
  util.initSession();
  util.initResponder();
  var line = util.getLineConnection();
  util.pushMessage(line, [
    {
      type: "text",
      text: '[自動送信] チャットが終了しました。'
    }
  ]);
}
function onChatEstablished() {}
function onChatRequestFail() {
　util.initSession();
  util.initResponder();
}
function onChatRequestSuccess() {}
function onChatTransferred() {}
function onCustomEvent() {}
function onNewVisitorBreadcrumb() {}
function onQueueUpdate() {}
function onFileTransfer(message) {
  var line = util.getLineConnection();
  if (message.message.type === 'Requested') {
    var session = util.getSession();
    session.file = message.message;
    util.setSession(session);
    util.pushMessage(line, [{
      type: "text",
      text: '[自動送信] オペレータが画像ファイル1枚の送信を許可しました。'
    }
    ]);

  } else if (message.message.type === 'Canceled') {
    var session = util.getSession();
    session.file = null;
    util.setSession(session);
    util.pushMessage(line, [{
      type: "text",
      text: '[自動送信] オペレータがファイル送信の許可を取り消しました。'
    }
    ]);
  }
}
  
function onAvailability() {}








// LINE からのイベントを処理する
exports.onEventRecieved = function(event) {
  switch (event.type) {
    case "message":
      switch (event.message.type) {
        case "text":
          onText(event)
          break;
        case "image":
          onImage(event)
          break;
        case "video":
          onVideo(event)
          break;
        case "audio":
          onAudio(event)
          break;
        case "location":
          onLocation(event)
          break;
        case "sticker":
          onSticker(event)
          break;
        default:
          break;
      }
      break;
    case "follow":
      break;
    case "unfollow":
      break;
    case "join":
      break;
    case "leave":
      break;
    case "postback":
      break;
    case "beacon":
      break;
    default:
      break;
  }
};


function onText(event) {
  sendMessage(event.message.text);
}

function onImage(event) {
  var session = util.getSession();
  var line = util.getLineConnection();
  if (session.file) {
    util.getContent(line, event.message, function(content) {
      uploadFile(content);
    });
  } else {
    sendMessage('[自動送信]ユーザーが画像の送信を試みました');
    util.pushMessage(line, [{
      type: "text",
      text: '[自動送信] 現在ファイル送信は許可されていません。オペレータの許可を待ってもう一度お試しください。'
    }]);
  }
}

function onVideo(event) {
  var line = util.getLineConnection();
  util.pushMessage(line, [{
      type: "text",
      text: '[自動送信] 動画の送信には対応しておりません。申し訳ございません。'
    }]);
  sendMessage('[自動送信]ユーザーが動画の送信を試みました');
}

function onAudio(event) {
  var line = util.getLineConnection();
  util.pushMessage(line, [{
      type: "text",
      text: '[自動送信] 音声の送信には対応しておりません。申し訳ございません。'
  }]);
  sendMessage('[自動送信]ユーザーが音声の送信を試みました');
}

function onLocation(event) {
  sendMessage('[自動送信]ユーザーが位置情報を共有しました');
  sendMessage(event.message.address);
  sendMessage('(' + event.message.latitude + ',' +  event.message.longitude);
}

function onSticker(event) {
  sendMessage('[自動送信]ユーザーがスティッカーを送信しました');
}

function onFollow(event) {}

function onUnfollow(event) {}

function onJoin(event) {}

function onLeave(event) {}

function onPostback(event) {}




function sendMessage(text) {
  var liveagent = util.getLiveagentConnection();
  var session = util.getSession();
  var request = require("request");
  var options = {
    url: "https://" + liveagent.laPod + "/chat/rest/Chasitor/ChatMessage",
    headers: {
      "X-LIVEAGENT-API-VERSION": API_VERSION,
      "X-LIVEAGENT-SESSION-KEY": session.key,
      "X-LIVEAGENT-SEQUENCE": session.sequence,
      "X-LIVEAGENT-AFFINITY": session.affinity
    },
    json: true,
    body: {
      text: text
    }
  };
  request.post(options, function(error, response, body) {
    if (error || response.statusCode != 200) {
      handleError(error, body);
      return;
    }
    session.sequence++;
    util.setSession(session);
  });
}

function uploadFile(content) {
  var session = util.getSession();
  var liveagent = util.getLiveagentConnection();
  var request = require("request");
  var query = "?orgId=" + liveagent.orgId;
  query += "&chatKey=" + session.key.slice(0, session.key.indexOf("!"));
  query += "&fileToken=" + session.file.fileToken;
  query += "&encoding=UTF-8";

  var options = {
    url: session.file.uploadServletUrl + query,
    headers: {
      Referer: session.file.cdmServletUrl,
      "User-Agent": USER_AGENT
    },
    formData: {
      filename: "attachment.jpeg",
      file: {
        value: content.data,
        options: {
          filename: "attachment.jpeg",
          contentType: content.type
        }
      }
    }
  };
  request.post(options, function(error, response, body) {
    if (error || response.statusCode != 200) {
      onUploadFileFailed(error, body);
      return;
    }
    var line = util.getLineConnection();
    util.pushMessage(line, [{
      type: "text",
      text: '[自動送信]ファイルが送信されました。'
    }]);
  }).on('data', function(chunk) {
    console.log("sending");
  });
}






// エラーハンドラー
function onUploadFileFailed(error, body) {
  handleError(error, body)
  var session = util.getSession();
  session.file = null;
  util.setSession(session);
  var line = util.getLineConnection();
  util.pushMessage(line, [{
      type: "text",
      text: '[自動送信]ファイルの送信に失敗しました。'
    }
  ]);
}
function onCreateLiveAgentSessionFailed(error, body) {
  handleError(error, body)
  util.initSession();
  util.initResponder();
  var line = util.getLineConnection();
  util.pushMessage(line, [{
      type: "text",
      text: '[自動送信]オペレータとのチャットの開始に失敗しました。チャットを中断します。対応可能なエージェントがいるか確認してください。'
    }
  ]);
}
function onCreateChatVisitorSessionFailed(error, body) {
  handleError(error, body)
  util.initResponder();
  var line = util.getLineConnection();
  util.pushMessage(line, [{
      type: "text",
      text: '[自動送信]訪問者の登録に失敗しました。チャットを中断します。'
    }
  ]);
}
function onMonitorChatActivityFailed(error, body) {
  handleError(error, body)
  util.initSession();
  util.initResponder();
  var line = util.getLineConnection();
  util.pushMessage(line, [{
      type: "text",
      text: '[自動送信]チャットの接続が困難な状態になりました。チャットを中断します。'
    }
  ]);
}

function handleError(error, body) {
  console.error(error);
  if (body && body.details && body.details.length > 0) {
    console.error(body.message);
    body.details.forEach(function(detail) {
      console.error(detail.property + ": " + detail.message);
    });
  }
}
