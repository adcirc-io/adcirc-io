import { default as fort14_worker_builder } from "./fort_14_worker_builder"

export default function fort14worker () {

    var _worker = fort14_worker_builder();
    var _fort14worker = function () {};

    var _on_start;
    var _on_progress;
    var _on_finish;

    _fort14worker.on_finish = function ( _ ) {
        if ( !arguments.length ) return _on_finish;
        if ( typeof _ == 'function' ) _on_finish = _;
        return _fort14worker;
    };

    _fort14worker.on_progress = function ( _ ) {
        if ( !arguments.length ) return _on_progress;
        if ( typeof _ == 'function' ) _on_progress = _;
        return _fort14worker;
    };

    _fort14worker.on_start = function ( _ ) {
        if ( !arguments.length ) return _on_start;
        if ( typeof _ == 'function' ) _on_start = _;
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
                if ( _on_start ) _on_start();
                break;

            case 'progress':
                if ( _on_progress ) _on_progress( message.progress );
                break;

            case 'finish':
                if ( _on_finish ) _on_finish();
                break;
        }

    });

    return _fort14worker;

}

