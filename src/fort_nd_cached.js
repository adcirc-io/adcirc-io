import { cache } from '../../adcirc-cache/index'
import { fortnd } from './fort_nd'
import { dispatcher } from '../../adcirc-events/index'

function fortnd_cached ( n_dims, size ) {

    var _file = fortnd( n_dims );
    var _fortnd = dispatcher();

    var _left_cache = cache()
        .size( size );
    var _right_cache = cache()
        .size( size );
    var _gl_cache = cache()
        .size( 1 )
        .cache_left( _left_cache )
        .cache_right( _right_cache )
        .transform( dispatch_data );

    // Bubble events
    _file.on( 'start', _fortnd.dispatch );
    _file.on( 'progress', _fortnd.dispatch );
    _file.on( 'finish', _fortnd.dispatch );

    // Handle events
    _file.on( 'info', on_info );

    _fortnd.open = function ( file ) {

        _file.read( file );
        return _fortnd;

    };

    return _fortnd;

    function dispatch_data ( index, data ) {

        _fortnd.dispatch({
            type: 'data',
            index: index,
            data: data.data()
        });

        return [index];

    }

    function on_info ( event ) {

        _gl_cache.max_size( event.num_datasets );
        _left_cache.max_size( event.num_datasets );
        _right_cache.max_size( event.num_datasets );

        _fortnd.dispatch( event );

    }

}