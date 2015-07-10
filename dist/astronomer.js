/* global FlowRouter, Router, analytics */

"use strict";

/**
 * If astronomer integration is ready, call directly, else queue.
 * The integration will replay them when ready.
 */
function callOrQueue(method) {
    var astronomerReady = ((analytics._integrations || {}).astronomer || {})._ready;

    for (var _len = arguments.length, args = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
        args[_key - 1] = arguments[_key];
    }

    if (astronomerReady) {
        analytics[method].apply(analytics, args);
    } else {
        window._astq.push([method].concat(args));
    }
}

/**
 * Setup an autorun, to identify a user whenever Meteor.userId changes.
 */
function setupIdentify() {
    if (typeof Meteor.user !== "undefined") {
        Tracker.autorun(function () {
            var userId = Meteor.userId();
            callOrQueue("identify", userId);
        });
    } else {
        console.warn("Meteor accounts not detected, all events will be anonymous.");
    }
}

/**
 * Take a source object and extend it with session keys.
 * @returns {Object} The new properties object.
 */
function createProperties() {
    var obj = arguments[0] === undefined ? {} : arguments[0];

    return _.extend(obj, { session: Session.keys });
}

/**
 * Detect the router and hook in to run analytics.page.
 */
function setupRouteTracking() {

    function page(pageName) {
        var properties = arguments[1] === undefined ? {} : arguments[1];

        callOrQueue("page", pageName, createProperties(properties));
    }

    if (typeof Router !== "undefined") {
        /** Setup Iron Router */
        Router.onRun(function () {
            var _this = this;

            /** Build properties to pass along with page */
            var routeParams = {};
            var keys = _.keys(this.params);
            _.each(keys, function (key) {
                routeParams[key] = _this.params[key];
            });

            /** Get the page name */
            var pageName = this.route.getName() || "Home";

            /** Send the page view with properties */
            page(pageName, { routeParams: routeParams });
            this.next();
        });
    } else if (typeof FlowRouter !== "undefined") {
        /** Setup Flow Router */
        FlowRouter.triggers.enter([function (context) {
            /** Build properties to pass along with page */
            var routeParams = context.params;

            /** Get the page name */
            var pageName = context.path !== "/" ? context.path : "Home";

            /** Send the page view with properties */
            page(pageName, { routeParams: routeParams });
        }]);
    }
}

/**
 * Override Meteor.apply (and Meteor.call) with our wrapper.
 * Our version wraps the user defined callback,
 * or defines a new one that will track an event if the method did not
 * throw an error.
 */
function setupMethodTracking() {
    Meteor.connection.apply = _.wrap(Meteor.connection.apply, function (func, name, args, options, callback) {
        if (options === undefined) options = {};

        if (typeof options === "function") {
            callback = options;
            options = {};
        }

        var track = function track(err, res) {
            if (!err) {
                var properties = createProperties({ args: args, res: res });
                callOrQueue("track", "Called " + name + " Method", properties);
            }
        };

        if (callback) {
            callback = _.wrap(callback, function (originalCallback, err, res) {
                track(err, res);
                originalCallback(err, res);
            });
        } else {
            callback = track;
        }

        func = _.bind(func, this);
        func(name, args, options, callback);
    });
}

/*
 * When meteor starts, attempt to initialize analytics.js integration
 * and setup automatic tracking.
 * @todo Clean this up, use promises or something.
 * @todo Change to production url.
 */
Meteor.startup(function () {
    var settings = (Meteor.settings || {})["public"] || {};
    var appId = (settings.astronomer || {}).appId;
    var appSecret = (settings.astronomer || {}).appSecret;
    var credentialServer = (settings.astronomer || {}).credentialServer || "https://app.astronomer.io:443";

    if (appId && appSecret) {

        // Setup our hooks into meteor
        setupIdentify();
        setupRouteTracking();
        setupMethodTracking();

        console.log("Authenticating with " + credentialServer);
        var home = DDP.connect(credentialServer);
        home.call("/applications/credentials", appId, appSecret, function (err, res) {

            // If the app does not exist in our system or can't connect,
            // log it and return.
            if (err) {
                return console.warn(err.reason);
            }

            // Otherwise init analaytics.js with credentials.
            var params = {
                appId: appId,
                streamName: res.streamName,
                roleArn: res.roleArn,
                identityId: res.credentials.IdentityId,
                token: res.credentials.Token,
                identityPoolId: res.identityPoolId,
                region: "us-east-1"
            };

            analytics.initialize({ "astronomer": params });
        });
    } else {
        console.warn("Astronomer keys not found in Meteor.settings, skipping setup.");
    }
});