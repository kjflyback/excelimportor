var server = {
	extid: "",
	send: function(obj, response) {
		// console.log(obj);
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
	toitem:function(index, done){
			server.send({
				cmd:'toitem',
				index:index
			}, done)
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
	},
	locate:function(leftorright){
		server.send({
			cmd:'locate', locate:leftorright
		},function(){
			
		})
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
	// 已经存在窗口则不继续检查
	if($("#flow").length) return;
	setTimeout("checkIsNeedShowWindow()", 1000);
	
	service.querydata(function(data){
		// console.log(data);
		var isNeed = false;
		for(var k in data.match){
			// 检查是否存在特定的控件名称
			// console.log(k);
			var obj = // $("[name='" + k + "']")[0];
				xpath2objlist(window.atob(k));
			// console.log(obj)
			if(obj.length){
				isNeed = true;
				break;
			}
		}
		if(!isNeed) return;
		
		addFlowControl(data.row, data.locate);
	});
}

function addFlowControl(row, locate){
		alert(locate)
        var div = document.createElement("div");
        div.id = "flow";
        div.innerHTML = 
"<button id='left-align'>&lt;</button> <button id='right-align'>&gt;</button>\n\
批量数据填表助手 行号:<span id='agency_row'> \
</span><br><button id='agency_prev'>上一条</button>\
<button id='agency_next'>下一条</button>\n第<input type='text' id='skipitem' size='3' value='1'>条";
        div.style = "box-shadow: 2px 2px 5px #888888;color:white;padding:10px;valign:middle;border-radius: 6px;position:fixed;bottom: 1rem;z-index: 9999;background-color: darkblue;"
        document.body.appendChild(div);
		if((locate == 'left') || (locate == 'right')){
			$("#flow").css(locate, "1rem");
		}
		
		$("#left-align").click(function(){
			$("#flow").css("left", "1rem");
			$("#flow").css("right", "");
			service.locate("left")
		})
		$("#right-align").click(function(){
			$("#flow").css("left", "");
			$("#flow").css("right", "1rem");
			service.locate("right")
		})
		$("#skipitem").keydown(function(event){
			if(event.keyCode ==13){
				// alert($("#skipitem")[0].value)
				service.toitem($("#skipitem")[0].value, function(){
					fillData()
				});
			}
		})
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
			var xpathString = window.atob(k)
			// console.log("xpath值")
			// console.log(xpathString)
			var obj = // $("[name='" + k + "']")[0];
				xpath2objlist(xpathString)[0];
			if(obj == undefined) continue
			// console.log(obj)
			// element UI 适配, element UI 的 select 是用 input 再套一层 额外的 ul li span 然后click绑定 事件
			// 经过仔细核对,普通input 的 parentelement是没有 el-input--suffix这个类名的
			// 只有elementUI的 select是有的 el-input--suffix
			// elementUI 的时间选择控件既有 el-input-suffix 又有 el-date-editor--date
			// 所以优先需要 el-date-editor--date 的选择
			// 后续再进行 el-input--suffix 的判断
			if(obj.parentElement.className.includes("el-date-editor--date")){
				let evt = document.createEvent('HTMLEvents');
				evt.initEvent('input', true, true);
				$(obj).val(val);
				obj.dispatchEvent(evt)
				// 因为时间控件已经变了 可以输入并搜索了,可以键入最终的值
				/*
				if (val) {
					console.log("日期" + val)
					let valDate = new Date(val);
					let elementUIDate = valDate.getDate()
					console.log(elementUIDate)
					//只有自动化测试软件里有这个功能
					//span[text()[normalize-space()='15']]
					//let select_click_obj = xpath2objlist("//span[text()[normalize-space()='" + elementUIDate + "']")[0]
					
					//先点击控件后可以出现以下控件
					//table[@class='el-date-table']//td[@class='available']//div//span
					//
					//let select_click_obj = xpath2objlist("/table[@class='el-date-table']//td[@class='available']//div//span")[0]
					//结果还是选择不到,可能是选择器的问题
					//console.log(select_click_obj)
					console.log($(".el-date-table>tbody>.el-date-table__row>.available>div>span"))
					console.log("换一种选择")
					
					///$(select_click_obj).click()
					//window.fuck_all = select_click_obj
				}
				continue;
				*/
			
			}else if(obj.parentElement.className.includes("el-input--suffix")){
				let select_click_obj =xpath2objlist("//span[text()='"+val+"']")[0]
				//console.log(select_click_obj)
				$(select_click_obj).click()
				//window.fuck_all=select_click_obj
				continue;
			}else if(obj.type == 'radio'){
				// 不能改变它的value，而是从同名的radio中打check
				// 查找同name的val
				var nameOfE = obj.name;
				var tags = document.querySelectorAll("[name='" + nameOfE + "']");
				tags.forEach(function(inobj){
					console.log(inobj.value); 
					if(inobj.value == val) 
					inobj.checked = true;
					})
					continue;
			}else if(obj.type == "select-one"){
				val = $(obj).find("option:contains('" + val + "')").val() || val;
				// console.log(val);
			}else if(obj.type == "checkbox"){ // 对checkbox加入识别, 可判读 1/是/有			
				if(val && (val == 1) || (val == "1") || (val == "是") || (val == "有")){
					obj.checked = true;
				}else{
					obj.checked = false;
				}
				continue;
			}
			// 为了避免直接通过js设置input的value时无法出发键盘事件导致无法提交，需要触发一次键盘事件
			let evt = document.createEvent('HTMLEvents');
			evt.initEvent('input', true, true);
			//尝试加入 鼠标选择事件，暂时因为选不中所需要的控件，失败
			let evt_click = document.createEvent('HTMLEvents');
			evt_click.initEvent('click', true, true);
			$(obj).val(val);
			obj.dispatchEvent(evt)
			//obj.dispatchEvent(evt_click)
			
		}
	})
}
function setMenuData(e, data, match){
	// console.log(e);
	var objFor = $(e.target).attr('for');
	// console.log(objFor);
	var msgForRadio = []
	var targetObject = xpath2objlist(window.atob(objFor))[0];
	if(targetObject.type == 'radio'){
		var nameOfRadio = targetObject.name;
		document.querySelectorAll("[type='radio'][name='" + nameOfRadio + "']").forEach(
			function(obj){
				msgForRadio.push(obj.value)
			}
		)
	}
	var radioMsg = "";
	if(msgForRadio.length){
		radioMsg = "<strong>单选按钮的取值为:" + msgForRadio.join(",") + "其中之一,请在excel中填入这些值</strong><br>";
	}
	var showtable = $("<table style='border-collapse: collapse;'></table>");
	var ch = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
	var columnName = ch.split('');
	
	var index = match[objFor];
	for (var k in data) {
		
		var radio = "<input type='radio' name='datatarget' colid='" + k + "' for='" + objFor + "' " + (k == index?"checked":"")+ "></input>";
		$(showtable).append($("<tr><td style='border:1px solid black;'>" 
		+ (columnName[k] || (k + '列'))
		+ "</td><td  style='border:1px solid black;'>" 
		+ radio + "</td><td style='border:1px solid black;' columnid='" 
		+ k + "'>"
		+ data[k] + "</td></tr>"));
	}
	var recordBtn = $("<button id='prev'>上一条</button><button id='next'>下一条</button><button id='load'>载入缓存</button><button id='download'>下载存档</button><input type='file' id='upload'/>");
	var flowDiv = $("<div style='position:absolute;background:gainsboro;border:solid 1px darkgrey;width:300px;height:auto;'></div>")
	.append(radioMsg)
	.append(recordBtn)
	.append(showtable);
	
	e = e || window.event;
	flowDiv.css("left", e.clientX);
	flowDiv.css("top", 0);
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
	$("#load").click(function(e){		
		loadPattern()
		console.log("载入之前存档")
	});
	$("#download").click(function(e){		
		downloadPattern()
		console.log("下载存档")
	});
	$("#upload").change(function(e){		
		uploadPattern()
		console.log("上传存档")
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
		storage.setItem("excelimportor_" + objFor, index);
	});
}
function showXlsData(e) {
	// console.log('showxls');
	// var forObjName = $(e.srcElement).attr("for");
	
	service.querydata(function(data) {
		// console.log(data)
		setMenuData(e, data.data, data.match);		
	})
	
	
}

function activeOperation() {
	$(document).mouseup(function(e) {
		if(e.target.id == "datamenu") return;
		if($(e.target).parents("#datamenu").length > 0) return;
		
		// 绑定数据
		if($("#datamenu").length)
				$("#datamenu").remove();
				
		if(e.target.id == "highlightControl") return;
		
		if($("#highlightControl").length){
			$("#highlightControl").remove();
		}
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
		var objName = readXPath(obj);
		
		if(!$('[for="' + window.btoa(objName) + '"]')) return;
		
		// 显示操作窗口
		var pos = {
			top: $(obj).offset().top + 2,
			//left: $(obj).offset().left + obj.offsetWidth + 3
			//一些输入框过长，选择从左对齐进行输入
			left: $(obj).offset().left + 3
		};

		var cover =
			"<div style='position:absolute; background-color:red;color:yellow;valign:middle;text-align:center;border-radius: 3px;" +
			"width:16" + /*obj.offsetWidth + */ "px;" + "height: " + (obj.offsetHeight - 4) + "px;" +
			"' id='highlightControl' for='" + window.btoa(objName) + "' title='点击进行配置'></div>";
		// console.log(cover);
		cover = $(cover);
		cover.text('>');
		
		$("body").append(cover);

		cover.offset({
			top: pos.top,
			left: pos.left
		});
		
		// console.log(readXPath(obj));
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
		// find obj
		// console.log(key);
		if(!key.length) continue;
		// "excelimportor_" + 
		if(key.indexOf("excelimportor_") == -1) continue;
		var encodeKey = key.substring("excelimportor_".length);
		
		var xpathString = window.atob(encodeKey);
		// console.log(xpathString);
		var objlst = xpath2objlist(xpathString);
		
		if(objlst.length){
			var val = storage.getItem(key);
			service.match[encodeKey] = val;
			service.binding(val, encodeKey);
		}
	}
}

function downloadPattern(){
	var storage = window.localStorage;
	for(var i = 0;i<storage.length;i++){
		var key = storage.key(i)
		// find obj
		// console.log(key);
		if(!key.length) continue;
		// "excelimportor_" + 
		if(key.indexOf("excelimportor_") == -1) continue;
		
		var encodeKey = key.substring("excelimportor_".length);
		
		var xpathString = window.atob(encodeKey);
		// console.log(xpathString);
		var objlst = xpath2objlist(xpathString);
		
		if(objlst.length){
			var val = storage.getItem(key);
			service.match[encodeKey] = val;
			service.binding(val, encodeKey);
		}
	}

	let storage_json=JSON.stringify(JSON.stringify(storage));

	let Link =document.createElement("a");
	Link.download="关联信息.json"
	Link.style.display ='none'
	let blob =new Blob([storage_json])
	Link.href=URL.createObjectURL(blob)
	document.body.appendChild(Link);
	Link.click()
	document.body.removeChild(Link)
}

function uploadPattern() {
  var selectedFile = document.getElementById("upload").files[0];//获取读取的File对象
  var name = selectedFile.name;//读取选中文件的文件名
  var size = selectedFile.size;//读取选中文件的大小
  console.log("文件名:"+name+"大小："+size);
  var reader = new FileReader();//这里是核心！！！读取操作就是由它完成的。
  reader.readAsText(selectedFile);//读取文件的内容
 
  reader.onload = function(){
    console.log("读取结果：", this.result);//当读取完成之后会回调这个函数，然后此时文件的内容存储到了result中。直接操作即可。
 
    console.log("读取结果转为JSON：");
    let json = JSON.parse(JSON.parse(this.result));
		console.log(json);
    Object.keys(json).forEach(function (k) {
      localStorage.setItem(k, json[k]);
			//console.log(k)
    });
  };
}

chrome.runtime.onMessage.addListener(
	function(request, sender, sendResponse) {
		if (client[request.cmd] != undefined) client[request.cmd](request, sender);
		sendResponse();
	}
);


//获取xpath
function readXPath(element) {
	// console.log(element);
    if (element.id !== "" && element.id != undefined) {//判断id属性，如果这个元素有id，则显 示//*[@id="xPath"]  形式内容
        return '//*[@id=\"' + element.id + '\"]';
    }
    //这里需要需要主要字符串转译问题，可参考js 动态生成html时字符串和变量转译（注意引号的作用）
    if (element == document.body) {//递归到body处，结束递归
        return '/html/' + element.tagName.toLowerCase();
    }
    var ix = 1,//在nodelist中的位置，且每次点击初始化
         siblings = element.parentNode.childNodes;//同级的子元素
 
    for (var i = 0, l = siblings.length; i < l; i++) {
        var sibling = siblings[i];
        //如果这个元素是siblings数组中的元素，则执行递归操作
        if (sibling == element) {
            return arguments.callee(element.parentNode) + '/' + element.tagName.toLowerCase() + '[' + (ix) + ']';
            //如果不符合，判断是否是element元素，并且是否是相同元素，如果是相同的就开始累加
        } else if (sibling.nodeType == 1 && sibling.tagName == element.tagName) {
            ix++;
        }
    }
};

function xpath2objlist(STR_XPATH) {
    var xresult = document.evaluate(STR_XPATH, document, null, XPathResult.ANY_TYPE, null);
    var xnodes = [];
    var xres;
    while (xres = xresult.iterateNext()) {
        xnodes.push(xres);
    }

    return xnodes;
}

loadPattern();
// console.log(service.match)

fillData();

checkIsNeedShowWindow();
