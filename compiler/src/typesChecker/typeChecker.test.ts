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
    const d = false;`;

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
  ]);
});
test("Typechecking variableDeclaration with explicit datatype", () => {
  const input = `
      const a : string = "1";
      const b : number = 1;
      const c : boolean = true;
      const d : boolean = false;`;

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