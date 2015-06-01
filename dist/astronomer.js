/*
 * When meteor starts, attempt to initialize analytics.js integration
 * and setup automatic tracking.
 */
"use strict";

Meteor.startup(function () {
  if (initalizeAnalyticsjs()) {
    if (typeof Meteor.user !== "undefined") {
      setupIdentify();
    } else {
      console.warn("Meteor accounts not detected, all events will be anonymous.");
    }
    setupRouteTracking();
    setupMethodTracking();
  } else {
    console.warn("Astronomer keys not found in Meteor.settings, skipping setup.");
  }
});

/**
 * Initialize the astronomer analytics.js integration.
 * @returns {Boolean} If the integration was able to initialize.
 */
function initalizeAnalyticsjs() {
  var settings = (Meteor.settings || {})["public"] || {};
  var accessKeyId = (settings.astronomer || {}).accessKeyId;
  var secretAccessKey = (settings.astronomer || {}).secretAccessKey;
  if (accessKeyId && secretAccessKey) {
    return analytics.initialize({
      "astronomer": {
        "accessKeyId": accessKeyId,
        "secretAccessKey": secretAccessKey
      }
    });
  }
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

    analytics.page(pageName, createProperties(properties));
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
    FlowRouter.middleware(function (path, next) {

      /** Get the page name */
      var pageName = path !== "/" ? path : "Home";

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
  Meteor.connection.apply = _.wrap(Meteor.connection.apply, function (func, name, args, _x3, callback) {
    var options = arguments[3] === undefined ? {} : arguments[3];

    if (typeof options === "function") {
      callback = options;
      options = {};
    }

    var track = function track(err, res) {
      if (!err) {
        var properties = createProperties({ args: args, res: res });
        analytics.track("Called " + name + " Method", properties);
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