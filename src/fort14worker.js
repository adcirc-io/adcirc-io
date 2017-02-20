import { default as worker } from "./worker"
import { default as read_sequential } from "./read_sequential"

export default function fort14worker () {

    var _worker = build_worker();
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
        }

    });

    return _fort14worker;

}

function sequential_worker () {

    self.addEventListener( 'message', function ( message ) {

        message = message.data;

        switch ( message.type ) {

            case 'read':
                read_sequential( message.file,
                    parse_data,
                    function () {},
                    function () { return false; }
                );
                // post_start();
                // post_progress(0);
                // post_progress(25);
                // post_progress(50);
                // post_progress(75);
                // post_progress(100);
                // post_finish();
                break;

        }

    });

    function parse_data ( data ) {

        // console.log( data.length );
        console.log( JSON.stringify(data) );

        var regex = /.*\r?\n/g;

        var matches;
        while( ( matches = regex.exec( data ) ) !== null ) {

            console.log( JSON.stringify( matches[0] ), matches[0].length );
            console.log( 'Next starts at: ' + regex.lastIndex );

        }

    }

    function post_start () {
        self.postMessage({
            type: 'start'
        });
    }

    function post_progress ( progress ) {
        self.postMessage({
            type: 'progress',
            progress: progress
        });
    }

    function post_finish () {
        self.postMessage({
            type: 'finish'
        });
    }

}

function build_worker () {

    var code = '';
    code += read_sequential.toString();
    code += sequential_worker.toString();
    code += 'sequential_worker();';

    return worker( code );

}