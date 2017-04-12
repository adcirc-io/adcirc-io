
var f63_picker = document.getElementById( 'f63' );
f63_picker.onchange = test_fort_63;

var progress_bar = document.getElementById( 'progress' );
var progress_text = document.getElementById( 'percent' );

function test_fort_63 () {

    var current = 0;
    var requested;

    var f63 = adcirc.fortnd_cached( 1, 20 )
        .on( 'start', start )
        .on( 'progress', progress )
        .on( 'finish', finish )
        .on( 'gl', function () {

            get_timestep( 0 );

        })
        .open( f63_picker.files[0] );

    d3.select( 'body' ).on( 'keydown', function () {

        switch ( d3.event.key ) {

            case 'ArrowRight':

                get_timestep( current + 1 );
                break;

            case 'ArrowLeft':

                get_timestep( current - 1 );
                break;

        }

    });

    function get_timestep ( index ) {

        if ( Math.abs( index - current ) == 1 ) {
            current = index;
            console.log( f63.timestep( current ).index() );
        }

    }

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
