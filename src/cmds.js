#!/usr/bin/env node

// Command line interface.
// Usage: coc eval file_name

var fs = require("fs");
var CoC = require("./main.js");

var path = process.cwd();
var call = process.argv[2];
var file = process.argv[3] || "main";

var main = fs.existsSync(file) ? fs.readFileSync(file, "utf8") : file;
var term = CoC.read(main);

switch (process.argv[2]) {
  case "type":
  console.log(CoC.show(CoC.type(term)));
  break;

  case "norm":
  console.log(CoC.show(CoC.norm(term)));
  break;

  case "eval":
  console.log("Type:");
  console.log(CoC.show(CoC.type(term)));
  console.log("")
  console.log("Norm:");
  console.log(CoC.show(CoC.norm(term)));
  break;

  case "help":
  console.log("Usage:")
  console.log("$ coc eval main # evaluates term on file named `main`")
  console.log("$ coc type main # infers type of term on file named `main`")
  console.log("$ coc type main # normalizes term on file named `main`")
  break;
}
