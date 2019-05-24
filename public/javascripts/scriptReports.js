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
        var idStudent = $("#idStudent").val();
        var idParent = $("#idParent").val();
        //console.log(idTeacher);
        //$("#selectStudentReports").append('<option value="0"></option>');
        //$("#selectSubjectReports").append('<option value="0"></option>');
        $.ajax({
            url: "/studentsListReport",
            type: "POST",
            data: jQuery.param({idGroup: idGroup, idStudent: idStudent, idParent: idParent}),
            dataType: "json"
        }).done(function (data) {
            //console.log(data);
            $("#selectStudentReports").find("option").remove().end();
            $("#selectStudentReports").append('<option value="0"></option>');
            for (var i in data) {
                $("#selectStudentReports").append("<option value="+data[i].id+">" + data[i].lastname +" "+ data[i].firstname + " "+ data[i].secondname+ "</option>");
            }
        });

        $.ajax({
            url: "/subjectsListReport",
            type: "POST",
            data: jQuery.param({idGroup: idGroup, idTeacher: idTeacher}),
            dataType: "json"
        }).done(function (data) {
            //console.log(data);
            $("#selectSubjectReports").find("option").remove().end();
            $("#selectSubjectReports").append('<option value="0"></option>');
            for (var i in data) {
                $("#selectSubjectReports").append("<option value="+data[i].id+">" + data[i].name + "</option>");
            }
        });
    });
});

function getReport() {
    var beginDate = $("#selectDayBegin").val();
    var endDate = $("#selectDayEnd").val();
    var idGroup = $("#selectGroupReports").val();
    var idSubject = $("#selectSubjectReports").val();
    var idStudent = $("#selectStudentReports").val();
    var studentId = $("#idStudent").val();//id студента со страницы
    $.ajax({
        type: "POST",
        url: "/getReport",
        data: jQuery.param({beginDate: beginDate, endDate: endDate, idGroup:idGroup, idSubject: idSubject, idStudent: idStudent, studentId: studentId}),
        dataType: "json"
    }).done(function (res) {
        console.log(typeof res);
        var present=0, absent=0,late=0;
        //id: row.id, attendance: row.attendance, dateAtt: row.date_attendance
        for (var i in res) {
            if (res[i].attendance===1) present++;
            if (res[i].attendance===0) absent++;
            if (res[i].attendance===2) late++;
        }
        console.log(present, absent,late);
        $('#results-chart').remove();
        $('.chart-container').append('<canvas id="results-chart" width="200" height="200"></canvas>'); //очищаем поле от предыдущего графика для создания нового
        var ctx = document.getElementById('results-chart');
        var attData = {
            labels: [
                "Присутствовал",
                "Отсутствовал",
                "Опоздал"
            ],
            datasets: [
                {
                    data: [present, absent, late],
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


}



