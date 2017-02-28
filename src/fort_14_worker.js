import { fort14_worker_builder } from "./fort_14_worker_builder"
import { nest } from './nest'

export function fort14worker () {

    var _worker = fort14_worker_builder();
    var _fort14worker = function () {};

    var _elements;
    var _nodes;

    var _on_start = [];
    var _on_progress = [];
    var _on_finish = [];

    var _on_elements = [];
    var _on_nodes = [];

    _fort14worker.elements = function ( _ ) {

        // No arguments, return cached data whether it exists or not
        if ( !arguments.length ) return _elements;

        // A callback has been passed
        if ( typeof _ === 'function' ) {

            // If we've got cached data, immediately pass data to callback
            if ( _elements ) return _( _elements );

            // Otherwise, queue up the callback to be called whenever we do get data and tell the worker we want it asap
            _on_elements.push( _ );
            _worker.postMessage({
                type: 'get',
                what: 'elements'
            });

        }

    };

    _fort14worker.nodes = function ( _ ) {

        // No arguments, return cached data whether it exists or not
        if ( !arguments.length ) return _nodes;

        // A callback has been passed
        if ( typeof _ === 'function' ) {

            // If we've got cached data, immediately pass data to callback
            if ( _nodes ) return _( _nodes );

            // Otherwise, queue up the callback to be called whenever we do get data and tell the worker we want it asap
            _on_nodes.push( _ );
            _worker.postMessage({
                type: 'get',
                what: 'nodes'
            });
        }

        // Data has been passed so cache it
        _nodes = _;
        return _fort14worker;
    };

    _fort14worker.on_finish = function ( _ ) {
        if ( !arguments.length ) return _on_finish;
        if ( typeof _ == 'function' ) _on_finish.push( _ );
        return _fort14worker;
    };

    _fort14worker.on_progress = function ( _ ) {
        if ( !arguments.length ) return _on_progress;
        if ( typeof _ == 'function' ) _on_progress.push( _ );
        return _fort14worker;
    };

    _fort14worker.on_start = function ( _ ) {
        if ( !arguments.length ) return _on_start;
        if ( typeof _ == 'function' ) _on_start.push( _ );
        return _fort14worker;
    };

    _fort14worker.read = function ( file ) {
        _worker.postMessage({
            type: 'read',
            file: file
        });
    };

    _worker.addEventListener( 'message', function ( message ) {

        message = message.data;

        switch ( message.type ) {

            case 'start':
                for ( var i=0; i<_on_start.length; ++i ) _on_start[i]();
                break;

            case 'progress':
                for ( var i=0; i<_on_progress.length; ++i ) _on_progress[i]( message.progress );
                break;

            case 'finish':
                for ( var i=0; i<_on_finish.length; ++i ) _on_finish[i]();
                break;

            case 'nodes':
                _nodes = {
                    array: new Float32Array( message.node_array ),
                    map: nest( new Uint32Array( message.node_map ) )
                };
                var cb;
                while ( ( cb = _on_nodes.shift() ) !== undefined ) cb( _nodes );
                break;

            case 'elements':
                _elements = {
                    array: new Uint32Array( message.element_array ),
                    map: nest( new Uint32Array( message.element_map ) )
                };
                var cb;
                while( ( cb = _on_elements.shift() ) !== undefined ) cb( _elements );
                break;
        }

    });

    return _fort14worker;

}

