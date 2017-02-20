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
    var num_nodes;
    var num_elements;
    var min_x = Infinity, max_x = -Infinity;
    var min_y = Infinity, max_y = -Infinity;
    var min_z = Infinity, max_z = -Infinity;

    var node_array;
    var node_map = {};
    var element_array;
    var element_map = {};

    self.addEventListener( 'message', function ( message ) {

        message = message.data;

        switch ( message.type ) {

            case 'read':

                file_reader( message.file )
                    .block_callback( parse_data )
                    .finished_callback( done )
                    .read();

                break;

        }

    });

    function done () {
        console.log( 'Nodes: ' + num_nodes );
        console.log( 'Elements: ' + num_elements );
        console.log( 'X-Range: ' + min_x + '\t' + max_x );
        console.log( 'Y-Range: ' + min_y + '\t' + max_y );
        console.log( 'Z-Range: ' + min_z + '\t' + max_z );
        console.log( line_map );
        console.log( node_map );
        console.log( element_map );
    }

    function parse_data ( data ) {

        // Reset the blob location
        blob_loc = 0;

        // Add any leftover line parts from the last parse
        data = line_part + data;

        // Perform matching
        var dat;
        var match;
        while ( ( match = regex_line.exec( data ) ) !== null ) {

            // Read the AGRID line
            if ( line == 0 ) {

                line_map[ 'agrid' ] = file_loc + match.index;
                agrid = match[0].trim();

            }

            // Read the mesh info line
            else if ( line == 1 ) {

                line_map[ 'info_line' ] = file_loc + match.index;
                info_line = match[0].trim();

                // Get the number of elements and nodes
                dat = info_line.match( regex_nonwhite );
                num_elements = parseInt( dat[0] );
                num_nodes = parseInt( dat[1] );

                // Allocate the arrays
                node_array = new Float32Array( 3 * num_nodes );
                element_array = new Uint32Array( 3 * num_elements );

            }

            else if ( line >= 2 && line < 2 + num_nodes ) {

                if ( line == 2 ) {
                    line_map[ 'nodes' ] = file_loc + match.index;
                }

                parse_node_line( match[0] );

            }

            else if ( line >= 2 + num_nodes && line < 2 + num_nodes + num_elements ) {

                if ( line == 2 + num_nodes ) {
                    line_map[ 'elements' ] = file_loc + match.index;
                }

                parse_element_line( match[0] );

            }

            blob_loc = regex_line.lastIndex;
            line += 1;

        }


        line_part = data.slice( blob_loc );
        file_loc += blob_loc;

    }

    function parse_node_line ( str ) {

        var dat = str.match( regex_nonwhite );
        var nn = parseInt( dat[0] );
        var x = parseFloat( dat[1] );
        var y = parseFloat( dat[2] );
        var z = parseFloat( dat[3] );

        if ( x < min_x ) min_x = x;
        else if ( x > max_x ) max_x = x;
        if ( y < min_y ) min_y = y;
        else if ( y > max_y ) max_y = y;
        if ( z < min_z ) min_z = z;
        else if ( z > max_z ) max_z = z;

        var node_index = line - 2;
        node_array[ 3 * node_index ] = x;
        node_array[ 3 * node_index + 1 ] = y;
        node_array[ 3 * node_index + 2 ] = z;

        node_map[ nn ] = node_index;

    }

    function parse_element_line ( str ) {

        var dat = str.match( regex_nonwhite );
        var en = parseInt( dat[0] );
        element_array[ 3 * en ] = parseInt( dat[2] );
        element_array[ 3 * en + 1 ] = parseInt( dat[3] );
        element_array[ 3 * en + 2 ] = parseInt( dat[4] );

        element_map[ en ] = line - num_nodes - 2;

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