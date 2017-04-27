
function timestep ( message ) {

    var _timestep = {};

    var _array;
    var _data_range;
    var _dimensions;
    var _index;
    var _model_time;
    var _model_timestep;
    var _num_datasets;

    if ( message.hasOwnProperty( 'data_range' ) && message.hasOwnProperty( 'dimensions' ) &&
         message.hasOwnProperty( 'model_time' ) && message.hasOwnProperty( 'model_timestep' ) &&
         message.hasOwnProperty( 'index' ) && message.hasOwnProperty( 'array' ) ) {

        try {

            _data_range = message.data_range;
            _dimensions = message.dimensions;
            _index = message.index;
            _model_time = message.model_time;
            _model_timestep = message.model_timestep;
            _num_datasets = message.num_datasets;
            _array = new Float32Array( message.array );

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

        return _array;

    };

    _timestep.data_range = function () {
        return _data_range;
    };

    _timestep.dimensions = function () {
        return _dimensions;
    };

    _timestep.index = function ( _ ) {
        if ( !arguments.length ) return _index;
        _index = _;
        return _timestep;
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

    _timestep.num_datasets = function ( _ ) {
        if ( !arguments.length ) return _num_datasets;
        _num_datasets = _;
        return _timestep;
    };

    return _timestep;

}

export { timestep }
