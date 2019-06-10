$(function(){
	moment.locale('ru');
    $('#birthyear').daterangepicker({
        singleDatePicker: true,
        showDropdowns: true,
        locale: {
            format: 'YYYY-MM-DD'
        },
    });
    $('#birthyearstud').daterangepicker({
        singleDatePicker: true,
        showDropdowns: true,
        locale: {
            format: 'YYYY-MM-DD'
        },
    });
    $('#startsemester').daterangepicker({
        singleDatePicker: true,
        showDropdowns: true,
        locale: {
            format: 'YYYY-MM-DD'
        },
    });
    $('#endsemester').daterangepicker({
        singleDatePicker: true,
        showDropdowns: true,
        locale: {
            format: 'YYYY-MM-DD'
        },
    });
    //$('#birthyearstud').val('');
    $('#birthyear').val('');
    $('#birthyear').attr("placeholder","Дата рождения");
});


$(function(){
	moment.locale('ru');
        $('#yearAdmission').daterangepicker({
            singleDatePicker: true,
            showDropdowns: true,
            locale: {
                format: 'YYYY-MM-DD'
            },
        });
    $('#yearAdmission').val('');
    $('#yearAdmission').attr("placeholder","Год зачисления");
});

//раскрытие список (слайдер)
$(document).ready(function () {
    $(".serviceList").click(function () {
        var otherMenuItems = $(".serviceList").not($(this));
        otherMenuItems.next('.slide').slideUp();
        otherMenuItems.find('.caret').removeClass("fa fa-caret-up");
        otherMenuItems.find('.caret').addClass("fa fa-caret-down");

        $(this).find('.caret').toggleClass("fa fa-caret-down fa fa-caret-up");
        $(this).next('.slide').slideToggle("slow");
    });

    $("#selectGroup").change(function () {
        var studyGroup_ = $("#selectGroup option:selected").val();
        $.ajax({
            url: "/regStudents",
            type: "POST",
            data: jQuery.param({studyGroup: studyGroup_ }),
            dataType: "json"
        }).done(function (data) {
            //$("#selectStudent").removeClass("div-none");
            $('#student').find('option').remove().end();
                for (var i in data) {
                    $('#student').append('<option value="'+data[i].idSt+'">' + data[i].fullName + '</option>');
                }
        });
    });
});


//скрываем поля
function UserRegister(a) {
    var label = a.value;
    var sel = document.getElementById("SelectTypeReg");
    var val = sel.options[sel.selectedIndex].text;
    if (val=="Преподаватель") {
        document.getElementById("selectGroup").style.display='none';
        document.getElementById("selectStudent").style.display='none';
        document.getElementById("selectifCanView").style.display='none';
    }
    else {
        document.getElementById("selectGroup").style.display='block';
        if (val=="Куратор") {
            document.getElementById("selectStudent").style.display='none';
            document.getElementById("studyGroup").setAttribute("multiple","multiple");
            document.getElementById("selectifCanView").style.display='none';
        }
        if (val=="Студент") {
            document.getElementById("studyGroup").removeAttribute("multiple");
            document.getElementById("selectStudent").style.display='none';
            document.getElementById("selectifCanView").style.display='block';
        }
        if (val=="Родитель") {
            document.getElementById("studyGroup").removeAttribute("multiple");
            document.getElementById("selectStudent").style.display='block';
            document.getElementById("selectifCanView").style.display='none';
        }
    }
}

function savePermission() {
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
                idStud = idStud.substring(idStud.indexOf("t") + 1);
                var attend;
                if ($(cell).hasClass("absent")){
                    attend = 0;
                }
                else {
                    if ($(cell).hasClass("present")){
                        attend = 1;
                    }
                    else {
                        if ($(cell).hasClass("late")){
                            attend = 2;
                        }
                    }
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





