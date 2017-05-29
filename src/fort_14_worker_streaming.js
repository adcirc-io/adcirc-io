import { default as file_reader } from './file_reader'
import { default as worker } from './worker'

function build_fort14_worker_streaming () {

    var newline_regex = /\r?\n/g;
    var nonwhite_regex = /\S+/g;

    self.addEventListener( 'message', function ( message ) {

        message = message.data;

        switch ( message.type ) {

            case 'read':

                var reader = new FileReaderSync();
                var data = reader.readAsText( message.file );
                var lines = data.split( newline_regex );

                parse_data( lines );

        }

    });

    function parse_data ( data ) {

        var headerline = data[0];
        var infoline = data[1];
        var info = infoline.match( nonwhite_regex );

        var num_elements = parseInt( info[0] );
        var num_nodes = parseInt( info[1] );

        // run_test( num_nodes, data, 1 );
        // run_test( num_nodes, data, 2 );
        // run_test( num_nodes, data, 4 );
        run_test( num_nodes, data, 5000 );
        run_test( num_nodes, data, 5000 );

    }

    function run_test ( num_nodes, data, stream_size ) {

        self.postMessage({
            type: 'start',
            stream_size: stream_size
        });

        var count = 0;
        var d = [];

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

            }

        }

        self.postMessage({
            type: 'finish'
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