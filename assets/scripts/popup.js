(function(){

    function bgPage(){
        return chrome.extension.getBackgroundPage();
    }
    var bg = chrome.extension.getBackgroundPage();
    bg.initConnect(function () {
        bg.getTabUrls(function (url) {

            var target = document.getElementById("target");
            var d = document.createElement("input");
            d.type = "radio";
            d.name = "targetpage";
            d.setAttribute('url', url);
            target.appendChild(d);

            var txt = document.createElement("span");
            txt.innerText = url;
            target.appendChild(txt);
            target.appendChild(document.createElement("p"));

            // save current select url
            $("input[name='targetpage']").click(function () {
                console.log(this);
                if ($(this).prop("checked") == false) return;

                var targeturl = $(this).attr('url');
                bgPage().cacheData.url = targeturl;
                console.log(bgPage().cacheData.url);
            });
            $("input[name='targetpage'][url='" + bgPage().cacheData.url + "']").prop("checked", "checked");
        });


    });
    $("#refresh").click(function(){
        var targeturl = $("[name='targetpage']:checked").attr('url');
        console.log(targeturl);
        bg.analyze(targeturl, function(namelist){
            bgPage().cacheData.matchtable = {};
            $("#namelist").html("");
            namelist.forEach(element => {
                bgPage().cacheData.matchtable[element] = undefined;
            });
           
            rematch();
        });
    });
    
    function rematch() {
        console.log("rematch");
        var sel = "<option>无对应</option>\n";
        var ch = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

        ch.split('').forEach(c => {
            sel += "<option>" + c + "</option>\n";
        });

        var matchtable = bgPage().cacheData.matchtable;
        

        $("#namelist").html("");
        for(var ele in matchtable){
            
            var element = ele;
            if (element == "") continue;
            $("#namelist").append($('<tr><td class="formName" src="' + element + '">' + element + '</td><td><select column="' +
                element + '" class="column">' + sel + '</select></td><td xlse="' + element + '" class="value"></td></tr>'));
            console.log(matchtable[ele]);
            document.querySelector("select.column[column='" + element + "']").value = matchtable[ele];
        };

        console.log("rematch2");

        $(".formName").hover(function () {
            // alert($(this).attr('src'));
            console.log("high");
            bgPage().highlight(true, $("[name='targetpage']:checked").attr('url'), $(this).attr('src'));
        }, function () {
            bgPage().highlight(false, $("[name='targetpage']:checked").attr('url'), $(this).attr('src'));
        });
        console.log("rematch3");
       
        $("select.column").change(function(){
            console.log(this);
            bgPage().cacheData.matchtable[$(this).attr('column')] = this.value;
            reShowData();
        });
        
   }

   function reShowData(){
    $(".value").each(function(obj){
        
        var ele = $(this).attr('xlse');
        var col = $("select.column[column='" + ele + "']")[0].value;

        // console.log(col);
        var v = bgPage().getXlsCell(col);
        // console.log(v);
        this.innerText = v || '';
        bgPage().fillData(ele, v);
    });
}
    function reBuildView(){
        

        document.querySelector("#currentFile").innerText = bgPage().cacheData.file || "未指定";
        $("#sheetnames").html("");
        (bgPage().cacheData.SheetNames || []).forEach(s =>{
            $("#sheetnames").append($("<option>" + s + "</option>"));
            // 保存第一个到内存
        });
        document.querySelector("#sheetnames").value = bgPage().cacheData.select;
        
    }
   
    $("#xlsFile").change(function (e) {
        bgPage().readWorkbookFromLocalFile(e.target.files[0], function (SheetNames) {
            bgPage().cacheData.file = document.querySelector("#xlsFile").value;
            bgPage().cacheData.SheetNames = SheetNames;
            bgPage().cacheData.select = SheetNames[0];
            reBuildView();
        })
    });

    $("#preview").click(function(){
        bgPage().preViewSheet(document.querySelector("#sheetnames").value);
    });

    $("#sheetnames").change(function(){
        bgPage().cacheData.select = document.querySelector("#sheetnames").value;
        reShowData();
    })

    $("#prev").click(function(){
        if(bgPage().cacheData.currentRow){
            if(bgPage().cacheData.currentRow > 0)
                bgPage().cacheData.currentRow --;
            
        }else{
            bgPage().cacheData.currentRow = 1;
        }
        reShowData();
    })

    $("#next").click(function(){
        if(bgPage().cacheData.currentRow){
            bgPage().cacheData.currentRow ++;
        }else{
            bgPage().cacheData.currentRow = 1;
        }
        reShowData();
    })
    reBuildView();
    rematch();
    reShowData();
})();