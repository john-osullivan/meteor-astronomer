/* eslint strict:0 */

Package.describe({
    name: "astronomerio:core",
    version: "0.2.20",
    summary: "Easily push analytics events to astronomer.",
    git: "https://github.com/astronomerio/meteor-astronomer",
    documentation: "README.md"
});

Npm.depends({
    "analytics-node": "https://github.com/astronomerio/analytics-node/archive/998b2f00ab76b8c969d70f9ee7f3e7c8a111cf12.tar.gz"
});

Package.onUse(function(api) {
    api.versionsFrom("1.0");

    api.use([
        "templating",
        "underscore",
        "mongo"
    ]);

    api.addFiles("dist/snippet.js", "client");
    api.addFiles("dist/tracking.js", "client");
    api.addFiles("dist/browser-policy.js", "server");
    api.addFiles("dist/publications.js", "server");
    api.addFiles("dist/server.js", "server");

    api.use(["accounts-base", "accounts-oauth"], { weak: true });
    api.use("iron:router@1.0.7", "client", { weak: true });
    api.use("meteorhacks:flow-router@1.17.2", "client", { weak: true });
    api.use("kadira:flow-router@2.0.0", "client", { weak: true });
    api.use("browser-policy-content", "server", { weak: true });

    api.export("analytics", "server");
});

Package.onTest(function(api) {
    api.use("tinytest");
    api.use("astronomerio:core");
    api.addFiles("astronomer-tests.js");
});
