/*
 * When meteor starts, attempt to initialize analytics.js integration
 * and setup automatic tracking.
 */
Meteor.startup(() => {
  if (initalizeAnalyticsjs()) {
    if (typeof Meteor.user !== "undefined") {
      setupIdentify();
      setupRouteTracking();
      setupMethodTracking();
    } else {
      console.warn("Meteor accounts not detected, skipping auto event detection.");
    }
  } else {
    console.warn("Astronomer keys not found in Meteor.settings, skipping setup.")
  }
});

/**
 * Initialize the astronomer analytics.js integration.
 * @returns {Boolean} If the integration was able to initialize.
 */
function initalizeAnalyticsjs() {
  let ret = false;
  let settings = (Meteor.settings || {}).public || {};
  let accessKeyId = (settings.astronomer || {}).accessKeyId;
  let secretAccessKey = (settings.astronomer || {}).secretAccessKey;
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
  Tracker.autorun(() => {
    let userId = Meteor.userId();
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
    Router.onBeforeAction(function() {
      let pageName = this.route.getName() || "Home";
      analytics.page(pageName);
      this.next();
    });
  } else if (typeof FlowRouter !== "undefined") {
    FlowRouter.middleware(function(path, next) {
      let pageName = path !== "/" ? path : "Home";
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
  Meteor.connection.apply = _.wrap(Meteor.connection.apply,
    function(func, name, args, options={}, callback) {
      if (typeof options === "function") {
        callback = options;
        options = {};
      }

      let track = function(err, res) {
        if (!err) analytics.track(`Called ${name} Method`, { args, res });
      }

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
