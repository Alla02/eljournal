$(document).ready(function () {
    $(function(){
        moment.locale('ru');
        $('#day').daterangepicker({
            singleDatePicker: true,
            showDropdowns: true,
            locale: {
                format: 'YYYY-MM-DD'
            },
        });
        $('#day').val('');
        $('#day').attr("placeholder","Выбрать день");
    });

    function attendance() {
        var url = window.location.pathname;
        var groupId_ = url.substring(url.lastIndexOf('/') + 1);
        $.ajax({
            type: "POST",
            url: "/fillAttendance",
            data: jQuery.param({id_group: groupId_}),
            dataType: "json"
        }).done(function (data) {
            let table = document.getElementById("table1");
            var dayOfWeek = [];
            var subjectName = [];
            var day1= 0; var day2= 0; var day3= 0;
            var day4= 0; var day5= 0; var day6= 0;
            for (var i in data) {
                dayOfWeek.push(data[i].dayOfWeek);
                subjectName.push(data[i].subjectName);
                //подсчитываем количество предметов за один день для настройки объединения
                if (data[i].dayOfWeek==1) day1 = day1+1;
                if (data[i].dayOfWeek==2) day2 = day2+1;
                if (data[i].dayOfWeek==3) day3 = day3+1;
                if (data[i].dayOfWeek==4) day4 = day4+1;
                if (data[i].dayOfWeek==5) day5 = day5+1;
                if (data[i].dayOfWeek==6) day6 = day6+1;
            }
            if (dayOfWeek.length){
                $([Понедельник]).attr('colspan',day1);
                $([Вторник]).attr('colspan',day2);
                $([Среда]).attr('colspan',day3);
                $([Четверг]).attr('colspan',day4);
                $([Пятница]).attr('colspan',day5);
                $([Суббота]).attr('colspan',day6);
                $('#subjects').append('<td></td>');
                for (var i in data) {

               // $('#Понедельник').append("<tr><td>1</td><td>Thomas</td></tr>");
                if (data[i].typesubject=="практика") $('#subjects').append('<td id="'+data[i].subjectId+'"class="typesPractice">'+data[i].subjectName+'</td>');
                else $('#subjects').append('<td id="'+data[i].subjectId+'"class="typesLection">'+data[i].subjectName+'</td>');
                $('.check').append('<td><input type="checkbox"></td>');
                $('.check2').append('<td><input type="checkbox" class="chkParent"></td>');

                }
                $('#table1 input:checkbox').change(function(e) {
                    if(this.checked) {
                        var value = parseInt($(this).closest('td').next('td').text(), 10);
                        alert(value);
                        // above will convert it from a string to an integer
                    }
                    else {
                        // same as above? Seems redundant
                    }
                });

                //$("#table1 tr td:nth-child(1) input[type=checkbox]").prop("checked", true);

                $('.chkParent').on("change", function() {
                    var $cb = $(this),
                        $th = $cb.closest("td"), // get parent th
                        col = $th.index() + 1;  // get column index. note nth-child starts at 1, not zero
                    alert(col);
                    $("tbody td:nth-child(" + col + ") input").prop("checked", this.checked);  //select the inputs and [un]check it
                });
            }
        });
    };
    attendance();
});

/*
<form method="POST" enctype="multipart/form-data" >
    <input type="hidden" name="chk" value="update">
    <table border="groove" cellpadding="15px">
<tr>
<td>s.no</td>
<td>Reg. No</td>
<td>name</td>
<td>Present</td>
</tr>

<?php
    include_once("yourconfig.php"); //add here your db config file
extract($_POST);
//After Click on Submit Call this
if(isset($btnAbsent))
{
    foreach($attend as $atn_key=>$atn_value)
    {
        if($atn_value=="present")
        {
            $upd_qry="UPDATE attendance SET present=present+1 where s_no='".$atn_key."'";
            mysql_query($upd_qry);
        }
        elseif($atn_value=="absent")
        {
            $upd_qry="UPDATE attendance SET absent=absent-1 where s_no='".$atn_key."'";
            mysql_query($upd_qry);
        }
    }
}


//Default call this
$check_exist_qry="select * from attendance";
$rs=mysql_query($check_exist_qry);
$total_found=mysql_num_rows($rs);
while ($row = mysql_fetch_assoc($rs))
{
    $id=  $row['s_no'];
    $no[]=  $row['std_reg_no'];
    echo "<tr><td>";
    echo $row['s_no']."</td><td>";
    echo $row['std_reg_no']."</td><td>";
    echo $row['std_name']."</td>";
    echo "<td> <input type='radio' name='attend[$id]' value='present' >Present &nbsp; <input type='radio' name='attend[$id]' value='absent'>absent</td></tr>";
}

echo "</table>";
echo "<input type='submit' name='btnAbsent' value='submit'>";
    ?>
</form>*/




