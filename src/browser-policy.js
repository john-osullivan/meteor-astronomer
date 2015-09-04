if (Package["browser-policy-common"]) {
    let content = Package['browser-policy-common'].BrowserPolicy.content;
    if (content) {
        content.allowOriginForAll("api.astronomer.io");
    }
}
