// ==UserScript==
// @name         __name__
// @namespace    https://www.bondageprojects.com/
// @version      0.7
// @description  __description__
// @author       __author__
// @include      /^https:\/\/(www\.)?bondageprojects\.elementfx\.com\/R\d+\/(BondageClub|\d+)\/(\d+\.html)?$/
// @include      /^https:\/\/(www\.)?bondage-europe\.com\/R\d+\/(BondageClub|\d+)\/(\d+\.html)?$/
// @include      /^https:\/\/(www\.)?bondageprojects\.com\/R\d+\/$/
// @run-at       document-end
// ==/UserScript==

(function () {
    "use strict";
    const script = document.createElement("script");
    script.src = `__base_url__/__script_file__?timestamp=${Date.now()}`;
    script.type = "module";
    script.crossOrigin = "anonymous";
    document.head.appendChild(script);
})();
