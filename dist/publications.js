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
    var _iteratorNormalCompletion = true;
    var _didIteratorError = false;
    var _iteratorError = undefined;

    try {
        for (var _iterator = Accounts.oauth.serviceNames()[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
            var service = _step.value;

            fields["services." + service + ".email"] = 1;
        }
    } catch (err) {
        _didIteratorError = true;
        _iteratorError = err;
    } finally {
        try {
            if (!_iteratorNormalCompletion && _iterator["return"]) {
                _iterator["return"]();
            }
        } finally {
            if (_didIteratorError) {
                throw _iteratorError;
            }
        }
    }

    // Find current user and send down email fields.
    var cursor = Meteor.users.find({ _id: userId }, { fields: fields });

    // Publish to our client side collection.
    Mongo.Collection._publishCursor(cursor, this, "AstronomerUser");

    // Ready
    return this.ready();
});