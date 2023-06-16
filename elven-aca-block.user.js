// ==UserScript==
// @name         Bloquer récolte académie de magie
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Block pickupProduction query for Magic Academy
// @author       fatypunk
// @match        https://*.elvenar.com/game*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=elvenar.com
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    const decoder = new TextDecoder("utf-8");
    const encoder = new TextEncoder("utf-8");

    let magicAcademyId = undefined;

    const origOpen = XMLHttpRequest.prototype.open;
    XMLHttpRequest.prototype.open = function(method, url, async, user, password) {
        this._url = url;
        this._method = method;
        this._async = async;
        origOpen.apply(this, arguments);
    };

    const origSend = XMLHttpRequest.prototype.send;
    XMLHttpRequest.prototype.send = function(body) {
        let allowed = true;
        let reload = false;

        if (this._url.includes('/game/json?h=')) {
            const strBody = decoder.decode(body);
            // const token = strBody.slice(0, 10);
            const payload = JSON.parse(strBody.slice(10));

            this.addEventListener("load", function () {
                const data = JSON.parse(this.responseText);
                data.forEach(res => {
                    if (res.requestMethod === 'getData' && res.requestClass === 'StartupService') {
                        res.responseData.city_map.entities.forEach(entity => {
                            if (entity.cityentity_id.includes('_MagicAcademy_')) {
                                magicAcademyId = entity.id;
                                // console.log(magicAcademyId);
                            }
                        });
                    }
                });
            }, false);

            payload.forEach(res => {
                if (res.requestMethod === 'pickupProduction' && res.requestClass === 'CityProductionService') {
                    // console.log(res);
                    if (!magicAcademyId || res.requestData[0].includes(magicAcademyId)) {
                        allowed = false;
                        reload = true;
                    }
                }
            })
        }
        if (allowed) {
            origSend.apply(this, arguments);
        } else {
            this.abort();
            if (reload) { location.reload(); }

            // this.open(this._method, 'https://httpstat.us/200', this._async);
            // origSend.apply(this, arguments);
        }
    };
})();
