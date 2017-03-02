
var f14_picker = document.getElementById( 'f14' );
var f63_picker = document.getElementById( 'f63' );
var f64_picker = document.getElementById( 'f64' );

var progress_bar = document.getElementById( 'progress' );
var progress_text = document.getElementById( 'percent' );

f14_picker.onchange = test_fort_14;
f63_picker.onchange = test_fort_63;
f64_picker.onchange = test_fort_64;

function test_fort_14 () {

    var f14 = adcirc.fort14()
        .on_start( start, true )
        .on_progress( progress, true )
        .on_finish( finish, true )
        .nodes( function ( nodes ) { console.log( nodes.array.length/3 + ' nodes' ); } )
        .elements( function ( elements ) { console.log( elements.array.length/3 + ' elements' ); } )
        .read( f14_picker.files[0] );

}

function test_fort_63 () {

    var f63 = adcirc.fort63()
        .on_start( start, true )
        .on_progress( progress, true )
        .on_finish( finish, true )
        .on_timestep( print_timestep_info, true )
        .on_finish( function () {
            f63.timestep( 0 );
        })
        .read( f63_picker.files[0] );

}

function test_fort_64 () {

    var f64 = adcirc.fort64()
        .on_start( start, true )
        .on_progress( progress, true )
        .on_finish( finish, true )
        .on_timestep( print_timestep_info, true )
        .on_finish( function () {
            f64.timestep( 0 );
        })
        .read( f64_picker.files[0] );

}

function start () {
    progress_bar.style.width = 0;
    progress_text.innerHTML = '0%';
}
function progress ( p ) {
    progress_bar.style.width = p.toFixed(1) + '%';
    progress_text.innerHTML = p.toFixed(1) + '%';
}
function finish () {
    progress_bar.style.width = '100%';
    progress_text.innerHTML = '100%';
}

function print_timestep_info ( ts ) {

    console.log( 'Model time: ' + ts.model_time() );
    console.log( 'Model timestep: ' + ts.model_timestep() );
    console.log( 'Timestep index: ' + ts.model_timestep_index() );
    console.log( 'Number of data points: ' + ts.data().length / ts.dimensions() );

}