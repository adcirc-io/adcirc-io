import { default as worker } from "./worker"
import { default as file_reader } from "./file_reader"

export default function fort14worker () {

    var _worker = new_worker();
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

function build_worker () {

    var blob_loc = 0;
    var file_loc = 0;

    var line = 0;
    var line_map = {};
    var line_part = '';

    var regex_line = /.*\r?\n/g;
    var regex_nonwhite = /\S+/g;

    var agrid;
    var info_line;

    self.addEventListener( 'message', function ( message ) {

        message = message.data;

        switch ( message.type ) {

            case 'read':

                file_reader( message.file )
                    // .offset( 104 )
                    .block_size( 300 )
                    .block_callback( parse_data )
                    .continue_callback( keep_going )
                    .read();

                break;

        }

    });

    function parse_data ( data ) {

        // Reset the blob location
        blob_loc = 0;

        // Add any leftover line parts from the last parse
        data = line_part + data;

        // Perform matching
        var match;
        while ( ( match = regex_line.exec( data ) ) !== null ) {

            if ( line == 0 ) {

                line_map[ 'agrid' ] = file_loc + match.index;
                agrid = match[0].trim();

            }

            else if ( line == 1 ) {

                line_map[ 'info_line' ] = file_loc + match.index;
                info_line = match[0].trim();

            }

            blob_loc = regex_line.lastIndex;
            line += 1;

        }


        line_part = data.slice( blob_loc );
        file_loc += blob_loc;

        console.log( agrid );
        console.log( info_line );

    }

    var count = 0;
    function keep_going () {
        count += 1;
        return count < 3;
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

function new_worker () {

    var code = '';
    code += file_reader.toString();
    code += build_worker.toString();
    code += 'build_worker();';

    return worker( code );

}