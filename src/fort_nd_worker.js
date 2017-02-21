import { default as fortnd_worker_builder } from "./fort_nd_worker_builder"

export default function fortndworker ( n_dims ) {

    var _n_dims = n_dims;
    var _worker = fortnd_worker_builder();
    var _fortndworker = function () {};

    var _on_start;
    var _on_progress;
    var _on_finish;

    _fortndworker.on_finish = function ( _ ) {
        if ( !arguments.length ) return _on_finish;
        if ( typeof _ == 'function' ) _on_finish = _;
        return _fortndworker;
    };

    _fortndworker.on_progress = function ( _ ) {
        if ( !arguments.length ) return _on_progress;
        if ( typeof _ == 'function' ) _on_progress = _;
        return _fortndworker;
    };

    _fortndworker.on_start = function ( _ ) {
        if ( !arguments.length ) return _on_start;
        if ( typeof _ == 'function' ) _on_start = _;
        return _fortndworker;
    };

    _fortndworker.read = function ( file ) {
        _worker.postMessage({
            type: 'read',
            file: file
        });
    };

    _worker.addEventListener( 'message', function ( message ) {

        message = message.data;

        switch ( message.type ) {

            case 'start':
                if ( _on_start ) _on_start();
                break;

            case 'progress':
                if ( _on_progress ) _on_progress( message.progress );
                break;

            case 'finish':
                if ( _on_finish ) _on_finish();
                _worker.postMessage({ 'type': 'test_map' });
                break;

        }

    });

    _worker.postMessage({ type: 'n_dims', n_dims: _n_dims });

    return _fortndworker;

}