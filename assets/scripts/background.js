
var bport;
var workbook = {
	'data':{}
};
function attachWorkSheet(data){
	// console.log(worksheet);
	workbook.data.workbook = data;
	bport.postMessage({'cmd':'attachdone'});
}

chrome.runtime.onConnect.addListener(port=>{
	bport = port;
	port.onMessage.addListener(msg=>{
		switch(msg.cmd){
			case 'attach':	attachWorkSheet(msg.attach); break;
			case 'getworkbook': bport.postMessage({'cmd':'getworkbook','getworkbook':workbook.data.workbook}); break;
			default:
				break;
		}
	});
});