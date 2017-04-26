
// ライブラリの読み込み
var express = require('express');
var bodyParser = require('body-parser');
var path = require('path');
var lineController = require('./controller/line-controller');

// app の設定
var app = express();
app.set('port', (process.env.PORT || 5000));
app.use(bodyParser.urlencoded({ extended: true })); // JSONの送信を許可
app.use(bodyParser.json()); // JSONのパースを楽に（受信時）
app.use(express.static( path.join( __dirname, 'public' )));



// Line からのリクエストを処理する。
app.route('/line').post(function(req, res) {
	console.log(liveagent);
	console.log(line);
	console.log(responder);
  lineController.processRequest(req, liveagent, line, responder);
  res.send('SUCCESS');
});

// サーバーを起動する
app.listen(app.get('port'), function() {
  console.log('Express server listening on port ' + app.get('port'));
});