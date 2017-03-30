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

- Can deal with files, solve devs recursively, auto-imports missing names.

- Can pretty-print terms showing names for known combinators.

- All that in less than 400 lines of code, ang a gziped minified size of just `2.3kb`.

## Usage

Install:

    $ npm install -g calculus-of-constructions

### From command line:

The command line can be used to print the base form, the normal form, and the type of a term. It auto-includes undefined variables by detecting them on the same directory. It can either print the full form, or a short form with known names.

```bash
$ coc two                         # (a:* (b:(.a a) (a:a (b (b a)))))
$ coc type "(exp two two)"        # Nat
$ coc norm "(exp two two)"        # four
$ coc full "(exp two two)"        # ((c:(a.* (.(.a a) (.a a))) (b:(a.* (.(.a a) (.a a))) (a:* (b (.a a) (c a))))) (a:* (b:(.a a) (a:a (b (b a))))) (a:* (b:(.a a) (a:a (b (b a))))))
$ coc full type "(exp two two)"   # (a.* (.(.a a) (.a a)))
$ coc full norm "(exp two two)"   # (a:* (b:(.a a) (a:a (b (b (b (b a)))))))
```

Check out the [examples](https://github.com/MaiaVictor/calculus-of-constructions/tree/master/examples) for that usage.

### From JavaScript:

```javascript
const coc = require("calculus-of-constructions");

const main = `T:* x:T x`; // id function

const term = CoC.read(main); // parses source, could be an object {name: source, ...}
const type = CoC.type(term); // infers type
const norm = CoC.norm(term); // normalizes

console.log(CoC.show(term)); // prints original term
console.log(CoC.show(type)); // prints inferred type
console.log(CoC.show(norm)); // prints normal form

// CoC.show can receive, optionally, a function that
// receives a combinator and returns a name of it. 
```

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
