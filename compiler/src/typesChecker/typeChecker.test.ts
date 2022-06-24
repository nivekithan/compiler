import { resolve } from "path";
import { convertToTokens } from "../lexer/lexer";
import { KeywordTokens, Token } from "../lexer/tokens";
import { convertToAst } from "../parser/parser";
import { DepImporter } from "./depImporter";
import { typeCheckAst } from "./typeChecker";
import { TypeCheckedAst } from "../tsTypes/typechecked";
import { t } from "xstate";

test("Typechecking variableDeclaration with implicit datatype", () => {
  const input = `
    const a = "1";
    const b = 1;
    const c = true;
    const d = false;
    const e = [1];
    const f = {a : 1};`;

  const output = typeCheckAst(convertToAst(convertToTokens(input)));

  expect(output).toEqual<TypeCheckedAst[]>([
    {
      type: "constVariableDeclaration",
      datatype: { type: "StringDatatype", length: 1 },
      identifierName: "a",
      exp: { type: "string", value: "1" },
      export: false,
    },
    {
      type: "constVariableDeclaration",
      datatype: { type: "NumberDatatype" },
      identifierName: "b",
      exp: { type: "number", value: 1 },
      export: false,
    },
    {
      type: "constVariableDeclaration",
      datatype: { type: "BooleanDataType" },
      identifierName: "c",
      exp: { type: "boolean", value: true },
      export: false,
    },
    {
      type: "constVariableDeclaration",
      datatype: { type: "BooleanDataType" },
      identifierName: "d",
      exp: { type: "boolean", value: false },
      export: false,
    },
    {
      type: "constVariableDeclaration",
      datatype: {
        type: "ArrayDataType",
        baseType: { type: "NumberDatatype" },
        numberOfElements: 1,
      },
      identifierName: "e",
      exp: {
        type: "array",
        exps: [{ type: "number", value: 1 }],
        datatype: {
          type: "ArrayDataType",
          baseType: { type: "NumberDatatype" },
          numberOfElements: 1,
        },
      },
      export: false,
    },
    {
      type: "constVariableDeclaration",
      datatype: {
        type: "ObjectDataType",
        keys: { a: { type: "NumberDatatype" } },
      },
      identifierName: "f",
      exp: {
        type: "object",
        keys: [["a", { type: "number", value: 1 }]],
        datatype: {
          type: "ObjectDataType",
          keys: { a: { type: "NumberDatatype" } },
        },
      },
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

  expect(output).toEqual<TypeCheckedAst[]>([
    {
      type: "constVariableDeclaration",
      datatype: { type: "StringDatatype", length: 1 },
      identifierName: "a",
      exp: { type: "string", value: "1" },
      export: false,
    },
    {
      type: "constVariableDeclaration",
      datatype: { type: "NumberDatatype" },
      identifierName: "b",
      exp: { type: "number", value: 1 },
      export: false,
    },
    {
      type: "constVariableDeclaration",
      datatype: { type: "BooleanDataType" },
      identifierName: "c",
      exp: { type: "boolean", value: true },
      export: false,
    },
    {
      type: "constVariableDeclaration",
      datatype: { type: "BooleanDataType" },
      identifierName: "d",
      exp: { type: "boolean", value: false },
      export: false,
    },
    {
      type: "constVariableDeclaration",
      datatype: {
        type: "ArrayDataType",
        baseType: { type: "NumberDatatype" },
        numberOfElements: 1,
      },
      identifierName: "e",
      exp: {
        type: "array",
        exps: [{ type: "number", value: 1 }],
        datatype: {
          type: "ArrayDataType",
          baseType: { type: "NumberDatatype" },
          numberOfElements: 1,
        },
      },
      export: false,
    },
    {
      type: "constVariableDeclaration",
      datatype: {
        type: "ObjectDataType",
        keys: { a: { type: "NumberDatatype" } },
      },
      identifierName: "f",
      exp: {
        type: "object",
        keys: [["a", { type: "number", value: 1 }]],
        datatype: {
          type: "ObjectDataType",
          keys: { a: { type: "NumberDatatype" } },
        },
      },
      export: false,
    },
  ]);
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

  expect(output).toEqual<TypeCheckedAst[]>([
    {
      type: "constVariableDeclaration",
      datatype: { type: "BooleanDataType" },
      exp: { type: "boolean", value: true },
      export: false,
      identifierName: "a",
    },
    {
      type: "constVariableDeclaration",
      datatype: { type: "BooleanDataType" },
      exp: {
        type: Token.Bang,
        argument: {
          type: "identifier",
          name: "a",
          datatype: { type: "BooleanDataType" },
        },
      },
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

  expect(output).toEqual<TypeCheckedAst[]>([
    {
      type: "letVariableDeclaration",
      datatype: { type: "NumberDatatype" },
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

  expect(output).toEqual<TypeCheckedAst[]>([
    {
      type: "constVariableDeclaration",
      datatype: {
        type: "ArrayDataType",
        baseType: { type: "NumberDatatype" },
        numberOfElements: 1,
      },
      exp: {
        type: "array",
        exps: [{ type: "number", value: 1 }],
        datatype: {
          type: "ArrayDataType",
          baseType: { type: "NumberDatatype" },
          numberOfElements: 1,
        },
      },
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
        leftBaseType: { type: "NumberDatatype" },
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

  expect(output).toEqual<TypeCheckedAst[]>([
    {
      type: "constVariableDeclaration",
      datatype: {
        type: "ObjectDataType",
        keys: { b: { type: "NumberDatatype" } },
      },
      exp: {
        type: "object",
        keys: [["b", { type: "number", value: 1 }]],
        datatype: {
          type: "ObjectDataType",
          keys: { b: { type: "NumberDatatype" } },
        },
      },
      export: false,
      identifierName: "a",
    },
    {
      type: "ReAssignment",
      assignmentOperator: Token.Assign,
      path: {
        type: "DotMemberPath",
        leftPath: { type: "IdentifierPath", name: "a" },
        leftDataType: {
          type: "ObjectDataType",
          keys: { b: { type: "NumberDatatype" } },
        },
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

  expect(output).toEqual<TypeCheckedAst[]>([
    {
      type: "constVariableDeclaration",
      datatype: {
        type: "ArrayDataType",
        baseType: { type: "NumberDatatype" },
        numberOfElements: 1,
      },
      exp: {
        type: "array",
        exps: [{ type: "number", value: 1 }],
        datatype: {
          type: "ArrayDataType",
          baseType: { type: "NumberDatatype" },
          numberOfElements: 1,
        },
      },
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
        leftBaseType: { type: "NumberDatatype" },
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

  expect(output).toEqual<TypeCheckedAst[]>([
    {
      type: "constVariableDeclaration",
      datatype: {
        type: "ArrayDataType",
        baseType: { type: "NumberDatatype" },
        numberOfElements: 1,
      },
      exp: {
        type: "array",
        exps: [{ type: "number", value: 1 }],
        datatype: {
          type: "ArrayDataType",
          baseType: { type: "NumberDatatype" },
          numberOfElements: 1,
        },
      },
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
        leftBaseType: { type: "NumberDatatype" },
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

  expect(output).toEqual<TypeCheckedAst[]>([
    {
      type: "constVariableDeclaration",
      datatype: {
        type: "ArrayDataType",
        baseType: { type: "NumberDatatype" },
        numberOfElements: 1,
      },
      exp: {
        type: "array",
        exps: [{ type: "number", value: 1 }],
        datatype: {
          type: "ArrayDataType",
          baseType: { type: "NumberDatatype" },
          numberOfElements: 1,
        },
      },
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
        leftBaseType: { type: "NumberDatatype" },
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

  expect(output).toEqual<TypeCheckedAst[]>([
    {
      type: "constVariableDeclaration",
      datatype: {
        type: "ArrayDataType",
        baseType: { type: "NumberDatatype" },
        numberOfElements: 1,
      },
      exp: {
        type: "array",
        exps: [{ type: "number", value: 1 }],
        datatype: {
          type: "ArrayDataType",
          baseType: { type: "NumberDatatype" },
          numberOfElements: 1,
        },
      },
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
        leftBaseType: { type: "NumberDatatype" },
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

  expect(output).toEqual<TypeCheckedAst[]>([
    {
      type: "constVariableDeclaration",
      datatype: { type: "NumberDatatype" },
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
          datatype: { type: "NumberDatatype" },
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

  expect(output).toEqual<TypeCheckedAst[]>([
    {
      type: "letVariableDeclaration",
      datatype: { type: "NumberDatatype" },
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

  expect(output).toEqual<TypeCheckedAst[]>([
    {
      type: "constVariableDeclaration",
      datatype: { type: "NumberDatatype" },
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
          datatype: { type: "NumberDatatype" },
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

  expect(output).toEqual<TypeCheckedAst[]>([
    {
      type: "letVariableDeclaration",
      datatype: { type: "NumberDatatype" },
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

  expect(output).toEqual<TypeCheckedAst[]>([
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

  expect(output).toEqual<TypeCheckedAst[]>([
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

  expect(output).toEqual<TypeCheckedAst[]>([
    {
      type: "FunctionDeclaration",
      name: "a",
      arguments: [],
      export: false,
      returnType: { type: "NumberDatatype" },
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

  expect(output).toEqual<TypeCheckedAst[]>([
    {
      type: "FunctionDeclaration",
      name: "a",
      arguments: [],
      export: false,
      returnType: { type: "NumberDatatype" },
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

  expect(output).toEqual<TypeCheckedAst[]>([
    {
      type: "FunctionDeclaration",
      arguments: [],
      export: false,
      name: "a",
      returnType: { type: "NumberDatatype" },
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

  expect(output).toEqual<TypeCheckedAst[]>([
    {
      type: "FunctionDeclaration",
      name: "a",
      arguments: [],
      export: false,
      returnType: { type: "NumberDatatype" },
      blocks: [{ type: "ReturnExpression", exp: { type: "number", value: 1 } }],
    },
    {
      type: "constVariableDeclaration",
      datatype: { type: "NumberDatatype" },
      export: false,
      identifierName: "b",
      exp: {
        type: "FunctionCall",
        arguments: [],
        left: {
          type: "identifier",
          name: "a",
          datatype: {
            type: "FunctionDataType",
            arguments: {},
            returnType: { type: "NumberDatatype" },
          },
        },
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

  expect(output).toEqual<TypeCheckedAst[]>([
    {
      type: "typeCheckedIfBlockDeclaration",
      ifBlock: {
        type: "IfBlockDeclaration",
        condition: { type: "boolean", value: true },
        blocks: [
          {
            type: "constVariableDeclaration",
            datatype: { type: "NumberDatatype" },
            exp: { type: "number", value: 1 },
            export: false,
            identifierName: "a",
          },
        ],
      },
      elseIfBlocks: [
        {
          type: "ElseIfBlockDeclaration",
          condition: { type: "boolean", value: true },
          blocks: [
            {
              type: "constVariableDeclaration",
              datatype: { type: "NumberDatatype" },
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
              datatype: { type: "NumberDatatype" },
              exp: { type: "number", value: 1 },
              export: false,
              identifierName: "a",
            },
          ],
        },
      ],
      elseBlock: {
        type: "ElseBlockDeclaration",
        blocks: [
          {
            type: "constVariableDeclaration",
            datatype: { type: "NumberDatatype" },
            exp: { type: "number", value: 1 },
            export: false,
            identifierName: "a",
          },
        ],
      },
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

  expect(output).toEqual<TypeCheckedAst[]>([
    {
      type: "typeCheckedIfBlockDeclaration",
      ifBlock: {
        type: "IfBlockDeclaration",
        condition: { type: "boolean", value: true },
        blocks: [
          {
            type: "constVariableDeclaration",
            datatype: { type: "NumberDatatype" },
            exp: { type: "number", value: 1 },
            export: false,
            identifierName: "a",
          },
        ],
      },
      elseBlock: {
        type: "ElseBlockDeclaration",
        blocks: [
          {
            type: "constVariableDeclaration",
            datatype: { type: "NumberDatatype" },
            exp: { type: "number", value: 1 },
            export: false,
            identifierName: "a",
          },
        ],
      },
      elseIfBlocks: [],
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

  expect(output).toEqual<TypeCheckedAst[]>([
    {
      type: "typeCheckedIfBlockDeclaration",
      ifBlock: {
        type: "IfBlockDeclaration",
        condition: { type: "boolean", value: true },
        blocks: [
          {
            type: "constVariableDeclaration",
            datatype: { type: "NumberDatatype" },
            exp: { type: "number", value: 1 },
            export: false,
            identifierName: "a",
          },
        ],
      },
      elseIfBlocks: [
        {
          type: "ElseIfBlockDeclaration",
          condition: { type: "boolean", value: true },
          blocks: [
            {
              type: "constVariableDeclaration",
              datatype: { type: "NumberDatatype" },
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
              datatype: { type: "NumberDatatype" },
              exp: { type: "number", value: 1 },
              export: false,
              identifierName: "a",
            },
          ],
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

  expect(output).toEqual<TypeCheckedAst[]>([
    {
      type: "typeCheckedIfBlockDeclaration",
      ifBlock: {
        type: "IfBlockDeclaration",
        condition: { type: "boolean", value: true },
        blocks: [
          {
            type: "constVariableDeclaration",
            datatype: { type: "NumberDatatype" },
            exp: { type: "number", value: 1 },
            export: false,
            identifierName: "a",
          },
        ],
      },
      elseIfBlocks: [],
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

  expect(output).toEqual<TypeCheckedAst[]>([
    {
      type: "FunctionDeclaration",
      export: false,
      name: "f",
      returnType: { type: "NumberDatatype" },
      arguments: [
        ["a", { type: "NumberDatatype" }],
        ["b", { type: "NumberDatatype" }],
      ],
      blocks: [
        {
          type: "ReturnExpression",
          exp: {
            type: Token.Plus,
            left: {
              type: "identifier",
              name: "a",
              datatype: { type: "NumberDatatype" },
            },
            right: {
              type: "identifier",
              name: "b",
              datatype: { type: "NumberDatatype" },
            },
          },
        },
      ],
    },
  ]);
});

test("Testing hoisting function declaration", () => {
  const input = `
  
  const a = b();

  function b() {
    return 1;
  }
  `;

  const output = typeCheckAst(convertToAst(convertToTokens(input)));

  expect(output).toEqual<TypeCheckedAst[]>([
    {
      type: "constVariableDeclaration",
      datatype: { type: "NumberDatatype" },
      exp: {
        type: "FunctionCall",
        left: {
          type: "identifier",
          name: "b",
          datatype: {
            type: "FunctionDataType",
            arguments: {},
            returnType: { type: "NumberDatatype" },
          },
        },
        arguments: [],
      },
      export: false,
      identifierName: "a",
    },
    {
      type: "FunctionDeclaration",
      arguments: [],
      blocks: [{ type: "ReturnExpression", exp: { type: "number", value: 1 } }],
      export: false,
      name: "b",
      returnType: { type: "NumberDatatype" },
    },
  ]);
});

test("Testing using variable declared in top level inside another lower level closure", () => {
  const input = `
  
  function a() {
    const b = c;
    const d = b ;
    return d;
  }

  const c = 1;
  `;

  const output = typeCheckAst(convertToAst(convertToTokens(input)));

  expect(output).toEqual<TypeCheckedAst[]>([
    {
      type: "FunctionDeclaration",
      arguments: [],
      blocks: [
        {
          type: "constVariableDeclaration",
          datatype: { type: "NumberDatatype" },
          exp: {
            type: "identifier",
            name: "c",
            datatype: { type: "NumberDatatype" },
          },
          export: false,
          identifierName: "b",
        },
        {
          type: "constVariableDeclaration",
          datatype: { type: "NumberDatatype" },
          exp: {
            type: "identifier",
            name: "b",
            datatype: { type: "NumberDatatype" },
          },
          export: false,
          identifierName: "d",
        },
        {
          type: "ReturnExpression",
          exp: {
            type: "identifier",
            name: "d",
            datatype: { type: "NumberDatatype" },
          },
        },
      ],
      export: false,
      name: "a",
      returnType: { type: "NumberDatatype" },
    },
    {
      type: "constVariableDeclaration",
      datatype: { type: "NumberDatatype" },
      exp: {
        type: "number",
        value: 1,
      },
      export: false,
      identifierName: "c",
    },
  ]);
});

test("Testing hoisting other than function declaration", () => {
  const input = `
  
  const a = b;
  const b = 1
  `;

  const getOutput = () => typeCheckAst(convertToAst(convertToTokens(input)));

  expect(getOutput).toThrow();
});

test("Test hoisting function declaration in reassignment", () => {
  const input = `
  let a = 1;
  a = b();

  function b() {
    return 1;
  }
  `;

  const output = typeCheckAst(convertToAst(convertToTokens(input)));

  expect(output).toEqual<TypeCheckedAst[]>([
    {
      type: "letVariableDeclaration",
      datatype: { type: "NumberDatatype" },
      exp: { type: "number", value: 1 },
      export: false,
      identifierName: "a",
    },
    {
      type: "ReAssignment",
      assignmentOperator: Token.Assign,
      path: { type: "IdentifierPath", name: "a" },
      exp: {
        type: "FunctionCall",
        left: {
          type: "identifier",
          name: "b",
          datatype: {
            type: "FunctionDataType",
            arguments: {},
            returnType: { type: "NumberDatatype" },
          },
        },
        arguments: [],
      },
    },
    {
      type: "FunctionDeclaration",
      arguments: [],
      blocks: [{ type: "ReturnExpression", exp: { type: "number", value: 1 } }],
      export: false,
      name: "b",
      returnType: { type: "NumberDatatype" },
    },
  ]);
});

test("[Reassignment] Testing using variable declared in top level inside another lower level closure", () => {
  const input = `
  
  function a() {
    const b = [c];
    const d = {e : b[0]} ;
    return d.e;
  }

  let c = 1;
  `;

  const output = typeCheckAst(convertToAst(convertToTokens(input)));

  expect(output).toEqual<TypeCheckedAst[]>([
    {
      type: "FunctionDeclaration",
      arguments: [],
      blocks: [
        {
          type: "constVariableDeclaration",
          datatype: {
            type: "ArrayDataType",
            baseType: { type: "NumberDatatype" },
            numberOfElements: 1,
          },
          exp: {
            type: "array",
            exps: [
              {
                type: "identifier",
                name: "c",
                datatype: { type: "NumberDatatype" },
              },
            ],
            datatype: {
              type: "ArrayDataType",
              baseType: { type: "NumberDatatype" },
              numberOfElements: 1,
            },
          },
          export: false,
          identifierName: "b",
        },
        {
          type: "constVariableDeclaration",
          datatype: {
            type: "ObjectDataType",
            keys: { e: { type: "NumberDatatype" } },
          },
          exp: {
            type: "object",
            keys: [
              [
                "e",
                {
                  type: "BoxMemberAccess",
                  left: {
                    type: "identifier",
                    name: "b",
                    datatype: {
                      type: "ArrayDataType",
                      baseType: { type: "NumberDatatype" },
                      numberOfElements: 1,
                    },
                  },
                  right: { type: "number", value: 0 },
                },
              ],
            ],
            datatype: {
              type: "ObjectDataType",
              keys: { e: { type: "NumberDatatype" } },
            },
          },
          export: false,
          identifierName: "d",
        },
        {
          type: "ReturnExpression",
          exp: {
            type: "DotMemberAccess",
            left: {
              type: "identifier",
              name: "d",
              datatype: {
                type: "ObjectDataType",
                keys: { e: { type: "NumberDatatype" } },
              },
            },
            right: "e",
          },
        },
      ],
      export: false,
      name: "a",
      returnType: { type: "NumberDatatype" },
    },
    {
      type: "letVariableDeclaration",
      datatype: { type: "NumberDatatype" },
      exp: {
        type: "number",
        value: 1,
      },
      export: false,
      identifierName: "c",
    },
  ]);
});

test("[Reassignment] Testing hoisting other than function declaration", () => {
  const input = `
  
  let a = 1;
  a = b;
  const b = 1
  `;

  const getOutput = () => typeCheckAst(convertToAst(convertToTokens(input)));

  expect(getOutput).toThrow();
});

test("Declaring a function with argname should throw error", () => {
  const input = `
  function a(b : number ,b : number) {
    return 1;
  }`;

  const getOutput = () => typeCheckAst(convertToAst(convertToTokens(input)));

  expect(getOutput).toThrow();
});

test("Typechecking import declaration", () => {
  const input = `
  import {a, b} from "./someFile"`;

  const TestImporter = new DepImporter("/curDir", {
    [resolve("/curDir", "./someFile")]: {
      a: { type: "NumberDatatype" },
      b: { type: "NumberDatatype" },
    },
  });

  const output = typeCheckAst(
    convertToAst(convertToTokens(input)),
    TestImporter
  );

  expect(output).toEqual<TypeCheckedAst[]>([
    {
      type: "importDeclaration",
      from: "./someFile",
      importedIdentifires: [
        { type: "identifier", dataType: { type: "NumberDatatype" }, name: "a" },
        { type: "identifier", dataType: { type: "NumberDatatype" }, name: "b" },
      ],
    },
  ]);
});

test("Typechecking strict equality and strict not equality", () => {
  const input = `
  const a = 1 === 1;
  const c = true === false;`;

  const output = typeCheckAst(convertToAst(convertToTokens(input)));

  expect(output).toEqual<TypeCheckedAst[]>([
    {
      type: "constVariableDeclaration",
      datatype: { type: "BooleanDataType" },
      exp: {
        type: Token.StrictEquality,
        left: { type: "number", value: 1 },
        right: { type: "number", value: 1 },
      },
      export: false,
      identifierName: "a",
    },
    {
      type: "constVariableDeclaration",
      datatype: { type: "BooleanDataType" },
      exp: {
        type: Token.StrictEquality,
        left: { type: "boolean", value: true },
        right: { type: "boolean", value: false },
      },
      export: false,
      identifierName: "c",
    },
  ]);
});

test("Testing compiler provided fn", () => {
  const input = `
  const a = printFoo()`;

  const output = typeCheckAst(convertToAst(convertToTokens(input)));

  expect(output).toEqual<TypeCheckedAst[]>([
    {
      type: "constVariableDeclaration",
      export: false,
      identifierName: "a",
      datatype: { type: "BooleanDataType" },
      exp: {
        type: "FunctionCall",
        arguments: [],
        left: {
          type: "identifier",
          datatype: {
            type: "FunctionDataType",
            arguments: {},
            returnType: { type: "BooleanDataType" },
          },
          name: "printFoo",
        },
      },
    },
  ]);
});

test("Testing length field on string", () => {
  const input = `
  const a = "123";
  const b = a.length;`;

  const output = typeCheckAst(convertToAst(convertToTokens(input)));

  expect(output).toEqual<TypeCheckedAst[]>([
    {
      type: "constVariableDeclaration",
      datatype: { type: "StringDatatype", length: 3 },
      export: false,
      identifierName: "a",
      exp: { type: "string", value: "123" },
    },
    {
      type: "constVariableDeclaration",
      datatype: { type: "NumberDatatype" },
      exp: {
        type: "DotMemberAccess",
        left: {
          type: "identifier",
          datatype: { type: "StringDatatype", length: 3 },
          name: "a",
        },
        right: "length",
      },
      export: false,
      identifierName: "b",
    },
  ]);
});

test("Testing box member access on string datatype", () => {
  const input = `
  const a = "123";
  const b = a[1];`;

  const output = typeCheckAst(convertToAst(convertToTokens(input)));

  expect(output).toEqual<TypeCheckedAst[]>([
    {
      type: "constVariableDeclaration",
      datatype: { type: "StringDatatype", length: 3 },
      exp: { type: "string", value: "123" },
      export: false,
      identifierName: "a",
    },
    {
      type: "constVariableDeclaration",
      datatype: { type: "StringDatatype", length: 1 },
      exp: {
        type: "BoxMemberAccess",
        left: {
          type: "identifier",
          datatype: { type: "StringDatatype", length: 3 },
          name: "a",
        },
        right: { type: "number", value: 1 },
      },
      export: false,
      identifierName: "b",
    },
  ]);
});
