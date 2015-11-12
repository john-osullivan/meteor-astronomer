/* global FlowRouter, Router, analytics */

"use strict";

/**
 * Define a client side collection.
 * Null publication will send the users document down to this collection,
 * to prevent clashing.  DDP can only work with top level fields,
 * and we are publishing nested service emails.
 */
var AstronomerUser = new Mongo.Collection("AstronomerUser");

/**
 * Attempt to find an email for the current user.
 */
function emailAddress(user) {
    var accountsEmail = ((user.emails || [])[0] || {}).address;
    if (accountsEmail) return accountsEmail;

    if (!Package["accounts-oauth"]) return;

    var services = Package["accounts-base"].Accounts.oauth.serviceNames();
    for (var i in services) {
        var service = services[i];
        var serviceEmail = ((user.services || {})[service] || {}).email;
        if (serviceEmail) return serviceEmail;
    }
}

/**
 * Setup an autorun, to identify a user whenever Meteor.userId changes.
 */
function setupIdentify() {
    if (Package["accounts-base"]) {
        Tracker.autorun(function () {
            var user = AstronomerUser.findOne() || {};
            var traits = {};
            var email = emailAddress(user);
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

    function page(pageName) {
        var properties = arguments[1] === undefined ? {} : arguments[1];

        analytics.page(pageName, properties);
    }

    if (Package["iron:router"]) {
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
            var pageName = this.route._path;

            /** Send the page view with properties */
            page(pageName, { routeParams: routeParams });

            /** Older versions if IR do not have a next function. */
            if (typeof this.next === "function") {
                this.next();
            }
        });
    } else if (Package["meteorhacks:flow-router"] || Package["kadira:flow-router"]) {
        /** Setup Flow Router */
        FlowRouter.triggers.enter([function (context) {
            /** Build properties to pass along with page */
            var routeParams = context.params;

            /** Get the page name */
            var pageName = context.route.path;

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

        var track = function track(err) {
            if (!err) {
                analytics.track("Called " + name + " Method", {});
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
        return func(name, args, options, callback);
    });
}

/**
 * Look for configuration and bootstrap auto tracking.
 */
function initialize() {
    var settings = window.AstronomerConfig || (((Meteor.settings || {})["public"] || {}).astronomer || {});

    if (settings.appId) {
        // Initialize analytics.js, with astronomer integration.
        analytics.load(settings.appId);
        // Setup our hooks into meteor
        if (!settings.disableUserTracking) setupIdentify();
        if (!settings.disableRouteTracking) setupRouteTracking();
        if (!settings.disableMethodTracking) setupMethodTracking();
    } else {
        console.warn("Astronomer settings not found in Meteor.settings, skipping setup.");
    }
}

/*
 * When meteor starts, attempt to initialize analytics.js integration
 * and setup automatic tracking.
 */
Meteor.startup(initialize);