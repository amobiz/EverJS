(function() {
    'use strict';

    function activeOrCreateTab( url, fn ) {
        url = chrome.extension.getURL( url );
        chrome.tabs.query({ url: url }, function( tabs ) {
            if ( tabs.length ) {
                chrome.tabs.update( tabs[0].id, {
                    active: true
                }, fn );
            }
            else {
                chrome.tabs.create({
                    url: url
                }, fn );
            }
        });
    }

    OAuth.initBackgroundPage();

    chrome.browserAction.onClicked.addListener(function( /*info, tab*/ ) {
        activeOrCreateTab( 'index.html' );
    });

    chrome.runtime.onInstalled.addListener(function( /*details*/) {
        //console.log('previousVersion', details.previousVersion);
    });

})();
