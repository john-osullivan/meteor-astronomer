/* eslint strict:0 */

Package.describe({
    name: "astronomerio:core",
    version: "0.0.8",
    summary: "Easily push analytics events to astronomer.",
    git: "https://github.com/astronomerio/meteor-astronomer",
    documentation: "README.md"
});

Package.onUse(function(api) {
    api.versionsFrom("1.0");
    api.use([
        "underscore",
        "ddp",
        "grigio:babel@0.1.3"
    ]);
    api.addFiles("lib/analytics.min.js", "client");
    api.addFiles("src/astronomer.es6.js", "client");
});

Package.onTest(function(api) {
    api.use("tinytest");
    api.use("astronomerio:core");
    api.addFiles("astronomer-tests.js");
});
