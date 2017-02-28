import { fort14_worker } from "./fort_14_worker"
import { nest } from './nest'

export function fort14 () {

    var _worker = fort14_worker();
    var _fort14 = function () {};

    var _elements;
    var _nodes;

    var _on_start = [];
    var _on_progress = [];
    var _on_finish = [];

    var _on_elements = [];
    var _on_nodes = [];

    var _on_start_persist = [];
    var _on_progress_persist = [];
    var _on_finish_persist = [];

    var _on_elements_persist = [];
    var _on_nodes_persist = [];

    _fort14.elements = function ( _ ) {

        // No arguments, return cached data whether it exists or not
        if ( !arguments.length ) return _elements;

        // A callback has been passed
        if ( typeof arguments[0] === 'function' ) {

            // If the user wants the callback to persist, add it to the queue
            if ( arguments.length == 2 && arguments[1] === true ) _on_elements_persist.push( arguments[0] );

            // If we've got cached data, immediately pass data to callback
            if ( _elements ) return _( _elements );

            // We're going to be waiting for data, so if it isn't persisting, add it to the one-off queue
            if ( arguments.length < 2 || arguments[1] !== true ) _on_elements.push( arguments[0] );

            _worker.postMessage({
                type: 'get',
                what: 'elements'
            });

            return _fort14;

        }

        // Data has been passed so cache it
        _elements = _;
        return _fort14;

    };

    _fort14.nodes = function ( _ ) {

        // No arguments, return cached data whether it exists or not
        if ( !arguments.length ) return _nodes;

        // A callback has been passed
        if ( typeof arguments[0] === 'function' ) {

            // If the user wants the callback to persist, add it to the queue
            if ( arguments.length == 2 && arguments[1] === true ) _on_nodes_persist.push( arguments[0] );

            // If we've got cached data, immediately pass data to callback
            if ( _nodes ) return _( _nodes );

            // We're going to be waiting for data, so if it isn't persisting, add it to the one-off queue
            if ( arguments.length < 2 || arguments[1] !== true ) _on_nodes.push( arguments[0] );

            _worker.postMessage({
                type: 'get',
                what: 'nodes'
            });

            return _fort14;

        }

        // Data has been passed so cache it
        _nodes = _;
        return _fort14;
    };

    _fort14.on_finish = function ( _ ) {
        if ( !arguments.length ) return _on_finish;
        if ( typeof arguments[0] === 'function' ) {
            if ( arguments.length == 1 ) _on_finish.push( arguments[0] );
            if ( arguments.length == 2 && arguments[1] === true ) _on_finish_persist.push( arguments[0] );
        }
        return _fort14;
    };

    _fort14.on_progress = function ( _ ) {
        if ( !arguments.length ) return _on_progress;
        if ( typeof arguments[0] == 'function' ) {
            if ( arguments.length == 1 ) _on_progress.push( arguments[0] );
            if ( arguments.length == 2 && arguments[1] === true ) _on_progress_persist.push( arguments[0] );
        }
        return _fort14;
    };

    _fort14.on_start = function ( _ ) {
        if ( !arguments.length ) return _on_start;
        if ( typeof arguments[0] == 'function' ) {
            if ( arguments.length == 1 ) _on_start.push( arguments[0] );
            if ( arguments.length == 2 && arguments[1] === true ) _on_start_persist.push( arguments[0] );
        }
        return _fort14;
    };

    _fort14.read = function ( file ) {
        _worker.postMessage({
            type: 'read',
            file: file
        });
    };

    _worker.addEventListener( 'message', function ( message ) {

        message = message.data;

        switch ( message.type ) {

            case 'start':
                for ( var i=0; i<_on_start_persist.length; ++i ) _on_start_persist[i]();
                var cb;
                while( ( cb = _on_start.shift() ) !== undefined ) cb();
                break;

            case 'progress':
                for ( var i=0; i<_on_progress_persist.length; ++i ) _on_progress_persist[i]( message.progress );
                var cb;
                while( ( cb = _on_progress.shift() ) !== undefined ) cb( message.progress );
                break;

            case 'finish':
                for ( var i=0; i<_on_finish_persist.length; ++i ) _on_finish_persist[i]();
                var cb;
                while( ( cb = _on_finish.shift() ) !== undefined ) cb();
                break;

            case 'nodes':
                _nodes = {
                    array: new Float32Array( message.node_array ),
                    map: nest( new Uint32Array( message.node_map ) )
                };
                for ( var i=0; i<_on_nodes_persist.length; ++i ) _on_nodes_persist[i]( _nodes );
                var cb;
                while ( ( cb = _on_nodes.shift() ) !== undefined ) cb( _nodes );
                break;

            case 'elements':
                _elements = {
                    array: new Uint32Array( message.element_array ),
                    map: nest( new Uint32Array( message.element_map ) )
                };
                for ( var i=0; i<_on_elements_persist.length; ++i ) _on_elements_persist[i]( _nodes );
                var cb;
                while( ( cb = _on_elements.shift() ) !== undefined ) cb( _elements );
                break;
        }

    });

    return _fort14;

}
