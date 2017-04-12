import { cache } from '../../adcirc-cache/index'
import { fortnd } from './fort_nd'
import { dispatcher } from '../../adcirc-events/index'

function fortnd_cached ( n_dims, size ) {

    var _file = fortnd( n_dims );
    var _fortnd = dispatcher();

    var _left_cache = cache()
        .size( size )
        .getter( request );
    var _right_cache = cache()
        .size( size )
        .getter( request );
    var _gl_cache = cache()
        .size( 1 )
        .cache_left( _left_cache )
        .cache_right( _right_cache );

    // Bubble events
    _file.on( 'start', _fortnd.dispatch );
    _file.on( 'progress', _fortnd.dispatch );
    _file.on( 'finish', _fortnd.dispatch );

    // Handle events
    _file.on( 'info', on_info );

    _fortnd.next_timestep = function () {

    };

    _fortnd.open = function ( file ) {

        _file.read( file );
        return _fortnd;

    };

    _fortnd.previous_timestep = function () {

    };

    _fortnd.timestep = function ( index ) {

        return _gl_cache.get( index );

    };

    return _fortnd;

    // function dispatch_data ( index, data ) {
    //
    //     _fortnd.dispatch({
    //         type: 'data',
    //         index: index,
    //         data: data.data()
    //     });
    //
    //     return [index];
    //
    // }

    function on_info ( event ) {

        _left_cache
            .max_size( event.num_datasets )
            .range([0, size])
            .once( 'ready', function () {

                console.log( 'left cache filled' );

                _gl_cache
                    .max_size( event.num_datasets )
                    .range([0, 1])
                    .once( 'ready', function () {

                        console.log( 'gl cache filled' );
                        _fortnd.dispatch( 'gl' );

                    });

            });

        _right_cache
            .max_size( event.num_datasets )
            .range([size, 2*size])
            .once( 'ready', function () {

                console.log( 'right cache filled' );

            });

        _fortnd.dispatch( event );

    }

    function request ( index, callback ) {

        _file.timestep( index, function ( event ) {

            callback( event.timestep.index(), event.timestep );

        } );

    }

}

export { fortnd_cached }