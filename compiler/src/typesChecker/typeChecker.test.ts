import { convertToTokens } from "../lexer/lexer";
import { KeywordTokens, Token } from "../lexer/tokens";
import { Ast, LiteralDataType } from "../parser/ast";
import { convertToAst } from "../parser/parser";
import { typeCheckAst } from "./typeChecker";

test("Typechecking variableDeclaration with implicit datatype", () => {
  const input = `
    const a = "1";
    const b = 1;
    const c = true;
    const d = false;
    const e = [1];
    const f = {a : 1};`;

  const output = typeCheckAst(convertToAst(convertToTokens(input)));

  expect(output).toEqual<Ast[]>([
    {
      type: "constVariableDeclaration",
      datatype: LiteralDataType.String,
      identifierName: "a",
      exp: { type: "string", value: "1" },
      export: false,
    },
    {
      type: "constVariableDeclaration",
      datatype: LiteralDataType.Number,
      identifierName: "b",
      exp: { type: "number", value: 1 },
      export: false,
    },
    {
      type: "constVariableDeclaration",
      datatype: LiteralDataType.Boolean,
      identifierName: "c",
      exp: { type: "boolean", value: true },
      export: false,
    },
    {
      type: "constVariableDeclaration",
      datatype: LiteralDataType.Boolean,
      identifierName: "d",
      exp: { type: "boolean", value: false },
      export: false,
    },
    {
      type: "constVariableDeclaration",
      datatype: {
        type: "ArrayDataType",
        baseType: LiteralDataType.Number,
      },
      identifierName: "e",
      exp: { type: "array", exps: [{ type: "number", value: 1 }] },
      export: false,
    },
    {
      type: "constVariableDeclaration",
      datatype: {
        type: "ObjectDataType",
        keys: { a: LiteralDataType.Number },
      },
      identifierName: "f",
      exp: { type: "object", keys: [["a", { type: "number", value: 1 }]] },
      export: false,
    },
  ]);
});
test("Typechecking variableDeclaration with explicit datatype", () => {
  const input = `
      const a : string = "1";
      const b : number = 1;
      const c : boolean = true;
      const d : boolean = false;
      const e : number[] = [1];
      const f : {a : number} = {a : 1};`;

  const output = typeCheckAst(convertToAst(convertToTokens(input)));

  expect(output).toEqual<Ast[]>([
    {
      type: "constVariableDeclaration",
      datatype: LiteralDataType.String,
      identifierName: "a",
      exp: { type: "string", value: "1" },
      export: false,
    },
    {
      type: "constVariableDeclaration",
      datatype: LiteralDataType.Number,
      identifierName: "b",
      exp: { type: "number", value: 1 },
      export: false,
    },
    {
      type: "constVariableDeclaration",
      datatype: LiteralDataType.Boolean,
      identifierName: "c",
      exp: { type: "boolean", value: true },
      export: false,
    },
    {
      type: "constVariableDeclaration",
      datatype: LiteralDataType.Boolean,
      identifierName: "d",
      exp: { type: "boolean", value: false },
      export: false,
    },
    {
      type: "constVariableDeclaration",
      datatype: {
        type: "ArrayDataType",
        baseType: LiteralDataType.Number,
      },
      identifierName: "e",
      exp: { type: "array", exps: [{ type: "number", value: 1 }] },
      export: false,
    },
    {
      type: "constVariableDeclaration",
      datatype: {
        type: "ObjectDataType",
        keys: { a: LiteralDataType.Number },
      },
      identifierName: "f",
      exp: { type: "object", keys: [["a", { type: "number", value: 1 }]] },
      export: false,
    },
  ]);
});

test("Wrong explicit string datatype", () => {
  const input = `
    const s : string = true;`;

  const getOutput = () => {
    typeCheckAst(convertToAst(convertToTokens(input)));
  };

  expect(getOutput).toThrowError();
});

test("Wrong explicit number datatype", () => {
  const input = `
    const s : number = true;`;

  const getOutput = () => {
    typeCheckAst(convertToAst(convertToTokens(input)));
  };

  expect(getOutput).toThrowError();
});

test("Wrong explicit boolean datatype", () => {
  const input = `
    const s : boolean = 1;`;

  const getOutput = () => {
    typeCheckAst(convertToAst(convertToTokens(input)));
  };

  expect(getOutput).toThrowError();
});

test("Identifier typechecking", () => {
  const input = `
  const a = true;
  const b = !a;`;

  const output = typeCheckAst(convertToAst(convertToTokens(input)));

  expect(output).toEqual<Ast[]>([
    {
      type: "constVariableDeclaration",
      datatype: LiteralDataType.Boolean,
      exp: { type: "boolean", value: true },
      export: false,
      identifierName: "a",
    },
    {
      type: "constVariableDeclaration",
      datatype: LiteralDataType.Boolean,
      exp: { type: Token.Bang, argument: { type: "identifier", name: "a" } },
      export: false,
      identifierName: "b",
    },
  ]);
});

test("Testing reassignment of operator Token.Assign", () => {
  const input = `
  let a = 1;
  a = 2;`;

  const output = typeCheckAst(convertToAst(convertToTokens(input)));

  expect(output).toEqual<Ast[]>([
    {
      type: "letVariableDeclaration",
      datatype: LiteralDataType.Number,
      exp: { type: "number", value: 1 },
      export: false,
      identifierName: "a",
    },
    {
      type: "ReAssignment",
      assignmentOperator: Token.Assign,
      path: { type: "IdentifierPath", name: "a" },
      exp: { type: "number", value: 2 },
    },
  ]);
});

test("Testing reassignment of Array element", () => {
  const input = `
  const a = [1];
  a[0] = 2;`;

  const output = typeCheckAst(convertToAst(convertToTokens(input)));

  expect(output).toEqual<Ast[]>([
    {
      type: "constVariableDeclaration",
      datatype: { type: "ArrayDataType", baseType: LiteralDataType.Number },
      exp: { type: "array", exps: [{ type: "number", value: 1 }] },
      export: false,
      identifierName: "a",
    },
    {
      type: "ReAssignment",
      assignmentOperator: Token.Assign,
      path: {
        type: "BoxMemberPath",
        leftPath: { type: "IdentifierPath", name: "a" },
        accessExp: { type: "number", value: 0 },
      },
      exp: { type: "number", value: 2 },
    },
  ]);
});

test("Testing reassignment of object key", () => {
  const input = `
  const a = {b : 1};
  a.b = 2;
  `;

  const output = typeCheckAst(convertToAst(convertToTokens(input)));

  expect(output).toEqual<Ast[]>([
    {
      type: "constVariableDeclaration",
      datatype: { type: "ObjectDataType", keys: { b: LiteralDataType.Number } },
      exp: { type: "object", keys: [["b", { type: "number", value: 1 }]] },
      export: false,
      identifierName: "a",
    },
    {
      type: "ReAssignment",
      assignmentOperator: Token.Assign,
      path: {
        type: "DotMemberPath",
        leftPath: { type: "IdentifierPath", name: "a" },
        rightPath: "b",
      },
      exp: { type: "number", value: 2 },
    },
  ]);
});

test("Testing reassignment with PlusAssign operator", () => {
  const input = `
  const a = [1];
  a[0] += 2;`;

  const output = typeCheckAst(convertToAst(convertToTokens(input)));

  expect(output).toEqual<Ast[]>([
    {
      type: "constVariableDeclaration",
      datatype: { type: "ArrayDataType", baseType: LiteralDataType.Number },
      exp: { type: "array", exps: [{ type: "number", value: 1 }] },
      export: false,
      identifierName: "a",
    },
    {
      type: "ReAssignment",
      assignmentOperator: Token.PlusAssign,
      path: {
        type: "BoxMemberPath",
        leftPath: { type: "IdentifierPath", name: "a" },
        accessExp: { type: "number", value: 0 },
      },
      exp: { type: "number", value: 2 },
    },
  ]);
});

test("Testing reassignment with MinusAssign operator", () => {
  const input = `
  const a = [1];
  a[0] -= 2;`;

  const output = typeCheckAst(convertToAst(convertToTokens(input)));

  expect(output).toEqual<Ast[]>([
    {
      type: "constVariableDeclaration",
      datatype: { type: "ArrayDataType", baseType: LiteralDataType.Number },
      exp: { type: "array", exps: [{ type: "number", value: 1 }] },
      export: false,
      identifierName: "a",
    },
    {
      type: "ReAssignment",
      assignmentOperator: Token.MinusAssign,
      path: {
        type: "BoxMemberPath",
        leftPath: { type: "IdentifierPath", name: "a" },
        accessExp: { type: "number", value: 0 },
      },
      exp: { type: "number", value: 2 },
    },
  ]);
});

test("Testing reassignment with StarAssign operator", () => {
  const input = `
  const a = [1];
  a[0] *= 2;`;

  const output = typeCheckAst(convertToAst(convertToTokens(input)));

  expect(output).toEqual<Ast[]>([
    {
      type: "constVariableDeclaration",
      datatype: { type: "ArrayDataType", baseType: LiteralDataType.Number },
      exp: { type: "array", exps: [{ type: "number", value: 1 }] },
      export: false,
      identifierName: "a",
    },
    {
      type: "ReAssignment",
      assignmentOperator: Token.StarAssign,
      path: {
        type: "BoxMemberPath",
        leftPath: { type: "IdentifierPath", name: "a" },
        accessExp: { type: "number", value: 0 },
      },
      exp: { type: "number", value: 2 },
    },
  ]);
});

test("Testing reassignment with SlashAssign operator", () => {
  const input = `
  const a = [1];
  a[0] /= 2;`;

  const output = typeCheckAst(convertToAst(convertToTokens(input)));

  expect(output).toEqual<Ast[]>([
    {
      type: "constVariableDeclaration",
      datatype: { type: "ArrayDataType", baseType: LiteralDataType.Number },
      exp: { type: "array", exps: [{ type: "number", value: 1 }] },
      export: false,
      identifierName: "a",
    },
    {
      type: "ReAssignment",
      assignmentOperator: Token.SlashAssign,
      path: {
        type: "BoxMemberPath",
        leftPath: { type: "IdentifierPath", name: "a" },
        accessExp: { type: "number", value: 0 },
      },
      exp: { type: "number", value: 2 },
    },
  ]);
});

test("Testing reassignment of const variable", () => {
  const input = `
  const a = 1;
  a = 2;`;

  const output = () => typeCheckAst(convertToAst(convertToTokens(input)));

  expect(output).toThrow();
});

test("Testing reassignment with another exp of different datatype", () => {
  let input = `
  let a = 1;
  a = true;`;

  const output = () => typeCheckAst(convertToAst(convertToTokens(input)));

  expect(output).toThrow();
});

test("Testing reassignment of wrong datatype with PlusAssign", () => {
  let input = `
  let a = true;
  a += true;`;

  const output = () => typeCheckAst(convertToAst(convertToTokens(input)));

  expect(output).toThrow();
});

test("Testing reassignment of wrong datatype with MinusAssign", () => {
  let input = `
  let a = true;
  a -= true;`;

  const output = () => typeCheckAst(convertToAst(convertToTokens(input)));

  expect(output).toThrow();
});

test("Testing reassignment of wrong datatype with StarAssign", () => {
  let input = `
  let a = true;
  a *= true;`;

  const output = () => typeCheckAst(convertToAst(convertToTokens(input)));

  expect(output).toThrow();
});

test("Testing reassignment of wrong datatype with SlashAssign", () => {
  const input = `
  let a = true;
  a /= true;`;

  const output = () => typeCheckAst(convertToAst(convertToTokens(input)));

  expect(output).toThrow();
});

test("Typechecking while loop declaration", () => {
  const input = `
  const a = 1;

  while (true) {
    const a = 1;
  }`;

  const output = typeCheckAst(convertToAst(convertToTokens(input)));

  expect(output).toEqual<Ast[]>([
    {
      type: "constVariableDeclaration",
      datatype: LiteralDataType.Number,
      export: false,
      identifierName: "a",
      exp: { type: "number", value: 1 },
    },
    {
      type: "WhileLoopDeclaration",
      condition: { type: "boolean", value: true },
      blocks: [
        {
          type: "constVariableDeclaration",
          datatype: LiteralDataType.Number,
          export: false,
          identifierName: "a",
          exp: { type: "number", value: 1 },
        },
      ],
    },
  ]);
});

test("Reassigning inside the while loop declaration", () => {
  const input = `
  let a = 1;

  while (true) {
     a += 1;
  }`;

  const output = typeCheckAst(convertToAst(convertToTokens(input)));

  expect(output).toEqual<Ast[]>([
    {
      type: "letVariableDeclaration",
      datatype: LiteralDataType.Number,
      export: false,
      identifierName: "a",
      exp: { type: "number", value: 1 },
    },
    {
      type: "WhileLoopDeclaration",
      condition: { type: "boolean", value: true },
      blocks: [
        {
          type: "ReAssignment",
          assignmentOperator: Token.PlusAssign,
          path: { type: "IdentifierPath", name: "a" },
          exp: { type: "number", value: 1 },
        },
      ],
    },
  ]);
});

test("Using datatype other than boolean in while loop", () => {
  const input = `
  let a = 1;

  while (1) {
     a += 1;
  }`;

  const output = () => typeCheckAst(convertToAst(convertToTokens(input)));

  expect(output).toThrow();
});

test("Typechecking Do while loop declaration", () => {
  const input = `
  const a = 1;

  do {
    const a = 1;
  } while (true)`;

  const output = typeCheckAst(convertToAst(convertToTokens(input)));

  expect(output).toEqual<Ast[]>([
    {
      type: "constVariableDeclaration",
      datatype: LiteralDataType.Number,
      export: false,
      identifierName: "a",
      exp: { type: "number", value: 1 },
    },
    {
      type: "DoWhileLoopDeclaration",
      condition: { type: "boolean", value: true },
      blocks: [
        {
          type: "constVariableDeclaration",
          datatype: LiteralDataType.Number,
          export: false,
          identifierName: "a",
          exp: { type: "number", value: 1 },
        },
      ],
    },
  ]);
});

test("Reassigning inside the do while loop declaration", () => {
  const input = `
  let a = 1;

  do {
     a += 1;
  } while (true)`;

  const output = typeCheckAst(convertToAst(convertToTokens(input)));

  expect(output).toEqual<Ast[]>([
    {
      type: "letVariableDeclaration",
      datatype: LiteralDataType.Number,
      export: false,
      identifierName: "a",
      exp: { type: "number", value: 1 },
    },
    {
      type: "DoWhileLoopDeclaration",
      condition: { type: "boolean", value: true },
      blocks: [
        {
          type: "ReAssignment",
          assignmentOperator: Token.PlusAssign,
          path: { type: "IdentifierPath", name: "a" },
          exp: { type: "number", value: 1 },
        },
      ],
    },
  ]);
});

test("Using datatype other than boolean in do while declaration", () => {
  const input = `
  let a = 1;

  do {
     a += 1;
  } while (1) `;

  const output = () => typeCheckAst(convertToAst(convertToTokens(input)));

  expect(output).toThrow();
});

test("Testing Break and Continue inside while loop", () => {
  const input = `
  while (true) {
    break;
    continue;
  }`;

  const output = typeCheckAst(convertToAst(convertToTokens(input)));

  expect(output).toEqual<Ast[]>([
    {
      type: "WhileLoopDeclaration",
      condition: { type: "boolean", value: true },
      blocks: [{ type: KeywordTokens.Break }, { type: KeywordTokens.Continue }],
    },
  ]);
});

test("Testing Break and Continue inside do while loop", () => {
  const input = `
  do {
    break;
    continue;
  } while (true)`;

  const output = typeCheckAst(convertToAst(convertToTokens(input)));

  expect(output).toEqual<Ast[]>([
    {
      type: "DoWhileLoopDeclaration",
      condition: { type: "boolean", value: true },
      blocks: [{ type: KeywordTokens.Break }, { type: KeywordTokens.Continue }],
    },
  ]);
});

test("Testing Break outside loop", () => {
  const input = `
  break;
  `;

  const output = () => typeCheckAst(convertToAst(convertToTokens(input)));

  expect(output).toThrow();
});

test("Testing Continue outside loop", () => {
  const input = `
  continue;
  `;

  const output = () => typeCheckAst(convertToAst(convertToTokens(input)));

  expect(output).toThrow();
});

test("Typechecking function declaration with implicit datatype", () => {
  const input = `
  function a() {
    return 1;
  }`;

  const output = typeCheckAst(convertToAst(convertToTokens(input)));

  expect(output).toEqual<Ast[]>([
    {
      type: "FunctionDeclaration",
      name: "a",
      arguments: [],
      export: false,
      returnType: LiteralDataType.Number,
      blocks: [{ type: "ReturnExpression", exp: { type: "number", value: 1 } }],
    },
  ]);
});

test("Typechecking function declaration with explicit datatype", () => {
  const input = `
  function a() : number {
    return 1;
  }`;

  const output = typeCheckAst(convertToAst(convertToTokens(input)));

  expect(output).toEqual<Ast[]>([
    {
      type: "FunctionDeclaration",
      name: "a",
      arguments: [],
      export: false,
      returnType: LiteralDataType.Number,
      blocks: [{ type: "ReturnExpression", exp: { type: "number", value: 1 } }],
    },
  ]);
});

test("Typechecking function declaration with different return exp datatype", () => {
  const input = `
  function a() {
    return 1;
    return false;
  }`;

  const output = () => typeCheckAst(convertToAst(convertToTokens(input)));

  expect(output).toThrow();
});

test("Testing return exp inside loop inside function declaration", () => {
  const input = `
  function a() {
    while (true) {
     return 1;
    }
  }`;

  const output = typeCheckAst(convertToAst(convertToTokens(input)));

  expect(output).toEqual<Ast[]>([
    {
      type: "FunctionDeclaration",
      arguments: [],
      export: false,
      name: "a",
      returnType: LiteralDataType.Number,
      blocks: [
        {
          type: "WhileLoopDeclaration",
          condition: { type: "boolean", value: true },
          blocks: [
            { type: "ReturnExpression", exp: { type: "number", value: 1 } },
          ],
        },
      ],
    },
  ]);
});

test("Testing function call", () => {
  const input = `
  function a() {
    return 1;
  }
  const b : number = a();`;

  const output = typeCheckAst(convertToAst(convertToTokens(input)));

  expect(output).toEqual<Ast[]>([
    {
      type: "FunctionDeclaration",
      name: "a",
      arguments: [],
      export: false,
      returnType: LiteralDataType.Number,
      blocks: [{ type: "ReturnExpression", exp: { type: "number", value: 1 } }],
    },
    {
      type: "constVariableDeclaration",
      datatype: LiteralDataType.Number,
      export: false,
      identifierName: "b",
      exp: {
        type: "FunctionCall",
        arguments: [],
        left: { type: "identifier", name: "a" },
      },
    },
  ]);
});

test("Typecheck if block declaration", () => {
  const input = `
  if (true) {
    const a = 1;
  } else if (true) {
    const a = 1;
  } else if (true) {
    const a = 1;
  } else {
    const a = 1;
  }`;

  const output = typeCheckAst(convertToAst(convertToTokens(input)));

  expect(output).toEqual<Ast[]>([
    {
      type: "IfBlockDeclaration",
      condition: { type: "boolean", value: true },
      blocks: [
        {
          type: "constVariableDeclaration",
          datatype: LiteralDataType.Number,
          exp: { type: "number", value: 1 },
          export: false,
          identifierName: "a",
        },
      ],
    },
    {
      type: "ElseIfBlockDeclaration",
      condition: { type: "boolean", value: true },
      blocks: [
        {
          type: "constVariableDeclaration",
          datatype: LiteralDataType.Number,
          exp: { type: "number", value: 1 },
          export: false,
          identifierName: "a",
        },
      ],
    },
    {
      type: "ElseIfBlockDeclaration",
      condition: { type: "boolean", value: true },
      blocks: [
        {
          type: "constVariableDeclaration",
          datatype: LiteralDataType.Number,
          exp: { type: "number", value: 1 },
          export: false,
          identifierName: "a",
        },
      ],
    },
    {
      type: "ElseBlockDeclaration",
      blocks: [
        {
          type: "constVariableDeclaration",
          datatype: LiteralDataType.Number,
          exp: { type: "number", value: 1 },
          export: false,
          identifierName: "a",
        },
      ],
    },
  ]);
});

test("Typecheck if block declaration without else if block", () => {
  const input = `
  if (true) {
    const a = 1;
  } else {
    const a = 1;
  }`;

  const output = typeCheckAst(convertToAst(convertToTokens(input)));

  expect(output).toEqual<Ast[]>([
    {
      type: "IfBlockDeclaration",
      condition: { type: "boolean", value: true },
      blocks: [
        {
          type: "constVariableDeclaration",
          datatype: LiteralDataType.Number,
          exp: { type: "number", value: 1 },
          export: false,
          identifierName: "a",
        },
      ],
    },
    {
      type: "ElseBlockDeclaration",
      blocks: [
        {
          type: "constVariableDeclaration",
          datatype: LiteralDataType.Number,
          exp: { type: "number", value: 1 },
          export: false,
          identifierName: "a",
        },
      ],
    },
  ]);
});

test("Typecheck if block declaration without else block", () => {
  const input = `
  if (true) {
    const a = 1;
  } else if (true) {
    const a = 1;
  } else if (true) {
    const a = 1;
  }`;

  const output = typeCheckAst(convertToAst(convertToTokens(input)));

  expect(output).toEqual<Ast[]>([
    {
      type: "IfBlockDeclaration",
      condition: { type: "boolean", value: true },
      blocks: [
        {
          type: "constVariableDeclaration",
          datatype: LiteralDataType.Number,
          exp: { type: "number", value: 1 },
          export: false,
          identifierName: "a",
        },
      ],
    },
    {
      type: "ElseIfBlockDeclaration",
      condition: { type: "boolean", value: true },
      blocks: [
        {
          type: "constVariableDeclaration",
          datatype: LiteralDataType.Number,
          exp: { type: "number", value: 1 },
          export: false,
          identifierName: "a",
        },
      ],
    },
    {
      type: "ElseIfBlockDeclaration",
      condition: { type: "boolean", value: true },
      blocks: [
        {
          type: "constVariableDeclaration",
          datatype: LiteralDataType.Number,
          exp: { type: "number", value: 1 },
          export: false,
          identifierName: "a",
        },
      ],
    },
  ]);
});

test("Typecheck if block declaration without both else and else if block", () => {
  const input = `
  if (true) {
    const a = 1;
  }`;

  const output = typeCheckAst(convertToAst(convertToTokens(input)));

  expect(output).toEqual<Ast[]>([
    {
      type: "IfBlockDeclaration",
      condition: { type: "boolean", value: true },
      blocks: [
        {
          type: "constVariableDeclaration",
          datatype: LiteralDataType.Number,
          exp: { type: "number", value: 1 },
          export: false,
          identifierName: "a",
        },
      ],
    },
  ]);
});

test("Testing declaring function at other than top level", () => {
  const input = `
  if (true) {
    function declaration a() {
      return 1;
    }
  }`;

  const getOutput = () => typeCheckAst(convertToAst(convertToTokens(input)));

  expect(getOutput).toThrow();
});

test("Testing declaring export variable at other than top level", () => {
  const input = `
  if (true) {
    export const a  = 1;
  }`;

  const getOutput = () => typeCheckAst(convertToAst(convertToTokens(input)));

  expect(getOutput).toThrow();
});

test("Using arguments in function declaration", () => {
  const input = `
  function f(a : number, b : number) {
    return a + b;
  }`;

  const output = typeCheckAst(convertToAst(convertToTokens(input)));

  expect(output).toEqual<Ast[]>([
    {
      type: "FunctionDeclaration",
      export: false,
      name: "f",
      returnType: LiteralDataType.Number,
      arguments: [
        ["a", LiteralDataType.Number],
        ["b", LiteralDataType.Number],
      ],
      blocks: [
        {
          type: "ReturnExpression",
          exp: {
            type: Token.Plus,
            left: { type: "identifier", name: "a" },
            right: { type: "identifier", name: "b" },
          },
        },
      ],
    },
  ]);
});
