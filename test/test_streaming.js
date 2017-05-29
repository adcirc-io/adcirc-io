var input = document.getElementById( 'f14' );
var progress_bar = document.getElementById( 'progress' );
var progress_text = document.getElementById( 'percent' );


input.addEventListener( 'change', function () {

    var file = this.files[0];
    var worker = adcirc.fort14_worker_streaming();
    var quadtree = d3.quadtree();

    var start, finish;

    worker.addEventListener( 'message', function ( message ) {

        switch ( message.data.type ) {

            case 'start':

                start = performance.now();
                break;

            case 'progress':

                progress( message.data.progress );
                break;

            case 'error':

                log( message.data.error );
                break;

            case 'nodes':

                var data = message.data.data;
                for ( var i=0; i<data.length; ++i ) {
                    quadtree.add( data[i] );
                }
                break;

            case 'finished':

                finish = performance.now();
                finished();

                var info = message.data.message || '';

                log( info + '\t' + ( finish - start ) + 'ms');
                quadtree = d3.quadtree();
                break;

        }

    });

    worker.postMessage({
        type: 'read',
        file: file
    });

});


function progress ( progress ) {
    progress_bar.style.width = progress.toFixed(1) + '%';
    progress_text.innerHTML = progress.toFixed(1) + '%';
}

function finished () {
    progress_bar.style.width = '100%';
    progress_text.innerHTML = '100%';
}

function log ( message ) {
    d3.select( '#log' )
        .append( 'div' )
        .attr( 'class', 'log-item' )
        .text( message );
}