/* global FlowRouter, Router, analytics */

"use strict";

/**
 * Attempt to find an email for the current user.
 */
function emailAddress(user) {
    let accountsEmail = ((user.emails || [])[0] || {}).address;
    if (accountsEmail) return accountsEmail;

    let services = ["facebook", "github", "google", "twitter"];
    for (let service of services) {
        let serviceEmail = ((user.services || {})[service] || {}).email;
        if (serviceEmail) return serviceEmail;
    }
};

/**
 * Setup an autorun, to identify a user whenever Meteor.userId changes.
 */
function setupIdentify() {
    if (Package["accounts-base"]) {
        Tracker.autorun(() => {
            let user = Meteor.user() || {};
            let traits = {};
            let email = emailAddress(user);
            if (email) {
                traits.email = email;
            }
            analytics.identify(user._id, traits);
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
        analytics.page(pageName, properties);
    }

    if (Package["iron:router"]) {
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

            /** Older versions if IR do not have a next function. */
            if (typeof this.next === "function") {
                this.next();
            }
        });
    } else if (Package["meteorhacks:flow-router"]) {
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
                    analytics.track(`Called ${name} Method`, {});
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

/**
 * Look for configuration and bootstrap auto tracking.
 */
function initialize() {
    let settings = window.AstronomerConfig
        || (((Meteor.settings || {}).public || {}).astronomer || {});

    if (settings.appId) {
        // Initialize analytics.js, with astronomer integration.
        analytics.initialize({ "astronomer": settings });
        // Setup our hooks into meteor
        setupIdentify();
        setupRouteTracking();
        setupMethodTracking();
    } else {
        console.warn("Astronomer settings not found in Meteor.settings, skipping setup.");
    }
}

/*
 * When meteor starts, attempt to initialize analytics.js integration
 * and setup automatic tracking.
 */
Meteor.startup(initialize);
