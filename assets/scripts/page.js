var targetList =
{
    "name": "门店名称",
    "merchno": "店铺编号",
    "bankId": "银行编号",
    "areaId": "归属区域id",
    "areaName": "归属区域",
    // "subCompany": "所属分公司",
    "firstSubBank": "一级分行",
    "secondSubBank": "二级分行",
    "orgaddress": "地址",
    "telno": "电话"
}
var targetFix = [{
    'id':'subCompany',
    'val':1,
    'selector':'#s2id_subCompany .select2-chosen',
    'text':"北京分公司"
},{
	'id':'selectSheet',
	'val':window.localStorage.getItem('select')
}
]

var flow = chrome.extension.getURL('assets/scripts/flow.html')
    // var page = chrome.extension.getURL('assets/scripts/page.js')

    $.get(flow,{}, function(html){
        var div = document.createElement("div");
        div.id = "flow";
        div.innerHTML = html
        div.style = "height:500px;position:fixed;top:1rem;bottom: 0rem;right: 1rem;left:500px;z-index: 9999;background-color: aqua;opacity:0.8;"
        document.body.appendChild(div);
        // console.log("add flow.html")
        // var js = document.createElement('script');
        // js.src = page
        // document.body.appendChild(js);
        buildMatchTable();
        updatestore()

        $("#xlsFile").change(function (e) {
            readWorkbookFromLocalFile(e.target.files[0], function () {
                readWorkbook();
            })
        });
        $("#savetosql").click(function(e){
            // saveToWebSQL();
            exportData();
        })
        $("#manager").change(function(e){
            var storage=window.localStorage;
            storage.setItem('manager', this.value);
        })
        $('#statisticBtn').click(function(e){
            statiticData()
        })
        $('#savecur').click(function(e){
            saveToWebSQL();
        })
        
    });

window.hackdata = {}
window.hackdata.first = true;
window.hackdata.counter = 1;
const port = chrome.runtime.connect({});

port.onMessage.addListener(function(msg){
    console.log(msg);
    switch(msg.cmd){
        case 'getworkbook':{
                window.hackdata.workbook = msg.getworkbook;
                readWorkbook()
            }
            break;
        case 'range':{
        	if(msg.range){
        		document.querySelector('#areaId').value = msg.range.id;
        		document.querySelector('#areaName').value = msg.range.name;
        	}
        }
        break;
        default:
            break;
    }
});

function getWorkBook(){
    port.postMessage({'cmd':'getworkbook'});
}

function AttachXls(data){
    var workbook = XLSX.read(data, { type: 'binary' });
    window.hackdata.workbook = workbook;
    window.hackdata.counter = 1;
    savetostore();
    port.postMessage({'cmd':'attach', 'attach':workbook});
}




function saveMatch(){
	var storage=window.localStorage;
	for(var l in targetList){
		var obj = document.getElementById(l + '_select').value;
		storage.setItem(l, obj);
	}
}
function reloadMatch(){
	var storage = window.localStorage;
	for(var l in targetList){
        console.log(l)
        var obj = storage.getItem(l);
        if(typeof obj != NaN)
        	document.getElementById(l + '_select').value = obj
    }
    getWorkBook();
    // window.hackdata.worksheet = window.localStorage.getItem('worksheet')
}


function setSheet(){
	var selectSheet = document.getElementById('selectSheet');
	// window.hackdata.counter = 1
        savetostore()
        if(window.hackdata.workbook == undefined) return;
        
        window.hackdata.worksheet = window.hackdata.workbook.Sheets[selectSheet.value];
       
        var xlsdata = document.getElementById('xlsdata');
        var samples = XLSX.utils.sheet_to_csv(window.hackdata.worksheet)
        xlsdata.innerHTML = csv2table(samples)
}
function savetostore(){
	var storage=window.localStorage;
    storage.setItem('counter', window.hackdata.counter);
    storage.setItem('select', document.getElementById('selectSheet').value)
}
function updatestore(){
	var storage = window.localStorage;
	window.hackdata.counter = parseInt(storage.getItem('counter'));
	if(window.hackdata.counter == undefined){
		window.hackdata.counter = 1;
    }
   
    document.getElementById('manager').value = storage.getItem('manager')
  	document.getElementById('selectSheet').innerHTML = "<option>" + storage.getItem('select') + "</option>";
  	document.getElementById('selectSheet').value = storage.getItem('select');
  	setSheet();
  // }
   targetFix.forEach(function(c){
        document.getElementById(c.id).value = c.val;
        if(c.selector)
                document.querySelector(c.selector).innerText = c.text;
    })
    function Date2Str(time){
        var day = ("0" + time.getDate()).slice(-2);
        var month = ("0" + (time.getMonth() + 1)).slice(-2);
        var today = time.getFullYear() + "-" + (month) + "-" + (day);
        return today
    }
    var dt = new Date()
    var bdt = new Date(dt.getTime() - 2 * 24 * 3600 * 1000)

    

    var bdttxt = Date2Str(bdt)
    var dttxt = Date2Str(dt)
    console.log(bdttxt, dttxt)
    document.querySelector("#btime").value = bdttxt
    document.querySelector("#etime").value = dttxt
}



function fillData(){
    var curSelRow = document.querySelector(".select") || {'className':''}
    curSelRow.className = '';

    var curNewSelRow = document.querySelector("tr[data='" + (window.hackdata.counter - 1) + "']") || 
    {'className':'', 'scrollIntoView':function(a){}}
    curNewSelRow.className = 'select';
    curNewSelRow.scrollIntoView(true);

    for (var n in targetList) {
        // console.log(n);
        var obj = document.getElementById(n + '_select').value;
        // console.log(obj + window.hackdata.counter)
        var val = window.hackdata.worksheet[obj + window.hackdata.counter]
        if(val != undefined){
          document.getElementById(n).value = val.v || '';
        	if(n == 'areaName'){
        		port.postMessage({'cmd':'getrangdat', 'getrangdat':val.v});
        	}
        }else{
            document.getElementById(n).value = '';
        }    
    }
    
    
}

document.body.onkeyup = function (e) {
    // reset current counter
    console.log(e);
    if (e.keyCode == 118) { // F1 back
        console.log('keyup F7');
        if (window.hackdata.first && window.hackdata.counter > 0) {
            window.hackdata.counter -= 1;
            // window.hackdata.first = false; // can't keep -1
			fillData();
			savetostore();
        }
    }
    if (e.keyCode == 119) { // F2 next
        console.log('keyup F8');
        
            window.hackdata.counter += 1;
            // window.hackdata.first = false; // can't keep -1
			fillData();
			savetostore();
        
    }
}


function saveToWebSQL(){
    var manager = document.getElementById('manager').value
    var newRow = {manager:manager}
    for (var n in targetList) {
       var obj = document.getElementById(n);
       if(obj){
           newRow[n] = obj.value
       }     
    }
    console.log(newRow);
    payImportDb.addNewRow(newRow,function(){
        console.log('add new record done')
    })
}


function exportData(){
    var book = []
    var managerLst = []
    document.querySelectorAll('#manager option').forEach(function(obj){
        managerLst.push(obj.innerText)
    })
    var btime = document.querySelector("#btime").value
    var etime = document.querySelector("#etime").value

    managerLst.forEach(function(m){
        payImportDb.getRowsByManager(m, function(rows){
            var d = {'name':m, 'data':[]}            
            for(var i = 0;i<rows.length;i++){
                d['data'].push(rows.item(i))
            }
            book.push(d);
            if(book.length == managerLst.length){
                WriteBook(book)
            }
        }, btime, etime)        
    })
}

function statiticData(){
    var btime = document.querySelector("#btime").value
    var etime = document.querySelector("#etime").value
    payImportDb.statisticsByFirstSubBank(function(rows){
        var stable = document.querySelector('#statistic');
        var shtml = "<tr><td>经理</td><td>所属区域</td><td>数量</td><tr>";
        for(var i = 0;i<rows.length;i++){
            shtml += "<tr>"
            var dat  = rows.item(i)
            for(var k in dat){
                shtml += "<td>" + dat[k] + "</td>"
            }
            shtml += "</tr>"
            // rows.item(i)
        }
        stable.innerHTML = shtml
    }, btime, etime)
}

function WriteBook(book){
    var myDate = new Date();
    var date = myDate.toLocaleDateString();
    date += ".xlsx"
    var wbook = XLSX.utils.book_new()

    book.forEach(function(obj){
        var arr = new Array()
        /*
        // 店铺经营名称
        // 商户号
        // 店铺号
        // 所属一级
        // 所属二级
        // 店铺地址
        // 店铺联系方式
        // 区域负责人
            */
        var title = `店铺经营名称,商户号,店铺号,所属一级,所属二级,店铺地址,店铺联系方式`
        var titleKeys = [
            'name' ,
        'bankId' ,
        'merchno',
        // 'deptName' ,
        // 'areaName' ,
        'firstSubBank' ,
        'secondSubBank' ,
        'orgaddress' ,
        'telno' ]
        arr[0] = title.split(',')
        obj.data.forEach(function(row, idx){
            var valLst = []
            titleKeys.forEach(function(k){
                valLst.push(row[k])
            })
            arr[idx + 1] = valLst
        })
        var ws = XLSX.utils.aoa_to_sheet(arr)
        XLSX.utils.book_append_sheet(wbook, ws, obj.name)
    })

    XLSX.writeFile(wbook, date);   
    
}
document.querySelector('#btnSubmit').onclick = function (e) {
    // fillData();
    saveToWebSQL();
};


// 

function buildMatchTable() {
    var selectSheet = document.getElementById("selectSheet");
    selectSheet.onchange = function (e) {
       setSheet();
    }
    var Div = document.getElementById("targetSelect");

    var table = "<tr>";
    for (var n in targetList) {
        // label & selection
        var tr = "<td>";
        tr += "<div id='" + n + "_Label'>";
        tr += targetList[n]
        tr += "<select id = '" + n + "_select' class='xlssel' style='width:50px;'>";

        'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').forEach(function (c) {
            tr += "<option value='" + c + "'>" + c +  " 列</option>"
        });
        tr += "</td>"
		table += tr;
    };
    table += "</tr>"
    Div.innerHTML = table;
    $('.xlssel').change(function(o){
        saveMatch();
    })
	reloadMatch();
}

function readWorkbook() {
    var workbook = window.hackdata.workbook;
    if(workbook == undefined) return;

    var sheetNames = workbook.SheetNames; // 工作表名称集合
    var selectSheet = document.getElementById('selectSheet');
    selectSheet.innerHTML = "<option>select a sheet</option>" + 
    	"<option value='" + window.localStorage.getItem('select') + "' selected='selected'>" + 
    	window.localStorage.getItem('select') +
    	"</option>"
    ;
    sheetNames.forEach(function (sh) {
        var option = document.createElement("option");
        option.innerText = sh;
        option.value = sh;
        selectSheet.appendChild(option);
    });
    setSheet();
    // var worksheet = workbook.Sheets[sheetNames[0]]; // 这里我们只读取第一张sheet
	
}

// 读取本地excel文件
function readWorkbookFromLocalFile(file, callback) {
    var reader = new FileReader();
    reader.onload = function (e) {
        var data = e.target.result;
        // var workbook = XLSX.read(data, { type: 'binary' });
        // window.hackdata.workbook = workbook;
        // save workbook
        AttachXls(data);
        if(callback) callback();
    };
    reader.readAsBinaryString(file);
}



// 将csv转换成表格
function csv2table(csv) {
    var html = '';
    var rows = csv.split('\n');
    rows.pop(); // 最后一行没用的
    var index = 0;
    rows.forEach(function (row, idx) {
        
        var columns = row.split(',');
        columns.unshift(idx + 1); // 添加行索引
        if (idx == 0) { // 添加列索引
            html += '<tr>';
            for (var i = 0; i < columns.length; i++) {
                html += '<th>' + (i == 0 ? '' : String.fromCharCode(65 + i - 1)) + '</th>';
            }
            html += '</tr>';
        }
        html += '<tr data="' + idx + '">';
        columns.forEach(function (column) {
            html += '<td>' + column + '</td>';
        });
        html += '</tr>';
        index ++;
        
    });
    html += '';
    return html;
}

