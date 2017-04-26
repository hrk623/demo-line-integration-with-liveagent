exports.getResponder = function() {
   delete require.cache[require.resolve('../public/responder.json')];
   return require('../public/responder.json');
}

exports.setResponder = function(responder) {
var fs = require('fs');
fs.writeFileSync('./public/responder.json', JSON.stringify(responder), 'utf8');
}

exports.getSession = function() {
   delete require.cache[require.resolve('../public/responder.json')];
   return require('../public/session.json');
}

exports.setSession = function(session) {
var fs = require('fs');
fs.writeFileSync('./public/session.json', JSON.stringify(responder), 'utf8');
}

exports.replyMessage = function(line, messageList) {
  var request = require('request');
  //ヘッダーを定義
  var headers = {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer {' + line.token + '}',
  };
  var body = {
    replyToken: line.event.replyToken,
    messages: messageList
  }
  var options = {
    url: 'https://api.line.me/v2/bot/message/reply',
    proxy: process.env.FIXIE_URL,
    headers: headers,
    json: true,
    body: body
  };
  request.post(options, function(error, response, body) {
    if (error || response.statusCode != 200) {
      handleError(error, body);
      return;
    }
  });
}

exports.pushMessage = function (line, messageList) {
  var request = require('request');
  //ヘッダーを定義
  var headers = {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer {' + line.token + '}',
  };

  //オプションを定義
  var options = {
    url: 'https://api.line.me/v2/bot/message/push',
    proxy: process.env.FIXIE_URL,
    headers: headers,
    json: true,
    body: {to: line.user.id, messages: messageList}
  };

  request.post(options, function(error, response, body) {
    if (error || response.statusCode != 200) {
      handleError(error, body);
      return;
    }
  });
}


exports.getUserProfile = function(line, callback) {
  var request = require('request');
  var options = {
    url: 'https://api.line.me/v2/bot/profile/' + line.user.id,
    proxy: process.env.FIXIE_URL,
    json: true,
    headers: {
      'Authorization': 'Bearer {' + line.token + '}'
    }
  };
  request.get(options, function(error, response, body) {
  	if (error || response.statusCode != 200) {
  		handleError(error, body);
  		return;
    }
      var user = {
      	id: body.userId,
        name: body.displayName,
        imageUrl: body.pictureUrl
      }
      callback(user);
    });
}


exports.getContent = function(line, message, callback) {
  var request = require('request');
  var options = {
    url: 'https://api.line.me/v2/bot/message/' + message.id + '/content',
    proxy: process.env.FIXIE_URL,
    json: true,
    headers: {
      'Authorization': 'Bearer {' + line.token + '}'
    }
  };
  request.get(options, function(error, response, body) {
    if (error || response.statusCode != 200) {
      handleError(error, body);
      return;
    }
    var content = {
    	type: response.headers['content-type'],
    	length: response.headers['content-length'],
    	data: body
    };
    callback(content);
  });
}

exports.parseQuery = function(str) {
  var query = {};
  var a = str.split('&');
  for (var i = 0; i < a.length; i++) {
    var b = a[i].split('=');
    query[decodeURIComponent(b[0])] = decodeURIComponent(b[1] || '');
  }
  return query;
}

function handleError(error, body) {
  console.error(body.message);
  if (body.details && body.details.length > 0) {
    body.details.forEach(function(detail) {
      console.error(detail.property + ': ' + detail.message);
    });
  }
}
