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
            let user = Meteor.user();
            let traits = {};

            let email = ((user.emails || [])[0] || {}).address;
            if (email) {
                traits.email = email;
            }

            callOrQueue("identify", user._id, traits);
        });
    } else {
        console.warn("Meteor accounts not detected, all events will be anonymous.");
    }
}

/**
 * Detect the router and hook in to run analytics.page.
 */
function setupRouteTracking() {

    function page(pageName, properties={}) {
        callOrQueue("page", pageName, properties);
    }

    if (typeof Router !== "undefined") {
        /** Setup Iron Router */
        Router.onRun(function() {
            /** Build properties to pass along with page */
            let routeParams = {};
            let keys = _.keys(this.params);
            _.each(keys, (key) => { routeParams[key] = this.params[key]; });

            /** Get the page name */
            let pageName = this.route._path;

            /** Send the page view with properties */
            page(pageName, { routeParams });
            this.next();
        });
    } else if (typeof FlowRouter !== "undefined") {
        /** Setup Flow Router */
        FlowRouter.triggers.enter([function(context) {
            /** Build properties to pass along with page */
            let routeParams = context.params;

            /** Get the page name */
            let pageName = context.route.path;

            /** Send the page view with properties */
            page(pageName, { routeParams });
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
    Meteor.connection.apply = _.wrap(Meteor.connection.apply,
        function(func, name, args, options={}, callback) {
            if (typeof options === "function") {
                callback = options;
                options = {};
            }

            let track = function(err, res) {
                if (!err) {
                    callOrQueue("track", `Called ${name} Method`, {});
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
 */
Meteor.startup(() => {
    let settings = window.AstronomerConfig
        || (((Meteor.settings || {}).public || {}).astronomer || {});

    if (settings.appId) {
        // Setup our hooks into meteor
        setupIdentify();
        setupRouteTracking();
        setupMethodTracking();
        analytics.initialize({ "astronomer": settings });
    } else {
        console.warn("Astronomer keys not found in Meteor.settings, skipping setup.");
    }
});
