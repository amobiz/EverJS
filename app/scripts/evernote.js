(function( exports, background ) {
    'use strict';

    var Evernote = background.Evernote;

    var msg, noteStore;

    function handleEDAMException( ex ) {
        switch( ex.name ) {
            case 'EDAMUserException':
                msg.show( 'User exception: invalid ' + ex.parameter );
                return true;
            case 'EDAMSystemException':
                msg.show( 'System exception: ' + ex.parameter );
                return true;
        }
        return false;
    }

    function listNotebooks( fn ) {
        noteStore.listNotebooks(function( ret ) {
            console.log( ret );
            if ( handleEDAMException( ret ) ) {
                return;
            }
            fn( ret );
        });
    }

    function createNotebook( values, fn ) {
        var notebook = new Evernote.Notebook();
        notebook.name = values.name;
        noteStore.createNotebook( notebook, function( ret ) {
            console.log( ret );
            if ( handleEDAMException( ret ) ) {
                return;
            }
            fn( ret );
        });
    }

    function listTags( fn ) {
        noteStore.listTags(function( ret ) {
            console.log( ret );
            if ( handleEDAMException( ret ) ) {
                return;
            }
            fn( ret );
        });
    }

    function createTag( values, fn ) {
        var tag = new Evernote.Tag();
        tag.name = values.name;
        noteStore.createTag( tag, function( ret ) {
            console.log( ret );
            if ( handleEDAMException( ret ) ) {
                return;
            }
            fn( ret );
        });
    }

    function createNote( values, fn ) {
        var note = new Evernote.Note();
        note.title = values.title;
        note.content = values.content;
        if ( values.notebookGuid ) {
            note.notebookGuid = values.notebookGuid;
        }
        noteStore.createNote( note, function( ret ) {
            console.log( ret );
            if ( handleEDAMException( ret ) ) {
                return;
            }
            fn( ret );
        });
    }

    function generateContent( content ) {
        var i, n, s;
        s = content.split( '\n' );
        content = '';
        for ( i = 0, n = s.length; i < n; ++i ) {
            content += '<div>' + s[ i ] + '</div>';
        }
        return '<?xml version="1.0" encoding="UTF-8"?><!DOCTYPE en-note SYSTEM "http://xml.evernote.com/pub/enml2.dtd"><en-note>' + content + '</en-note>';
    }

    var $ = exports.$,
        Message = exports.Message,
        List = exports.List,
        ListView = exports.ListView,
        EditView = exports.EditView;

    var App = {};

    App.init = function() {
        var notebooks, tags;

        msg = new Message( '#message' );

        App.notebooks = notebooks = new List( listNotebooks );
        App.tags = tags = new List( listTags );

        new ListView({
            el: '#noteNotebook',
            template: '<option value="{guid}">{name}</option>',
            list: notebooks
        });
        new ListView({
            el: '#notebooks',
            template: '<li id="{guid}">{name}</li>',
            list: notebooks
        });
        new ListView({
            el: '#tags',
            template: '<li id="{guid}">{name}</li>',
            list: tags
        });

        new EditView({
            el: '#createNotebook',
            action: function( values ) {
                var self = this;
                createNotebook( values, function() {
                    self.clear();
                    notebooks.list();
                });
            },
            bindings: {
                'name': '#notebookName'
            }
        });

        new EditView({
            el: '#createTag',
            action: function( values ) {
                var self = this;
                createTag( values, function() {
                    self.clear();
                    tags.list();
                });
            },
            bindings: {
                'name': '#tagName'
            }
        });

        new EditView({
            el: '#createNote',
            action: function( values ) {
                var self = this;
                values.content = generateContent( values.content );
                createNote( values, function( /* ret */ ) {
                    self.clear();
                });
            },
            bindings: {
                'title': '#noteTitle',
                'notebookGuid': '#noteNotebook',
                'content': '#noteContent'
            }
        });

        new EditView({
            el: '#authorize',
            model: localStorage,
            action: function( values ) {
                App.savePerferences( values );
                App.authorize();
            },
            bindings: {
                'consumerKey': '#consumerKey',
                'consumerSecret': '#consumerSecret',
                'sandbox': {
                    'el': '#sandbox',
                    'defaults': true
                }
            }
        });

        $( '#demo' ).style.display = 'none';
    };

    App.run = function() {
        App.notebooks.list();
        App.tags.list();
    };

    App.authorize = function() {
        var client = new Evernote.Client({
            consumerKey: localStorage.consumerKey,
            consumerSecret: localStorage.consumerSecret,
            sandbox: localStorage.sandbox
        });

        client.authorize(function() {
            $( '#authorize' ).disabled = true;
            $( '#demo' ).style.display = 'block';
            noteStore = client.getNoteStore();
            App.run();
        }, function( error ) {
            handleEDAMException( error );
        });
    };

    App.savePerferences = function( values ) {
        localStorage.consumerKey = values.consumerKey;
        localStorage.consumerSecret = values.consumerSecret;
        localStorage.sandbox = values.sandbox;
    };

    App.init();
    App.authorize();

})( this, chrome.extension.getBackgroundPage() );
