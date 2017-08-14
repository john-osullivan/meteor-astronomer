Package.describe({
    name: 'astronomerio:core',
    version: '1.0.1',
    summary: 'Easily push analytics events to Astronomer.',
    git: 'https://github.com/astronomerio/meteor-astronomer',
    documentation: 'README.md'
});

Npm.depends({'astronomer': '2.0.4'});

Package.onUse(function(api) {
    api.versionsFrom('1.4.1');

    api.use([
        'ecmascript',
        'underscore',
        'mongo'
    ]);

    api.mainModule('client.js', 'client');
    api.mainModule('server.js', 'server');

    api.use(['accounts-base', 'accounts-oauth'], { weak: true });
    api.use('tracker', 'client', { weak: true });
    api.use('iron:router@1.0.7', 'client', { weak: true });
    api.use('meteorhacks:flow-router@1.17.2', 'client', { weak: true });
    api.use('kadira:flow-router@2.0.0', 'client', { weak: true });
    api.use('browser-policy-content', 'server', { weak: true });

    api.export('analytics', 'server');
});

Package.onTest(function(api) {
    api.use('tinytest');
    api.use('astronomerio:core');
    api.addFiles('astronomer-tests.js');
});
