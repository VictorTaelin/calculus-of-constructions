## Examples

- Print a term

    ```bash
    $ coc two
    (a:* (b:(.a a) (a:a (b (b a)))))
    ```

- Print the type of a term

    ```bash
    $ coc type two
    Nat
    ```

- Fully print the type of a term

    ```bash
    $ coc full type two
    (a.* (.(.a a) (.a a)))
    ```


- Print the type of another term

    ```bash
    $ coc type exp
    (.Nat (.Nat Nat))
    ```


- Print the type of an expression

    ```bash
    $ coc type "(exp two two)"
    Nat
    ```


- Fully print the type of an expression

    ```bash
    $ coc full type "(exp two two)"
    (a.* (.(.a a) (.a a)))
    ```


- Print the normal form of an expression

    ```bash
    $ coc norm "(exp two two)"
    four
    ```


- Fully print the normal form of an expression

    ```bash
    $ coc full norm "(exp two two)"
    (a:* (b:(.a a) (a:a (b (b (b (b a)))))))
    ```
