/* global FlowRouter, Router, analytics */

"use strict";

/**
 * Setup an autorun, to identify a user whenever Meteor.userId changes.
 */
function setupIdentify() {
    if (Package["accounts-base"]) {
        Tracker.autorun(function () {
            var user = Meteor.user() || {};
            var traits = {};

            /** TODO: incude facebook/google/twitter/etc emails */
            var email = ((user.emails || [])[0] || {}).address;
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
    } else if (Package["meteorhacks:flow-router"]) {
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

        var track = function track(err, res) {
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
        func(name, args, options, callback);
    });
}

/*
 * When meteor starts, attempt to initialize analytics.js integration
 * and setup automatic tracking.
 */
Meteor.startup(function () {
    var settings = window.AstronomerConfig || (((Meteor.settings || {})["public"] || {}).astronomer || {});

    if (settings.appId) {
        // Setup our hooks into meteor
        setupIdentify();
        setupRouteTracking();
        setupMethodTracking();
        analytics.initialize({ "astronomer": settings });
    } else {
        console.warn("Astronomer settings not found in Meteor.settings, skipping setup.");
    }
});