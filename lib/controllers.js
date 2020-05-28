'use strict';

var groups = require.main.require('./src/groups');
var nconf = module.parent.parent.require('nconf');

var nbbAuthController = require.main.require('./src/controllers/authentication');

var Controllers = {};

Controllers.renderAdminPage = function (req, res, next) {
	groups.getGroupsFromSet('groups:visible:createtime', req.uid, 0, -1, function (err, groupData) {
		if (err) {
			return next(err);
		}
		res.render('admin/plugins/session-sharing', { groups: groupData });
	});
};

Controllers.retrieveUser = function (req, res) {
	const main = module.parent.exports;
	const remoteId = req.query.id;

	if (remoteId) {
		main.getUser(remoteId, function (err, userObj) {
			if (err) {
				res.status(500).json({
					error: err.message,
				});
			} else if (userObj) {
				res.status(200).json(userObj);
			} else {
				res.sendStatus(404);
			}
		});
	} else {
		res.status(400).json({
			error: 'no-id-supplied',
		});
	}
};

Controllers.process = function (req, res) {
	const main = module.parent.exports;

	const token = req.body.token || req.query.token;

	if (!token) {
		return res.status(400).json({
			error: 'no-token-provided',
		});
	}

	main.process(token, (err, uid) => {
		if (err) {
			return res.status(500).json({
				error: err.message,
			});
		}

		if (req.method == "GET") {
			nbbAuthController.doLogin(req, uid, function () {
				req.session.loginLock = true;
				const url = req.session.returnTo || '/';
				delete req.session.returnTo;
				res.redirect(nconf.get('relative_path') + encodeURI(url));
			});
		} else {
			return res.status(200).json({uid,});
		}
	});
};

module.exports = Controllers;
