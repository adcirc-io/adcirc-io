import { fortnd_worker } from "./fort_nd_worker"

function fortnd ( n_dims ) {

    var _n_dims = n_dims;
    var _worker = fortnd_worker();
    var _fortndworker = function () {};

    var _on_start = [];
    var _on_progress = [];
    var _on_finish = [];

    var _on_start_persist = [];
    var _on_progress_persist = [];
    var _on_finish_persist = [];

    var _timestep_callbacks = {};

    _fortndworker.load_timestep = function ( timestep_index, callback ) {
        _timestep_callbacks[ timestep_index ] = callback;
        _worker.postMessage({
            type: 'timestep',
            timestep_index: timestep_index
        });
        return _fortndworker;
    };

    _fortndworker.on_finish = function ( _ ) {
        if ( !arguments.length ) return _on_finish;
        if ( typeof arguments[0] === 'function' ) {
            if ( arguments.length == 1 ) _on_finish.push( arguments[0] );
            if ( arguments.length == 2 && arguments[1] === true ) _on_finish_persist.push( arguments[0] );
        }
        return _fortndworker;
    };

    _fortndworker.on_progress = function ( _ ) {
        if ( !arguments.length ) return _on_progress;
        if ( typeof arguments[0] == 'function' ) {
            if ( arguments.length == 1 ) _on_progress.push( arguments[0] );
            if ( arguments.length == 2 && arguments[1] === true ) _on_progress_persist.push( arguments[0] );
        }
        return _fortndworker;
    };

    _fortndworker.on_start = function ( _ ) {
        if ( !arguments.length ) return _on_start;
        if ( typeof arguments[0] == 'function' ) {
            if ( arguments.length == 1 ) _on_start.push( arguments[0] );
            if ( arguments.length == 2 && arguments[1] === true ) _on_start_persist.push( arguments[0] );
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

            case 'timestep':

                var data = {
                    model_time: message.model_time,
                    timestep: message.timestep,
                    array: new Float32Array( message.array )
                };

                if ( message.timestep_index in _timestep_callbacks ) {
                    _timestep_callbacks[ message.timestep_index ]( data );
                }

        }

    });

    _worker.postMessage({ type: 'n_dims', n_dims: _n_dims });

    return _fortndworker;

}

export function fort63 () {
    return fortnd( 1 );
}

export function fort64() {
    return fortnd( 2 );
}