# Chrome扩展读取excel文件内容填入web表单

- 使用chrome的开发者模式加载本扩展程序
- 测试文件2个，一个是test.html另一个是testframe.html,因为许多web提交的表单通常是在另一个html页面的，
如果你要改成你自己的操作的网页，修改manifest.json里content_scripts\matches，把file:///*/testframe.html替换成http://xxxx https://xxxx
- 注意manifest.json里的permissions
- 加载以后按F7/F8分别是excel记录的上一条和下一条
- 扩展里会把临时数据存入WebSQL的数据库里，在下次刷新了以后会自动填上最后一次选择的内容
- backgroundpage.js在chrome执行的过程中保存着最后一次选择的excel文件内容，所以在frame刷新了以后不需要再选择文件
- flow.html里显示了excel列和你的表单上的空间id的对应关系，需要在第一次运行的时候指定，指定完了扩展会保存到数据库，下一次不需要指定了

