import { convertToTokens } from "../lexer/lexer";
import { Token } from "../lexer/tokens";
import { Ast, LiteralDataType } from "../parser/ast";
import { convertToAst } from "../parser/parser";
import { typeCheckAst } from "./typeChecker";

test("Typechecking variableDeclaration with implicit datatype", () => {
  const input = `
    const a = "1";
    const b = 1;
    const c = true;
    const d = false;
    const e = [1];`;

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
  ]);
});
test("Typechecking variableDeclaration with explicit datatype", () => {
  const input = `
      const a : string = "1";
      const b : number = 1;
      const c : boolean = true;
      const d : boolean = false;
      const e : number[] = [1]`;

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
