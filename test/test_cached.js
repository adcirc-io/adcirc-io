
var f63_picker = document.getElementById( 'f63' );
f63_picker.onchange = test_fort_63;

var progress_bar = document.getElementById( 'progress' );
var progress_text = document.getElementById( 'percent' );

function test_fort_63 () {

    var f63 = adcirc.fort63_cached( 20 )
        .on( 'start', start )
        .on( 'progress', progress )
        .on( 'finish', finish )
        .on( 'timestep', function ( event ) {

            console.log( event.timestep.index() );

        })
        .open( f63_picker.files[0] );

    d3.select( 'body' ).on( 'keydown', function () {

        switch ( d3.event.key ) {

            case 'ArrowRight':

                f63.next_timestep();
                break;

            case 'ArrowLeft':

                f63.previous_timestep();
                break;

        }

    });

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
