var util = require('./utilities');

exports.onEventRecieved = function(event) {
  var line = util.getLineConnection();
  switch (event.type) {
    case 'message':
      switch (event.message.type) {
        case 'text':
          onText(line, event.message);
          break;
        case 'image':
          onImage(line, event.message);
          break;
        case 'video':
          onVideo(line, event.message);
          break;
        case 'audio':
          onAudio(line, event.message);
          break;
        case 'location':
          onLocation(line, event.message);
          break;
        case 'sticker':
          onSticker(line, event.message);
          break;
        default:
          break;
      }
      break;
    case 'follow':
      onFollow(line);
      break;
    case 'unfollow':
      onUnfollow(line);
      break;
    case 'join':
      onJoin(line);
      break;
    case 'leave':
      onLeave(line);
      break;
    case 'postback':
      onPostback(line, event.postback);
      break;
    case 'beacon':
      onBeacon(line, event.beacon);
      break;
    default:
      break;
  }
}

function onText(line, message) {
  var patterns = [{
    key: /こんにちは|ハロー/,
    messages: [{
      type: 'text',
      text: 'こんにちは、' + line.user.name + 'さん'
    }, {
      type: 'text',
      text: '今日は何して遊びますか？'
    }]
  }, {
    key: /./,
    messages: [{
      type: 'text',
      text: 'ごめんなさい。よくわからないです・・・'
    }, {
      type: 'template',
      altText: 'オペレータとチャットしますか？',
      template: {
        type: 'buttons',
        thumbnailImageUrl: 'https://rocky-beach-18961.herokuapp.com/liveagent_invite.png',
        title: 'オペレータとチャット',
        text: 'オペレータならどんな悩みもすぐに解決！',
        actions: [{
          type: 'postback',
          label: 'チャットする',
          data: 'target=liveagent&action=start'
        }]
      }
    }]
  }];
  var matchedPattern = patterns.filter(function(pattern) {
    return pattern.key.test(message.text);
  });
  util.replyMessage(line, matchedPattern[0].messages);
}


function onImage(line, message) {
  util.getContent(line, message, function(content) {
    var messages = [{
      type: 'text',
      text: '画像を受け取ったよ！'
    }, {
      type: 'text',
      text: '種類は「' + content.type + '」、サイズは「' + content.length + '」バイトだね！'
    }];
    util.replyMessage(line, messages);
  });
}

function onVideo(line, message) {
  util.getContent(line, message, function(content) {
    var messages = [{
      type: 'text',
      text: '動画を受け取ったよ！'
    }, {
      type: 'text',
      text: '種類は「' + content.type + '」、サイズは「' + content.length + '」バイトだね！'
    }];
    util.replyMessage(line, messages);
  });
}

function onAudio(line, message) {
  util.getContent(line, message, function(content) {
    var messages = [{
      type: 'text',
      text: '音声を受け取ったよ！'
    }, {
      type: 'text',
      text: '種類は「' + content.type + '」、サイズは「' + content.length + '」バイトだね！'
    }];
    util.replyMessage(line, messages);
  });
}

function onLocation(line, message) {
  var messages = [{
    type: 'text',
    text: message.address + 'にいるんだね！'
  }, {
    type: 'text',
    text: 'ボクはここにいるよ！'
  }, {
    type: 'location',
    title: 'Cloudyの居場所',
    address: '〒100 - 0005 東京都千代田区丸の内２丁目７−２',
    latitude: 35.6800059,
    longitude: 139.7643227
  }];
  util.replyMessage(line, messages);
}

function onSticker(line, message) {
  var messages = [{
    type: 'text',
    text: '良いスタンプだね！'
  }];
  util.replyMessage(line, messages);
}

function onFollow(line) {}

function onUnfollow(line) {}

function onJoin(line) {}

function onLeave(line) {}

function onPostback(line, postback) {
  var params = util.parseQuery(postback.data);
  switch (params.target) {
    case 'liveagent':
      if (params.action === 'start') {
        messages = [{
          type: 'text',
          text: 'ちょっとまってね'
        }];
        util.replyMessage(line, messages);
      }
      break;
    default:
      break;
  }
}

function onBeacon(line, beacon) {}
