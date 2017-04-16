const CoC = require("./../src/main.js");
const assert = require("assert");

describe("Exponentiation", () => {
  it("2 ^ 2 == 4", () => {

    const main = `
      Nat=
        Nat. *
        Succ. (.Nat Nat)
        Zero. Nat
        Nat

      two=
        Nat: *
        Succ: (.Nat Nat)
        Zero: Nat
        (Succ (Succ Zero))

      exp=
        a: Nat
        b: Nat
        Nat: *
        (b (.Nat Nat) (a Nat))

      (exp two two)
    `;

    const Nat = `(a.* (.(.a a) (.a a)))`;
    const four = `(a:* (b:(.a a) (a:a [b b b b a])))`;

    const term = CoC.read(main);
    const type = CoC.type(term);
    const norm = CoC.norm(term);

    assert(CoC.show(type) === Nat);
    assert(CoC.show(norm) === four);
  });
});


describe("Files", () => {
  it("Should be able to solve dependencies and stringify combinator names", () => {
    var files = {
      "NAT": "(Nat. * Succ. (.Nat Nat) Zero. Nat Nat)",
      "C0": "(N:* S:(.N N) Z:N Z)",
      "C1": "(N:* S:(.N N) Z:N (S Z))",
      "PAIR": "(T:* P:(.NAT .NAT T) (P C0 C1))"
    }

    var terms = CoC.read(files);

    var nameOf = {}
    for (var name in files)
      nameOf[CoC.show(terms[name])] = name;

    var shown = CoC.show(
      terms.PAIR,

      comb => {
        if (nameOf[CoC.show(comb)] !== "PAIR")
          return nameOf[CoC.show(comb)]
      });

    assert(shown === "(a:* (a:(.NAT (.NAT a)) (a C0 C1)))");
  });
});
