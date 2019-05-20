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
        //console.log(idTeacher);
        //$("#selectStudentReports").append('<option value="0"></option>');
        //$("#selectSubjectReports").append('<option value="0"></option>');
        $.ajax({
            url: "/studentsListReport",
            type: "POST",
            data: jQuery.param({idGroup: idGroup}),
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
    $.ajax({
        type: "POST",
        url: "/getReport",
        data: jQuery.param({beginDate: beginDate, endDate: endDate, idGroup:idGroup, idSubject: idSubject, idStudent: idStudent }),
    }).done(function (res) {
        console.log(res);
        var present=0, absent=0,late=0;
        console.log(res[1].attendance, res[1].id,res[1].dateAtt);
        //id: row.id, attendance: row.attendance, dateAtt: row.date_attendance
        $.each( res.items, function( i, item ) {
            if (item.attendance===1) present++;
        });
        for (var i in res) {
            if (res[i].attendance===1) present++;
            if (res[i].attendance==="0") absent++;
            if (res[i].attendance==="2") late++;
            //console.log(data[i].attendance);
            //console.log(present, absent,late);
        }
        console.log(present, absent,late);
    });
}
/*
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
*/

