export function nest ( flat ) {
    var map = {};
    var num_entries = flat.length/2;
    for ( var i=0; i<num_entries; ++i ) {
        map[ flat[ 2*i ] ] = flat[ 2*i + 1 ];
    }
    return map;
}