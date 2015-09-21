"use strict";

Meteor.publish(null, function () {
    var userId = this.userId;

    // Resolve a settings object.
    var settings = global.AstronomerConfig || (((Meteor.settings || {})["public"] || {}).astronomer || {});

    // Return if no user or disabled user tracking.
    if (!userId || settings.disableUserTracking) {
        return this.ready();
    }

    // Build fields object.
    var fields = { "emails": 1 };

    if (Package["accounts-oauth"]) {
        var services = Package["accounts-base"].Accounts.oauth.serviceNames();
        _.each(services, function (s) {
            return fields["services." + s + ".email"] = 1;
        });
    }

    // Find current user and send down email fields.
    var cursor = Meteor.users.find({ _id: userId }, { fields: fields });

    // Publish to our client side collection.
    Mongo.Collection._publishCursor(cursor, this, "AstronomerUser");

    // Ready
    return this.ready();
});