(function(window, document){
    var db = openDatabase('payImportdb', '', "payImport database", 1024 * 1024 * 30, function(result){
       console.log('create db ok!')
       db = result;

    });
    if(!db){
        console.log('db create failed')
        return;
    }else{
        console.log('db create ok!')
    }

    const columns = [
        'name' ,
        'bankId' ,
        'merchno',
        'deptName' ,
        'areaName' ,
        'firstSubBank' ,
        'secondSubBank' ,
        'orgaddress' ,
        'telno' ,
        'manager' , 
        'exported', 
        'CreatedTime'
    ];
    db.transaction(function(tx){
        // 店铺经营名称
        // 商户号
        // 店铺号
        // 所属一级
        // 所属二级
        // 店铺地址
        // 店铺联系方式
        // 区域负责人
        /*
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
         */
        var sql = `create table if not exists PayInfo (
        name ,
        bankId ,
        merchno ,
        deptName ,
        areaName ,
        firstSubBank ,
        secondSubBank ,
        orgaddress ,
        telno ,
        manager , 
        exported int default (0), 
        [CreatedTime] TimeStamp NOT NULL DEFAULT (datetime('now','localtime'))
        )`
        tx.executeSql(sql, []);
    }, function(error){
        console.log("数据初始化失败，失败原因：" + error.message)
    }, function(result){
        console.log("数据初始化成功")
    });

    

    window.payImportDb = {
        db:db,
        tmp:{},
        addNewRow:function(row, cb){
                var insertsql = "insert into PayInfo(";
                var wheresql = "select count(1) as c from PayInfo where ";
                var colLst = []
                var valLst = []
                var whereLst = []
                for(var k in row){
                    if(columns.indexOf(k) == -1) continue;

                    whereLst.push(k + ' = "' + row[k] + '"')
                    colLst.push(k)
                    valLst.push('"' + row[k] + '"')
                }
                wheresql += whereLst.join(' and ')
                insertsql += colLst.join(',');
                insertsql += ") values (";
                insertsql += valLst.join(',');
                insertsql += ")"
                console.log(wheresql);
            this.db.transaction(function(tx){
                tx.executeSql(wheresql, [], function(tx, results){
                    console.log(results)
                    if(results.rows.item(0).c == 0){
                        tx.executeSql(insertsql, []);
                    }else{
                        alert('记录已经存在')
                    }
                })
            }, function(error){}, function(success){if(cb)cb();})
        },
        getRowsByManager:function(manager, cb, btime, etime){
            console.log(manager);
            var selsql = 'select * from PayInfo where manager="' + manager + '"' + 
            // (ignoreexported?'':' and exported = 0') + 
            (btime ? (' and CreatedTime >= date("' + btime + '") '):'') + 
            (etime ? (' and CreatedTime <= datetime("' + etime + ' 23:59:59") '):'')

            console.log(selsql)
            this.db.transaction(function(tx){
                tx.executeSql(selsql, [], function(tx, results){
                    if(cb) cb(results.rows)
                })
            }, function(error){}, function(success){})
        },
        statisticsByFirstSubBank:function(cb, btime, etime){
            var selsql = 'select manager, firstsubbank, count(1) as c from PayInfo where 1=1 ' + 
            // ignoreexported?'':'where exported = 0' + 
            (btime ? (' and CreatedTime >= date("' + btime + '") '):'') + 
            (etime ? (' and CreatedTime <= datetime("' + etime + ' 23:59:59") '):'') + 
            ' group by manager, firstsubbank ' +
            ' union ' +
            ' select manager, "所有", count(1) as c from PayInfo where 1=1 '+
            (btime ? (' and CreatedTime >= date("' + btime + '") '):'') + 
            (etime ? (' and CreatedTime <= datetime("' + etime + ' 23:59:59") '):'') + 
            ' group by manager'
            ;
            console.log(selsql)
            this.db.transaction(function(tx){
                tx.executeSql(selsql, [], function(tx, results){
                    if(cb) cb(results.rows)
                })
            }, function(error){}, function(success){})
        },
        statisticsByManager:function(cb, btime, etime){
            var selsql = 'select manager, count(1) as c from PayInfo where 1=1 ' + 
            // ignoreexported?'':'where exported = 0' + 
            (btime ? (' and CreatedTime >= date("' + btime + '") '):'') + 
            (etime ? (' and CreatedTime <= datetime("' + etime + ' 23:59:59") '):'') + 
            ' group by manager '
            ;
            console.log(selsql)
            this.db.transaction(function(tx){
                tx.executeSql(selsql, [], function(tx, results){
                    if(cb) cb(results.rows)
                })
            }, function(error){}, function(success){})
        }
    };

})(window,document)
