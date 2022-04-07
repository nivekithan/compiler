import exp from "constants";
import { convertToTokens } from "../lexer/lexer";
import { convertToAst } from "../parser/parser";
import { typeCheckAst } from "../typesChecker/typeChecker";
import { convertToLLVMModule } from "./codegen";

test("Testing const variable declaration", () => {
  const input = `
    const a = 1;
    const b = true;
    const c = +1;
    const d = -1;
    const e = 1 + 1;
    const f = 1 - 2;
    const g = 1 * 2;
    const h = 2 / 2;
    const i = 1 === 1;
    const j = true === false;
    const k = 1 !== 1;
    const l = true !== false;
    const m = 1 > 1;
    const n = 1 >= 1;
    const o = 1 < 1;
    const p = 1 <= 1;
    const q = a;
    const r = b;
    const s = !r;`;

  const output = convertToLLVMModule(
    typeCheckAst(convertToAst(convertToTokens(input)))
  );

  expect(output).toMatchInlineSnapshot(`
"; ModuleID = 'main'
source_filename = \\"main\\"

define void @main() {
entry:
  %a = alloca double, align 8
  store double 1.000000e+00, double* %a, align 8
  %b = alloca i1, align 1
  store i1 true, i1* %b, align 1
  %c = alloca double, align 8
  store double 1.000000e+00, double* %c, align 8
  %d = alloca double, align 8
  store double -1.000000e+00, double* %d, align 8
  %e = alloca double, align 8
  store double 2.000000e+00, double* %e, align 8
  %f = alloca double, align 8
  store double -1.000000e+00, double* %f, align 8
  %g = alloca double, align 8
  store double 2.000000e+00, double* %g, align 8
  %h = alloca double, align 8
  store double 1.000000e+00, double* %h, align 8
  %i = alloca i1, align 1
  store i1 true, i1* %i, align 1
  %j = alloca i1, align 1
  store i1 false, i1* %j, align 1
  %k = alloca i1, align 1
  store i1 false, i1* %k, align 1
  %l = alloca i1, align 1
  store i1 true, i1* %l, align 1
  %m = alloca i1, align 1
  store i1 false, i1* %m, align 1
  %n = alloca i1, align 1
  store i1 true, i1* %n, align 1
  %o = alloca i1, align 1
  store i1 false, i1* %o, align 1
  %p = alloca i1, align 1
  store i1 true, i1* %p, align 1
  %q = alloca double, align 8
  %0 = load double, double* %a, align 8
  store double %0, double* %q, align 8
  %r = alloca i1, align 1
  %1 = load i1, i1* %b, align 1
  store i1 %1, i1* %r, align 1
  %s = alloca i1, align 1
  %2 = load i1, i1* %r, align 1
  %3 = xor i1 %2, true
  store i1 %3, i1* %s, align 1
  ret void
}
"
`);
});

test("Testing function declaration", () => {
  const input = `
  function a() {
    const b = 1;
    const c = b;
    const d = c + 2;

    return d;
  }`;

  const output = convertToLLVMModule(
    typeCheckAst(convertToAst(convertToTokens(input)))
  );

  expect(output).toMatchInlineSnapshot(`
"; ModuleID = 'main'
source_filename = \\"main\\"

define void @main() {
entry:
  ret void
}

define double @a() {
entry:
  %b = alloca double, align 8
  store double 1.000000e+00, double* %b, align 8
  %c = alloca double, align 8
  %0 = load double, double* %b, align 8
  store double %0, double* %c, align 8
  %d = alloca double, align 8
  %1 = load double, double* %c, align 8
  %2 = fadd double %1, 2.000000e+00
  store double %2, double* %d, align 8
  %3 = load double, double* %d, align 8
  ret double %3
}
"
`);
});

test("Calling a function", () => {
  const input = `
  function a() {
    return 1;
  }

  const d = a();
`;

  const output = convertToLLVMModule(
    typeCheckAst(convertToAst(convertToTokens(input)))
  );

  expect(output).toMatchInlineSnapshot(`
"; ModuleID = 'main'
source_filename = \\"main\\"

define void @main() {
entry:
  %d = alloca double, align 8
  %0 = call double @a()
  store double %0, double* %d, align 8
  ret void
}

define double @a() {
entry:
  ret double 1.000000e+00
}
"
`);
});

test("Calling a function with argument", () => {
  const input = `
  function a(b : number, c : number) {
    return b + c;
  };
  
  const d = a(1, 2);
  `;

  const output = convertToLLVMModule(
    typeCheckAst(convertToAst(convertToTokens(input)))
  );

  expect(output).toMatchInlineSnapshot(`
"; ModuleID = 'main'
source_filename = \\"main\\"

define void @main() {
entry:
  %d = alloca double, align 8
  %0 = call double @a(double 1.000000e+00, double 2.000000e+00)
  store double %0, double* %d, align 8
  ret void
}

define double @a(double %0, double %1) {
entry:
  %b = alloca double, align 8
  store double %0, double* %b, align 8
  %c = alloca double, align 8
  store double %1, double* %c, align 8
  %2 = load double, double* %b, align 8
  %3 = load double, double* %c, align 8
  %4 = fadd double %2, %3
  ret double %4
}
"
`);
});

test("Testing letVariable declaration", () => {
  const input = `
  let a =1;`;

  const output = convertToLLVMModule(
    typeCheckAst(convertToAst(convertToTokens(input)))
  );

  expect(output).toMatchInlineSnapshot(`
"; ModuleID = 'main'
source_filename = \\"main\\"

define void @main() {
entry:
  %a = alloca double, align 8
  store double 1.000000e+00, double* %a, align 8
  ret void
}
"
`);

});
