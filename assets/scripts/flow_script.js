$("#_xlsFile").change(function (e) {
    readWorkbookFromLocalFile(e.target.files[0], function () {
        readWorkbook();
    })
});