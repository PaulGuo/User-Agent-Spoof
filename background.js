/*global chrome*/

var DEFAULT_UA = navigator.userAgent;
var DEFAULT_URLS = '<all_urls>';
var CUSTOM_UA = DEFAULT_UA;
var URLS = DEFAULT_URLS;

function init() {
    bindOnBeforeSendHeaders();
    bindOnMessage();
}

function onBeforeSendHeadersCallback(details) {
    if (CUSTOM_UA === DEFAULT_UA) {
        return;
    }

    for (let i = 0; i < details.requestHeaders.length; i++) {
        if (details.requestHeaders[i].name !== 'User-Agent') {
            continue;
        }
        details.requestHeaders[i].value = CUSTOM_UA;
        break;
    }

    return {
        requestHeaders: details.requestHeaders
    };
}

function removeBeforeSendHeaders() {
    if (chrome.webRequest.onBeforeSendHeaders.hasListener(onBeforeSendHeadersCallback)) {
        chrome.webRequest.onBeforeSendHeaders.removeListener(onBeforeSendHeadersCallback);
    }
}

function bindOnBeforeSendHeaders() {
    var validURLS = URLS.split(',').map(Function.prototype.call.bind(String.prototype.trim)).filter(isValidURL);

    removeBeforeSendHeaders();

    if (validURLS.length) {
        try {
            chrome.webRequest.onBeforeSendHeaders.addListener(
                onBeforeSendHeadersCallback, 
                { urls: validURLS },
                ["blocking", "requestHeaders"]
            );
        } catch (e) {}
    }
}

function bindOnMessage() {
    chrome.runtime.onMessage.addListener(function(msg, sender, callback) {
        if (msg.type === 'getUA') {
            callback({
                ua: CUSTOM_UA,
                urls: URLS
            });
        } else if (msg.type === 'setUA') {
            gotMessageSetUA(msg.ua, msg.urls);
        } else if (msg.type === 'resetUA') {
            gotMessageResetUA();
        }
    });
}

function gotMessageSetUA(ua, urls) {
    if(urls) {
        URLS = urls;
    }

    if (ua === '') {
        CUSTOM_UA = DEFAULT_UA;
    } else if(isValidUA(ua)) {
        CUSTOM_UA = ua;
    } else {
        throw "Invalid UA";
    }

    chrome.storage.sync.set({
        'ua_spoof_patterns': urls,
        'ua_spoof_custom': ua
    }, function() {
        bindOnBeforeSendHeaders();
    });
}

function gotMessageResetUA() {
    CUSTOM_UA = DEFAULT_UA;
    URLS = DEFAULT_URLS;
    chrome.storage.sync.remove(['ua_spoof_patterns', 'ua_spoof_custom'], function() {
        removeBeforeSendHeaders();
        chrome.runtime.sendMessage({
            type: 'reload',
            ua: CUSTOM_UA,
            urls: URLS
        });
    });
}

function isValidUA(ua) {
    // Pretty much any string is considered valid.
    // Invalid if not a string, or has new line characters.
    return isString(ua) && !ua.match("[\n\r]") ? true : false;
}

function isValidURL(urlPattern) {
    var validPattern = /^(file:\/\/.+)|(https?|ftp|\*):\/\/(\*|\*\.([^\/*]+)|([^\/*]+))\//g;
    return !!urlPattern.match(validPattern);
}

function isString(input) {
    return input !== undefined && input !== null && typeof(input) === 'string';
}

chrome.storage.sync.get(['ua_spoof_patterns', 'ua_spoof_custom'], function(items) {
    if(items.ua_spoof_patterns) {
        URLS = items.ua_spoof_patterns;
    }

    if(items.ua_spoof_custom) {
        CUSTOM_UA = items.ua_spoof_custom;
    }

    init();
});
