/* global FlowRouter, Router, analytics */

"use strict";

/**
 * If astronomer integration is ready, call directly, else queue.
 * The integration will replay them when ready.
 */
function callOrQueue(method, ...args) {
    let astronomerReady =
        ((analytics._integrations || {}).astronomer || {})._ready;

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
        Tracker.autorun(() => {
            let userId = Meteor.userId();
        });
    } else {
        console.warn("Meteor accounts not detected, all events will be anonymous.");
    }
}

/**
 * Take a source object and extend it with session keys.
 * @returns {Object} The new properties object.
 */
function createProperties(obj={}) {
    return _.extend(obj, { session: Session.keys });
}

/**
 * Detect the router and hook in to run analytics.page.
 */
function setupRouteTracking() {

    function page(pageName, properties={}) {
        callOrQueue("page", pageName, createProperties(properties));
    }

    if (typeof Router !== "undefined") {
        /** Setup Iron Router */
        Router.onRun(function() {
            /** Build properties to pass along with page */
            let routeParams = {};
            let keys = _.keys(this.params);
            _.each(keys, (key) => { routeParams[key] = this.params[key]; });

            /** Get the page name */
            let pageName = this.route.getName() || "Home";

            /** Send the page view with properties */
            page(pageName, { routeParams });
            this.next();
        });
    } else if (typeof FlowRouter !== "undefined") {
        /** Setup Flow Router */
        FlowRouter.middleware(function(path, next) {

            /** Get the page name */
            let pageName = path !== "/" ? path : "Home";

            /** Send the page view with properties */
            page(pageName);
            next();
        });
    }
}

/**
 * Override Meteor.apply (and Meteor.call) with our wrapper.
 * Our version wraps the user defined callback,
 * or defines a new one that will track an event if the method did not
 * throw an error.
 */
function setupMethodTracking() {
    Meteor.connection.apply = _.wrap(Meteor.connection.apply,
        function(func, name, args, options={}, callback) {
            if (typeof options === "function") {
                callback = options;
                options = {};
            }

            let track = function(err, res) {
                if (!err) {
                    let properties = createProperties({ args, res });
                    callOrQueue("track", `Called ${name} Method`, properties);
                }
            };

            if (callback) {
                callback = _.wrap(callback, function(originalCallback, err, res) {
                    track(err, res);
                    originalCallback(err, res);
                });
            } else {
                callback = track;
            }

            func = _.bind(func, this);
            func(name, args, options, callback);
        }
    );
}

/*
 * When meteor starts, attempt to initialize analytics.js integration
 * and setup automatic tracking.
 * @todo Clean this up, use promises or something.
 * @todo Change to production url.
 */
Meteor.startup(() => {
    let settings = (Meteor.settings || {}).public || {};
    let appId = (settings.astronomer || {}).appId;
    let appSecret = (settings.astronomer || {}).appSecret;
    let credentialServer = (settings.astronomer || {}).credentialServer
        || "http://astronomermeteor-48385.onmodulus.net:80";
    console.log(credentialServer);
    if (appId && appSecret) {

        // Setup our hooks into meteor
        setupIdentify();
        setupRouteTracking();
        setupMethodTracking();

        console.log(`Authenticating with ${credentialServer}`);
        let home = DDP.connect(credentialServer);
        home.call("/applications/credentials", appId, appSecret, (err, res) => {

            // If the app does not exist in our system or can't connect,
            // log it and return.
            if (err) {
                return console.error(err.reason);
            }

            // Otherwise init analaytics.js with credentials.
            let params = {
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

