$(function(){
	moment.locale('ru');
        $('#birthyear').daterangepicker({
            singleDatePicker: true,
            showDropdowns: true,
            locale: {
                format: 'YYYY-MM-DD'
            },
        });
    $('#birthyear2').daterangepicker({
        singleDatePicker: true,
        showDropdowns: true,
        locale: {
            format: 'YYYY-MM-DD'
        },
    });
    //$('#birthyear2').val('');
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


    $("#SelectTypeReg").change(function () {
        var label = a.value;
        var sel = document.getElementById("SelectTypeReg");
        var val = sel.options[sel.selectedIndex].text;
        alert(val);
        if (val=="Преподаватель") {
            document.getElementById("selectGroup").style.display='none';
        }
        else {
            document.getElementById("selectGroup").style.display='block';
            if (val=="Студент" && val=="Куратор") document.getElementById("selectStudent").style.display='none';
        }
    });

    $("#selectGroup").change(function () {
        var studyGroup_ = $("#selectGroup option:selected").val();
        $.ajax({
            url: "/regStudents",
            type: "POST",
            data: jQuery.param({studyGroup: studyGroup_ }),
            dataType: "json"
        }).done(function (data) {
            var sel = document.getElementById("SelectTypeReg");
            var val = sel.options[sel.selectedIndex].text;
            if (val=="Родитель") {$("#selectStudent").removeClass("div-none");
                for (var i in data) {
                    $('#student').append('<option>' + data[i].fullName + '</option>');
                }
            }
            else $("#selectStudent").toggleClass("div-none");

        });
    });
});

/*
//скрываем поле от всех, кроме преподавателей
function UserRegister(a) {
    var label = a.value;
    var sel = document.getElementById("SelectTypeReg");
    var val = sel.options[sel.selectedIndex].text;
    if (val=="Преподаватель") {
        document.getElementById("selectGroup").style.display='none';
    }
    else {
        document.getElementById("selectGroup").style.display='block';
        if (val=="Студент" && val=="Куратор") document.getElementById("selectStudent").style.display='none';
    }
};

*/




