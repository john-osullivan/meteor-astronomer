/* eslint strict:0 */

Package.describe({
    name: "astronomerio:core",
    version: "0.1.0",
    summary: "Easily push analytics events to astronomer.",
    git: "https://github.com/astronomerio/meteor-astronomer",
    documentation: "README.md"
});

Package.onUse(function(api) {
    api.versionsFrom("1.0");
    api.use([
        "underscore",
        "ddp"
    ]);
    api.addFiles("lib/analytics.js/analytics.js", "client");
    api.addFiles("dist/astronomer.js", "client");
});

Package.onTest(function(api) {
    api.use("tinytest");
    api.use("astronomerio:core");
    api.addFiles("astronomer-tests.js");
});
