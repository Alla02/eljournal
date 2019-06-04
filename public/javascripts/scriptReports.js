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
    var idParent = $("#idParent").val();//id родителя со страницы
    $.ajax({
        type: "POST",
        url: "/getReport",
        data: jQuery.param({beginDate: beginDate, endDate: endDate, idGroup:idGroup, idSubject: idSubject, idStudent: idStudent, studentId: studentId, idParent: idParent}),
        dataType: "json"
    }).done(function (res) {
        console.log(typeof res);
        var present=0, absent=0,late=0,excused=0;
        for (var i in res) {
            if (res[i].attendance===1) present++;
            if (res[i].attendance===0) absent++;
            if (res[i].attendance===2) late++;
            if (res[i].attendance===3) excused++;
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
            type: 'pie',
            data: attData
        });
    });

    if (idStudent==="0"){
    $.ajax({
        type: "POST",
        url: "/getReportTable",
        data: jQuery.param({beginDate: beginDate, endDate: endDate, idGroup:idGroup, idSubject: idSubject, idStudent: idStudent, studentId: studentId, idParent:idParent}),
        dataType: "json"
    }).done(function (res) {
        console.log(res);
        $('#addRows').children("tr").remove();
        $('#addRows2').children("tr").remove();
        document.getElementById("firstTable").style.display='block';
        document.getElementById("secondTable").style.display='none';
        /*
        for (var i in res) {
            $('#addRows').append('<tr><td>' + res[i].lastname+' '+ (res[i].firstname).substring(0, 1)+'. '+ (res[i].secondname).substring(0, 1) + '.</td><td>'+res[i].absent+'</td></tr>');
        }*/
        $('#tableReports').DataTable( {
            destroy: true,
            data: res,
            columns: [
                { data: 'lastname' },
                { data: 'firstname' },
                { data: 'secondname' },
                { data: 'absent' }
            ],
            "lengthMenu": [ [-1, 10], ["Все", 10] ],
            "language": {
                "lengthMenu": "Показывать по _MENU_ записей на странице",
                "search": "Поиск:",
                "zeroRecords": "Поиск не дал результатов",
                "info": "Страница _PAGE_ из _PAGES_",
                "infoEmpty": "Записи не найдены",
                "infoFiltered": "(всего записей _MAX_)",
                "paginate": {
                    "first": "Первая",
                    "last": "Последняя",
                    "next": "Следующая",
                    "previous": "Предыдущая"
                },
            }
        });
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
            document.getElementById("firstTable").style.display='none';
            document.getElementById("secondTable").style.display='block';
            $('#addRows').children("tr").remove();
            $('#addRows2').children("tr").remove();
            /*
            for (var i in res) {
                var atten;
                if (res[i].attendance===1) atten="Присутствовал";
                if (res[i].attendance===0) atten="Отсутствовал";
                if (res[i].attendance===2) atten="Опоздал";
                if (res[i].attendance===3) atten="Уважительная причина";
                $('#addRows2').append('<tr><td>' + res[i].dateAtt+'</td><td>'+atten+'</td><td>'+res[i].name+'</td><td>'+res[i].comment+'</td></tr>');
            }*/

            for (var i in res) {
                var atten;
                if (res[i].attendance===1) res[i].attendance="Присутствовал";
                if (res[i].attendance===0) res[i].attendance="Отсутствовал";
                if (res[i].attendance===2) res[i].attendance="Опоздал";
                if (res[i].attendance===3) res[i].attendance="Уважительная причина";
            }
            $('#tableReports2').DataTable( {
                destroy: true,
                data: res,
                columns: [
                    { data: 'dateAtt' },
                    { data: 'attendance' },
                    { data: 'name' },
                    { data: 'comment' }
                ],
                initComplete: function () {
                    this.api().columns().every( function () {
                        var column = this;
                        var select = $('<select><option value=""></option></select>')
                            .appendTo( $(column.footer()).empty() )
                            .on( 'change', function () {
                                var val = $.fn.dataTable.util.escapeRegex(
                                    $(this).val()
                                );

                                column
                                    .search( val ? '^'+val+'$' : '', true, false )
                                    .draw();
                            } );

                        column.data().unique().sort().each( function ( d, j ) {
                            select.append( '<option value="'+d+'">'+d+'</option>' )
                        } );
                    } );
                },
                "lengthMenu": [ [-1, 10], ["Все", 10] ],
                "language": {
                    "lengthMenu": "Показывать по _MENU_ записей на странице",
                    "search": "Поиск:",
                    "zeroRecords": "Поиск не дал результатов",
                    "info": "Страница _PAGE_ из _PAGES_",
                    "infoEmpty": "Записи не найдены",
                    "infoFiltered": "(всего записей _MAX_)",
                    "paginate": {
                        "first": "Первая",
                        "last": "Последняя",
                        "next": "Следующая",
                        "previous": "Предыдущая"
                    },
                }
            });
        });
    }

}



