
if(window.location.search.length == 0){
    window.location = '?chart=YHOO';
}

getJson("http://query.yahooapis.com/v1/public/yql?q=select%20*%20from%20yahoo.finance.historicaldata%20where%20symbol%20=%20%22"+window.location.search.substr(1).split('&')[0].split('=')[1]+"%22%20and%20startDate%20=%20%222012-09-11%22%20and%20endDate%20=%20%222014-02-11%22&diagnostics=true&format=json&env=store://datatables.org/alltableswithkeys")

$("#stock").val(window.location.search.substr(1).split('&')[0].split('=')[1]);

$("#stock").change(function () {
    var text =  this.value? this.value:'YHOO';
    window.location = '?chart='+text;
});

function getJson(url){
    jQuery.ajax({
        url: url,
          context: document.body,
        }).done(function(chartData) {
        var jsonData = [];
        var priceData = [];
        var volumeData = [];
        var data = chartData['query']['results']['quote'];
        for(var i = 0; i<data.length; i++) {
            jsonData[i] = data[i];
            priceData[i] = [];
            volumeData[i] = [];
            priceData[i][0] = i;
            priceData[i][1] = data[i]['Close'];
            volumeData[i][0] = i;
            volumeData[i][1] = data[i]['Volume'];
        }
        var oldPriceData = priceData;
        jsonData.sort(function(a, b){
            var a1= a['Date'], b1= b['Date'];
            if(a1== b1) return 0;
            return a1> b1? 1: -1;
        });
        drawChart(chartData, jsonData, oldPriceData, volumeData, priceData);

    });
}

function drawChart (chartData, jsonData, priceData, volumeData, summaryData) {
    HumbleFinance.trackFormatter = function (obj) {
        var x = Math.floor(obj.x);
        var data = jsonData[x];
        var text = data.Date + " Price: " + data.Close + " Vol: " + data.Volume + " high: " + data.High + " low: " + data.Low;
        return text;
    };

    HumbleFinance.yTickFormatter = function (n) {

        if (n == this.axes.y.max) {
            return false;
        }

        return '$'+n;
    };

    HumbleFinance.xTickFormatter = function (n) {

        if (n === 0) {
            return false;
        }
        var date = jsonData[n].Date;
        date = date.split('-');
        date = date[1] + '-' + date[0];

        return date;
    };

    HumbleFinance.init('finance', priceData, volumeData, summaryData);
    // HumbleFinance.setFlags(flagData);

    var xaxis = HumbleFinance.graphs.summary.axes.x;
    var prevSelection = HumbleFinance.graphs.summary.prevSelection;
    var xmin = xaxis.p2d(prevSelection.first.x);
    var xmax = xaxis.p2d(prevSelection.second.x);
    xmax = Math.floor(xmax);

    jQuery(function ($) {
        // $("#financeTitle").text(window.location.search.substr(1).split('&')[0].split('=')[1]);

        $( "#startDate" ).val(moment(new Date(jsonData[0].Date)).format('YYYY/MM/DD'));
        $( "#endDate" ).val(moment(new Date(jsonData[jsonData.length-1].Date)).format('YYYY/MM/DD'));

        $( "#startDate" ).datepicker({
            dateFormat: 'yy/mm/dd',
            // beforeShow: customRange,
            minDate: moment(new Date(jsonData[0].Date)).format('YYYY/MM/DD'),
            maxDate: moment(new Date(jsonData[jsonData.length-1].Date)).format('YYYY/MM/DD'),
            onSelect: function(date){

              var selectedDate = new Date(date);
              $("#endDate").datepicker( "option", "minDate", selectedDate );
                if( $( "#endDate" ).val() && $( "#startDate" ).val() ){
                  HumbleFinance.zoom( moment().isoWeekdayCalc({
                    rangeStart: new Date($( "#startDate" ).val()),
                    rangeEnd: new Date($( "#endDate" ).val()),
                    weekdays: [1,2,3,4,5], //weekdays Mon to Fri
                    // exclusions: ['6 Apr 2015','7 Apr 2015']  //public holidays
                  }), 'days' );
                }
            }


        });
        $( "#endDate" ).datepicker({
            dateFormat: 'yy/mm/dd',
            minDate: moment(new Date(jsonData[0].Date)).format('YYYY/MM/DD'),
            maxDate: moment(new Date(jsonData[jsonData.length-1].Date)).format('YYYY/MM/DD')
        });



      $( "#endDate" ).change(function() {
        if( $( "#endDate" ).val() && $( "#startDate" ).val() ){
          HumbleFinance.zoom( moment().isoWeekdayCalc({
            rangeStart: new Date($( "#startDate" ).val()),
            rangeEnd: new Date($( "#endDate" ).val()),
            weekdays: [1,2,3,4,5], //weekdays Mon to Fri
            // exclusions: ['6 Apr 2015','7 Apr 2015']  //public holidays
          }), 'days' );
        }
      });

    });

    // $('dateRange').update($( "#startDate" ).val() + ' - ' + $( "#endDate" ).val());

    Event.observe(HumbleFinance.containers.summary, 'flotr:select', function (e) {
        var area = e.memo[0];
        xmin = Math.floor(area.x1);
        xmax = Math.ceil(area.x2);

        var date1 = jsonData[xmin].Date;
        var date2 = jsonData[xmax].Date;
        $('dateRange').update(jsonData[xmin].Date + ' - ' + jsonData[xmax].Date);
        jQuery(function ($) {
            $( "#startDate" ).val(moment(jsonData[xmin].Date).format('YYYY/MM/DD'));
            $( "#endDate" ).val(moment(jsonData[xmax].Date).format('YYYY/MM/DD'));
            var selectedDate = $( "#startDate" ).val();
            $("#endDate").datepicker( "option", "minDate", selectedDate );
        });
    });
}
