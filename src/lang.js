// Syntax (parser and stringifier).

module.exports = (function() {

  var Core = require("./core.js");

  // (s : Either String (Map String String)) -> case s of { Left s => String, Right s => Map String String }
  //   Receives a source or an object mapping names to sources,
  //   returns either a term of a map of names and terms.
  function read(sources) {
    if (typeof sources !== "object")
      sources = {"$": sources};

    var terms = {};

    function parseTerm(name) {
      var source = sources[name];
      var index = 0;

      if (!source)
        return Core.Set;

      if (terms[name])
        return terms[name];

      // Recursive parser
      var term = (function parse() {
        // Skip special characters
        while (/[^a-zA-Z\(\)_0-9\.@:\-\*\%\#\{\}\[\]]/.test(source[index]||""))
          ++index;

        // Application | (f x y z) -> (((f x) y) z) | [f x y z] -> (f (x (y z)))
        if (source[index] === "(" || source[index] === "[") {
          ++index;
          var rev = source[index - 1] === "(";
          var arg = [];
          while (source[index] !== ")" && source[index] !== "]") {
            arg.push(parse());
            while (/\s/.test(source[index])) ++index;
          };
          ++index;
          return function(depth, binders, aliases) {
            var appTerm = arg[rev ? 0 : arg.length - 1](depth, binders, aliases);
            if (rev)
              for (var i=1, l=arg.length; i<l; ++i)
                appTerm = Core.App(appTerm, arg[i](depth, binders, aliases));
            else
              for (var i=arg.length-2; i>=0; --i)
                appTerm = Core.App(arg[i](depth, binders, aliases), appTerm);
            return appTerm; 
          };

        // Set
        } else if (source[index] === "*") {
          ++index;
          return function(depth, binders, aliases) {
            return Core.Set;
          };

        // Either a binder or a binding expression
        } else {
          var binder = "";

          while (/[a-zA-Z0-9_]/.test(source[index]||""))
            binder += source[index++];

          // Lambda
          if (source[index] === ":") {
            ++index;
            var type = parse();
            var body = parse();
            return function(depth, binders, aliases) {
              return Core.Lam(
                type(depth, binders, aliases),
                body(depth+1, binders.concat(binder), aliases));
            };

          // Forall
          } else if (source[index] === ".") {
            ++index;
            var type = parse();
            var body = parse();
            return function(depth, binders, aliases) {
              return Core.For(
                type(depth, binders, aliases),
                body(depth+1, binders.concat(binder), aliases));
            };

          // Fix
          } else if (source[index] === "@") {
            ++index;
            var body = parse();
            return function(depth, binders, aliases) {
              return Core.Fix(body(depth+1, binders.concat(binder), aliases));
            };

          // Let
          } else if (source[index] === "=") {
            ++index;
            var value = parse();
            var context = parse();
            return function(depth, binders, aliases) {
              var newAliases = {};
              for (var key in aliases)
                newAliases[key] = aliases[key];
              newAliases[binder] = value;
              return context(depth, binders, newAliases);
            };

          // Binder
          } else {
            return function(depth, binders, aliases) {
              var binderIndex = binders.lastIndexOf(binder);
              if (binderIndex === -1) {
                if (aliases[binder]) {
                  return aliases[binder](depth, binders, aliases);
                } else {
                  return parseTerm(binder);
                }
              }
              return Core.Var(depth - binderIndex - 1);
            };
          };
        }
      })()(0, [], []);

      return terms[name] = term;
    };

    for (var name in sources)
      parseTerm(name);

    return terms["$"] || terms;
  };

  // Term, Maybe (Either (Map String String) (Term -> Maybe String)) -> String
  //   Stringifies a term. `combinatorName` is called on each
  //   combinator and may return a name for it.
  function show(term, combinatorName) {
    if (typeof term === "string")
      return term;

    if (!combinatorName)
      combinatorName = function(){ return null };

    function toName(nat) {
      var alphabet = "abcdefghijklmnopqrstuvwxyz";
      var name = "";
      do {
        name += alphabet[nat % alphabet.length];
        nat = Math.floor(nat / alphabet.length);
      } while (nat > 0);
      return name;
    };

    function extend(a,b) {
      var c = {};
      for (var key in a) c[key] = a[key];
      for (var key in b) c[key] = b[key];
      return c;
    };

    // Merges 2 scopes
    function merge(a,b) {
      var c = [];
      for (var ai=0, bi=0, al=a.length, bl=b.length; ai<al || bi < bl;)
        c.push( ai === al ? b[bi++]
              : bi === bl ? a[ai++]
              : a[ai][0] < b[bi][0] ? a[ai++]
              : b[bi][0] < a[ai][0] ? b[bi++]
              : [a[ai][0], extend(a[ai++][1],b[bi++][1])]);
      return c;
    };

    // Next scope
    function minVar(a) {
      for (var i=0; i<4294967296; ++i)
        if (!a[i])
          return i;
    };

    function next(a) {
      var bound = a[0] && a[0][0] === 0;
      var ext = {};
      if (bound)
        ext[minVar(a[0][1])] = 1;
      var c = [];
      for (var i=bound?1:0, l=a.length; i<l; ++i)
        c.push([a[i][0]-1, extend(a[i][1], ext)]);
      return c;
    };

    // Generates clean variable names
    (function go(term) {
      switch (term.ctor) {
        case Core.VAR:
          return [[term.idx, {}]];
        case Core.APP:
          return merge(go(term.fun), go(term.arg));
        case Core.LAM:
        case Core.FOR:
          var scope = go(term.bod);
          if (scope[0] && scope[0][0] === 0)
            term.arg = minVar(scope[0][1]); // ugly side-effective hack
          var nextScope = merge(go(term.typ), next(scope));
          term.isCombinator = nextScope.length === 0;
          return nextScope;
        case Core.FIX:
          var scope = go(term.ter);
          if (scope[0] && scope[0][0] === 0)
            term.arg = minVar(scope[0][1]); // ugly side-effective hack
          var nextScope = next(scope);
          term.isCombinator = nextScope.length === 0;
          return nextScope;
        case Core.ERR:
          return go(term.ter);
        default: return [];
      };
    })(term);

    // Returns the string
    return (function go(term, args) {
      if (term.isCombinator && combinatorName) {
        var name = combinatorName(term);
        if (name) return name;
      };
      switch (term.ctor) {
        case Core.VAR:
          return args[args.length-term.idx-1] || (term.idx>0 ? "Var"+term.idx  :"FreeVar"+(-term.idx));
        case Core.APP: 
          var apps = [];
          var left = term.fun.ctor === Core.APP;
          for (var app = term; app.ctor === Core.APP; app = left ? app.fun : app.arg)
            apps.push(go(left ? app.arg : app.fun, args));
          apps.push(go(app, args));
          return left || apps.length <= 2 ? "("+apps.reverse().join(" ")+")" : "["+apps.join(" ")+"]";
        case Core.LAM: 
          var arg = term.arg >= 0 ? toName(term.arg) : "";
          var typ = go(term.typ, args);
          var bod = go(term.bod, args.concat([arg]));
          return "("+arg+":"+typ+" "+bod+")";
        case Core.FOR: 
          var arg = term.arg >= 0 ? toName(term.arg) : "";
          var typ = go(term.typ, args);
          var bod = go(term.bod, args.concat([arg]));
          return "("+arg+"."+typ+" "+bod+")";
        case Core.FIX: 
          var arg = term.arg >= 0 ? toName(term.arg) : "";
          var bod = go(term.ter, args.concat([arg]));
          return arg+"@"+bod;
        case Core.SET: return "*";
      };
    })(term, []);
  };

  return {
    read: read,
    show: show
  }
})();
