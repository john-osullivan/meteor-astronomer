/* global FlowRouter, Router, analytics */

/**
 * Define a client side collection.
 * Null publication will send the users document down to this collection,
 * to prevent clashing.  DDP can only work with top level fields,
 * and we are publishing nested service emails.
 */
const AstronomerUser = new Mongo.Collection('AstronomerUser');

/**
 * Attempt to find an email for the current user.
 */
function emailAddress(user) {
    const accountsEmail = ((user.emails || [])[0] || {}).address;
    if (accountsEmail) return accountsEmail;

    if (!Package['accounts-oauth']) return;

    const services = Package['accounts-base'].Accounts.oauth.serviceNames();
    for (let i in services) {
        let service = services[i];
        const serviceEmail = ((user.services || {})[service] || {}).email;
        if (serviceEmail) return serviceEmail;
    }
}

/**
 * Setup an autorun, to identify a user whenever Meteor.userId changes.
 */
function setupIdentify() {
    if (Package['accounts-base']) {
        const Tracker = require('meteor/tracker').Tracker;
        if (Tracker) {
          Tracker.autorun(function () {
            const user = AstronomerUser.findOne() || {};

            const id = user._id;
            if (!id) return;

            const traits = {};
            traits.email = emailAddress(user);

            analytics.identify(id, traits);
          });
        }
        else {
          console.warn('Tracker not detected, User changes cannot be monitored, all events will be anonymous.')
        }
    } else {
        console.warn('Meteor accounts not detected, all events will be anonymous.');
    }
}

/**
 * Detect the router and hook in to run analytics.page.
 */
function setupRouteTracking() {

    function page(pageName) {
        const properties = arguments[1] === undefined ? {} : arguments[1];

        analytics.page(pageName, properties);
    }

    if (Package['iron:router']) {
        /** Setup Iron Router */
        const Router = require('meteor/iron:router').Router;

        Router.onRun(function () {
            let _this = this;

            /** Build properties to pass along with page */
            const routeParams = {};
            const keys = _.keys(this.params);
            _.each(keys, function (key) {
                routeParams[key] = _this.params[key];
            });

            /** Get the page name */
            const pageName = this.route._path;

            /** Send the page view with properties */
            page(pageName, { routeParams: routeParams });

            /** Older versions if IR do not have a next function. */
            if (typeof this.next === 'function') {
                this.next();
            }
        });
    } else if (Package['meteorhacks:flow-router'] || Package['kadira:flow-router']) {
        /** Setup Flow Router */
        let FlowRouter;
        if (Package['meteorhacks:flow-router']) FlowRouter = Package['meteorhacks:flow-router'].FlowRouter;
        if (Package['kadira:flow-router']) FlowRouter = Package['kadira:flow-router'].FlowRouter;

        FlowRouter.triggers.enter([function (context) {
            /** Build properties to pass along with page */
            const routeParams = context.params;

            /** Get the page name */
            const pageName = context.route.path;

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

        if (typeof options === 'function') {
            callback = options;
            options = {};
        }

        const track = function track(err) {
            if (!err) {
                analytics.track('Called ' + name + ' Method', {});
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
    const settings = window.AstronomerConfig || (((Meteor.settings || {})['public'] || {}).astronomer || {});
    if (settings.appId) {
        // Initialize analytics.js, with astronomer integration.
        analytics.load(settings.appId);
        // Setup our hooks into meteor
        if (!settings.disableUserTracking) setupIdentify();
        if (!settings.disableRouteTracking) setupRouteTracking();
        if (!settings.disableMethodTracking) setupMethodTracking();
    } else {
        console.warn('Astronomer settings not found in Meteor.settings, skipping setup.');
    }
}

/*
 * When meteor starts, attempt to initialize analytics.js integration
 * and setup automatic tracking.
 */
Meteor.startup(initialize);
