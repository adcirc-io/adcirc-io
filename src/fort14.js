import { default as worker } from './fort14worker'

export default function () {

    var _worker = worker();

    function _fort14 () {

    }

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

