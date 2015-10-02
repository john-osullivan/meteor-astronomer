/* eslint strict:0 */

Package.describe({
    name: "astronomerio:core",
    version: "0.2.16",
    summary: "Easily push analytics events to astronomer.",
    git: "https://github.com/astronomerio/meteor-astronomer",
    documentation: "README.md"
});

Package.onUse(function(api) {
    api.versionsFrom("1.0");
    api.use([
        "underscore",
        "mongo"
    ]);
    api.addFiles("lib/analytics.js/analytics.js", "client");
    api.addFiles("dist/tracking.js", "client");
    api.addFiles("dist/browser-policy.js", "server");
    api.addFiles("dist/publications.js", "server");

    api.use(["accounts-base", "accounts-oauth"], { weak: true });
    api.use("iron:router@1.0.7", "client", { weak: true });
    api.use("meteorhacks:flow-router@1.17.2", "client", { weak: true });
    api.use("browser-policy-content", "server", { weak: true });
});

Package.onTest(function(api) {
    api.use("tinytest");
    api.use("astronomerio:core");
    api.addFiles("astronomer-tests.js");
});
