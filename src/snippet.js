!(function () {
    const analytics = window.analytics = window.analytics || [];
    if (!analytics.initialize) if (analytics.invoked) window.console && console.error && console.error('Astronomer snippet included twice.');else {
        analytics.invoked = !0;
        analytics.methods = ['trackSubmit', 'trackClick', 'trackLink', 'trackForm', 'pageview', 'identify', 'reset', 'group', 'track', 'ready', 'alias', 'page', 'once', 'off', 'on'];
        analytics.factory = function (t) {
            return function () {
                let e = Array.prototype.slice.call(arguments);
                e.unshift(t);
                analytics.push(e);
                return analytics;
            };
        };
        for (let t = 0; t < analytics.methods.length; t++) {
            let e = analytics.methods[t];
            analytics[e] = analytics.factory(e);
        }
        analytics.load = function (t) {
            const e = document.createElement('script');
            e.type = 'text/javascript';
            e.async = !0;
            e.src = ('https:' === document.location.protocol ? 'https://' : 'http://') + 'cdn.astronomer.io/analytics.js/v1/' + t + '/analytics.min.js';
            const n = document.getElementsByTagName('script')[0];
            n.parentNode.insertBefore(e, n);
        };
        analytics.SNIPPET_VERSION = '3.1.0';
    }
})();