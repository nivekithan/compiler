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
    const p = 1 <= 1;`;

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
  ret void
}
"
`);
});