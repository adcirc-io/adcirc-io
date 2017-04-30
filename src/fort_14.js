import { fort14_worker } from "./fort_14_worker"
import { nest } from './nest'
import { dispatcher } from '../../adcirc-events/index'

export function fort14 () {

    var _worker = fort14_worker();
    var _fort14 = dispatcher();

    var _elements;
    var _nodes;

    _fort14.elements = function ( _ ) {

        if ( !arguments.length ) return _elements;

        _elements = _;

        return _fort14;

    };

    _fort14.nodes = function ( _ ) {

        if ( !arguments.length ) return _nodes;

        _nodes = _;

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

                _fort14.dispatch( message );

                break;

            case 'progress':

                _fort14.dispatch( message );

                break;

            case 'finish':

                _fort14.dispatch( message );

                _worker.postMessage({
                    type: 'get',
                    what: 'nodes'
                } );

                _worker.postMessage({
                    type: 'get',
                    what: 'elements'
                } );

                break;

            case 'nodes':

                _nodes = {
                    array: new Float32Array( message.node_array ),
                    map: nest( new Uint32Array( message.node_map ) ),
                    dimensions: message.dimensions,
                    names: [ 'x', 'y', 'depth' ]
                };

                _fort14.dispatch( {
                    type: 'nodes',
                    nodes: _nodes
                } );

                if ( _nodes && _elements ) _fort14.dispatch( { type: 'ready' } );

                break;

            case 'elements':

                _elements = {
                    array: new Uint32Array( message.element_array ),
                    map: nest( new Uint32Array( message.element_map ) )
                };

                _fort14.dispatch( {
                    type: 'elements',
                    elements: _elements
                } );

                if ( _nodes && _elements ) _fort14.dispatch( { type: 'ready' } );

                break;
        }

    });

    return _fort14;

}
