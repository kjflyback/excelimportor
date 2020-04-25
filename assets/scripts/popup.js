//
var bg = chrome.extension.getBackgroundPage();

$("#btnCollect").change(function(e) {
	bg.server.lockTarget($(this).is(':checked'));
});

$("#xlsFile").change(function(e) {
	// console.log(e);
	bg.readWorkbookFromLocalFile(e.target.files[0], function(filename) {
		// display table in inject page
		$("#sheetnames").html(""); // 清空
		// 显示当前选择的
		fillSheetName();
		$("#currentFile").text(filename);
	})
});
$("#sheetnames").change(function(){
	bg.selectSheet($("#sheetnames").val());
});

function setObjectStatus() {
	if (bg.server.lock)
		$("#btnCollect").attr("checked", true);

	$("#locktabid").text(bg.server.targettitle);
	bg.server.binding(function(tabid, url) {
		$("#target").append("<p>" + url + "</p>");
	});
	fillSheetName();
	$("#currentFile").text(bg.server.filename);
}

function fillSheetName(){
	bg.getSheetNames().forEach(s =>{
	    $("#sheetnames").append($("<option>" + s + "</option>"));
	    // 保存第一个到内存
	});
	
	$("#sheetnames").val(bg.server.sheet);
}

bg.server.init();
setObjectStatus();
