import { default as worker } from './fort14worker'

export default function ( _file_location ) {

    var _file_location = _file_location;
    var _worker = worker();

    _worker.set_file( _file_location );

    function fort14 () {

    }

    return fort14;

}

