
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
        .on( 'start', start )
        .on( 'progress', progress )
        .on( 'finish', finish )
        .on( 'nodes', function ( event ) { console.log( event.nodes.array.length / 3 + ' nodes' ); } )
        .on( 'elements', function ( event ) { console.log( event.elements.array.length/3 + ' elements' ); } )
        .on( 'ready', function () { console.log( 'Ready!' ); } )
        .read( f14_picker.files[0] );

}

function test_fort_63 () {

    var f63 = adcirc.fort63()
        .on( 'start', start )
        .on( 'info', function ( event ) { console.log( event ); } )
        .on( 'progress', progress )
        .on( 'finish', finish )
        .on( 'finish', function () { f63.timestep( 0 ); } )
        .on( 'timestep', print_timestep_info )
        .read( f63_picker.files[0] );

}

function test_fort_64 () {

    var f64 = adcirc.fort64()
        .on( 'start', start )
        .on( 'info', function ( event ) { console.log( event ); } )
        .on( 'progress', progress )
        .on( 'finish', finish )
        .on( 'finish', function () { f64.timestep( 0 ); } )
        .on( 'timestep', print_timestep_info )
        .read( f64_picker.files[0] );

}

function start () {
    progress_bar.style.width = 0;
    progress_text.innerHTML = '0%';
}
function progress ( event ) {
    progress_bar.style.width = event.progress.toFixed(1) + '%';
    progress_text.innerHTML = event.progress.toFixed(1) + '%';
}
function finish () {
    progress_bar.style.width = '100%';
    progress_text.innerHTML = '100%';
}

function print_timestep_info ( event ) {

    var ts = event.timestep;

    console.log( ts );

    console.log( 'Model time: ' + ts.model_time() );
    console.log( 'Model timestep: ' + ts.model_timestep() );
    console.log( 'Timestep index: ' + ts.index() );
    console.log( 'Number of data points: ' + ts.data().length / ts.dimensions() );

}