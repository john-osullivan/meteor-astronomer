"use strict";

Meteor.publish(null, function() {
    let userId = this.userId;
    let settings = global.AstronomerConfig
        || (((Meteor.settings || {}).public || {}).astronomer || {});

    if (!userId || settings.disableUserTracking) {
        return this.ready();
    }

    let fields = {
        "services.facebook.email": 1,
        "services.google.email": 1,
        "services.github.email": 1,
        "services.twitter.email": 1
    };
    return Meteor.users.find({ _id: userId }, { fields });
});
