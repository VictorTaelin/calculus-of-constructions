#!/usr/bin/env node

// Command line interface.
// Usage: coc eval file_name

var fs = require("fs");
var CoC = require("./main.js");
var path = require("path");
var args = process.argv.slice(2);

var files = {"$main$": args.pop()};
fs.readdirSync(process.cwd()).forEach(function(name) {
  if (name.slice(-4) === ".coc")
    files[name.slice(0, -4)] = fs.readFileSync(path.join(process.cwd(), name), "utf8");
});

var terms = CoC.read(files);

var nameOf = {};
for (var name in terms)
  nameOf[CoC.show(terms[name])] = name;

if (args[0] === "help") {
  console.log("Usage:");
  console.log("$ coc term           # shows the base form of term.coc");
  console.log("$ coc type term      # shows the type of term.coc");
  console.log("$ coc norm term      # shows the normal form of term.coc");
  console.log("$ coc full term      # fully shows the base form of term.coc");
  console.log("$ coc full type term # fully shows the type of term.coc");
  console.log("$ coc full norm term # fully shows the normal form of term.coc");
}

var full = false;
if (args[0] === "full") {
  full = true;
  args.shift();
}

var map = function(x) { return x; };
if (args[0] === "type") {
  map = CoC.type;
  args.shift();
}
if (args[0] === "norm") {
  map = CoC.norm;
  args.shift;
};

console.log(CoC.show(map(terms["$main$"]), function(comb) {
  return !full && nameOf[CoC.show(comb)] !== "$main$" && nameOf[CoC.show(comb)];
}));
