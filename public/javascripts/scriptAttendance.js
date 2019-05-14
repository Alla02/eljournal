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
                //подсчитываем количество предметов за один день для настройки объединения
                /*
                if (data[i].dayOfWeek==1) day1 = day1+1;
                if (data[i].dayOfWeek==2) day2 = day2+1;
                if (data[i].dayOfWeek==3) day3 = day3+1;
                if (data[i].dayOfWeek==4) day4 = day4+1;
                if (data[i].dayOfWeek==5) day5 = day5+1;
                if (data[i].dayOfWeek==6) day6 = day6+1;*/
            }
            if (day===1) nameDay="Понедельник";
            if (day===2) nameDay="Вторник";
            if (day===3) nameDay="Среда";
            if (day===4) nameDay="Четверг";
            if (day===5) nameDay="Пятница";
            if (day===6) nameDay="Суббота";
            $('#weekd').attr('colspan',subjectName.length).text(nameDay);
            $('#subjects, .check, .check2').find('.typeLection,.typePractice, .attend').remove().end();
            if (dayOfWeek.length){
                /*$([Понедельник]).attr('colspan',day1);
                $([Вторник]).attr('colspan',day2);
                $([Среда]).attr('colspan',day3);
                $([Четверг]).attr('colspan',day4);
                $([Пятница]).attr('colspan',day5);
                $([Суббота]).attr('colspan',day6);*/
                //$('#subjects, .check, .check2').remove();
                $('#subjects').append('<td class="typeLection"></td>');
                for (var i in data) {
                if (data[i].typeSubject==="практика") $('#subjects').append('<td id="'+data[i].subjectId+'"class="typePractice">'+data[i].subjectName+'</td>');
                else $('#subjects').append('<td id="'+data[i].subjectId+'"class="typeLection">'+data[i].subjectName+'</td>');
                //$('.check').append('<td class="attend"><input type="checkbox" class="check1"></td>');
                //$('.check2').append('<td><input type="checkbox" class="chkParent"></td>');
                $('.check').append('<td class="attend" onclick="updateCell()"></td>');
                }
                /*//НЕ УДАЛЯТЬ. ДЛЯ ЧЕКБОКСОВ
                $('.chkParent').on("change", function() {
                    var $cb = $(this),
                        $th = $cb.closest("td"), // get parent th
                        col = $th.index() + 1;  // get column index. note nth-child starts at 1, not zero
                    //alert(col);
                    $("tbody td:nth-child(" + col + ") input").prop("checked", this.checked);  //select the inputs and [un]check it
                });*/

                /*
                $('#table1 input:checkbox').change(function(e) {
                    if(this.checked) {
                        var value = parseInt($(this).closest('td').next('td').text(), 10);
                        alert(value);
                        // above will convert it from a string to an integer
                    }
                    else {
                        // same as above? Seems redundant
                    }
                });*/
                /*
                var tab = document.getElementsByTagName("table")[0];
                var cells = tab.getElementsByTagName("td"); //
                var day = document.getElementsByName("selectDay");


                for(var i = 1; i < cells.length; i++){
                    // Cell Object
                    var cell = cells[i];
                    // Track with onclick
                    cell.onclick = function(){
                        //var cellIndex  = this.cellIndex + 1;
                        //var rowIndex = this.parentNode.rowIndex + 1;
                        var column = $(this).index();
                        var idSubj = $('#subjects').find('td').eq(column).attr("id");
                        var idStud = $(this).parent().attr("id")
                        console.log(idSubj +" "+ idStud)
                    }
                }*/


                //$("#table1 tr td:nth-child(1) input[type=checkbox]").prop("checked", true);
                /*
                $('table [type="checkbox"]').each(function(i, chk) {
                    if (chk.checked) {
                        console.log("Checked!", i, chk);
                        var column = $(chk).index();
                        console.log(column);
                        var idSubj = $('#subjects').find('td').eq(column).attr("id");
                        var idStud = $(this).parent().attr("id")
                        console.log(idSubj +" "+ idStud)
                    }
                });*/

            }
        });
    };
    //attendance();

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


});

function updateCell() {
    $(".check .attend").click(function() {
        $(this).html("x");
    });
    //$(this).html('Data to be shown inside td');
    //$(".check .attend").on("click", function () {
     //   $(this).attr('id')
    //    console.log("clicked");
    //});
}
function saveResults() {
    console.log("ggggg")
    //alert("работает");
    var tab = document.getElementsByTagName("table")[0];
    var cells = tab.getElementsByClassName("attend");
    var checkboxes = tab.getElementsByClassName("check1");//
    var day = document.getElementById("selectDay").value;
    var res=[];
    console.log(day);
    for(var i = 0; i < cells.length; i++){
        // Cell Object
        var cell = cells[i];
        var column = $(cell).index();
        var idSubj = $('#subjects').find('td').eq(column).attr("id");
        var idStud = $(cell).parent().attr("id");
        var attend;
        if ($(checkboxes[i]).prop('checked')) {
            attend = 1;
        }
        else attend =0;
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
    });
};


