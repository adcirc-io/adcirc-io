import { cache } from '../../adcirc-cache/index'
import { fortnd } from './fort_nd'
import { dispatcher } from '../../adcirc-events/index'

function fortnd_cached ( n_dims, size ) {

    var _current_timestep;
    var _max_timestep;

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

        if ( _current_timestep !== undefined ) {

            if ( _current_timestep + 1 < _max_timestep ) {
                get_timestep( _current_timestep + 1 );
            }

        }

    };

    _fortnd.open = function ( file ) {

        _file.read( file );
        return _fortnd;

    };

    _fortnd.previous_timestep = function () {

        if ( _current_timestep !== undefined ) {

            if ( _current_timestep - 1 >= 0 ) {
                get_timestep( _current_timestep - 1 );
            }

        }

    };

    _fortnd.timestep = function ( index ) {

        return _gl_cache.get( index );

    };

    return _fortnd;


    function dispatch_timestep ( timestep ) {

        _fortnd.dispatch({
            type: 'timestep',
            timestep: timestep
        });

    }

    function get_timestep ( index ) {

        var timestep = _gl_cache.get( index );
        if ( timestep !== undefined ) {

            _current_timestep = timestep.index();
            dispatch_timestep( timestep );

        }

    }


    function on_info ( event ) {

        _max_timestep = event.num_datasets;

        _left_cache
            .once( 'ready', function () {
                _gl_cache
                    .once( 'ready', function ( event ) {

                        get_timestep( 0 );
                        _fortnd.dispatch( event );

                    })
                    .max_size( event.num_datasets )
                    .range([0, 1])
            })
            .max_size( event.num_datasets )
            .range([0, size]);

        _right_cache
            .max_size( event.num_datasets )
            .range([size, 2*size]);

        _fortnd.dispatch( event );

    }

    function request ( index, callback ) {

        _file.timestep( index, function ( event ) {

            callback( event.timestep.index(), event.timestep );

        } );

    }

}

export function fort63_cached ( size ) {
    return fortnd_cached( 1, size );
}

export function fort64_cached ( size ) {
    return fortnd_cached( 2, size );
}