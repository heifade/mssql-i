// 删除dist目录

let fs = require("fs-i");

fs.rmdir("./es");
fs.rmdir("./docs");
fs.rmdir("./.nyc_output");
