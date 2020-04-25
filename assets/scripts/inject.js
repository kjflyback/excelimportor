var server = {
	extid: "",
	send: function(obj, response) {
		chrome.runtime.sendMessage( obj, function(rp) {
			if (response) response(rp);
		});
	}
}
var service = {
	match:{},
	cache:undefined,
	reporthref: function() {
		server.send({
			cmd: "reporthref",
			href: window.location.href
		});
	},
	querydata: function( list) {
		server.send({
			cmd: "querydata"
		}, function(data){
			if(data == undefined) return;
			if(list) list(data);
			this.match = data.match;
			this.cache = data.data;
		});
	},
	prev:function(done){
		server.send({
			cmd:'prev'
		}, done);
	},
	next:function(done){
		server.send({
			cmd:'next'
		}, done);
	},
	binding:function(index,objName){
		// save to localstorage
		
		
		server.send({
			cmd:'binding',
			objName:objName,
			index:index
		});
		
		
	},
	getIndex:function(objName, done){
		server.send({
			cmd:'getIndex',
			objName:objName
		},done)
	}
}

var client = {
	isactived: false,
	query: function(rq, sender) {
		server.extid = sender.id;
		service.reporthref();
	},
	active: function(rq, sender) {
		// console.log(rq);
		if (this.isactived) return;
		this.isactived = true;
		activeOperation();
		
	}
}

function checkIsNeedShowWindow(){
	service.querydata(function(data){
		// console.log(data);
		var isNeed = false;
		for(var k in data.match){
			// 检查是否存在特定的控件名称
			// console.log(k);
			var obj = $("[name='" + k + "']");
			// console.log(obj)
			if(obj.length){
				isNeed = true;
				break;
			}
		}
		if(!isNeed) return;
		
		addFlowControl(data.row);
	});
}

function addFlowControl(row){

        var div = document.createElement("div");
        div.id = "flow";
        div.innerHTML = "批量数据填表助手 行号:<span id='agency_row'></span><br><button id='agency_prev'>上一条</button><button id='agency_next'>下一条</button>";
        div.style = "box-shadow: 2px 2px 5px #888888;color:white;padding:10px;valign:middle;border-radius: 6px;position:fixed;bottom: 1rem;left: 1rem;z-index: 9999;background-color: darkblue;"
        document.body.appendChild(div);
		
		$("#agency_row").text(row);

        $("#agency_prev").click(function () {            
            	service.prev(function(){
            		fillData();
            	})          
        })
        $("#agency_next").click(function () {
            service.next(function(){
            	fillData();
            }) 
        })
		
    }

function fillData(){
	service.querydata(function(data){
		if(data == undefined) return;
		$("#agency_row").text(data.row);
		// console.log(data);
		for(var k in data.match){
			// console.log(k)
			var index = data.match[k];
			// console.log(index)
			var val = data.data[index];
			var obj = $("[name='" + k + "']")[0];
			if(obj == undefined) continue
			// console.log()
			if(obj.type == "select-one"){
				val = $(obj).find("option:contains('" + val + "')").val() || val;
				// console.log(val);
			}
			$(obj).val(val);
		}
	})
}
function setMenuData(e, data, match){
	// console.log(e);
	var objFor = $(e.target).attr('for');
	// console.log(objFor);
	
	var showtable = $("<table style='border-collapse: collapse;'></table>");
	var ch = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
	var columnName = ch.split('');
	
	var index = match[objFor];
	for (var k in data) {
		
		var radio = "<input type='radio' name='datatarget' colid='" + k + "' for='" + objFor + "' " + (k == index?"checked":"")+ "></input>";
		$(showtable).append($("<tr><td style='border:1px solid black;'>" 
		+ columnName[k] 
		+ "</td><td  style='border:1px solid black;'>" 
		+ radio + "</td><td style='border:1px solid black;' columnid='" 
		+ k + "'>"
		+ data[k] + "</td></tr>"));
	}
	var recordBtn = $("<button id='prev'>上一条</button><button id='next'>下一条</button>");
	var flowDiv = $("<div style='position:absolute;background:gainsboro;border:solid 1px darkgrey;width:300px;height:auto;'></div>")
	.append(recordBtn)
	.append(showtable);
	
	e = e || window.event;
	flowDiv.css("left", e.clientX);
	flowDiv.css("top", e.clientY);
	flowDiv.attr("id", "datamenu");
	$("body").append(flowDiv);
	
	$("#prev").click(function(e){
		service.prev(function(){
			service.querydata(function(data){
				for(var k in data.data){
					$("[columnid='" + k + "']").text(data.data[k]);
				}
			})
		})
	});
	$("#next").click(function(e){		
		service.next(function(){			
			service.querydata(function(data){				
				for(var k in data.data){
					$("[columnid='" + k + "']").text(data.data[k]);
				}
			})
		})
	});
	$("input[type='radio'][name='datatarget']").click(function(e){
		if(!$(this).is(":checked")){
			return;
		}
		// save relationship
		// console.log(objFor);
		var index = $(this).attr("colid");
		service.binding(index, objFor);
		var storage = window.localStorage;
		storage.setItem(objFor, index);
	});
}
function showXlsData(e) {
	console.log('showxls');
	// var forObjName = $(e.srcElement).attr("for");
	
	service.querydata(function(data) {
		console.log(data)
		setMenuData(e, data.data, data.match);		
	})
	
	
}

function activeOperation() {
	$(document).mouseup(function(e) {
		if(e.target.id == "datamenu") return;
		if($(e.target).parents("#datamenu").length > 0) return;
		
		// 绑定数据
		$("#datamenu").remove();
		// console.log(document.activeElement.tagName);
		// 除了body之外的都是操作对象
		if (document.activeElement.tagName == "BODY"  ) {
			// console.log(e);
			
			return;
		}
		if (document.activeElement.type == "submit") return;
		if (document.activeElement.type == "button") return;
		if (document.activeElement.tagName == "button") return;
		var obj = document.activeElement;
		var objName = obj.name;
		
		if(!$('[for="' + objName + '"]')) return;
		
		// 显示操作窗口
		var pos = {
			top: $(obj).offset().top + 2,
			left: $(obj).offset().left + obj.offsetWidth + 3
		};

		var cover =
			"<div style='position:absolute; background-color:red;color:yellow;valign:middle;text-align:center;border-radius: 3px;" +
			"width:16" + /*obj.offsetWidth + */ "px;" + "height: " + (obj.offsetHeight - 4) + "px;" +
			"' id='highlightControl' for='" + objName + "' title='点击进行配置'></div>";
		// console.log(cover);
		cover = $(cover);
		cover.text('>');
		
		$("body").append(cover);

		cover.offset({
			top: pos.top,
			left: pos.left
		});
		
		cover.click(function(e) {
			e = e || window.event;
			showXlsData(e);
			return false;
		});
	});


}

function loadPattern(){
	var storage = window.localStorage;
	for(var i = 0;i<storage.length;i++){
		var key = storage.key(i)
		if($("[name='" + key +"']")){
			var val = storage.getItem(key);
			service.match[key] = val;
			service.binding(val, key);
		}
	}
}

chrome.runtime.onMessage.addListener(
	function(request, sender, sendResponse) {
		if (client[request.cmd] != undefined) client[request.cmd](request, sender);
		sendResponse();
	}
);

loadPattern();
// console.log(service.match)
checkIsNeedShowWindow();
fillData();