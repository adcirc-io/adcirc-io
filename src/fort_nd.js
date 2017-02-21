import { default as worker } from './fort_nd_worker'

function fortnd ( n_dims ) {

    var _worker = worker( n_dims );

    function _fortnd () {

    }

    _fortnd.on_start = function ( _ ) {
        if ( !arguments.length ) return _worker.on_start();
        _worker.on_start( _ );
        return _fortnd;
    };

    _fortnd.on_progress = function ( _ ) {
        if ( !arguments.length ) return _worker.on_progress();
        _worker.on_progress( _ );
        return _fortnd;
    };

    _fortnd.on_finish = function ( _ ) {
        if ( !arguments.length ) return _worker.on_finish();
        _worker.on_finish( _ );
        return _fortnd;
    };

    _fortnd.read = function ( file ) {
        _worker.read( file );
        return _fortnd;
    };

    return _fortnd;

}

export function fort63 () {
    return fortnd( 1 );
}

export function fort64() {
    return fortnd( 2 );
}