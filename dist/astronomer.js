/*
 * When meteor starts, attempt to initialize analytics.js integration
 * and setup automatic tracking.
 */
"use strict";

Meteor.startup(function () {
  if (initalizeAnalyticsjs()) {
    if (typeof Meteor.user !== "undefined") {
      setupIdentify();
      setupRouteTracking();
      setupMethodTracking();
    } else {
      console.warn("Meteor accounts not detected, skipping auto event detection.");
    }
  } else {
    console.warn("Astronomer keys not found in Meteor.settings, skipping setup.");
  }
});

/**
 * Initialize the astronomer analytics.js integration.
 * @returns {Boolean} If the integration was able to initialize.
 */
function initalizeAnalyticsjs() {
  var ret = false;
  var settings = (Meteor.settings || {})["public"] || {};
  var accessKeyId = (settings.astronomer || {}).accessKeyId;
  var secretAccessKey = (settings.astronomer || {}).secretAccessKey;
  if (accessKeyId && secretAccessKey) {
    analytics.initialize({
      "astronomer": {
        "accessKeyId": accessKeyId,
        "secretAccessKey": secretAccessKey
      }
    });
    ret = true;
  }
  return ret;
}

/**
 * Setup an autorun, to identify a user whenever Meteor.userId changes.
 */
function setupIdentify() {
  Tracker.autorun(function () {
    var userId = Meteor.userId();
    if (userId) {
      analytics.identify(userId);
    }
  });
}

/**
 * Detect the router and hook in to run analytics.page.
 */
function setupRouteTracking() {
  if (typeof Router !== "undefined") {
    Router.onBeforeAction(function () {
      var pageName = this.route.getName() || "Home";
      analytics.page(pageName);
      this.next();
    });
  } else if (typeof FlowRouter !== "undefined") {
    FlowRouter.middleware(function (path, next) {
      var pageName = path !== "/" ? path : "Home";
      analytics.page(pageName);
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
  Meteor.connection.apply = _.wrap(Meteor.connection.apply, function (func, name, args, _x, callback) {
    var options = arguments[3] === undefined ? {} : arguments[3];

    if (typeof options === "function") {
      callback = options;
      options = {};
    }

    var track = function track(err, res) {
      if (!err) analytics.track("Called " + name + " Method", { args: args, res: res });
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