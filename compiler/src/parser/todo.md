# Partial explicit types

As of now you can either have explicit type or implicit type. That is when you declare a variable
you have option to explicitly specify the datatype or let typechecker figure it out implicitly.

This works fine for simple use case but in case of `string` and `array`. We need length of elements to
to specify datatype. But since there is no valid typescript syntax to specify the length, there is no way to
specify the datatype explicitly.

If we add support to this feature then following syntax

```ts
const a: number[] = [1, 2, 3];
```

should generate `ast` something like this

```ts
{
    type : "constVariableDeclaration",
    varName : "a",
    dataType : {type : "array", baseType : "number", length : undefined}
    expressions : "<expression>"
}
```

This way typechecker can enforce that `expression` should be type of `array` with baseType `number` and can implicitly
find out the `length`
