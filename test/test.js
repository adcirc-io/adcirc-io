
var f14_picker = document.getElementById( 'f14' );

f14_picker.onchange = test_fort_14;

function test_fort_14 () {

    var f14 = adcirc.fort14( f14_picker.files[0] )

}