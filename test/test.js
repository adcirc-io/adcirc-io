
var f14_picker = document.getElementById( 'f14' );

f14_picker.onchange = test_fort_14;

function test_fort_14 () {

    function start () { console.log( 'Starting...' ); }
    function progress ( p ) { console.log( p + '%' ); }
    function finish () { console.log( 'Finished!' ); }

    var f14 = adcirc.fort14()
        .on_start( start )
        .on_progress( progress )
        .on_finish( finish )
        .read( f14_picker.files[0] );

}