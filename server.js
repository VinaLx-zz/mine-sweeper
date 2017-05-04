const express = require("express")
const exp = express();

exp.use("/minesweeper", express.static("static"));
exp.listen(8080);