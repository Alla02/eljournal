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
        var present=0, absent=0,late=0,excused=0;
        //id: row.id, attendance: row.attendance, dateAtt: row.date_attendance
        for (var i in res) {
            if (res[i].attendance===1) present++;
            if (res[i].attendance===0) absent++;
            if (res[i].attendance===2) late++;
            if (res[i].attendance===2) excused++;
        }
        console.log(present, absent,late);
        $('#results-chart').remove();
        $('.chart-container').append('<canvas id="results-chart" width="200" height="200"></canvas>'); //очищаем поле от предыдущего графика для создания нового
        var ctx = document.getElementById('results-chart');
        var attData = {
            labels: [
                "Присутствовал",
                "Отсутствовал",
                "Опоздал",
                "Уважительная причина"
            ],
            datasets: [
                {
                    data: [present, absent, late,excused],
                    backgroundColor: [
                        "#63FF84",
                        "#FF6384",
                        "#6384FF",
                        "#9D95F6"
                    ]
                }]
        };

        var pieChart = new Chart(ctx, {
            //responsive: true,
            type: 'pie',
            data: attData
        });
    });

    if (idStudent==="0"){
    $.ajax({
        type: "POST",
        url: "/getReportTable",
        data: jQuery.param({beginDate: beginDate, endDate: endDate, idGroup:idGroup, idSubject: idSubject, idStudent: idStudent, studentId: studentId}),
        dataType: "json"
    }).done(function (res) {
        console.log(res);
        $('#addRows').children("tr").remove();
        for (var i in res) {
            $('#addRows').append('<tr><td>' + res[i].lastname+' '+ (res[i].firstname).substring(0, 1)+'. '+ (res[i].secondname).substring(0, 1) + '.</td><td>'+res[i].absent+'</td></tr>');
        }
    });
    }
    else {
        $.ajax({
            type: "POST",
            url: "/getReportTable2",
            data: jQuery.param({beginDate: beginDate, endDate: endDate, idGroup:idGroup, idSubject: idSubject, idStudent: idStudent, studentId: studentId}),
            dataType: "json"
        }).done(function (res) {
            console.log(res);
            $('#addRows2').children("tr").remove();
            for (var i in res) {
                var atten;
                if (res[i].attendance===1) atten="Присутствовал";
                if (res[i].attendance===0) atten="Отсутствовал";
                if (res[i].attendance===2) atten="Опоздал";
                if (res[i].attendance===2) atten="Уважительная причина";
                $('#addRows2').append('<tr><td>' + res[i].dateAtt+'</td><td>'+atten+'</td><td>'+res[i].comment+'</td></tr>');
            }
        });
    }

}



