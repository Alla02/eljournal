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
        var url = window.location.pathname;
        var groupId_ = url.substring(url.lastIndexOf('/') + 1);
        $.ajax({
            type: "POST",
            url: "/fillAttendance",
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
            $('#selectPair').find('option').remove().end();
            $("h2").text("")
            if (dayOfWeek.length){
                $('#subjects').append('<td class="typeLection"></td>');
                for (var i in data) {
                if (data[i].typeSubject==="практика") $('#subjects').append('<td id="'+data[i].idSubjTeacher+'"class="typePractice">'+data[i].subjectName+'</td>');
                else $('#subjects').append('<td id="'+data[i].idSubjTeacher+'"class="typeLection">'+data[i].subjectName+'</td>');
                //$('.check').append('<td class="attend"><input type="checkbox" class="check1"></td>');
                //$('.check2').append('<td><input type="checkbox" class="chkParent"></td>');
                $('.check').append('<td class="attend"></td>');
                $('.check2').append('<td class="chkParent"></td>');
                $('#selectPair').append('<option value="'+data[i].idSubjTeacher+'">' + data[i].subjectName + '</option>');
                }
                /*//НЕ УДАЛЯТЬ. ДЛЯ ЧЕКБОКСОВ
                $('.chkParent').on("change", function() {
                    var $cb = $(this),
                        $th = $cb.closest("td"), // get parent th
                        col = $th.index() + 1;  // get column index. note nth-child starts at 1, not zero
                    //alert(col);
                    $("tbody td:nth-child(" + col + ") input").prop("checked", this.checked);  //select the inputs and [un]check it
                });*/
            }
        });
    };

    $(function () {
        $('#selectDay').on('change', function () {
            //alert($(this).val());
            if( $(this).val()!= undefined){
                var t = $(this).val().split(/[-]/);
                var d = new Date(Date.UTC(t[0], t[1]-1, t[2]));
                //console.log(getCurrentWeek())
                attendance(d.getDay(),$(this).val());
            }
        });
    });

    $(document).on("click", "td.attend" , function() {
        if ($(this).hasClass("present")){
            $(this).removeClass("present").addClass("absent");
        }
        else{
            if ($(this).hasClass("absent")){
                $(this).removeClass("absent").addClass("late");
            }
            else {
                if ($(this).hasClass("late")){
                    $(this).removeClass("late").addClass("present");
                }
            }
        }
    });

    $(document).on("click", "td.chkParent" , function() {
        var $cb = $(this),
            $th = $cb.closest("td"), // get parent th
            col = $th.index() + 1;  // get column index. note nth-child starts at 1, not zero
        //$("tbody td:nth-child(" + col + ") input").prop("checked", this.checked);  //select the inputs and [un]check it
        if ($("tbody td.attend:nth-child(" + col + ")").hasClass("present")){
            $("tbody td.attend:nth-child(" + col + ")").removeClass("present").addClass("absent");
        }
        else{
            if ($("tbody td.attend:nth-child(" + col + ")").hasClass("absent")){
                $("tbody td.attend:nth-child(" + col + ")").removeClass("absent").addClass("late");
            }
            else {
                if ($("tbody td.attend:nth-child(" + col + ")").hasClass("late")){
                    $("tbody td.attend:nth-child(" + col + ")").removeClass("late").addClass("present");
                }
            }
        }
    });

    $("#selectPair").on("change", function() {
        $("tbody td.attend").removeClass("present");
        $("tbody td.attend").removeClass("absent");
        $("tbody td.attend").removeClass("late");
        var idSubjTeacher = $("#selectPair option:selected").val();
        var col = $("#"+idSubjTeacher).index()+1;  // get column index. note nth-child starts at 1, not zero
        console.log(col);
        $("tbody td.attend:nth-child(" + col + ")").addClass("present");
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
        if (!data.result) { //УБРАТЬ !
            var idSelectedSubject = data.idSubject;
            var col = $("#"+idSubjTeacher).index()+1;  // get column index. note nth-child starts at 1, not zero
           // console.log(col);
            var tab = document.getElementsByTagName("table")[0];
            //var cells = tab.getElementsByClassName("attend");
            var cells = $("tbody td.attend:nth-child(" + col + ")");
            //var checkboxes = tab.getElementsByClassName("check1");//
            var day = document.getElementById("selectDay").value;
            var res=[];
            for(var i = 0; i < cells.length; i++){
                // Cell Object
                var cell = cells[i];
                var column = $(cell).index();
                var idSubj = $('#subjects').find('td').eq(column).attr("id");
                var idStud = $(cell).parent().attr("id");
                var attend;
                if ($(cell).hasClass("absent")){
                    attend = 0;
                }
                else {
                    if ($(cell).hasClass("present")){
                        attend = 1;
                    }
                    else
                    if ($(cell).hasClass("late")){
                        attend = 2;
                    }
                }
                /*
                if ($(checkboxes[i]).prop('checked')) {
                    attend = 1;
                }
                else attend =0;*/

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
                //dataType: "json"
            }).done(function (data) {
                $("h2").text("Посещаемость сохранена");
            });
        }
        else {
            $("h2").text("Код не совпадает");
        }
    });
}


