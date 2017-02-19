export default function ( code ) {

    var blob_url = URL.createObjectURL( new Blob(
        [ code ],
        { type: 'application/javascript' } )
    );
    var worker = new Worker( blob_url );

    URL.revokeObjectURL( blob_url );

    return worker;

}