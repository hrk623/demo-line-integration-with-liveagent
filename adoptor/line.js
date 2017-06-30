var STATUS = {
	NOTSTARTED : 0,
	STARTED    : 1,
	ENDED      : 2,
}


exports.processRequest = function(req) {
	req.body.events.forEach(function(event) {
		var requesterId = event.source.userId || event.source.groupId || event.source.roomId;
		if (!getStatus(requesterId) == STATUS.NOTSTARTED) {
			// 会話を開始したユーザー
			// TODO: ユーザー情報の取得
			// TODO: requesterId とユーザー情報の保存
			// TODO: コンテキストを作成
			// TODO: コンテキストをルーティング
		} else {
			// 会話を継続中のユーザー
			// TODO: ユーザー情報の読み出し
			// TODO: コンテキストを作成
			// TODO: コンテキストをルーティング
		}
	});
}

exports.sendContext = function(context) {
	// TODO: ユーザー情報を読み出し
	// TODO: リプライ/プッシュを判定
	
	if (hasReplyToken(targetId)) {
		// TODO: リプライイベントを作成
		// TODO: リプライイベントを送信
		// TODO: リプライトークンの削除
	}
	else {
		// TODO: プッシュイベントを作成
		// TODO: プッシュイベントを送信
	}
}

function getStatus(id) {
	return STATUS.NOTSTARTED;
}



function createContext(event) {

}

function createReplyEvent(replyToken, context) {
	return {
		replyToken: replyToken,
		messages: messageList
	}
}

function createPushEvent(context) {
	return {
		to: line.user.id,
		messages: messageList
	};
}

function sendReplyEvent(token, replyToken, event) {
	var request = require("request");
	//ヘッダーを定義
	var headers = {
		"Content-Type": "application/json",
		Authorization: "Bearer {" + token + "}"
	};
	var options = {
		url: "https://api.line.me/v2/bot/message/reply",
		proxy: process.env.FIXIE_URL,
		headers: headers,
		json: true,
		body: event,
	};
	return new Promise(function(resolve, reject) {
		request.post(options, function(error, response, body) {
			if (error || response.statusCode != 200) {
				reject(error, body);
			} else {
				resolve(response, body);
			}
		});
	});
};

function sendPushEvent(token, event) {
	var request = require("request");
	//ヘッダーを定義
	var headers = {
		"Content-Type": "application/json",
		Authorization: "Bearer {" + token + "}"
	};

	//オプションを定義
	var options = {
		url: "https://api.line.me/v2/bot/message/push",
		proxy: process.env.FIXIE_URL,
		headers: headers,
		json: true,
		body: event,
	};

	return new Promise(function(resolve, reject) {
		request.post(options, function(error, response, body) {
			if (error || response.statusCode != 200) {
				reject(error, body);
			} else {
				resolve(response, body);
			}
		});
	});
};
