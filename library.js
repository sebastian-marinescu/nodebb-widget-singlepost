(function() {
	'use strict';

	var winston = module.parent.require('winston'),
			async = module.parent.require('async'),
			nconf = module.parent.require('nconf'),
			path = require('path'),
			topics = module.parent.require('./topics'),
			plugins = module.parent.require('./plugins'),
			templates = module.parent.require('templates.js'),
			fs = require('fs'),
			util = require('util'),
			app, router, topicController, controllers, siteUrl;

	function loadWidgetTemplate(template, next) {
		winston.info("Loading templateFile: " + template);
        fs.readFile(path.resolve(__dirname, './public/templates/' + template), function (err, data) {
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
			loadWidgetTemplate('./admin/singlepost.tpl', function(templateData) {
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
			var mockReq;
			try {
				/*
				winston.info("renderSinglePostWidget widgetRenderParams: " + util.inspect(widgetRenderParams), {
					showHidden: false,
					depth: 1
				});
				*/

				mockReq = {
					uid: widgetRenderParams.uid,
					params: {topic_id: '', slug: ''},
					query: {sort: 'oldest_to_newest'},
					session: {returnTo: ''}

				};

				mockReq.params.topic_id = widgetRenderParams.data.postId;
				if (widgetRenderParams.data.renderAsUserId) {
					mockReq.uid = widgetRenderParams.data.renderAsUserId;
				}

				/**
				 * Create a wrapped response object to intercept the subsequent app rendering of the widget
				 */
				var resWrap = {
					locals: {},
					redirect: function (path) {
					},
					status: function (code) {
						return {
							render: function (code, data) {
								winston.info("SinglePostWidget " + code + " redirect intercepted for uid: " + widgetRenderParams.uid + " post.id: " + widgetRenderParams.data.postId + " data: " + util.inspect(data))
							}
						}
					},
					render: function (template, data) {
						//winston.info("singlePost.render template requested: " + util.inspect(template));
						//winston.info("singlePost tid: " + data.tid);
						data.postid = data.tid;
						data.postShowTitle = widgetRenderParams.data.postShowTitle;
						data.postLinkTitle = widgetRenderParams.data.postLinkTitle;
						data.postUrl = "/topic/" + data.slug;

                        // Parse the content as post
                        plugins.fireHook('filter:parse.post', { postData: data.posts[0] }, function(err, parsedData) {

                            // If there is an error or missing data, bail out and log it.
                            if (err || !parsedData) return console.log("Couldn't parse post data.");

                            data.posts[0] = parsedData.postData;

                            //winston.info("singlePost.render data: " + util.inspect(data, {showHidden: false, depth: 1}));
                            //winston.info("singlePost about to render post id: " + data.postid);
                            app.render("singlepost.tpl", data, function(err, parsedData) {
                            	finalCallback(err, { html: parsedData })
							});
                        });
					}
				};

				/**
				 * Here we need to preemptively load the topic slug, because the topicController gets upset
				 * if we don't pass that along with the rendering of the topic
				 */
				async.waterfall([
					function (next) {
						topics.getTopicData([widgetRenderParams.data.postId], next);
					},
					function (topic, next) {
						mockReq.params.slug = topic.slug.replace(/\d+\//g, "");
						//winston.info("Intercepted topic request. topic id: " + mockReq.params.topic_id + " (slug from db): " + mockReq.params.slug);
						topicController.get(mockReq, resWrap, finalCallback);
					}
				]);
			} catch (err) {
				winston.error("Error while rendering single post widget: " + util.inspect(mockReq) + " Error:");
				winston.error(err);
			}
		}
	};

	module.exports = Singlepost;
})();
