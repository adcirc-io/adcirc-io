import { default as file_reader } from "./file_reader"
import { default as worker } from "./worker"

function build_fort14_worker () {

    var reader;
    var file_size;

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

    var nope;
    var neta;
    var nbou;
    var nvel;
    var elev_segments = [];
    var flow_segments = [];
    var segment_length = -1;
    var segment;

    var progress = 0;
    var progress_interval = 2;
    var next_progress = progress + progress_interval;

    self.addEventListener( 'message', function ( message ) {

        message = message.data;

        switch ( message.type ) {

            case 'read':

                file_size = message.file.size;

                post_start();

                reader = file_reader( message.file )
                    .block_callback( parse_data )
                    .finished_callback( done )
                    .error_callback( on_error )
                    .read();

                break;

            // case 'test_map':
            //
            //     console.log( 'starting test' );
            //     reader.read_block( 926747, 926847, function ( d ) {
            //         console.log( d.target.result );
            //     });
            //
            //     break;

        }

    });

    function done () {

        parse_data( '\n' );
        post_finish();

    }

    function on_error ( error ) {

        post_error( error );

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

            // Progress stuff
            if ( 100 * ( file_loc + match.index ) / file_size > next_progress ) {

                post_progress( next_progress );
                next_progress += progress_interval;

            }

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

            else if ( nope === undefined ) {

                line_map[ 'nope' ] = file_loc + match.index;

                dat = match[0].match( regex_nonwhite );
                nope = parseInt( dat[0] );

            }

            else if ( neta === undefined ) {

                line_map[ 'neta' ] = file_loc + match.index;

                dat = match[0].match( regex_nonwhite );
                neta = parseInt( dat[0] );

            }

            else if ( elev_segments.length == nope && nbou === undefined ) {

                line_map[ 'nbou' ] = file_loc + match.index;

                dat = match[0].match( regex_nonwhite );
                nbou = parseInt( dat[0] );

            }

            else if ( elev_segments.length == nope && nvel === undefined ) {

                line_map[ 'nvel' ] = file_loc + match.index;

                dat = match[0].match( regex_nonwhite );
                nvel = parseInt( dat[0] );

            }

            else if ( segment_length == -1 && ( elev_segments.length < nope || flow_segments.length < nbou ) ) {

                dat = match[0].match( regex_nonwhite );
                segment_length = parseInt( dat[0] );
                segment = [];

            }

            else if ( segment.length < segment_length ) {

                dat = match[0].match( regex_nonwhite );
                segment.push( parseInt( dat[0] ) );

                if ( segment.length == segment_length ) {

                    if ( elev_segments.length < nope ) {

                        elev_segments.push( segment );

                    }

                    else if ( flow_segments.length < nbou ) {

                        flow_segments.push( segment );

                    }

                    segment_length = -1;
                    segment = [];

                }

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

    function post_error ( error ) {
        self.postMessage({
            type: 'error',
            error: error.message
        });
    }

}

export default function fort14_worker_builder () {

    var code = '';
    code += file_reader.toString();
    code += build_fort14_worker.toString();
    code += 'build_fort14_worker();';

    return worker( code );

}