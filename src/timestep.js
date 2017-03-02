
function timestep ( dimensions, worker, message ) {

    var _timestep = {};
    var _dimensions = dimensions;
    var _worker = worker;

    var _array;
    var _model_time;
    var _model_timestep;
    var _model_timestep_index;

    var _invalidated;

    if ( message.hasOwnProperty( 'model_time' ) && message.hasOwnProperty( 'model_timestep' ) &&
         message.hasOwnProperty( 'model_timestep_index' ) && message.hasOwnProperty( 'array' ) ) {

        try {

            _model_time = message.model_time;
            _model_timestep = message.model_timestep;
            _model_timestep_index = message.model_timestep_index;
            _array = new Float32Array( message.array );
            _invalidated = false;

        } catch ( e ) {

            console.error( 'Error building timestep' );
            console.error( e.message );
            throw( e );

        }

    } else {

        console.error( 'Timestep is missing data' );
        console.error( message );

    }


    _timestep.data = function () {

        if ( !_invalidated ) return _array;
        console.warn(
            'Data for timestep ' + _model_timestep_index + 'has already been returned to worker for caching'
        );

    };

    _timestep.dimensions = function () {
        return _dimensions;
    };

    _timestep.finished = function () {

        var message = {
            type: 'return',
            model_time: _model_time,
            model_timestep: _model_timestep,
            model_timestep_index: _model_timestep_index,
            array: _array.buffer
        };

        _worker.postMessage(
            message,
            [ message.array ]
        );

        _invalidated = true;

    };

    _timestep.model_time = function ( _ ) {
        if ( !arguments.length ) return _model_time;
        _model_time = _;
        return _timestep;
    };

    _timestep.model_timestep = function ( _ ) {
        if ( !arguments.length ) return _model_timestep;
        _model_timestep = _;
        return _timestep;
    };

    _timestep.model_timestep_index = function ( _ ) {
        if ( !arguments.length ) return _model_timestep_index;
        _model_timestep_index = _;
        return _timestep;
    };

    return _timestep;

}

export { timestep }
