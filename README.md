# Meteor Package for [Astronomer](http://astronomer.io)

If you're using Meteor and haven't instrumented your app for **user analytics** yet, you're in luck! Our package will instrument your entire Meteor app automatically. 

We're still in active development, but we'd love to have you kick the tires!


<b>*NOTE: If you are using the package "percolatestudio:segment.io," you will need to remove this before installing Astronomer. This package sets a global 'analytics' object that makes things a bit, uh, wonky.*</b>

###Which user actions get tracked?
All of them! This is done by tracking all Meteor methods, route changes (flow-router and iron-router), and insertions into minimongo.

# 1. Add the package

Open your terminal, change your directory to your app, and add the Astronomer package:

```meteor add astronomerio:core```

# 2. Get an appId

Get the appId from Astronomer "Settings" tab by clicking the 'Copy to Clipboard' button. 
<img src="https://www.filepicker.io/api/file/6WLcSszVRBWWpdSgoQ9K">

# 3.  Configure your app

Put the App ID into a new file labeled 'settings.json' (if you don't have this file already). The final format should look like the below.

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

<i>*Note: Be sure to restart your Meteor app when you change settings.json file.*</i>

# 4. Activate a broadcast integration

Every integration will require you to set up a separate account with specific keys or ids that let Astronomer know which account is yours.

# 5. Confirm events are being sent

1. Check the web browser's javascript console for your app, make sure you see **"Authenticating with https://app.astronomer.io:443"** to ensure you got the Meteor settings correct.
2. Take some actions in your app (sign up, change routes).
3. Click on the 'Live Stream' tab to see what events are being received by Astronomer.
4. Go to the integrations that you've activated and check to see that events are being properly received  on their end. 

# 6. Create separate production/dev apps (optional)

You may want to create a separate Astronomer/{Any Integration) instances to keep your test/dev events out of your production data. I use the naming convention “{AppName} Prod” and “{AppName} Dev” across all the services to keep it all straight. Some Integrations do this automatically but for us, you'll need to make a new project to keep everything separate.

#7. Share your story with us (not optional!)

Please report any issues, confusing steps, etc. you encounter in the process. Or any feedback of any kind. The fastest way to get a response from us is to join our [developer slack channel](https://astronomerchat.slack.com). Email [ben@astronomer.io](mailto:ben@astronomer.io) for an invite.

