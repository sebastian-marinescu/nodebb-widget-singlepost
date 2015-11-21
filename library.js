(function() {
	'use strict';

	var winston = module.parent.require('winston'),
			async = module.parent.require('async'),
			nconf = module.parent.require('nconf'),
			path = require('path'),
			topics = module.parent.require('./topics'),
			templates = module.parent.require('templates.js'),
			fs = require('fs'),
			util = require('util'),
			app, router, topicController, controllers, siteUrl;

	function loadWidgetTemplate(template, next) {
		var __dirname = "./node_modules/nodebb-widget-singlepost";
		var templateFile = path.resolve(__dirname, template);
		winston.info("Loading templateFile: " + templateFile);

		fs.readFile(templateFile, function (err, data) {
			if (err) {
				console.log(err.message);
				return next(null, err);
			}
			next(data.toString());
		});
	}

	var	Singlepost = {
		/**
		 * We'll need to capture some of the global app objects for use in the widget
		 * rendering later
		 */
		staticAppLoad: function(params, callback) {
			winston.info("Singlepost - app.load called");
			app = params.app;
			router = params.router;
			controllers = params.controllers;
			topicController = controllers.topics;

			//Done
			if (typeof callback === 'function') {
				callback();
			}
		},

		defineWidgets: function(widgets, callback) {
			loadWidgetTemplate('./templates/nodebb-widget-singlepost/admin/singlepost.tpl', function(templateData) {
				widgets = widgets.concat([
					{
						widget: "singlepost",
						name: "Single Post Widget",
						description: "Renders the content of a single post",
						content: templateData
					}
				]);

				callback(null, widgets);
			});
		},

		renderSinglePostWidget: function(widgetRenderParams, finalCallback) {
			winston.info("renderSinglePostWidget widgetRenderParams: " + util.inspect(widgetRenderParams), {showHidden: false, depth: 1});

			//var req = widgetRenderParams.req;
			//var res = widgetRenderParams.res;

			var req = {
						uid: widgetRenderParams.uid,
						params: {topic_id: '', slug: ''},
						query: {sort: 'oldest_to_newest'},
						session: {returnTo: ''}

					};
			var res = {
				locals: {},
				redirect: function(path) {},
				status: function(code) {
					return {
						render: function(code, data) {
							winston.info("SinglePostWidget " + code + " redirect intercepted for uid: " + widgetRenderParams.uid + " post.id: " + widgetRenderParams.data.postId)
						}
					}
				}
			};

			req.params.topic_id = widgetRenderParams.data.postId;
			//winston.info("widget input id: " + req.params.topic_id);

			/**
			 * Create a wrapped response object to intercept the subsequent app rendering of the widget
			 */
			var resWrap = {
				locals: res.locals,
				render: function(template, data) {
					winston.info("singlePost.render template requested: " + util.inspect(template));
					winston.info("singlePost tid: " + data.tid);
					data.postid = data.tid;
					data.postShowTitle = widgetRenderParams.data.postShowTitle;
					data.postLinkTitle = widgetRenderParams.data.postLinkTitle;
					data.postUrl = nconf.get('url') + "/topic/" + data.tid;

					//winston.info("singlePost.render data: " + util.inspect(data, {showHidden: false, depth: 1}));
					//winston.info("singlePost about to render post id: " + data.postid);
					app.render("nodebb-widget-singlepost/singlepost", data, finalCallback);
				}
			};

			/**
			 * Here we need to preemptively load the topic slug, because the topicController gets upset
			 * if we don't pass that along with the rendering of the topic
			 */
			async.waterfall([
				function(next) {
					topics.getTopicData([widgetRenderParams.data.postId], next);
				},
				function(topic, next) {
					req.params.slug = topic.slug.replace(/\d+\//g, "");
					//winston.info("Intercepted topic request. topic id: " + req.params.topic_id + " (slug from db): " + req.params.slug);
					topicController.get(req, resWrap, finalCallback);
				}
			]);

		}
	};

	module.exports = Singlepost;
})();
