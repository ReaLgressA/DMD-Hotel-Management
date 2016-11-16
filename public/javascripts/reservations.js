$( function() {
    function dateDifference(is_in) {
        var room = JSON.parse( $('#room').val() );
        // check if both is not empty
        if($("#datepicker_in").val()=='' || $("#datepicker_out").val()=='')
            return;
        var diff = ($("#datepicker_out").datepicker("getDate") - $("#datepicker_in").datepicker("getDate"))
            / 1000 / 60 / 60 / 24; // days
        if(diff < 0) {
            $('#total_price').val(room['price']);
            if (is_in) {
                $("#datepicker_in").datepicker("setDate", $("#datepicker_out").val());
            } else {
                $("#datepicker_out").datepicker("setDate", $("#datepicker_in").val());
            }
        } else {
            $('#total_price').val((1 + diff) * room['price']);
        }
    }
    $('#room').on('change', function() {
        dateDifference(true);
    });
    $('#datepicker_in').datepicker( {
        onSelect: function(date) {
            dateDifference(true);
        },
        firstDay: 1
    });

    $('#datepicker_out').datepicker( {
        onSelect: function(date) {
            dateDifference(false);
        },
        firstDay: 1
    });
    $( "#datepicker_in" ).datepicker("option", "dateFormat", "yy-mm-dd" );
    $( "#datepicker_out" ).datepicker("option", "dateFormat", "yy-mm-dd" );
    $( "#datepicker_bill" ).datepicker();
    $( "#datepicker_bill" ).datepicker("option", "dateFormat", "yy-mm-dd" );

} );