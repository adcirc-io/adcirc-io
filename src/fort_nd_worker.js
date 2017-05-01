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

    var nodal_timeseries = { seconds: [], timestep: [] };
    var mints = [];
    var maxts = [];

    self.addEventListener( 'message', function ( message ) {

        message = message.data;

        switch ( message.type ) {

            case 'read':

                file = message.file;
                num_dims = message.n_dims;

                enqueue( { type: 'prep_timeseries' } );

                read_header();
                break;

            case 'timeseries':

                enqueue( { type: 'timeseries', node_number: message.node_number } );
                if ( mapping.finished && !dequeueing ) check_queue();
                break;

            case 'timestep':

                enqueue( { type: 'timestep', index: message.index } );
                if ( mapping.finished && !dequeueing ) check_queue();
                break;

        }

    });

    function check_queue () {

        var task;
        var wait = wait_queue;
        wait_queue = [];
        while ( wait.length > 0 ) {

            task = wait.shift();
            enqueue( task );

        }

        task = process_queue.shift();

        if ( task !== undefined ) {

            dequeueing = true;

            if ( task.type === 'timestep' ) {

                load_timestep( task.index );

            }

            else if ( task.type === 'timeseries' ) {

                load_timeseries( task.node_number );

            }

            else if ( task.type === 'prep_timeseries' ) {

                load_all_timeseries();

            }

        } else {

            dequeueing = false;

            if ( !mapping.finished ) {

                resume_mapping();

            }

        }

    }

    function enqueue ( task ) {

        if ( task.type === 'timestep' ) {

            if ( task.index < timesteps.length ) {

                process_queue.push( task );

            } else {

                wait_queue.push( task );

            }

        }

        else if ( task.type === 'timeseries' || task.type === 'prep_timeseries' ) {

            if ( mapping.finished ) {

                process_queue.push( task );

            } else {

                wait_queue.push( task );

            }

        }

    }

    function load_all_timeseries () {

        post_start( 'timeseries_prep' );

        var newline_regex = /\r?\n/g;
        var nonwhite_regex = /\S+/g;

        var reader = new FileReaderSync();
        var data = reader.readAsText( file );
        var lines = data.split( newline_regex );

        // Get info about the data
        var infoline = lines[1].match( nonwhite_regex );
        var num_nodes = parseInt( infoline[1] );
        var num_ts = parseInt( infoline[0] );

        // Create empty lists
        for ( var node=0; node<num_nodes; ++node ) {

            nodal_timeseries[ (node+1).toString() ] = [];

        }

        // Read data
        for ( var ts=0; ts<num_ts; ++ts ) {

            var start_line = 2 + ts * ( num_nodes + 1 );
            var start_line_dat = lines[ start_line ].match( nonwhite_regex );

            nodal_timeseries.seconds.push( parseFloat( start_line_dat[ 0 ] ) );
            nodal_timeseries.timestep.push( parseInt( start_line_dat[ 1 ] ) );

            var currmin = Infinity;
            var currmax = -Infinity;

            post_progress( 100 * ts / num_datasets, 'timeseries_prep' );

            for ( node = 1; node < num_nodes + 1; ++node ) {

                var dat = parseFloat( lines[ start_line + node ].match( nonwhite_regex )[ 1 ] );
                if ( dat != -99999 ) {

                    if ( dat > currmax ) currmax = dat;
                    if ( dat < currmin ) currmin = dat;

                }

                nodal_timeseries[ node.toString() ].push( dat );

            }

            if ( currmax != Infinity ) {
                maxts.push( currmax );
            } else {
                maxts.push( null );
            }

            if ( currmin != Infinity ) {
                mints.push( currmin );
            } else {
                mints.push( null );
            }

        }

        post_finish( 'timeseries_prep' );

        check_queue();

    }

    function load_timeseries ( node_number ) {

        var timeseries = {
            array: new Float32Array( nodal_timeseries[ node_number ] ),
            node_number: node_number,
            min: [ mints[ node_number-1 ] ],
            max: [ maxts[ node_number-1 ] ]
        };

        post_timeseries( timeseries );
        check_queue();

    }

    function load_timeseries_async ( node_number ) {

        var ts = 0;
        var location = timesteps[ ts ];
        var block_size = 1024 * 1024 * 5;

        var timeseries = {
            array: new Float32Array( num_dims * num_datasets ),
            node_number: node_number,
            min: ( new Array( num_dims ) ).fill( Infinity ),
            max: ( new Array( num_dims ) ).fill( -Infinity )
        };

        var match, dat, val;
        var header;
        var val_index = 0;
        var found = false;

        function parse_block ( data ) {

            var regex_line = /.*\r?\n/g;
            var regex_nonwhite = /\S+/g;

            while ( ( match = regex_line.exec( data ) ) !== null && val_index < num_dims * num_datasets ) {

                if ( !header ) {

                    header = match[0];

                } else {

                    dat = match[0].match( regex_nonwhite );
                    val = parseInt( dat[0] );

                    if ( val == node_number ) {

                        found = true;

                        for ( var i=0; i<num_dims; ++i ) {

                            val = parseFloat( dat[1+i] );
                            timeseries.array[ val_index++ ] = val;

                            if ( val !== -99999 ) {
                                if ( val < timeseries.min[ i ] ) timeseries.min[ i ] = val;
                                else if ( val > timeseries.max[ i ] ) timeseries.max[ i ] = val;
                            }

                        }

                        header = null;
                        ts += 1;

                        if ( ts < num_datasets ) {

                            location = timesteps[ ts ];
                            break;

                        } else {

                            post_timeseries( timeseries );
                            check_queue();

                        }

                    } else {

                        found = false;

                    }

                }

            }

            if ( !found ) {

                location += block_size;

            }

            if ( val_index < num_datasets*num_dims ) {

                reader.read_block( location, location + block_size, parse_block );

            }

        }

        reader.read_block( location, location + block_size, parse_block );

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
                    post_progress( 100 * ( mapping.ts_index / num_datasets ), 'map_timesteps' );


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
                post_finish( 'map_timesteps' );

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

    function post_finish ( task ) {

        var message = {
            type: 'finish'
        };

        if ( task ) message.task = task;

        self.postMessage( message );

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

    function post_progress ( percent, task ) {

        var event = {
            type: 'progress',
            progress: percent
        };

        if ( task ) event.task = task;

        self.postMessage( event );

    }

    function post_start ( task ) {

        var message = {
            type: 'start'
        };

        if ( task ) message.task = task;

        self.postMessage( message );

    }

    function post_timeseries ( timeseries ) {

        var ranges = [];
        for ( var i=0; i<num_dims; ++i ) {
            ranges.push( [ timeseries.min[i], timeseries.max[i] ] );
        }

        var message = {
            type: 'timeseries',
            data_range: ranges,
            dimensions: num_dims,
            node_number: timeseries.node_number,
            array: timeseries.array.buffer
        };

        self.postMessage(
            message,
            [ message.array ]
        );

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
            num_datasets: num_datasets,
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