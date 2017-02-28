import { fort14worker } from './fort_14_worker'

export default function fort14 () {

    var _worker = fort14worker();

    function _fort14 () {

    }

    _fort14.elements = function ( _ ) {
        if ( !arguments.length ) return _worker.elements();
        _worker.elements( _ );
        return _fort14;
    };

    _fort14.nodes = function ( _ ) {
        if ( !arguments.length ) return _worker.nodes();
        _worker.nodes( _ );
        return _fort14;
    };

    _fort14.on_start = function ( _ ) {
        if ( !arguments.length ) return _worker.on_start();
        _worker.on_start( _ );
        return _fort14;
    };

    _fort14.on_progress = function ( _ ) {
        if ( !arguments.length ) return _worker.on_progress();
        _worker.on_progress( _ );
        return _fort14;
    };

    _fort14.on_finish = function ( _ ) {
        if ( !arguments.length ) return _worker.on_finish();
        _worker.on_finish( _ );
        return _fort14;
    };

    _fort14.read = function ( file ) {
        _worker.read( file );
        return _fort14;
    };

    return _fort14;

}

