// Core language.

module.exports = (function() {

  // Constructors
  var VAR = 0, Var = function(idx) { return {ctor:VAR, idx:idx}; };
  var APP = 1, App = function(fun,arg) { return {ctor:APP, fun:fun, arg:arg}; };
  var LAM = 2, Lam = function(typ,bod) { return {ctor:LAM, typ:typ, bod:bod}; };
  var FOR = 3, For = function(typ,bod) { return {ctor:FOR, typ:typ, bod:bod}; };
  var FIX = 4, Fix = function(ter) { return {ctor:FIX, ter:ter}; };
  var SET = 5, Set = {ctor:SET};
  var VALUE = 0, TYPE = 1;

  // Typechecker and evaluator
  function hoas(term, mode, bipass) {
    function extend(val, typ, ctx) {
      return {
        vals: {head:val, tail:ctx.vals},
        typs: {head:typ, tail:ctx.typs},
        depth: ctx.depth + 1};
    };

    function check(a,b) {
      return (function check(a, b, d) {
        if (a.ctor === FIX && b.ctor !== FIX) return check(a.ter(a),b,d);
        if (a.ctor !== FIX && b.ctor === FIX) return check(a,b.ter(b),d);
        switch (a.ctor + b.ctor * SET) {
          case VAR + VAR*SET: return d-a.idx-1 === d-b.idx-1;
          case FIX + FIX*SET: return check(a.ter(Var(d)),b.ter(Var(d)),d);
          case APP + APP*SET: return check(a.fun,b.fun,d) && check(a.arg,b.arg,d);
          case LAM + LAM*SET: return check(a.typ,b.typ,d) && check(a.bod(Var(d)),b.bod(Var(d)),d+1);
          case FOR + FOR*SET: return check(a.typ,b.typ,d) && check(a.bod(Var(d)),b.bod(Var(d)),d+1);
          case SET + SET*SET: return true;
        };
        return false;
      })(a,b,0);
    };

    function eval(term, mode, ctx) {
      switch (term.ctor) {

        case VAR:
          var vars = mode === TYPE ? ctx.typs : ctx.vals;
          for (var i=0, l=term.idx; i<l; ++i)
            vars = vars.tail;
          return vars.head;

        case APP:
          var f = eval(term.fun, mode, ctx);
          var x = eval(term.arg, VALUE, ctx);
          if (f.ctor === FIX)
            f = f.ter(f);
          if (mode === TYPE) {
            var xt = eval(term.arg, TYPE, ctx);
            if (!bipass && f.ctor !== FOR)
              errors.push({type: "NotAFunction"});
            if (!bipass && f.ctor === FOR && !check(f.typ, xt))
              errors.push({
                type: "TypeMismatch",
                term: quote(0,x),
                expected: quote(0,f.typ||Set),
                actual: quote(0,xt)});
            return f.ctor === FOR ? f.bod(x) : App(f, x);
          } else {
            return f.ctor === LAM ? f.bod(x) : App(f, x);
          };

        case LAM:
          var typ = eval(term.typ, VALUE, ctx);
          var val = function(v) { return eval(term.bod, mode, extend(v, typ, ctx)); };
          return mode ? For(typ, val) : Lam(typ, val);

        case FOR:
          if (mode === TYPE) {
            var typt = eval(term.typ, TYPE, ctx);
            var typv = eval(term.typ, VALUE, ctx);
            var bodt = eval(term.bod, TYPE, extend(Set, typv, ctx));
            if (!check(typt, Set) || !check(bodt, Set))
              errors.push({type: "InvalidInputType"});
            return Set;
          } else {
            var typ = eval(term.typ, VALUE, ctx);
            var val = function(v) { return eval(term.bod, 0, extend(v, typ, ctx)); };
            return For(typ, val);
          };

        case FIX:
          return Fix(function(v) { return eval(term.ter, mode, extend(v, Set, ctx))});

        case SET:
          return Set;
      };
    };

    function quote(d, term, fix) {
      switch (term.ctor) {
        case VAR: return Var(d - term.idx - 1);
        case APP: return App(quote(d, term.fun, fix), quote(d, term.arg, fix));
        case LAM: return Lam(quote(d, term.typ, fix), quote(d+1, term.bod(Var(d)), fix));
        case FOR: return For(quote(d, term.typ, fix), quote(d+1, term.bod(Var(d)), fix));
        case FIX: return Fix(quote(d+1, term.ter(Var(d)), fix));
        case SET: return Set;
      };
    };

    var errors = [];
    var result = quote(0, eval(term, mode, {typs:null, vals:null, depth: 0}), false);

    return {term: errors.length === 0 ? result : null, errors: errors};
  };

  // Reduces to normal form
  function norm(term) {
    return hoas(term, 0, 1).term;
  };

  // Infers type
  function type(term, bipass) {
    return hoas(term, 1, bipass).term;
  };

  // Infers type & returns errors
  function check(term) {
    return hoas(term, 1, 0);
  };

  return {
    Var: Var, VAR: VAR,
    App: App, APP: APP,
    Lam: Lam, LAM: LAM,
    For: For, FOR: FOR,
    Fix: Fix, FIX: FIX,
    Set: Set, SET: SET,
    hoas: hoas,
    norm: norm,
    type: type,
  };
})();
