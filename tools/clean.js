// 删除dist目录

let fs = require("fs-extra");

function deletePath(path) {
  fs.emptyDirSync(path);
  fs.rmdirSync(path);
}




deletePath("./es");
deletePath("./docs");
deletePath("./.nyc_output");