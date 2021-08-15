
//initialize daterange picker configuration
    var start = moment().subtract(29, 'days');
    var end = moment();
    $('#datepick').daterangepicker({
        startDate: start,
        endDate: end,
        ranges: {
           'Today': [moment(), moment()],
           'Yesterday': [moment().subtract(1, 'days'), moment().subtract(1, 'days')],
           'Last 7 Days': [moment().subtract(6, 'days'), moment()],
           'Last 30 Days': [moment().subtract(29, 'days'), moment()],
           'This Month': [moment().startOf('month'), moment().endOf('month')],
           'Last Month': [moment().subtract(1, 'month').startOf('month'), moment().subtract(1, 'month').endOf('month')]
        },
        autoUpdateInput: true,
        locale: {
          cancelLabel: 'Clear'
        },
    }).on('change', function() { //handle event on search by date modified
      selectSearch = 'datepick'; //variable from searchadv.js
      emptyAllbox('datepick'); //function from searchadv.js
    });
    $('#datepick').val('');
    //handle apply  button clicked
    $('input[name="datepick"]').on('apply.daterangepicker', function(ev, picker) {
         $('#datepick').val(picker.startDate.format('MM/DD/YYYY') + ' - ' + picker.endDate.format('MM/DD/YYYY'));
         $('#datepick').change();
     });
   //handle cancel button clic$(this).change();ked
     $('input[name="datepick"]').on('cancel.daterangepicker', function(ev, picker) {
         $('#datepick').val('');
     });
