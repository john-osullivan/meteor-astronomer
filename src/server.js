import Analytics from 'astronomer';

// Grab settings from global object or Meteor.settings.
const settings = global.AstronomerConfig || (((Meteor.settings || {})['public'] || {}).astronomer || {});

// Setup dummy methods.
analytics = {};
analytics.methods = ['trackSubmit', 'trackClick', 'trackLink', 'trackForm', 'pageview', 'identify', 'reset', 'group', 'track', 'ready', 'alias', 'page', 'once', 'off', 'on'];
for (let t = 0; t < analytics.methods.length; t++) {
    let e = analytics.methods[t];
    analytics[e] = function () {};
}

// Assign real analytics if we have an appId.
if (settings.appId) {
    analytics = new Analytics(settings.appId);
} else {
    console.warn('Astronomer settings not found in Meteor.settings, skipping setup.');
}