// 删除dist目录

let fs = require("fs");

function deletePath(path) {
  if (fs.existsSync(path)) {
    let files = fs.readdirSync(path);
    files.forEach((file, index) => {
      let fileFullName = `${path}/${file}`;
      if (fs.statSync(fileFullName).isDirectory()) {
        deletePath(fileFullName);
      } else {
        fs.unlinkSync(fileFullName);
      }
    });
    fs.rmdirSync(path);
  }
}

deletePath("./es");
deletePath("./docs");
