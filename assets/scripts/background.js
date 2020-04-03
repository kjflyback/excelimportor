
var port;
var getUrlsCallBack = function(url){

};
var namelistCallBack;
var cacheurls = [];
var cacheData = {
	workbook:undefined,
	matchtable:[],
	currentRow:0
};

function getCurrentTab(callback) {
    chrome.tabs.query({
        active: true
    }, function (tabs) {
        if (tabs && tabs[0]) {
            callback(tabs[0]);
        }
    });
}

chrome.runtime.onMessage.addListener(function (request,sender,callback) {
	
	if(request.cmd == 'active'){
		callback({cmd:'active', url:cacheData.url, row:cacheData.currentRow});
		console.log(request);
		getCurrentTab(function(tab){
			if(port){
				port.disconnect();
				// port = undefined;
			}
	
			port = chrome.tabs.connect(tab.id, {});
	
			port.onMessage.addListener(function (msg) {
				// console.log('background.js' + msg);
				if (msg.cmd == "url") {
					cacheurls.push(msg.url);
					if (getUrlsCallBack) {
						getUrlsCallBack(msg.url);
					}
				}else if(msg.cmd == 'analyze'){
					if (namelistCallBack) {
						namelistCallBack(msg.namelist);
					}
				}
			});
		});
	}else if(request.cmd == 'prev' &&request.url == cacheData.url){
		if(cacheData.currentRow > 1)
			cacheData.currentRow --;
		for(var col in cacheData.matchtable){
			var xlsCol = cacheData.matchtable[col];
			// console.log(xlsCol);
			var value = getXlsCell(xlsCol);
			// console.log(value);
			fillData(col, value);
		}
		callback({cmd:'prev', row:cacheData.currentRow});
	}else if(request.cmd == 'next'&&request.url == cacheData.url){
		cacheData.currentRow ++;
		for(var col in cacheData.matchtable){
			var xlsCol = cacheData.matchtable[col];
			// console.log(xlsCol);
			var value = getXlsCell(xlsCol);
			// console.log(value);
			fillData(col, value);
		}
		callback({cmd:'prev', row:cacheData.currentRow});
	}
});

/*
chrome.tabs.onUpdated.addListener(function(tabid, changinfo, tab){
	console.log(changinfo);
	if(changinfo.status != "complete") return;
	getCurrentTab(function(tab){
		console.log(tab.id);
		port = chrome.tabs.connect(tab.id, {});

		port.onMessage.addListener(function (msg) {
			console.log(msg);
			if (msg.cmd == "url") {
				cacheurls.push(msg.url);
				if (getUrlsCallBack) {
					getUrlsCallBack(msg.url);
				}
			}else if(msg.cmd == 'analyze'){
				if (namelistCallBack) {
					namelistCallBack(msg.namelist);
				}
			}
		});
	})
})

*/
function initConnect(cb){
	/*
	getCurrentTab(function(tab){
		if(port){
			port.disconnect();
			// port = undefined;
		}

		port = chrome.tabs.connect(tab.id, {});

		port.onMessage.addListener(function (msg) {
			// console.log('background.js' + msg);
			if (msg.cmd == "url") {
				cacheurls.push(msg.url);
				if (getUrlsCallBack) {
					getUrlsCallBack(msg.url);
				}
			}else if(msg.cmd == 'analyze'){
				if (namelistCallBack) {
					namelistCallBack(msg.namelist);
				}
			}
		});
		
		if(cb) cb();
	})
	*/
	if(cb)cb();
}

function getTabUrls( cb){
	cacheurls = [];
	getUrlsCallBack = cb;
	// console.log(port);
	port.postMessage({cmd:'geturl'});
}

function analyze(url, cb){
	// console.log('analyze' + url);
	namelistCallBack = cb;
	port.postMessage({cmd:'analyze', url:url, row:cacheData.currentRow});
}

function highlight(show, url, name){
	port.postMessage({cmd:'highlight', url:url, name:name, show:show});
}

// 读取本地excel文件
function readWorkbookFromLocalFile(file, callback) {
    var reader = new FileReader();
    reader.onload = function (e) {
        var data = e.target.result;
        cacheData.workbook = XLSX.read(data, { type: 'binary' });
        if(callback) callback(cacheData.workbook.SheetNames);
    };
    reader.readAsBinaryString(file);
}

function getSheetNames(){
	if(cacheData.workbook)
		return cacheData.workbook.SheetNames;
}

function preViewSheet(sheetName){
	if(!cacheData.workbook){
		console.log('no valid workbook data');
		return;
	}
	// console.log(sheetName);

	var worksheet = cacheData.workbook.Sheets[sheetName];
    var xlsdata = '<html><body><table>';
    var samples = XLSX.utils.sheet_to_csv(worksheet)
	xlsdata += csv2table(samples);
	xlsdata += '</table></body></html>';

	// console.log(xlsdata);
	// xlsdata = "alert('ok');"
	chrome.tabs.create({url:chrome.extension.getURL('assets/scripts/preview.html')}, function(tab){
		// console.log(tab);
		chrome.tabs.onUpdated.addListener(function(tid, cinfo, t_tab){
			if(tab.id = tid && cinfo.status == 'complete'){
				chrome.tabs.sendMessage(tid, {"showtable": xlsdata});
			}
		})
		
		// chrome.tabs.executeScript(tab.id, {code:xlsdata, runAt:"document_end"});
	});
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


function getXlsCell(columnName){
	if(!cacheData.workbook) return;

	var worksheet = cacheData.workbook.Sheets[cacheData.select];
	// console.log(worksheet);
	if(!worksheet) return;
	var cellName = columnName + cacheData.currentRow;
	// console.log(cellName);
	var v = (worksheet[cellName] || {v:undefined}).v;
	// console.log(v);
	return v;
}

function fillData(ctrlId, value){
	port.postMessage({cmd:'filldata', id:ctrlId, value:value, url:cacheData.url});
}