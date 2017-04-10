import { default as file_reader } from './file_reader'
import { default as worker } from './worker'

function build_fortnd_worker () {

    var file;
    var reader;
    var num_dims;
    var num_datasets = 0;
    var num_nodes = 0;
    var ts;
    var ts_interval;

    var timesteps = [];

    self.addEventListener( 'message', function ( message ) {

        message = message.data;

        switch ( message.type ) {

            case 'read':

                file = message.file;
                num_dims = message.n_dims;

                read();

        }

    });

    function map_file ( start_location ) {

        // var block_size = 1024*1024*5;       // Read 5MB at a time
        var block_size = 1024;
        var location = start_location;
        var test_num_reads = 0;
        var test_max_reads = 5;

        var header;
        var ts_index = 0;
        var node_index = 0;

        var regex_line = /.*\r?\n/g;
        var regex_nonwhite = /\S+/g;
        var match;

        var last_index = 0;
        var line_part = '';

        function parse_block ( data ) {

            console.log( 'read' );

            data = line_part + data;

            console.log( data.slice( 0, 40 ) );

            while ( ( match = regex_line.exec( data ) ) !== null ) {

                if ( !header ) {

                    header = match[ 0 ];
                    var dat = header.match( regex_nonwhite );
                    var model_time = parseFloat( dat[ 0 ] );
                    var ts = parseInt( dat[ 1 ] );

                    timesteps.push( location );

                    console.log( 'Timestep ' + ts + ': ' + model_time + '\tat location ' + location );

                } else {

                    node_index += 1;

                    console.log( node_index, JSON.stringify( match[0] ) );

                    if ( node_index == num_nodes ) {

                        header = null;
                        node_index = 0;

                    }

                }

                location += match[0].length;
                last_index = regex_line.lastIndex;

            }

            line_part = '' + data.slice( last_index );
            console.log( 'LINE PART: ' );
            console.log( JSON.stringify( line_part ) );
            // location += line_part.length;

            if ( test_num_reads < test_max_reads ) {

                test_num_reads += 1;
                reader.read_block( location, location + block_size, parse_block );

            } else {

            //     var i = 0;
            //     function print_next ( data ) {
            //
            //         match = regex_line.exec( data );
            //         if ( match !== null ) {
            //
            //             console.log( match[0] );
            //
            //         }
            //         if ( i < timesteps.length ) {
            //             i += 1;
            //             reader.read_block( timesteps[i], timesteps[i] + 1024, print_next );
            //         }
            //
            //     }
            //     reader.read_block( timesteps[i], timesteps[i] + 1024, print_next );
            //
            }

        }

        reader.read_block( location, location + block_size, parse_block );

    }

    function post_header_info () {

    }

    function read () {

        read_header();

    }

    function read_header () {

        reader = file_reader( file )
            .error_callback( on_error );

        reader.read_block( 0, 1024, function ( data ) {

            // Regexes
            var regex_line = /.*\r?\n/g;
            var regex_nonwhite = /\S+/g;
            var end_of_header = 0;

            // Parse the first line
            var match = regex_line.exec( data );

            if ( match !== null ) {

                end_of_header += match[0].length;

                // Parse the second line
                match = regex_line.exec( data );

                if ( match !== null ) {

                    end_of_header += match[0].length;

                    var info_line = match[0];
                    var info = info_line.match( regex_nonwhite );

                    num_datasets = parseInt( info[0] );
                    num_nodes = parseInt( info[1] );
                    ts_interval = parseInt( info[3] );
                    ts = parseFloat( info[2] ) / ts_interval;

                    console.log( 'HEADER INFO:' );
                    console.log( ' - Number of nodes: ' + num_nodes );
                    console.log( ' - Number of datasets: ' + num_datasets );
                    console.log( ' - Number of values per node: ' + num_dims );

                    map_file( end_of_header );

                }

            }

        })

    }



    function on_error ( e ) {
        console.log( e );
    }

}

export function fortnd_worker() {

    var code = '';
    code += file_reader.toString();
    code += build_fortnd_worker.toString();
    code += 'build_fortnd_worker();';

    return worker( code );

}