var server = {
	targetid: 0,
	lock: false,
	targettitle: "",
	current: {
		tabid: 0,
		tabtitle: ""
	},
	saveTarget: function(id, title) {
		// 保存当前的数据
		this.current.tabid = id;
		this.current.tabtitle = title;
		if (this.lock) {
			// 已经锁定则自动调用active
			chrome.tabs.sendMessage(this.targetid, {
				cmd: 'active'
			});
			return;
		}
		this.targetid = id;
		this.targettitle = title;
	},
	urls: [],
	init: function() {
		if (this.lock) return;
		this.urls = [];
		this.match = {};
	},
	binding: function(urlcallback) {
		// console.log(this.urls);
		this.ucallback = urlcallback;
		if (this.urls.length > 0) {
			for (var k in this.urls) {
				this.ucallback(this.urls[k].tabid, this.urls[k].href);
			}
			return;
		}
		chrome.tabs.query({
			active: true
		}, function(tabs) {
			this.targetid = tabs[0].id;
			chrome.tabs.sendMessage(this.targetid, {
				cmd: 'query'
			});
		});
	},
	ucallback: undefined,
	lockTarget: function(lock) {
		// console.log(lock);
		this.lock = lock;
		// active inject page
		chrome.tabs.sendMessage(this.targetid, {
			cmd: 'active'
		});
	},
	workbook: undefined,
	sheet: undefined,
	filename: undefined,
	row: 0,
	match:{}
};

chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
	// console.log(tab);
	if (tab.status != "complete") return;
	var url = tab.url;
	// console.log(tab);
	if (url == undefined) return;

	// save current title
	server.saveTarget(tabId, tab.title);

	try {
		chrome.tabs.sendMessage(
			tabId, {
				cmd: 'query'
			},
			function(response) {
				// console.log(response);
			});
	} catch (err) {
		console.log(err);
	}

});


chrome.tabs.onActivated.addListener(function(activeInfo) {
	if (activeInfo.tabId) {
		chrome.tabs.get(activeInfo.tabId, function(tab) {
			// console.log(tab);
			server.saveTarget(tab.id, tab.title);
			try {
				chrome.tabs.sendMessage(
					tab.id, {
						cmd: 'query'
					},
					function(response) {
						// console.log(response);
					});
			} catch (err) {
				console.log(err);
			}
		});
	}
});

chrome.runtime.onMessage.addListener(function(rq, send, response) {
	if (server.lock) {
		if(send.tab.id != server.targetid) return;
		}
	if (rq.cmd == "reporthref" && server.ucallback) {
		// console.log(server);
		if (!server.lock) {
			// server.targetid = send.tab.id;

			server.urls.push({
				href: rq.href,
				frameId: send.frameId,
				tabid: send.tab.id,
				tabtitle: send.tab.title
			});
			server.ucallback(send.tab.id, rq.href);
		}
		response('return');
		return;
	}
	if (rq.cmd == "querydata") {
		// console.log('querydata');
		var worksheet = server.workbook.Sheets[server.sheet];
		var samples = XLSX.utils.sheet_to_csv(worksheet)
		var xlsdata = csv2array(samples, server.row);
		
		response({match:server.match, data:xlsdata, row:server.row});
		return;
	}
	if(rq.cmd == "prev"){
		server.row -= server.row > 0?1:0;
		response();
		return;
	}
	if(rq.cmd == "next"){
		var sheet = server.workbook.Sheets[server.sheet];
		var range = XLSX.utils.decode_range(sheet['!ref']);
		if(range)
				server.row += range.e.r > server.row?1:0;
		response();
		return;
	}
	if(rq.cmd == "binding"){
		server.match[rq.objName] = rq.index;
	}

});

function csv2array(data, rowIndex) {
	// 将csv转换成表格
	var rows = data.split('\n');
	rows.pop(); // 最后一行没用的
	var columns = rows[rowIndex].split(',');
	return columns;
}
// 读取本地excel文件
function readWorkbookFromLocalFile(file, readDone) {
	var reader = new FileReader();
	reader.onload = function(e) {
		var data = e.target.result;
		server.workbook = XLSX.read(data, {
			type: 'binary'
		});
		server.sheet = server.workbook.SheetNames[0];
		if (readDone) readDone(server.filename);
	};
	server.filename = file.name;
	reader.readAsBinaryString(file);
}

function getSheetNames() {
	if (server.workbook)
		return server.workbook.SheetNames;
	return [];
}

function selectSheet(nameOfSheet) {
	server.sheet = nameOfSheet;
}

