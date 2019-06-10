$(document).ready(function () {
    $(function(){
        moment.locale('ru');
        $('#selectDay').daterangepicker({
            singleDatePicker: true,
            showDropdowns: true,
            locale: {
                format: 'YYYY-MM-DD'
            },
            isInvalidDate: function(date) {
                var day = (date._d).getDay();
                if (day == 0) {
                    return true;
                }
            }
        });
        $('#selectDay').val('');
        $('#selectDay').attr("placeholder","Выбрать день");
    });


    function attendance(day, seldate) {
        var times =["8:30","10:10", "11:50", "13:50", "15:30", "17:10", "18:50"];
        var url = window.location.pathname;
        var groupId_ = url.substring(url.lastIndexOf('/') + 1);
        $.ajax({
            type: "POST",
            url: "/fillSchedule",
            data: jQuery.param({id_group: groupId_,selecteddate: seldate, day:day}),
            dataType: "json"
        }).done(function (data) {
            let table = document.getElementById("table1");
            var dayOfWeek = [];
            var subjectName = []; var nameDay;
            var day1= 0; var day2= 0; var day3= 0;
            var day4= 0; var day5= 0; var day6= 0;
            for (var i in data) {
                dayOfWeek.push(data[i].dayOfWeek);
                subjectName.push(data[i].subjectName);
            }
            if (day===1) nameDay="Понедельник";
            if (day===2) nameDay="Вторник";
            if (day===3) nameDay="Среда";
            if (day===4) nameDay="Четверг";
            if (day===5) nameDay="Пятница";
            if (day===6) nameDay="Суббота";
            $('#weekd').attr('colspan',subjectName.length).text(nameDay);
            $('#subjects, .check, .check2').find('.typeLection,.typePractice, .attend, .chkParent').remove().end();
            $('#selectPair').find('option').remove().end().append('<option></option>');
            $("h2").text("")
            if (dayOfWeek.length){
                $('#subjects').append('<td class="typeLection stickyLeft"></td>');
                for (var i in data) {
                    var shortSubject = (data[i].subjectName).replace('Дисциплина по выбору','ДПВ'); //сокращение дисциплины по выбору.
                    if (data[i].typeSubject==="практика") $('#subjects').append('<td id="'+data[i].idSubjTeacher+'"class="typePractice chkParent">'+shortSubject+'</td>');
                    else $('#subjects').append('<td id="'+data[i].idSubjTeacher+'"class="typeLection chkParent">'+shortSubject+'</td>');
                    $('.check').append('<td class="attend"></td>');
                    $('#selectPair').append('<option value="'+data[i].idSubjTeacher+'">' + data[i].subjectName + " ("+ times[data[i].numPair-1]+")"+'</option>');
                }
                $.ajax({
                    type: "POST",
                    url: "/fillAttendance",
                    data: jQuery.param({id_group: groupId_,selecteddate: seldate, day:day}),
                    dataType: "json"
                }).done(function (data2) {
                    console.log("data2 "+data2);
                    for (var i in data2) {
                        var column = $("#" + data2[i].idSubjTeacher).index();
                        if (data2[i].attendance===0) $("#st" + data2[i].idStudent).find('td').eq(column).addClass("absent");
                        else {
                            if (data2[i].attendance === 1) $("#st" + data2[i].idStudent).find('td').eq(column).addClass("present");
                            else {if (data2[i].attendance===2) $("#st" + data2[i].idStudent).find('td').eq(column).addClass("late");
                                else if (data2[i].attendance===3) $("#st" + data2[i].idStudent).find('td').eq(column).addClass("excused");
                            }
                        }
                    }
                });
            }
        });
    };

    $(function () {
        $('#selectDay').on('change', function () {
            $('#teachersName').text("");
            if( $(this).val()!= undefined){
                var t = $(this).val().split(/[-]/);
                var d = new Date(Date.UTC(t[0], t[1]-1, t[2]));
                attendance(d.getDay(),$(this).val());
            }
        });
    });

    $(document).on("click", "td.attend" , function() {
        var $cell = $(this);
        if ($cell.hasClass("selected")) {
            if (!$cell.hasClass("present") && !$cell.hasClass("absent") && !$cell.hasClass("late")) $cell.addClass("present");//если ячейка без отметки, то добавляем класс present
            else {
                if ($cell.hasClass("present")) {
                    $cell.removeClass("present").addClass("absent");
                } else {
                    if ($cell.hasClass("absent")) {
                        $cell.removeClass("absent").addClass("late");
                    } else {
                        if ($cell.hasClass("late")) {
                            $cell.removeClass("late").addClass("present");
                        }
                    }
                }
            }
        }
    });

    $(document).on("click", "td.chkParent" , function() {
        var $cb = $(this),
            $th = $cb.closest("td"), // get parent th
            col = $th.index() + 1;  // get column index. note nth-child starts at 1, not zero
        var $cells = $("tbody td.attend:nth-child(" + col + ")");
        if ($cells.hasClass("selected")) {
            if (!$cells.hasClass("present") && !$cells.hasClass("absent") && !$cells.hasClass("late"))
                $cells.addClass("present");
            else {
                if ($cells.hasClass("present")) $cells.removeClass("present").addClass("absent");
                else {
                    if ($cells.hasClass("absent")) $cells.removeClass("absent").addClass("late");
                    else if ($cells.hasClass("late")) $cells.removeClass("late").addClass("present");
                }
            }
        }
    });

    $("#selectPair").on("change", function() {
        $("tbody td.attend").removeClass("selected");
        var idSubjTeacher = $("#selectPair option:selected").val();
        var col = $("#"+idSubjTeacher).index()+1;  // get column index. note nth-child starts at 1, not zero
        console.log(col);
        $("tbody td.attend:nth-child(" + col + ")").addClass("selected");
        $("h2").text("");
        $('#teachersName').text("");
        $.ajax({
            type: "POST",
            url: "/getTeachersName",
            data: jQuery.param({idSubjTeacher: idSubjTeacher}),
            dataType: "json"
        }).done(function (data) {
            $('#teachersName').text(data[0].lastname + " " + data[0].firstname.substring(1,0) + ". " + data[0].secondname.substring(1,0)+".");
        });
    });
});

function saveResults() {
    var idSubjTeacher = $("#selectPair option:selected").val();
    var code = $("#code").val();
    console.log(idSubjTeacher);
    console.log(code);

    $.ajax({
        type: "POST",
        url: "/validateCode",
        data: jQuery.param({idSubjTeacher: idSubjTeacher, code: code }),
    }).done(function (data) {
        console.log("result from validat "+data.result);
        if (data.result) {
            var col = $("#"+idSubjTeacher).index()+1;
            var tab = document.getElementsByTagName("table")[0];
            var cells = $("tbody td.attend:nth-child(" + col + ")");
            var day = document.getElementById("selectDay").value;
            var res=[];
            for(var i = 0; i < cells.length; i++){
                var cell = cells[i];
                var column = $(cell).index();
                var idSubj = $('#subjects').find('td').eq(column).attr("id");
                var idStud = $(cell).parent().attr("id");
                idStud = idStud.substring(idStud.indexOf("t") + 1);
                var attend;
                if ($(cell).hasClass("absent")) attend = 0;
                else {
                    if ($(cell).hasClass("present")) attend = 1;
                    else if ($(cell).hasClass("late")) attend = 2;
                }
                res.push({
                    "idStudent" : idStud,
                    "idSubject"  : idSubj,
                    "date"       : day,
                    "attendance" : attend
                });
            }
            console.log(res);

            $.ajax({
                type: "POST",
                url: "/saveAttendance",
                contentType: 'application/json',
                data: JSON.stringify(res)
            }).done(function (data) {
                $("h2").text("Посещаемость сохранена");
            });
        }
        else {
            $("h2").text("Код не совпадает");
        }
    });
}


