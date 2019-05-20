$(document).ready(function () {
    $(function(){
        moment.locale('ru');
        $('#selectDayBegin').daterangepicker({
            singleDatePicker: true,
            showDropdowns: true,
            locale: {
                format: 'YYYY-MM-DD'
            }
        });
        $('#selectDayBegin').val('');
        $('#selectDayBegin').attr("placeholder","Выбрать начало");

        $('#selectDayEnd').daterangepicker({
            singleDatePicker: true,
            showDropdowns: true,
            locale: {
                format: 'YYYY-MM-DD'
            }
        });
        $('#selectDayEnd').val('');
        $('#selectDayEnd').attr("placeholder","Выбрать конец");
    });

    $("#selectGroupReports").on("change", function() {
        var idGroup = $("#selectGroupReports option:selected").val();
        var idTeacher = $("#idTeacher").val();
        $.ajax({
            url: "/reportsLists",
            type: "POST",
            data: jQuery.param({idGroup: idGroup}),
            dataType: "json"
        }).done(function (data) {
            //$("#selectStudent").removeClass("div-none");
            $('#student').find('option').remove().end();
            for (var i in data) {
                $('#student').append('<option value="'+data[i].idSt+'">' + data[i].fullName + '</option>');
            }
        });
    });


    function getReport() {
        var idSubjTeacher = $("#selectPair option:selected").val();
        var code = $("#code").val();
        console.log(idSubjTeacher);
        console.log(code);

        $.ajax({
            type: "POST",
            url: "/validateCode",
            data: jQuery.param({idSubjTeacher: idSubjTeacher, code: code }),
        }).done(function (data) {

        });
    }

    var ctx = document.getElementById('myChart');
    var attData = {
        labels: [
            "Присутствовал",
            "Отсутствовал",
            "Опоздал"
        ],
        datasets: [
            {
                data: [133.3, 86.2, 52.2],
                backgroundColor: [
                    "#63FF84",
                    "#FF6384",
                    "#6384FF"
                ]
            }]
    };

    var pieChart = new Chart(ctx, {
        //responsive: true,
        type: 'pie',
        data: attData
    });
});



