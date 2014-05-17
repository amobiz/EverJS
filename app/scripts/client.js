/*global Thrift, Note, NoteStoreClient, Notebook, NoteFilter, Tag, UserStoreClient, User, EDAM_VERSION_MAJOR, EDAM_VERSION_MINOR */
(function( exports ) {
    'use strict';

    var Evernote = exports.Evernote || (exports.Evernote = {});

    var Client = function( options ) {
        this.clientName = options.clientName || 'EverJS/0.1.9; Windows/7.0';
        this.consumerKey = options.consumerKey;
        this.consumerSecret = options.consumerSecret;
        this.sandbox = typeof(options.sandbox) !== 'undefined' ? options.sandbox : true;
        this.serviceHost = options.serviceHost || (this.sandbox ? 'sandbox.evernote.com' : 'www.evernote.com');
        this.additionalHeaders = options.additionalHeaders || {};
        this.token = options.accessTokenKey = options.token || localStorage.oauth_token;
        this.secret = options.accessTokenSecret = options.secret || localStorage.oauth_token_secret;
        this.sharedToken = options.sharedToken || localStorage.sharedToken;
        this.noteStoreUrl = options.noteStoreUrl || localStorage.noteStoreUrl;
    };

    Client.prototype.authorize = function( onsuccess, onfailure ) {
        var self;

        function getOAuth() {
            if ( ! self.oauth ) {
                self.oauth = new OAuth({
                    requestTokenUrl: self.getEndpoint( 'oauth' ),
                    authorizationUrl: self.getEndpoint( 'OAuth.action' ),
                    accessTokenUrl: self.getEndpoint( 'oauth' ),
                    consumerKey: self.consumerKey,
                    consumerSecret: self.consumerSecret
                });
            }
            return self.oauth;
        }

        function handleSuccess() {
            var userStore;

            userStore = self.getUserStore();
            userStore.getUser(function( ret ) {
                console.log( ret );

                /* handle if user withdraw authorization. */
                switch ( ret.name ) {
                    case 'EDAMUserException':
                    case 'EDAMSystemException':
                        handleFailure( ret );
                        return;
                }

                userStore.checkVersion( self.clientName, EDAM_VERSION_MAJOR, EDAM_VERSION_MINOR, function( ret ) {
                    if ( ret ) {
                        onsuccess( self );
                    }
                    else {
                        handleFailure( 'Evernote API version outdated' );
                    }
                });
            });
        }

        function handleFailure( error ) {
            localStorage.removeItem( 'oauth_token' );
            localStorage.removeItem( 'oauth_token_secret' );
            self.token = self.secret = self.sharedToken = null;
            if ( onfailure ) {
                onfailure( error );
            }
        }

        self = this;
        if ( self.token ) {
            handleSuccess();
        }
        else {
            getOAuth().authorize(function( oauth ) {
                self.token = localStorage.oauth_token = oauth.getAccessTokenKey();
                self.secret = localStorage.oauth_token_secret = oauth.getAccessTokenSecret();
                self.sharedToken = localStorage.sharedToken = oauth.getParameter( 'edam_sharedToken' );
                self.noteStoreUrl = localStorage.noteStoreUrl = oauth.getParameter( 'edam_noteStoreUrl' );
                handleSuccess();
            }, onfailure);
        }
    };

    Client.prototype.getUserStore = function() {
        var self = this;
        return new Store(Evernote.UserStoreClient, function( callback ) {
            callback( null, self.token, self.getEndpoint( '/edam/user' ) );
        });
    };

    Client.prototype.getNoteStore = function( noteStoreUrl ) {
        var self = this;
        if ( typeof noteStoreUrl !== 'undefined' ) {
            self.noteStoreUrl = noteStoreUrl;
        }
        return new Store( Evernote.NoteStoreClient, function( callback ) {
            if ( self.noteStoreUrl ) {
                callback( null, self.token, self.noteStoreUrl );
            }
            else {
                self.getUserStore().getNoteStoreUrl(function( err, noteStoreUrl ) {
                    self.noteStoreUrl = noteStoreUrl;
                    callback( err, self.token, self.noteStoreUrl );
                });
            }
        });
    };

    Client.prototype.getSharedNoteStore = function( linkedNotebook ) {
        var self = this;
        return new Store( Evernote.NoteStoreClient, function( callback ) {
            var thisStore = this;
            if ( thisStore.sharedToken ) {
                callback( null, thisStore.sharedToken, linkedNotebook.noteStoreUrl );
            }
            else {
                var noteStore = new Store( Evernote.NoteStoreClient, function( cb ) {
                    cb( null, self.token, linkedNotebook.noteStoreUrl );
                });
                noteStore.authenticateToSharedNotebook( linkedNotebook.shareKey, function( err, sharedAuth ) {
                    thisStore.sharedToken = sharedAuth.authenticationToken;
                    callback( err, thisStore.sharedToken, linkedNotebook.noteStoreUrl );
                });
            }
        });
    };

    Client.prototype.getBusinessNoteStore = function() {
        var self = this;
        return new Store(Evernote.NoteStoreClient, function( callback ) {
            var thisStore = this;
            if ( thisStore.bizToken && thisStore.bizNoteStoreUri ) {
                callback( null, thisStore.bizToken, thisStore.bizNoteStoreUri );
            }
            else {
                self.getUserStore().authenticateToBusiness(function( err, bizAuth ) {
                    thisStore.bizToken = bizAuth.authenticationToken;
                    thisStore.bizNoteStoreUri = bizAuth.noteStoreUrl;
                    thisStore.bizUser = bizAuth.user;
                    callback( err, thisStore.bizToken, thisStore.bizNoteStoreUri );
                });
            }
        });
    };

    Client.prototype.getEndpoint = function( path ) {
        var self = this;
        var url = 'https://' + self.serviceHost;
        if ( path ) {
            url += '/' + path;
        }
        return url;
    };

    var Store = function( clientClass, enInfoFunc ) {
        var self = this;

        self.clientClass = clientClass;
        self.enInfoFunc = enInfoFunc;

        for ( var key in self.clientClass.prototype ) {
            if ( key.indexOf( '_' ) !== -1 || typeof( self.clientClass.prototype[ key ] ) !== 'function' ) {
                continue;
            }
            self[ key ] = Store.createWrapperFunction( self, key );
        }
    };

    Store.createWrapperFunction = function( self, name ) {
        return function() {
            var orgArgs = arguments;
            self.getThriftClient(function( err, client, token ) {
                var callback;
                if ( err ) {
                    callback = orgArgs[ orgArgs.length - 1 ];
                    if ( callback && typeof(callback) === 'function' ) {
                        callback( err );
                    }
                    else {
                        throw 'Evernote SDK for Node.js doesn\'t support synchronous calls';
                    }
                    return;
                }
                var orgFunc = client[ name ];
                var orgArgNames = self.getParamNames( orgFunc );
                if ( orgArgNames !== null && orgArgs.length + 1 === orgArgNames.length ) {
                    try {
                        var newArgs = [];
                        for ( var i in orgArgNames ) {
                            if ( orgArgNames[ i ] === 'authenticationToken' ) {
                                newArgs.push( token );
                            }
                            if ( i < orgArgs.length ) {
                                newArgs.push( orgArgs[ i ] );
                            }
                        }
                        orgFunc.apply( client, newArgs );
                    }
                    catch ( e ) {
                        orgFunc.apply( client, orgArgs );
                    }
                }
                else {
                    orgFunc.apply( client, orgArgs );
                }
            });
        };
    };

    Store.prototype.getThriftClient = function( callback ) {
        var self = this;
        self.enInfoFunc(function( err, token, url ) {
            var m = token.match( /:A=([^:]+):/ );
            if ( m ) {
                self.userAgentId = m[ 1 ];
            }
            else {
                self.userAgentId = '';
            }
            var transport = new Evernote.Thrift.BinaryHttpTransport( url );
            var protocol = new Evernote.Thrift.BinaryProtocol( transport );
            callback( err, new self.clientClass( protocol ), token );
        });
    };

    Store.prototype.getParamNames = function( func ) {
        var funStr = func.toString();
        return funStr.slice( funStr.indexOf( '(' ) + 1, funStr.indexOf( ')' ) ).match( /([^\s,]+)/g );
    };

    Evernote.Client = Client;
    Evernote.Thrift = Thrift;
    Evernote.NoteStoreClient = NoteStoreClient;
    Evernote.UserStoreClient = UserStoreClient;

    Evernote.Note = Note;
    Evernote.Notebook = Notebook;
    Evernote.NoteFilter = NoteFilter;
    Evernote.Tag = Tag;
    Evernote.User = User;

})( this );
