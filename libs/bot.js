var util = require('./utilities');

exports.onEventRecieved = function(event) {
  var line = util.getLineConnection();
  switch (event.type) {
    case 'message':
      switch (event.message.type) {
        case 'text':
          onText(line, event);
          break;
        case 'image':
          onImage(line, event);
          break;
        case 'video':
          onVideo(line, event);
          break;
        case 'audio':
          onAudio(line, event);
          break;
        case 'location':
          onLocation(line, event);
          break;
        case 'sticker':
          onSticker(line, event);
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
      onPostback(line, event);
      break;
    case 'beacon':
      onBeacon(line, event);
      break;
    default:
      break;
  }
}

function onText(line, event) {
  var patterns = [{
    key: /こんにちは|ハロー/,
    messages: [{
      type: 'text',
      text: 'こんにちは、' + line.user.name + 'さん'
    }, {
      type: 'text',
      text: '何かお困りですか？'
    }]
  }, {
    key: /./,
    messages: [{
      type: 'text',
      text: 'すみません。よく分かりませんでした。'
    }, {
      type: 'template',
      altText: 'オペレータとチャットしますか？',
      template: {
        type: 'buttons',
        thumbnailImageUrl: 'https://rocky-beach-18961.herokuapp.com/liveagent_invite.png',
        title: '答えが見つかりませんか？',
        text: '今すぐチャットでオペレータに質問してみましょう。',
        actions: [{
          type: 'postback',
          label: 'チャットを開始',
          data: 'target=liveagent&action=start'
        }]
      }
    }]
  }];
  var matchedPattern = patterns.filter(function(pattern) {
    return pattern.key.test(event.message.text);
  });
  util.replyMessage(line, event, matchedPattern[0].messages);
}


function onImage(line, event) {
  util.getContent(line, event.message, function(content) {
    var messages = [{
      type: 'text',
      text: '画像を受け取りました。'
    }, {
      type: 'text',
      text: '種類は「' + content.type + '」、サイズは「' + content.length + '」バイトです。'
    }];
    util.replyMessage(line, event, messages);
  });
}

function onVideo(line, event) {
  util.getContent(line, event.message, function(content) {
    var messages = [{
      type: 'text',
      text: '動画を受け取りました。'
    }, {
      type: 'text',
      text: '種類は「' + content.type + '」、サイズは「' + content.length + '」バイトです。'
    }];
    util.replyMessage(line, event, messages);
  });
}

function onAudio(line, event) {
  util.getContent(line, event.message, function(content) {
    var messages = [{
      type: 'text',
      text: '音声を受け取りました。'
    }, {
      type: 'text',
      text: '種類は「' + content.type + '」、サイズは「' + content.length + '」バイトです。'
    }];
    util.replyMessage(line, event, messages);
  });
}

function onLocation(line, event) {
  var messages = [{
    type: 'text',
    text: event.message.address + 'にいるんだね！'
  }, {
    type: 'text',
    text: 'ボクはここにいるよ！'
  }, {
    type: 'location',
    title: '現在地',
    address: '〒100 - 0005 東京都千代田区丸の内２丁目７−２',
    latitude: 35.6800059,
    longitude: 139.7643227
  }];
  util.replyMessage(line, event, messages);
}

function onSticker(line, event) {
  var messages = [{
    type: 'text',
    text: '良いスタンプだね！'
  }];
  util.replyMessage(line, event, messages);
}

function onFollow(line, event) {}

function onUnfollow(line, event) {}

function onJoin(line, event) {}

function onLeave(line, event) {}

function onPostback(line, event) {
  var params = util.parseQuery(event.postback.data);
  switch (params.target) {
    case 'liveagent':
      if (params.action === 'start') {
        messages = [{
          type: 'text',
          text: 'オペレーターを呼び出します。'
        }];
        util.replyMessage(line, event, messages);
      }
      break;
    default:
      break;
  }
}

function onBeacon(line, event) {}
