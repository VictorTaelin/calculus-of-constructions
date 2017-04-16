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
        vs: {head: val, tail: ctx.vs},
        ts: {head: typ, tail: ctx.ts},
        d: ctx.d + 1};
    };

    function equals(a,b) {
      return (function equals(a, b, d) {
        if (a.ctor === FIX && b.ctor !== FIX) return equals(a.ter(a),b,d);
        if (a.ctor !== FIX && b.ctor === FIX) return equals(a,b.ter(b),d);
        if (a.ctor !== b.ctor) return false;
        switch (a.ctor) {
          case VAR: return d-a.idx-1 === d-b.idx-1;
          case FIX: return equals(a.ter(Var(d)),b.ter(Var(d)),d);
          case APP: return equals(a.fun,b.fun,d) && equals(a.arg,b.arg,d);
          case LAM: return equals(a.typ,b.typ,d) && equals(a.bod(Var(d)),b.bod(Var(d)),d+1);
          case FOR: return equals(a.typ,b.typ,d) && equals(a.bod(Var(d)),b.bod(Var(d)),d+1);
          case SET: return true;
        };
        return false;
      })(a,b,0);
    };

    function str(a) {
      switch (a.ctor) {
        case VAR: return "(Var "+a.idx+")";
        case APP: return "(App "+str(a.fun)+" "+str(a.arg)+")";
        case LAM: return "(Lam "+str(a.typ)+" "+str(a.bod)+")";
        case FOR: return "(For "+str(a.typ)+" "+str(a.bod)+")";
        case FIX: return "(Fix "+str(a.ter)+")";
        case SET: return "Set";
      };
    }

    function eval(term, ctx) {
      switch (term.ctor) {
        case VAR:
          var ts = ctx.ts;
          var vs = ctx.vs;
          for (var i=0, l=term.idx; i<l; ++i) {
            ts = ts.tail;
            vs = vs.tail;
          }
          return {v: vs.head, t: ts.head};

        case APP:
          var f = eval(term.fun, ctx);
          var x = eval(term.arg, ctx);

          if (f.t.ctor === FIX) f.t = f.t.ter(f.t);
          if (f.v.ctor === FIX) f.v = f.v.ter(f.v);

          if (f.t.ctor !== FOR)
            throw "NonFunctionApplication";

          if (!equals(f.t.typ, x.t))
            throw "TypeMismatch";

          return {
            t: f.t.ctor === FOR ? f.t.bod(x.v) : App(f.t, x.v),
            v: f.v.ctor === LAM ? f.v.bod(x.v) : App(f.v, x.v)
          }

        case LAM:
          var typ = eval(term.typ, ctx);
          var bod = function(v) { return eval(term.bod, extend(v, typ.v, ctx)); };

          return {
            t : For(typ.v, function(v) { return bod(v).t; }),
            v : Lam(typ.v, function(v) { return bod(v).v; })
          }

        case FOR:
          var typ = eval(term.typ, ctx);
          var bod = function(v) { return eval(term.bod, extend(v, typ.v, ctx)); };

          if (!equals(typ.t, Set) || !equals(bod(Set).t, Set))
            throw "ForallNotAType";

          return {
            t : Set,
            v : For(typ.v, function (v) { return bod(v).v; })
          }

        case FIX:
          return {
            t : Fix(function(v) { return eval(term.ter, extend(v, Set, ctx)).t; }),
            v : Fix(function(v) { return eval(term.ter, extend(v, Set, ctx)).v; })
          }

        case SET:
          return {t : Set, v : Set};
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

    try {
      var e = eval(term, {ts:null, vs:null, d: 0});
      var q = quote(0, mode ? e.t : e.v, false);
      return q;
    } catch (error) {
      return error;
    }
  };

  // Reduces to normal form
  function norm(term) {
    return hoas(term, 0, 1);
  };

  // Infers type
  function type(term, bipass) {
    return hoas(term, 1, bipass);
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
