function setUA(ua, urls) {
    chrome.runtime.sendMessage({
        type: 'setUA',
        urls: urls,
        ua: ua
    });
    window.close();
}

function resetUA() {
    chrome.runtime.sendMessage({
        type: 'resetUA'
    });
    window.close();
}

function bindButtons() {
    document.getElementById('submit-ua-custom').onclick = function() {
        setUA(document.getElementById('ua-custom').value, document.getElementById('ua-target-websites').value);
    }

    document.getElementById('submit-ua-reset').onclick = resetUA;
}

function init() {
    bindButtons();
    populatePopupContent();
    bindOnMessage();
}

function populatePopupContent() {
    chrome.runtime.sendMessage({
        type: 'getUA'
    }, (data) => {
        populateCurrentUA(data.ua, data.urls);
    });
}

function populateCurrentUA(ua, urls) {
    document.getElementById('current-ua').innerText = navigator.userAgent;
    document.getElementById('ua-custom').value = ua;
    document.getElementById('ua-target-websites').value = urls;
}

function bindOnMessage() {
    chrome.runtime.onMessage.addListener(function(msg, sender, callback) {
        if (msg.type === 'reload') {
            populateCurrentUA(msg.ua, msg.urls);
        }
    });
}

init();
