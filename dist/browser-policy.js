"use strict";

if (Package["browser-policy-common"]) {
    var content = Package["browser-policy-common"].BrowserPolicy.content;
    if (content) {
        content.allowOriginForAll("api.astronomer.io");
    }
}