# Typescript Compiler

This is a small Educational compiler which I created to apply my knowledge of compilers. I have also written a lot of comprenhsive test to make sure compiler works as it expected.

It converts a small subset of typescript language to Native code using LLVM backend.

As it is a eductioncal compiler I have not added any support for error reporting meaning that if your code has syntax error, instead of reporting it. It will die with an error message that you can't understand.

As of now these are the supported syntax

1. Const variable declaration

```typescript
const a = 1;
const b: number = 1;
```

2. Let variable declaration

```typescript
let a = 1;
let b: number = 1;
```

3. Uniary expressions

```typescript
!true + 1 - 1;
```

4. Binary expressions

```typescript
1 + 1;
1 - 1;
1 * 1;
1 / 1;
1 === 1;
1 !== 1;
1 <= 1;
1 >= 1;
1 < 1;
1 > 1;
```

5. If block, else if block, else block

```typescript
if (true) {
  doSomething();
} else if (true) {
  doSomethingElse();
} else {
  doSomethingDefault();
}
```

6. While loop, do While loop.

```typescript
while (true) {
  willRunAlways();
}

do {
  willRunOnce();
} while (false);
```

7. Function declaration (only at top level)

```typescript
function nameOfFunction(arg1 : boolean, arg2 : number) {
    return 1;
}
```
