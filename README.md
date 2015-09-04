# astronomerio:core meteor package

This package automatically sends events from your Meteor app (route hits and Meteor.method calls) to Astronomer.

It's under active development. We just [launched our alpha test phase](http://docs.astronomer.io/#alpha-test-process).

We'd love to have you kick the tires!

### Example Meteor.settings
```
{
  "public": {
    "astronomer": {
      "appId": "XXXXXXXXXXXXXXXXXXX", // required
      "disableUserTracking": true, // optional
      "disableRouteTracking": true, // optional
      "disableMethodTracking": true // optional
    }
  }
}
```
