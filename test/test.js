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
    const four = `(a:* (b:(.a a) (a:a (b (b (b (b a)))))))`;

    const term = CoC.read(main);
    const type = CoC.type(term);
    const norm = CoC.norm(term);
    
    assert(CoC.show(type) === Nat);
    assert(CoC.show(norm) === four);
  });
});


