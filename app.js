
// ライブラリの読み込み
var express = require('express');
var bodyParser = require('body-parser');
var path = require('path');
var lineController = require('./controller/line-controller');
var util = require("./libs/utilities");

// app の設定
var app = express();
app.set('port', (process.env.PORT || 5000));
app.use(bodyParser.urlencoded({ extended: true })); // JSONの送信を許可
app.use(bodyParser.json()); // JSONのパースを楽に（受信時）
app.use(express.static( path.join( __dirname, 'public' )));

// responder の設定
util.initResponder();
util.initSession();
util.initLiveagentConnection();
util.initLineConnection();
util.initTranscript();

// Line からのリクエストを処理する。
app.route('/line').post(function(req, res) {
  util.setEnv({baseUrl:'https://' + req.headers.host});
  lineController.processRequest(req);
  res.send('SUCCESS');
});

// サーバーを起動する
app.listen(app.get('port'), function() {
  console.log('Express server started on port: ' + app.get('port'));
});