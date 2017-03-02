import { fortnd_worker } from "./fort_nd_worker"
import { timestep } from './timestep'

function fortnd ( n_dims ) {

    var _file_size;
    var _num_datapoints;
    var _num_datasets;
    var _num_dimensions;
    var _model_timestep;
    var _model_timestep_interval;

    var _n_dims = n_dims;
    var _worker = fortnd_worker();
    var _fortndworker = function () {};

    var _on_start = [];
    var _on_progress = [];
    var _on_finish = [];
    var _on_timestep = [];

    var _on_start_persist = [];
    var _on_progress_persist = [];
    var _on_finish_persist = [];
    var _on_timestep_persist = [];


    _fortndworker.timestep = function ( index ) {
        if ( index >=0 && index < _num_datasets ) {
            _worker.postMessage({
                type: 'timestep',
                model_timestep_index: index
            });
        }
        return _fortndworker;
    };

    _fortndworker.on_finish = function ( _ ) {
        if ( !arguments.length ) return _fortndworker;
        if ( typeof arguments[0] === 'function' ) {
            if ( arguments.length == 1 ) _on_finish.push( arguments[0] );
            if ( arguments.length == 2 && arguments[1] === true ) _on_finish_persist.push( arguments[0] );
        }
        return _fortndworker;
    };

    _fortndworker.on_progress = function ( _ ) {
        if ( !arguments.length ) return _fortndworker;
        if ( typeof arguments[0] === 'function' ) {
            if ( arguments.length == 1 ) _on_progress.push( arguments[0] );
            if ( arguments.length == 2 && arguments[1] === true ) _on_progress_persist.push( arguments[0] );
        }
        return _fortndworker;
    };

    _fortndworker.on_start = function ( _ ) {
        if ( !arguments.length ) return _fortndworker;
        if ( typeof arguments[0] === 'function' ) {
            if ( arguments.length == 1 ) _on_start.push( arguments[0] );
            if ( arguments.length == 2 && arguments[1] === true ) _on_start_persist.push( arguments[0] );
        }
        return _fortndworker;
    };

    _fortndworker.on_timestep = function ( _ ) {
        if ( !arguments.length ) return _fortndworker;
        if ( typeof arguments[0] === 'function' ) {
            if ( arguments.length == 1 ) _on_timestep.push( arguments[0] );
            if ( arguments.length == 2 && arguments[1] === true ) _on_timestep_persist.push( arguments[0] );
        }
        return _fortndworker;
    };

    _fortndworker.read = function ( file ) {
        _worker.postMessage({
            type: 'read',
            file: file
        });
        return _fortndworker;
    };

    _worker.addEventListener( 'message', function ( message ) {

        message = message.data;

        switch ( message.type ) {

            case 'info':
                _file_size = message.file_size;
                _num_datapoints = message.num_datapoints;
                _num_datasets = message.num_datasets;
                _num_dimensions = message.num_dimensions;
                _model_timestep = message.model_timestep;
                _model_timestep_interval = message.model_timestep_interval;
                break;

            case 'start':
                invoke_persistent( _on_start_persist );
                invoke_oneoff( _on_start );
                break;

            case 'progress':
                invoke_persistent( _on_progress_persist, [ message.progress ] );
                invoke_oneoff( _on_progress, [ message.progress ] );
                break;

            case 'finish':
                invoke_persistent( _on_finish_persist );
                invoke_oneoff( _on_finish );
                break;

            case 'timestep':

                var _timestep = timestep( _n_dims, _worker, message );
                invoke_persistent( _on_timestep_persist, [ _timestep ] );
                invoke_oneoff( _on_timestep, [ _timestep ] );
                break;

        }

    });

    _worker.postMessage({ type: 'n_dims', n_dims: _n_dims });

    return _fortndworker;

    function invoke_persistent ( list, args ) {
        for ( var i=0; i<list.length; ++i ) {
            list[i].apply( list[i], args );
        }
    }

    function invoke_oneoff ( list, args ) {
        var cb;
        while ( ( cb = list.shift() ) !== undefined ) cb.apply( cb, args );
    }

}

export function fort63 () {
    return fortnd( 1 );
}

export function fort64() {
    return fortnd( 2 );
}