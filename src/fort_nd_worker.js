import { default as file_reader } from "./file_reader"
import { default as worker } from "./worker"

function build_fortnd_worker () {

    var reading = false;
    var queue = [];

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

                queue.push( function () {
                    load_timestep( message.index );
                });
                if ( !reading )
                    check_queue();

                break;

        }

    });

    function check_queue () {

        var cb = queue.shift();
        if ( cb ) {
            reading = true;
            cb();
        } else {
            reading = false;
        }

    }

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
                    check_queue();
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

    function map_timesteps ( start_location ) {

        var index = 0;
        var timestep = timesteps[ index ];
        var location = start_location;

        var header_found = false;
        var header_predicted = false;
        var line_part = '';

        var chunk_size = 65536;

        reader.read_block(
            location,
            location + chunk_size,
            parse_block
        );

        function parse_block( data ) {

            data = line_part + data;

            // Regexes
            var regex_line = /.*\r?\n/g;
            var regex_nonwhite = /\S+/g;
            var match;

            var last_index = 0;
            var last_node = 1;

            while( ( match = regex_line.exec( data ) ) !== null ) {

                var dat = match[0].match( regex_nonwhite );

                if ( dat && dat.length >= 2 ) {

                    if ( !header_found ) {

                        if ( parseFloat( dat[ 1 ] ) == timestep ) {

                            header_found = true;
                            timestep_map[ timestep ] = location - line_part.length + match.index;
                            post_progress( 100 * ( index / num_datasets ) );

                        } else {

                            last_node = parseInt( dat[ 0 ] );

                        }

                    }

                    else {

                        var jump_size = match[ 0 ].length * num_nodes;
                        location = location - line_part.length + match.index + jump_size;
                        index += 1;
                        timestep = timesteps[ index ];
                        header_predicted = true;
                        header_found = false;
                        break;

                    }

                }

                last_index = regex_line.lastIndex;

            }

            line_part = '';

            if ( !header_predicted ) {

                if ( last_node < num_nodes / 2 ) {

                    location = location - chunk_size;
                    line_part = '';


                } else {

                    location = location + chunk_size;
                    line_part = data.slice( last_index );

                }

            } else {

                header_predicted = false;

            }

            if ( index < num_datasets ) {

                reader.read_block(
                    location,
                    location + chunk_size,
                    parse_block
                );

            } else {

                post_finish();

            }

        }

    }

    function parse_header ( data ) {

        // Regexes
        var regex_line = /.*\r?\n/g;
        var regex_nonwhite = /\S+/g;
        var end_of_header = 0;

        // Get the first line
        var match = regex_line.exec( data );

        if ( match !== null ) {

            agrid = match[0];
            end_of_header += match[0].length;

            // Get the second line
            match = regex_line.exec( data );

            if ( match !== null ) {

                info_line = match[0];
                end_of_header += match[0].length;

                var info = info_line.match( regex_nonwhite );
                num_datasets = parseInt( info[0] );
                num_nodes = parseInt( info[1] );
                ts_interval = parseInt( info[3] );
                ts = parseFloat( info[2] ) / ts_interval;

                for ( var i=0; i<num_datasets; ++i ) {
                    timesteps.push( (i+1)*ts_interval );
                }

                // Post info about the timeseries data
                post_info();

                // Map the timesteps
                map_timesteps( end_of_header );

            }

        }

    }

    function parse_timestep ( data ) {

        var regex_line = /.*\r?\n/g;
        var regex_nonwhite = /\S+/g;
        var ts = {
            array: new Float32Array( n_dims * num_nodes ),
            min: ( new Array( n_dims ) ).fill( Infinity ),
            max: ( new Array( n_dims ) ).fill( -Infinity )
        };
        var match, dat, val;
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

                    val = parseFloat( dat[ 1 ] );
                    ts.array[ line++ - 1 ] = val;

                    if ( val !== -99999 ) {
                        if ( val < ts.min[ i ] ) ts.min[ i ] = val;
                        else if ( val > ts.max[ i ] ) ts.max[ i ] = val;
                    }

                }


            }

        }

        return ts;

    }

    function on_error ( error ) {

        post_error( error );

    }

    function post_info () {
        self.postMessage({
            type: 'info',
            file_size: file_size,                   // File size
            num_datapoints: num_nodes,              // Number of data points per timestep
            num_datasets: num_datasets,             // Number of complete datasets
            num_dimensions: n_dims,                 // Number of data fields per data point
            model_timestep: ts,                     // Number of timesteps
            model_timestep_interval: ts_interval    // Output interval for timesteps
        });
    }

    function post_timestep ( index, timestep ) {

        var ranges = [];
        for ( var i=0; i<n_dims; ++i ) {
            ranges.push( [ timestep.min[i], timestep.max[i] ] );
        }

        var message = {
            type: 'timestep',
            data_range: ranges,
            dimensions: n_dims,
            index: index,
            model_time: timestep.model_time,
            model_timestep: timestep.timestep,
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