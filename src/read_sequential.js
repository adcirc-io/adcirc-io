export default function read_sequential ( file, blob_callback, finished_callback, continue_callback, error_callback ) {

    var reader = new FileReader();
    var file_size = file.size;
    var chunk_size = 256 * 1024;
    var offset = 0;
    var last = '';

    // Create fallback callbacks
    blob_callback = blob_callback || function () {};
    finished_callback = finished_callback || function () {};
    continue_callback = continue_callback || function () { return true; };
    error_callback = error_callback || function () {};

    // Start reading
    read_block( offset, chunk_size, file );

    // Define functions needed to perform sequential reading
    function read_block ( start_index, block_size, f ) {

        var blob = f.slice( start_index, start_index + block_size );
        reader.onload = parse_block;
        reader.readAsText( blob );

    }

    function parse_block ( block ) {

        if ( block.target.error !== null ) {
            error_callback( block.target.error );
            throw block.target.error;
        }

        var length = block.target.result.length;
        var newline = /\n/;

        var data = block.target.result.split( newline );
        data[0] = last + data[0];
        last = data.pop();

        // Calculate offset for next read
        offset += length;

        // Determine if there will be another read
        if ( offset >= file_size ) {

            // There won't so pass all of the data to the parsing callback
            data.push( last );
            blob_callback( data );

            // Now we're finished
            finished_callback();

        } else {

            // There will, so pass the data to the parsing callback
            blob_callback( data );

            // Check that we should still continue
            if ( continue_callback() ) {

                // We should, so read the next block
                read_block( offset, chunk_size, file );

            } else {

                // We shouldn't, so we're finished
                finished_callback();

            }

        }

    }

}