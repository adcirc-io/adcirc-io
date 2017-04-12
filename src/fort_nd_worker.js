import { default as file_reader } from './file_reader'
import { default as worker } from './worker'

function build_fortnd_worker () {

    var file;
    var file_size;
    var reader;
    var num_dims;
    var num_datasets = 0;
    var num_nodes = 0;
    var ts;
    var ts_interval;

    var timesteps = [];
    var dequeueing = false;
    var process_queue = [];
    var wait_queue = [];

    var mapping = {
        block_size: 1024*1024*10,    // Read 10MB at a time
        location: 0,
        header: null,
        ts_index: 0,
        node_index: 0,
        finished: false,
        final_check: false
    };

    self.addEventListener( 'message', function ( message ) {

        message = message.data;

        switch ( message.type ) {

            case 'read':

                file = message.file;
                num_dims = message.n_dims;
                read_header();
                break;

            case 'timestep':

                enqueue( message.index );
                if ( mapping.finished && !dequeueing ) check_queue();
                break;

        }

    });

    function check_queue () {

        var index;
        var wait = wait_queue;
        wait_queue = [];
        while ( wait.length > 0 ) {

            index = wait.shift();
            enqueue( index );

        }

        index = process_queue.shift();
        if ( index !== undefined ) {

            dequeueing = true;
            load_timestep( index );

        } else {

            dequeueing = false;

            if ( !mapping.finished ) {

                resume_mapping();

            }

        }

    }

    function enqueue ( index ) {

        if ( index < timesteps.length ) {

            process_queue.push( index );

        } else {

            wait_queue.push( index );

        }

    }

    function load_timestep ( timestep_index ) {

        var location = timesteps[ timestep_index ];
        var block_size = 1024 * 1024 * 5;   // Read 5MB at a time
        var regex_line = /.*\r?\n/g;
        var regex_nonwhite = /\S+/g;
        var ts = {
            array: new Float32Array( num_dims * num_nodes ),
            index: timestep_index,
            min: ( new Array( num_dims ) ).fill( Infinity ),
            max: ( new Array( num_dims ) ).fill( -Infinity )
        };
        var match, dat, val;
        var header;
        var line = 0;

        function parse_block ( data ) {

            while ( ( match = regex_line.exec( data ) ) !== null && line < num_nodes ) {

                if ( !header ) {

                    header = match[0].match( regex_nonwhite );
                    ts.model_time = parseFloat( header[0] );
                    ts.timestep = parseInt( header[1] );

                } else {

                    dat = match[0].match( regex_nonwhite );

                    for ( var i=0; i<num_dims; ++i ) {

                        val = parseFloat( dat[1] );
                        ts.array[ line++ ] = val;

                        if ( val !== -99999 ) {
                            if ( val < ts.min[ i ] ) ts.min[ i ] = val;
                            else if ( val > ts.max[ i ] ) ts.max[ i ] = val;
                        }

                    }

                }

                location += match[0].length;

            }

            if ( line < num_nodes ) {

                reader.read_block( location, location + block_size, parse_block );

            } else {

                post_timestep( ts );
                check_queue();

            }

        }

        reader.read_block( location, location + block_size, parse_block );

    }

    function read_header () {

        post_start();

        file_size = file.size;

        reader = file_reader( file )
            .error_callback( post_error );

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

                    post_info();

                    mapping.location = end_of_header;
                    resume_mapping();

                }

            }

        });

    }

    function resume_mapping () {

        var regex_line = /.*\r?\n/g;
        var match;

        function parse_block ( data ) {

            while ( ( match = regex_line.exec( data ) ) !== null ) {

                if ( !mapping.header ) {

                    mapping.header = match[ 0 ];

                    timesteps[ mapping.ts_index++ ] = mapping.location;
                    post_progress( 100 * ( mapping.ts_index / num_datasets ) );


                } else {

                    mapping.node_index += 1;

                    if ( mapping.node_index == num_nodes ) {

                        mapping.header = null;
                        mapping.node_index = 0;

                    }

                }

                mapping.location += match[0].length;

            }

            if ( mapping.ts_index < num_datasets ) {

                check_queue();

            } else {

                mapping.finished = true;
                post_finish();

                if ( !mapping.final_check ) {

                    mapping.final_check = true;
                    check_queue();

                }

            }


        }

        reader.read_block( mapping.location, mapping.location + mapping.block_size, parse_block );

    }


    function post_error ( error ) {

        self.postMessage({
            type: 'error',
            error: error.message
        });

    }

    function post_finish () {

        self.postMessage({
            type: 'finish'
        });

    }

    function post_info () {

        self.postMessage({
            type: 'info',
            file_size: file_size,
            num_datapoints: num_nodes,
            num_datasets: num_datasets,
            num_dimensions: num_dims,
            model_timestep: ts,
            model_timestep_interval: ts_interval
        });

    }

    function post_progress ( percent ) {

        self.postMessage({
            type: 'progress',
            progress: percent
        });

    }

    function post_start () {

        self.postMessage({
            type: 'start'
        });

    }

    function post_timestep ( timestep ) {

        var ranges = [];
        for ( var i=0; i<num_dims; ++i ) {
            ranges.push( [ timestep.min[i], timestep.max[i] ] );
        }

        var message = {
            type: 'timestep',
            data_range: ranges,
            dimensions: num_dims,
            index: timestep.index,
            model_time: timestep.model_time,
            model_timestep: timestep.timestep,
            array: timestep.array.buffer
        };

        self.postMessage(
            message,
            [ message.array ]
        );

    }

}

export function fortnd_worker() {

    var code = '';
    code += file_reader.toString();
    code += build_fortnd_worker.toString();
    code += 'build_fortnd_worker();';

    return worker( code );

}