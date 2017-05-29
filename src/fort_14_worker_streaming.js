import { default as file_reader } from './file_reader'
import { default as worker } from './worker'

function build_fort14_worker_streaming () {

    var newline_regex = /\r?\n/g;
    var nonwhite_regex = /\S+/g;

    self.addEventListener( 'message', function ( message ) {

        message = message.data;

        switch ( message.type ) {

            case 'read':

                // var reader = new FileReaderSync();
                // var data = reader.readAsText( message.file );
                // var lines = data.split( newline_regex );
                //
                // parse_data( lines );

                stream_file( message.file );

        }

    });


    function stream_file ( file ) {

        var reader = new FileReader();
        var one_mb = 16*256*256;
        var block_size = 2 * one_mb;
        var offset = 0;
        var file_size = file.size;

        function read_block ( start, size, f ) {

            var block = f.slice( start, start + size );
            reader.readAsText( block );

        }

        function prepare_block ( data ) {

            // Calculate offset for next read
            offset += data.length;

            // Parse the data
            parse_streaming_data( data );

            // Determine if there will be another read
            if ( offset >= file_size ) {

                // There won't, so call the finished callback
                post_finished( 'Finished reading file' );

            } else {

                // post_progress( 100 * ( offset / file_size ) );

                // There will, read the next block
                read_block( offset, offset + block_size, file );

            }

        }

        reader.onload = function ( dat ) {

            if ( dat.target.error !== null ) {
                post_error( dat.target.error );
                throw dat.target.error;
            }

            prepare_block( dat.target.result );

        };

        post_start();
        read_block( offset, offset + block_size, file );

    }

    var line = 0;
    var next_percent = 0;
    var num_nodes, num_elements;
    var nodes = [],
        elements = [];

    function parse_streaming_data ( data ) {


        // Match line by line
        var match, index = 0;
        while ( ( match = newline_regex.exec( data ) ) !== null ) {

            var dat = data.slice( index, match.index ).match( nonwhite_regex );

            if ( line === 1 ) {

                num_elements = parseInt( dat[0] );
                num_nodes = parseInt( dat[1] );

            }

            else if ( line > 1 ) {

                if ( nodes.length < num_nodes ) {

                    nodes.push( [
                        parseFloat( dat[1] ),
                        parseFloat( dat[2] ),
                        parseFloat( dat[3] )
                    ]);

                }

                else if ( elements.length < num_elements ) {

                    elements.push( [
                        parseInt( dat[2] ),
                        parseInt( dat[3] ),
                        parseInt( dat[4] )
                    ]);

                }

                var progress = 100 * ( line / ( num_nodes + num_elements ) );
                if ( progress > next_percent ) {
                    post_progress( progress );
                    next_percent += 1;
                }

            }

            index = match.index;
            line += 1;

        }


    }

    function parse_data ( data ) {

        var headerline = data[0];
        var infoline = data[1];
        var info = infoline.match( nonwhite_regex );

        var num_elements = parseInt( info[0] );
        var num_nodes = parseInt( info[1] );

        run_test( num_nodes, data, 1000 );

    }

    function run_test ( num_nodes, data, stream_size ) {

        var count = 0;
        var next_percent = 1;
        var d = [];

        post_start();

        for ( var i=0; i<num_nodes; ++i ) {

            var dat = data[2+i].match( nonwhite_regex );
            d.push( [ parseFloat( dat[1] ), parseFloat( dat[2] ), parseFloat( dat[3] ) ] );
            count += 1;

            if ( count === stream_size || i === num_nodes - 1 ) {

                self.postMessage({
                    type: 'nodes',
                    data: d
                });

                d = [];
                count = 0;

            }

            var progress = 100 * ( i / num_nodes );
            if ( progress > next_percent ) {
                post_progress( progress );
                next_percent += 1;
            }

        }

        post_finished( 'Stream size ' + stream_size + ':\t' );

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

    function post_error ( event ) {

        self.postMessage({
            type: 'error',
            error: event.target.error
        });

    }

    function post_finished ( message ) {

        self.postMessage({
            type: 'finished',
            message: message
        });

    }

}



export function fort14_worker_streaming () {

    var code = '';
    code += file_reader.toString();
    code += build_fort14_worker_streaming.toString();
    code += 'build_fort14_worker_streaming();';

    return worker( code );

}