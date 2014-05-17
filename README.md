# Evernote SDK for JavaScript Sample with Basic Access Permissions

This sample uses the following libraries:
* [Evernote SDK for JavaScript](https://github.com/evernote/evernote-sdk-js),
* [jsOAuth](https://bytespider.github.com/jsOAuth/), and
* [jsOAuth plugin for Google Chrome Extension](https://github.com/amobiz/jsOAuthChromeEx/).

This sample is based on the [Evernote SDK for JavaScript Quick-start Guide](http://dev.evernote.com/doc/start/javascript.php).
(Note that the sample code listed on the Quick-start Guide is somehow not working, please checkout directly to the [PhoneGap example using the Evernote SDK for JavaScript](https://github.com/evernote/phonegap-example) for working sample source code.)

You'll need to create an account on Evernote [development server](https://sandbox.evernote.com/).
And then [Get An API Key](http://dev.evernote.com/doc) and fill in the `consumerKey` and `consumerSecret` in your code.

You can revoke access authorization on [Applications](https://sandbox.evernote.com/AuthorizedServices.action) management page.

Please checkout the [Evernote Developer Documentation](http://dev.evernote.com/doc/) for complete Evernote API reference.

Released under the MIT. Please see LICENSE in the project root folder for more information.

## Tutorial

This sample uses Yeoman, please checkout [yeoman.io](http://yeoman.io/) for installation and tutorial.

* Generate the scaffolding using [generator-chrome-extension](https://github.com/yeoman/generator-chrome-extension).

```
    yo chrome-extension
```

* Add required libraries.

```
    bower install evernote
    bower install git://bytespider.github.com/jsOAuth.git
    bower install git://github.com/amobiz/jsOAuthChromeEx.git
```

* In manifest.json, add the required scripts for event/background page.

```
    "background": {
        "scripts": [
            "bower_components/evernote/evernote-sdk-js/thrift/lib/thrift.js",
            "bower_components/evernote/evernote-sdk-js/thrift/lib/thrift-binary.js",
            "bower_components/evernote/evernote-sdk-js/generated/Errors_types.js",
            "bower_components/evernote/evernote-sdk-js/generated/Limits_types.js",
            "bower_components/evernote/evernote-sdk-js/generated/NoteStore.js",
            "bower_components/evernote/evernote-sdk-js/generated/NoteStore_types.js",
            "bower_components/evernote/evernote-sdk-js/generated/Types_types.js",
            "bower_components/evernote/evernote-sdk-js/generated/UserStore.js",
            "bower_components/evernote/evernote-sdk-js/generated/UserStore_types.js",
            "bower_components/jsOAuth/dist/jsOAuth-1.3.7.js",
            "bower_components/jsOAuthChromeEx/app/scripts/jsOAuthChromeEx.js",
            "scripts/chromereload.js",
            "scripts/client.js",
            "scripts/background.js"
        ]
    },
```

    Don't use the minified version of evernote-sdk-js, because we need the "authenticationToken" veriable be reserved, as in the next step.

* In Gruntfile.js, add keyword "authenticationToken" to except in uglify.

```
    uglify: {
        options: {
            mangle: {
                except: ['authenticationToken']
            }
        }
    },
```

* In manifest.json, add "web_accessible_resources".

```
    "web_accessible_resources": [
        "oauth.html"
    ],
```

* In manifest.json, add permission to "https://sandbox.evernote.com/".

```
    "permissions": [
        "tabs",
        "https://sandbox.evernote.com/"
    ]
```

* In background.js, setup the jsOAuth:

```
    OAuth.initBackgroundPage();
```

* To authorize using OAuth, create an Evernote.Client object, and then call it's authorize method.

```
    var client = new Evernote.Client({
        consumerKey: 'your consumerKey',
        consumerSecret: 'your consumerSecret',
        sandbox: true
    });

    client.authorize(function() {
        noteStore = client.getNoteStore();
        // call noteStore's method to access Evernote API.
    }, function( error ) {
        handleEDAMException( error );
    });
```

  You'll need to replace the consumer key and secret with your own.

* Load the sample Chrome Extension in developer mode.

  Please checkout [Load the extension](https://developer.chrome.com/extensions/getstarted#unpacked) for instruction.

* Checkout evernote.js for usage examples.

## Authors

  * [Amobiz](https://github.com/amobiz)
