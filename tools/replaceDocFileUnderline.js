
// 替换 doc 目录下面所有"_" 打头的文件
let fs = require("fs");

let renameFileList = [];

// 遍历目录，查找所有文件
function eachFile(path, callback) {
  var each = function(path) {
    if (fs.existsSync(path)) {
      let files = fs.readdirSync(path);
      files.forEach((file, index) => {
        let fileFullName = `${path}/${file}`;
        if (fs.statSync(fileFullName).isDirectory()) {
          each(fileFullName);
        } else {
          callback({ path, file });
        }
      });
    }
  };

  each(path);
}

// 遍历目录，重命名所有带"_"的文件
function renameFile(path) {
  eachFile(path, file => {
    var fromName = file.file;
    var toName = file.file.replace(/_/g, "A");
    fs.renameSync(file.path + "/" + fromName, file.path + "/" + toName);

    if (fromName != toName) {
      renameFileList.push({
        fromName,
        toName
      });
    }
  });
}

// 在文件中更新文件引用
function replaceFile(path) {
  eachFile(path, file => {
    let fileName = file.path + "/" + file.file;
    if (
      fileName.endsWith(".html") ||
      fileName.endsWith(".js") ||
      fileName.endsWith(".htm")
    ) {
      var content = fs.readFileSync(fileName, "utf-8");
      renameFileList.map(h => {
        content = content.replace(new RegExp(h.fromName, 'g'), h.toName);
      });
      fs.writeFileSync(fileName, content);
    }
  });
}

renameFile("./docs");
replaceFile("./docs");
