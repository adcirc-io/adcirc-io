import { default as file_reader } from "./file_reader"
import { default as worker } from "./worker"

function build_fortnd_worker () {

    var reader;
    var file_size;

    var agrid;
    var info_line;
    var n_dims;
    var num_datasets;
    var num_nodes;
    var ts;             // timestep in seconds
    var ts_interval;    // timestep interval (ie. written out every ts_interval timesteps)

    var timestep_map = {};
    var timesteps = [];

    self.addEventListener( 'message', function ( message ) {

        message = message.data;

        switch ( message.type ) {

            case 'n_dims':

                n_dims = message.n_dims;
                break;

            case 'read':

                map_file( message.file );
                break;

            case 'timestep':

                load_timestep( message.timestep_index );
                break;

        }

    });

    function load_timestep ( timestep_index ) {

        if ( timestep_index < num_datasets ) {

            // Get file location from mapping
            var timestep = timesteps[ timestep_index ];
            var start = timestep_map[ timestep ];
            var end = timestep_index == num_datasets - 1 ? file_size : timestep_map[ timesteps[ timestep_index + 1 ] ];

            reader.read_block(
                start,
                end,
                function ( data ) {
                    post_timestep( timestep_index, parse_timestep( data ) );
                }
            );

        }

    }

    function map_file ( file ) {

        // Store the file size for progress things
        file_size = file.size;

        post_start();

        // Create the file reader
        reader = file_reader( file )
            .error_callback( on_error );

        // Parse the file header
        reader.read_block( 0, 1024, parse_header );

    }

    function map_timesteps () {

        var header_found = false;
        var next_timestep = 0;
        var next_header = timesteps[ next_timestep ];
        var next_location = 0;

        // Start things off
        reader.read_block(
            next_location,
            next_location + 1024,
            parse_block
        );

        function parse_block ( data ) {

            var regex_line = /.*\r?\n/g;
            var regex_nonwhite = /\S+/g;
            var match;

            if ( header_found === false ) {

                while ( ( match = regex_line.exec( data ) ) !== null ) {

                    var dat = match[ 0 ].match( regex_nonwhite );

                    if ( dat.length >= 2 ) {

                        var test_ts = parseInt( dat[ 1 ] );
                        if ( test_ts == next_header ) {

                            // Set flag that allows us to continue
                            header_found = true;

                            // Store the mapped location
                            timestep_map[ next_header ] = next_location + match.index;

                            // Set the next location, which is the first node of the timestep
                            next_location = next_location + regex_line.lastIndex;

                            // Increment to the next timestep
                            next_timestep += 1;

                            // Post progress
                            post_progress( 100 * ( next_timestep / num_datasets ) );

                            // Determine if we need to continue
                            if ( next_timestep < num_datasets ) {

                                next_header = timesteps[ next_timestep ];
                                reader.read_block(
                                    next_location,
                                    next_location + 1024,
                                    parse_block
                                );

                            } else {

                                post_finish();

                            }
                        }
                    }
                }
            }

            else {

                match = regex_line.exec( data );
                next_location = next_location + num_nodes * match[0].length;

                header_found = false;

                reader.read_block(
                    next_location,
                    next_location + 1024,
                    parse_block
                );

            }
        }
    }

    function parse_header ( data ) {

        // Regexes
        var regex_line = /.*\r?\n/g;
        var regex_nonwhite = /\S+/g;

        // Get the first line
        var match = regex_line.exec( data );

        if ( match !== null ) {

            agrid = match[0];

            // Get the second line
            match = regex_line.exec( data );

            if ( match !== null ) {

                info_line = match[0];

                var info = info_line.match( regex_nonwhite );
                num_datasets = parseInt( info[0] );
                num_nodes = parseInt( info[1] );
                ts_interval = parseInt( info[3] );
                ts = parseFloat( info[2] ) / ts_interval;

                for ( var i=0; i<num_datasets; ++i ) {
                    timesteps.push( (i+1)*ts_interval );
                }

                // Map the timesteps
                map_timesteps();

            }

        }

    }

    function parse_timestep ( data ) {

        var regex_line = /.*\r?\n/g;
        var regex_nonwhite = /\S+/g;
        var ts = { array: new Float32Array( n_dims * num_nodes ) };
        var match, dat;
        var line = 0;

        while ( ( match = regex_line.exec( data ) ) !== null ) {

            if ( line == 0 ) {

                dat = match[0].match( regex_nonwhite );
                ts.model_time = parseFloat( dat[0] );
                ts.timestep = parseInt( dat[1] );

                line += 1;

            } else {

                dat = match[0].match( regex_nonwhite );

                for ( var i=0; i<n_dims; ++i ) {
                    ts.array[ line++ - 1 ] = parseFloat( dat[ 1 ] );
                }


            }

        }

        return ts;

    }

    function on_error ( error ) {

        post_error( error );

    }

    function post_timestep ( index, timestep ) {

        var message = {
            type: 'timestep',
            model_time: timestep.model_time,
            timestep: timestep.timestep,
            timestep_index: index,
            array: timestep.array.buffer
        };

        self.postMessage(
            message,
            [ message.array ]
        );

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

export function fortnd_worker () {

    var code = '';
    code += file_reader.toString();
    code += build_fortnd_worker.toString();
    code += 'build_fortnd_worker();';

    return worker( code );

}