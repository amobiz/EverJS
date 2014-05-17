(function( exports ) {
    'use strict';

    function $( selector ) {
        return document.querySelector( selector );
    }

    function mixin( target, source ) {
        var k;

        for ( k in source ) {
            if ( source.hasOwnProperty( k ) && 'function' === typeof source[ k ] ) {
                target[ k ] = source[ k ];
            }
        }
    }

    function accessor( el ) {
        switch( el.type ) {
            case 'checkbox':
                return {
                    get: function() {
                        return el.checked;
                    },
                    set: function( value ) {
                        el.checked = value;
                    },
                    clear: function() {
                    }
                };
            case 'select-one':
                return {
                    get: function() {
                        return el.value;
                    },
                    set: function( value ) {
                        el.value = value;
                    },
                    clear: function() {
                    }
                };
            default:
                return {
                    get: function() {
                        return el.value;
                    },
                    set: function( value ) {
                        el.value = value;
                    },
                    clear: function() {
                        el.value = '';
                    }
                };
        }
    }

    var DataExchange = function() {
    };

    DataExchange.prototype.bind = function( bindings ) {
        var k, el, property, properties = {};
        for ( k in bindings ) {
            if ( bindings.hasOwnProperty( k ) ) {
                property = bindings[ k ];
                if ( 'string' === typeof property ) {
                    el = $( property );
                    properties[ k ] = {
                        el: el,
                        accessor: accessor( el )
                    };
                }
                else if ( 'object' === typeof property ) {
                    el = $( property.el );
                    properties[ k ] = {
                        el: el,
                        accessor: accessor( el ),
                        defaults: property.defaults
                    };
                }
            }
        }
        this.properties = properties;
    };

    DataExchange.prototype.clear = function() {
        var k, accessor, properties = this.properties;
        for ( k in properties ) {
            if ( properties.hasOwnProperty( k ) ) {
                accessor = properties[ k ].accessor;
                accessor.clear();
            }
        }
    };

    DataExchange.prototype.set = function( values ) {
        var k, value, accessor, properties = this.properties;
        for ( k in properties ) {
            if ( properties.hasOwnProperty( k ) ) {
                value = values[ k ] || properties[ k ].defaults;
                if ( typeof value !== 'undefined' ) {
                    accessor = properties[ k ].accessor;
                    accessor.set( value );
                }
            }
        }
    };

    DataExchange.prototype.get = function( values ) {
        var k, accessor, properties = this.properties;
        if ( ! values ) {
            values = {};
        }
        for ( k in properties ) {
            if ( properties.hasOwnProperty( k ) ) {
                accessor = properties[ k ].accessor;
                values[ k ] = accessor.get() || properties[ k ].defaults;
            }
        }
        return values;
    };

    var List = function( listFn ) {
        this.listeners = [];
        this.listFn = listFn;
    };

    List.prototype.list = function() {
        var self;

        self = this;
        self.listFn(function( list ) {
            var i, n;

            for ( i = 0, n = self.listeners.length; i < n; ++i ) {
                self.listeners[ i ]( list );
            }
        });
    };

    List.prototype.addListener = function( listener ) {
        this.listeners.push( listener );
    };

    var ListView = function( options ) {
        var self, template;

        function render( list ) {
            var i, n, item, s, html = '';
            for ( i = 0, n = list.length; i < n; ++i ) {
                item = list[ i ];
                s = template.replace( '{guid}', item.guid );
                s = s.replace( '{name}', item.name );
                html += s;
            }
            self.el.innerHTML = html;
        }

        self = this;
        self.el = $( options.el );
        template = options.template;

        if ( options.list ) {
            options.list.addListener( render );
        }
    };

    var EditView = function( options ) {
        var self = this;

        self.bind( options.bindings );

        if ( options.model ) {
            self.set( options.model );
        }

        $( options.el ).addEventListener( 'click', function( e ) {
            var values;

            e.preventDefault();
            values = self.get( options.model || {} );
            options.action.call( self, values );
        });
    };

    mixin( EditView.prototype, DataExchange.prototype );

    var Message = function( selector ) {
        this.el = $( selector );
    };

    Message.prototype.show = function( msg, timeout ) {
        var self;

        self = this;
        self.el.innerHTML = msg;
        self.el.classList.add( 'active' );
        setTimeout(function() {
            self.el.classList.remove( 'active' );
        }, timeout || 3000);
    };

    exports.$ = $;
    exports.List = List;
    exports.ListView = ListView;
    exports.EditView = EditView;
    exports.Message = Message;

})( this );
