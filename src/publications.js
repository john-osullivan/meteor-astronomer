Meteor.publish(null, function () {
    const userId = this.userId;

    // Resolve a settings object.
    const settings = global.AstronomerConfig || (((Meteor.settings || {})['public'] || {}).astronomer || {});

    // Return if no user or disabled user tracking.
    if (!userId || settings.disableUserTracking) {
        return this.ready();
    }

    // Build fields object.
    const fields = { 'emails': 1 };

    if (Package['accounts-oauth']) {
        const services = Package['accounts-base'].Accounts.oauth.serviceNames();
        _.each(services, function (s) {
            return fields['services.' + s + '.email'] = 1;
        });
    }

    // Find current user and send down email fields.
    const cursor = Meteor.users.find({ _id: userId }, { fields: fields });

    // Publish to our client side collection.
    Mongo.Collection._publishCursor(cursor, this, 'AstronomerUser');

    // Ready
    return this.ready();
});