

(function(){
    // console.log('inject');
    var conn ;
    chrome.runtime.onConnect.addListener(function(port){
        console.log('onConnect');
        
        port.onMessage.addListener(function(msg){
            
            if(msg.cmd == 'geturl'){
                port.postMessage({cmd:'url', url:window.location.href});
            }else if(msg.cmd == 'analyze' && msg.url == window.location.href){
                var idList = [];
                document.querySelectorAll('form input').forEach(function(obj){
                    idList.push(obj.name);
                });
                port.postMessage({cmd:'analyze', namelist:idList,url:window.location.href});
                addFlowControl(msg.row);
            } else if (msg.cmd == 'highlight' && msg.url == window.location.href) {
                console.log("hight");

                $("#highlightControl").remove();
                if (!msg.show) return;

                var obj = document.querySelector("[name='" + msg.name + "']");
                obj.scrollIntoView();

                console.log(obj.Width);
                var pos = { top: $(obj).offset().top, left: $(obj).offset().left };

                var cover =
                    "<div style='position:absolute; background-color:black;color:yellow;valign:middle;text-align:center;" +
                    "width:" + obj.offsetWidth + "px;" + "height: " + obj.offsetHeight + "px;" +
                    "' id='highlightControl'></div>";
                console.log(cover);
                cover = $(cover);
                cover.text(msg.name);

                $("body").append(cover);

                cover.offset({ top: pos.top, left: pos.left });



            } else if (msg.cmd == 'filldata' && msg.url == window.location.href) {
                //console.log(msg);
                var obj = $("input[name='" + msg.id + "']");
                //console.log(obj);
                obj.val(msg.value);
            } 
        });
        
    });
    chrome.runtime.sendMessage({cmd:"active", url:window.location.href}, function(response){
        if(response.url != window.location.href) return;
        addFlowControl(response.row);
    });
    function addFlowControl(row){

    // }
    // 

        // if(response.url != window.location.href) return;

        var div = document.createElement("div");
        div.id = "flow";
        div.innerHTML = "批量数据填表助手 行号:<span id='agency_row'></span><button id='agency_prev'>上一条</button><button id='agency_next'>下一条</button>";
        div.style = "position:fixed;bottom: 1rem;left: 1rem;z-index: 9999;background-color: aqua;opacity:0.6;"
        document.body.appendChild(div);

        $("#agency_row").text(row);

        $("#agency_prev").click(function () {
            chrome.runtime.sendMessage({ cmd: 'prev', url: window.location.href }, function(response){
                $("#agency_row").text(response.row);
            });
        })
        $("#agency_next").click(function () {
            chrome.runtime.sendMessage({ cmd: 'next', url: window.location.href }, function(response){
                $("#agency_row").text(response.row);
            });
        })
    }

})();