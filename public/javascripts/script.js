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
                    $('#student').append('<option>' + data[i].fullName + '</option>');
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
    }
    else {
        document.getElementById("selectGroup").style.display='block';
        if (val=="Куратор") {
            document.getElementById("selectStudent").style.display='none';
            document.getElementById("studyGroup").setAttribute("multiple","multiple");
        }
        if (val=="Студент") {
            document.getElementById("studyGroup").removeAttribute("multiple");
            document.getElementById("selectStudent").style.display='none';
        }
        if (val=="Родитель") {
            document.getElementById("studyGroup").removeAttribute("multiple");
            document.getElementById("selectStudent").style.display='block';
        }
    }
};





