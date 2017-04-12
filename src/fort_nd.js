import { fortnd_worker } from "./fort_nd_worker"
import { timestep } from './timestep'
import { dispatcher } from '../../adcirc-events/index'

function fortnd ( n_dims ) {

    var _file_size;
    var _num_datapoints;
    var _num_datasets;
    var _num_dimensions;
    var _model_timestep;
    var _model_timestep_interval;

    var _n_dims = n_dims;
    var _worker = fortnd_worker();
    var _fortnd = dispatcher();

    // Kick off the loading of a specific timestep. Optionally
    // pass in a callback that will be called only once when
    // the data is loaded. The 'timestep' event will also
    // be fired when the timestep has loaded
    _fortnd.timestep = function ( index, callback ) {

        if ( index >=0 && index < _num_datasets ) {

            if ( typeof callback === 'function' ) {

                _fortnd.once( 'timestep' + index, function ( event ) {

                    callback( event );

                } );

            }

            _worker.postMessage({
                type: 'timestep',
                index: index
            });

        }

        return _fortnd;
    };

    _fortnd.read = function ( file ) {
        _worker.postMessage({
            type: 'read',
            file: file,
            n_dims: n_dims
        });
        return _fortnd;
    };

    _worker.addEventListener( 'message', function ( message ) {

        message = message.data;

        switch ( message.type ) {

            case 'info':

                _file_size = message.file_size;
                _num_datapoints = message.num_datapoints;
                _num_datasets = message.num_datasets;
                _num_dimensions = message.num_dimensions;
                _model_timestep = message.model_timestep;
                _model_timestep_interval = message.model_timestep_interval;

                _fortnd.dispatch( {
                    type: 'info',
                    file_size: _file_size,
                    num_datapoints: _num_datapoints,
                    num_datasets: _num_datasets,
                    num_dimensions: _num_dimensions,
                    model_timestep: _model_timestep,
                    model_timestep_interval: _model_timestep_interval
                } );

                break;

            case 'start':

                _fortnd.dispatch( { type: 'start' } );

                break;

            case 'progress':

                _fortnd.dispatch( {
                    type: 'progress',
                    progress: message.progress
                } );

                break;

            case 'finish':

                _fortnd.dispatch( { type: 'finish' } );
                _fortnd.dispatch( { type: 'ready' } );

                break;

            case 'error':

                _fortnd.dispatch( { type: 'error', error: message.error } );
                break;

            case 'timestep':

                var _timestep = timestep( message );

                _fortnd.dispatch( {
                    type: 'timestep',
                    timestep: _timestep
                });

                _fortnd.dispatch( {
                    type: 'timestep' + _timestep.index(),
                    timestep: _timestep
                });

                break;

        }

    });

    _worker.postMessage({ type: 'n_dims', n_dims: _n_dims });

    return _fortnd;

}

export function fort63 () {
    return fortnd( 1 );
}

export function fort64() {
    return fortnd( 2 );
}

export { fortnd }