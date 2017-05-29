export default function file_reader ( file ) {

    var _file = file;
    var _file_size = file.size;
    var _reader = new FileReader();
    var _block_size = 4*256*256;    // ~1MB
    var _offset = 0;

    var _block_callback = function () {};
    var _continue_callback = function () { return true; };
    var _finished_callback = function () {};
    var _error_callback = function () {};

    var _r = function ( file ) {

        _file = file;
        _file_size = file.size;

    };

    _r.read = function () {
        read_block( _offset, _block_size, file );
        return _r;
    };

    _r.read_block = function ( start, end, cb ) {

        var block = _file.slice( start, end );
        _reader.onload = function ( dat ) {

            if ( dat.target.error !== null ) {
                _error_callback( dat.target.error );
                throw dat.target.error;
            }

            cb( dat.target.result );

        };
        _reader.readAsText( block );

    };

    _r.block_size = function ( _ ) {
        if ( !arguments.length ) return _block_size;
        _block_size = _;
        return _r;
    };

    _r.offset = function ( _ ) {
        if ( !arguments.length ) return _offset;
        _offset = _;
        return _r;
    };

    _r.block_callback = function ( _ ) {
        if ( !arguments.length ) return _block_callback;
        if ( typeof _ === 'function' ) _block_callback = _;
        return _r;
    };

    _r.continue_callback = function ( _ ) {
        if ( !arguments.length ) return _continue_callback;
        if ( typeof _ === 'function' ) _continue_callback = _;
        return _r;
    };

    _r.finished_callback = function ( _ ) {
        if ( !arguments.length ) return _finished_callback;
        if ( typeof _ === 'function' ) _finished_callback = _;
        return _r;
    };

    _r.error_callback = function ( _ ) {
        if ( !arguments.length ) return _error_callback;
        if ( typeof _ === 'function' ) _error_callback = _;
        return _r;
    };

    function read_block ( start_index, block_size, f ) {

        var block = f.slice( start_index, start_index + block_size );
        _reader.onload = parse_block;
        _reader.readAsText( block );

    }

    function parse_block ( block ) {

        if ( block.target.error !== null ) {
            _error_callback( block.target.error );
            throw block.target.error;
        }

        // Get the data
        var data = block.target.result;

        // Calculate offset for next read
        _offset += data.length;

        // Determine if there will be another read
        if ( _offset >= _file_size ) {

            // There won't so pass all of the data to the parsing callback
            _block_callback( data );

            // Now we're finished
            _finished_callback();

        } else {

            // There will, so pass the data to the parsing callback
            _block_callback( data );

            // Check that we should still continue
            if ( _continue_callback() ) {

                // We should, so read the next block
                read_block( _offset, _block_size, file );

            } else {

                // We shouldn't, so we're finished
                _finished_callback();

            }

        }

    }

    return _r;

}