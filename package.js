Package.describe({
  name: 'astronomer',
  version: '0.0.1',
  summary: 'Easily push analytics events to astronomer.',
  git: 'https://github.com/astronomerio/meteor-astronomer',
  documentation: 'README.md'
});

Package.onUse(function(api) {
  api.versionsFrom('1.1.0.2');
  api.use('underscore');
  api.addFiles('lib/analytics.min.js', 'client');
  api.addFiles('dist/astronomer.js', 'client');
});

Package.onTest(function(api) {
  api.use('tinytest');
  api.use('astronomer');
  api.addFiles('astronomer-tests.js');
});
