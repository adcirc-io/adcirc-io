import { default as worker } from "./worker"
import { default as read_sequential } from "./read_sequential"

export default function fort14worker () {

    var _worker = build_worker();
    var _fort14worker = {};

    _fort14worker.set_file = function ( file ) {

        _worker.postMessage({
            type: 'file_location',
            file: file
        });

    };

    return _fort14worker;

}

function setup_communicator () {

    self.addEventListener( 'message', function ( message ) {

        message = message.data;

        switch ( message.type ) {

            case 'file_location':
                console.log( message.file );
                break;

        }

    });

}

function build_worker () {

    var code = '';
    code += read_sequential.toString();
    code += setup_communicator.toString();
    code += 'setup_communicator();'

    return worker( code );

}