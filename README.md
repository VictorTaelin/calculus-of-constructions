## Calculus of Constructions

A lightweight implementation of the [Calculus of Constructions](https://en.wikipedia.org/wiki/Calculus_of_constructions) in JavaScript. CoC is both a minimalistic programming language (similar to the [Lambda Calculus](https://en.wikipedia.org/wiki/Lambda_calculus), but with a very powerful type system) and a constructive foundation for mathematics, serving as the basis of proof assistants such as [Coq](https://en.wikipedia.org/wiki/Coq).

## Features

- Core lang with `Lambda`, `Forall`, `Application`, `Variables` and, as you love paradoxes, `Fix` and `Type in Type`.

- `Let` bindings as syntax sugars.

- Extremelly minimalistic, unbloated, pure ASCII syntax.

- Completely implemented with [HOAS](https://en.wikipedia.org/wiki/Higher-order_abstract_syntax), substitution free, including the type checker, which means it is very fast.

- A robust parser, which allows arbitrary grammar nestings, including of `Let`s.

- A smart stringifier which names vars so that [combinators](https://en.wikipedia.org/wiki/Combinatory_logic) are stringified uniquely, regardless of the context.

- Node.js, cross-browser, 100% ES5 compliant.

- Simple command line interface to type-check / evaluate a file.

- All that in less than 400 lines of code, ang a gziped minified size of just `2.3kb`.

## Syntax

- **Lambda:** `name:Type Body`

    A function that receives `name` of type `Type` and returns `Body`.

- **Forall:** `name.ArgType BodyType`

    The type of functions that receive `name` of type `ArgType` and return `BodyType`.

- **Fix:** `self@ Term`

    The term `Term` with all instances of `self` replaced by itself.

- **Apply:** `(f x y z)`

    The application of the function `f` to `x`, `y` and `z`.

- **Let:** `name=Term Body`

    Let `name` be the term `Term` inside the term `Body`.

The name can be omitted from `Lambda` and `Forall`, so, for example, the equivalent of `Int -> Int` is just `.Int Int`. All other special characters are ignored, so you could write `λ a: Type -> Body` if that is more pleasing to you.

## Usage

Install:

    npm install -g calculus-of-constructions

Use from command line:

    coc eval my_file.coc

Use from JavaScript:

```javascript
const coc = require("calculus-of-constructions");

const main = `T:* x:T x`; // id function

const term = CoC.read(main); // parses source
const type = CoC.type(term); // infers type
const norm = CoC.norm(term); // normalizes

console.log(CoC.show(term)); // prints original term
console.log(CoC.show(type)); // prints inferred type
console.log(CoC.show(norm)); // prints normal form
```

## Example:

Below, an example implementation of exponentiation:

```haskell
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
```

You can save it as `exp.coc` and run with `coc eval exp.coc`. 

To aid you grasp the minimalist syntax, it is equivalent to this [Idris](https://www.idris-lang.org/) program:

```haskell
NatT : Type
NatT
  =  (Nat : Type)
  -> (Succ : Nat -> Nat)
  -> (Zero : Nat)
  -> Nat

two : NatT
two
  =  \ Nat : Type
  => \ Succ : (Nat -> Nat)
  => \ Zero : Nat
  => Succ (Succ Zero)

exp : NatT -> NatT -> NatT
exp
  =  \ a : NatT
  => \ b : NatT
  => \ Nat : Type
  => b (Nat -> Nat) (a Nat)

printNatT : NatT -> IO ()
printNatT n = print (n Nat (+ 1) 0)

main : IO ()
main = do
  printNatT (exp two two)
```
