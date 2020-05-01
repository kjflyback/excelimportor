## 起因
老婆从事的是售后的工作，常年需要把售前工程师和销售的一些实施的数据录入到他们的工作平台上。

最开始我看在眼里，焦虑在心上，我心想，你这完全是人力无价值的搬运工的(excel到网页表单)工作，你们公司难道不能把录入这一部分的工作开放给更前线的人或者提供一个excel导入的工具吗？老婆摇摇头说，这个事已经提了n年了，以她这工作岗位在公司里的重要程度，还不足以让开发工程师紧着她做事，他们还有“更重要的事”要做。

曾几何时，开发出身的我也想着让她学学Js,Python什么的，可是对于她来说，学写程序和看剧这两件事情无疑看剧是```更重要的事```。

为了拯救老婆的双眼和布道计算机就是生产力，我抽起了老刀，咔咔咔，不辱使命。

-----


[不愿意用github的懒人看这里，收点税](https://download.csdn.net/download/flyback/12316927)

[操作说明](https://jingyan.baidu.com/article/b7001fe14ed9bf4f7382dd33.html)

[github源代码](https://github.com/kjflyback/excelimportor/tree/master)

V0.0.5
修改了操作方式


## 代码解析及原理

manifest.json 文件
```JSON
{

  "name": "ExcelImportor",
  "version": "0.0.3",
  "manifest_version": 2,
  "description": "excel 数据填入web表单",
  "browser_action":{
    "default_popup":"assets/scripts/popup.html"
  },
  "web_accessible_resources": [
    "assets/scripts/preview.html",
    "assets/scripts/preview.js"
  ],
  "background": {
    "scripts": ["assets/libs/xlsx.core.min.js","assets/libs/jQuery/jquery.js","assets/scripts/background.js"],
    "persistent": true
  },
  "content_scripts": [{
    "matches": ["<all_urls>"],
    "js": [
      "assets/libs/jQuery/jquery.js",
      "assets/libs/xlsx.core.min.js",
      "assets/scripts/inject.js"
    ],
    "all_frames":true,
    "run_at":"document_end",
    
    "match_about_blank":true
  }],
  "permissions": [
        "tabs", 
         "<all_urls>"
       ]
}
```
- browser_action
	- default_popup ```assets/scripts/popup.html``` 需要操作数据的弹出菜单页面，这个页面是可以和后台脚本进行直接调用的。 
- web_accessible_resources 这里的页面和脚本是用来作为数据预览用的，只有加到这里才会可以被扩展访问到 
- content_scripts
	- matches 的 ```<all_urls>``` 让后面的```js```节点中的所有文件可以插入到浏览器加载的每一个页面，不会进行过滤，包括```<iframe>```页面
	- js 要插入的脚本，这个是有顺序的
	- all_frames 是不是所有的帧都允许
	- run_at ```document_end``` 在文档下载完毕后运行插入的脚本
- permissions 允许在所有tab页和所有网页上生效


----

background.js
```javascript
var port;

var cacheData = {
	workbook:undefined,
	matchtable:[],
	currentRow:0
};
```
- cacheData.workbook 在background.js里保持xls的数据，在浏览器退出之前一直存在
- cacheData.matchtable 记录控件与xls列的对应关系
- cacheData.currentRow 记录当前数据提取的xls行号

```function getCurrentTab(callback)```

获取浏览器当前所在tab的通信对象

```chrome.runtime.onMessage.addListener(function (request,sender,callback)```

接收运行时消息

	active消息，当收到来自页面的active消息时重新绑定port
	prev消息, 获取xls数据的上一条
	next消息, 获取xls数据的下一条

- ```function getTabUrls( cb)```

获取当前正在查看的网页的url

- ```function analyze(url, cb)```

获取当前网页```<form></form>```中所有具备```name```属性的控件名称，显示到popup.html

- ```function highlight(show, url, name)```

高亮显示控件位置

- ```function preViewSheet(sheetName)```

在扩展preview页面中显示xls文件的预览

- ```function fillData(ctrlId, value)```

给指定的网页控件填入数据

---

