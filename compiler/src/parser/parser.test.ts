import { convertToTokens } from "../lexer/lexer";
import { KeywordTokens, Token } from "../lexer/tokens";
import { Ast, ConstVariableDeclaration, DataType } from "./ast";
import { convertToAst } from "./parser";

test("Test import declaration", () => {
  const input = `
    import { table, Chair } from  "./someFile"
    import { so, soo } from "./file2";
    import { so, soo } from "./file3";
    `;

  const output = convertToAst(convertToTokens(input));

  expect(output).toEqual<Ast[]>([
    {
      type: "importDeclaration",
      from: "./someFile",
      importedIdentifires: [
        { type: "identifier", name: "table", dataType: DataType.NotCalculated },
        {
          type: "identifier",
          name: "Chair",
          dataType: DataType.NotCalculated,
        },
      ],
    },
    {
      type: "importDeclaration",
      from: "./file2",
      importedIdentifires: [
        { type: "identifier", name: "so", dataType: DataType.NotCalculated },
        {
          type: "identifier",
          name: "soo",
          dataType: DataType.NotCalculated,
        },
      ],
    },
    {
      type: "importDeclaration",
      from: "./file3",
      importedIdentifires: [
        { type: "identifier", name: "so", dataType: DataType.NotCalculated },
        {
          type: "identifier",
          name: "soo",
          dataType: DataType.NotCalculated,
        },
      ],
    },
  ]);
});

test("Let variable declaration", () => {
  const input = `
  let a = "A";`;

  const output = convertToAst(convertToTokens(input));

  expect(output).toEqual<Ast[]>([
    {
      type: "letVariableDeclaration",
      identifierName: "a",
      datatype: DataType.NotCalculated,
      exp: { type: "string", value: "A" },
    },
  ]);
});
test("Const variable declaration", () => {
  const input = `
  const a = "A"
  const b = someOtherVar;
  const c = 123
  const d = true;
  const e = false 
  const f = +123
  const g = -123
  const h = !!true;`;

  const output = convertToAst(convertToTokens(input));

  expect(output).toEqual<Ast[]>([
    {
      type: "constVariableDeclaration",
      identifierName: "a",
      exp: { type: "string", value: "A" },
      datatype: DataType.NotCalculated,
    },
    {
      type: "constVariableDeclaration",
      identifierName: "b",
      exp: { type: "identifier", name: "someOtherVar" },
      datatype: DataType.NotCalculated,
    },
    {
      type: "constVariableDeclaration",
      identifierName: "c",
      exp: { type: "number", value: 123 },
      datatype: DataType.NotCalculated,
    },
    {
      type: "constVariableDeclaration",
      identifierName: "d",
      exp: { type: "boolean", value: true },
      datatype: DataType.NotCalculated,
    },
    {
      type: "constVariableDeclaration",
      identifierName: "e",
      exp: { type: "boolean", value: false },
      datatype: DataType.NotCalculated,
    },
    {
      type: "constVariableDeclaration",
      identifierName: "f",
      exp: { type: Token.Plus, argument: { type: "number", value: 123 } },
      datatype: DataType.NotCalculated,
    },
    {
      type: "constVariableDeclaration",
      identifierName: "g",
      exp: { type: Token.Minus, argument: { type: "number", value: 123 } },
      datatype: DataType.NotCalculated,
    },
    {
      type: "constVariableDeclaration",
      identifierName: "h",
      exp: {
        type: Token.Bang,
        argument: {
          type: Token.Bang,
          argument: { type: "boolean", value: true },
        },
      },
      datatype: DataType.NotCalculated,
    },
  ]);
});

test("Testing Binary Expression", () => {
  const input = `
  const a = 1 + 2;
  const b = 1 - 2;
  const c = 1 * 2;
  const d = 1 / 2;
  const e = 1 | 2;
  const f = 1 ^ 2;
  const g = 1 & 2;
  const h = 1 === 2;
  const i = 1 !== 2;
  const j = 1 < 2;
  const k = 1 <= 2;
  const l = 1 > 2;
  const m = 1 >= 2;
   `;

  const output = convertToAst(convertToTokens(input));

  expect(output).toEqual<Ast[]>([
    {
      type: "constVariableDeclaration",
      datatype: DataType.NotCalculated,
      identifierName: "a",
      exp: {
        type: Token.Plus,
        left: { type: "number", value: 1 },
        right: { type: "number", value: 2 },
      },
    },
    {
      type: "constVariableDeclaration",
      datatype: DataType.NotCalculated,
      identifierName: "b",
      exp: {
        type: Token.Minus,
        left: { type: "number", value: 1 },
        right: { type: "number", value: 2 },
      },
    },
    {
      type: "constVariableDeclaration",
      datatype: DataType.NotCalculated,
      identifierName: "c",
      exp: {
        type: Token.Star,
        left: { type: "number", value: 1 },
        right: { type: "number", value: 2 },
      },
    },
    {
      type: "constVariableDeclaration",
      datatype: DataType.NotCalculated,
      identifierName: "d",
      exp: {
        type: Token.Slash,
        left: { type: "number", value: 1 },
        right: { type: "number", value: 2 },
      },
    },
    {
      type: "constVariableDeclaration",
      datatype: DataType.NotCalculated,
      identifierName: "e",
      exp: {
        type: Token.VerticalBar,
        left: { type: "number", value: 1 },
        right: { type: "number", value: 2 },
      },
    },
    {
      type: "constVariableDeclaration",
      datatype: DataType.NotCalculated,
      identifierName: "f",
      exp: {
        type: Token.Caret,
        left: { type: "number", value: 1 },
        right: { type: "number", value: 2 },
      },
    },
    {
      type: "constVariableDeclaration",
      datatype: DataType.NotCalculated,
      identifierName: "g",
      exp: {
        type: Token.Ampersand,
        left: { type: "number", value: 1 },
        right: { type: "number", value: 2 },
      },
    },
    {
      type: "constVariableDeclaration",
      datatype: DataType.NotCalculated,
      identifierName: "h",
      exp: {
        type: Token.StrictEquality,
        left: { type: "number", value: 1 },
        right: { type: "number", value: 2 },
      },
    },
    {
      type: "constVariableDeclaration",
      datatype: DataType.NotCalculated,
      identifierName: "i",
      exp: {
        type: Token.StrictNotEqual,
        left: { type: "number", value: 1 },
        right: { type: "number", value: 2 },
      },
    },
    {
      type: "constVariableDeclaration",
      datatype: DataType.NotCalculated,
      identifierName: "j",
      exp: {
        type: Token.LessThan,
        left: { type: "number", value: 1 },
        right: { type: "number", value: 2 },
      },
    },
    {
      type: "constVariableDeclaration",
      datatype: DataType.NotCalculated,
      identifierName: "k",
      exp: {
        type: Token.LessThanOrEqual,
        left: { type: "number", value: 1 },
        right: { type: "number", value: 2 },
      },
    },
    {
      type: "constVariableDeclaration",
      datatype: DataType.NotCalculated,
      identifierName: "l",
      exp: {
        type: Token.GreaterThan,
        left: { type: "number", value: 1 },
        right: { type: "number", value: 2 },
      },
    },
    {
      type: "constVariableDeclaration",
      datatype: DataType.NotCalculated,
      identifierName: "m",
      exp: {
        type: Token.GreaterThanOrEqual,
        left: { type: "number", value: 1 },
        right: { type: "number", value: 2 },
      },
    },
  ]);
});

test("Testing group expressions", () => {
  const input = `
  const a = (1 * (2 + 3)) / (4 + 5)`;

  const output = convertToAst(convertToTokens(input));

  expect(output).toEqual<Ast[]>([
    {
      type: "constVariableDeclaration",
      identifierName: "a",
      datatype: DataType.NotCalculated,
      exp: {
        type: Token.Slash,
        left: {
          type: Token.Star,
          left: { type: "number", value: 1 },
          right: {
            type: Token.Plus,
            left: { type: "number", value: 2 },
            right: { type: "number", value: 3 },
          },
        },
        right: {
          type: Token.Plus,
          left: { type: "number", value: 4 },
          right: { type: "number", value: 5 },
        },
      },
    },
  ]);
});

test("Box Member Access Test", () => {
  const input = `
  const a = b[1];`;

  const output = convertToAst(convertToTokens(input));

  expect(output).toEqual<Ast[]>([
    {
      type: "constVariableDeclaration",
      identifierName: "a",
      datatype: DataType.NotCalculated,
      exp: {
        type: "BoxMemberAccess",
        left: { type: "identifier", name: "b" },
        right: { type: "number", value: 1 },
      },
    },
  ]);
});

test("Dot Member Access Test", () => {
  const input = `
  const a = b.c;`;

  const output = convertToAst(convertToTokens(input));

  expect(output).toEqual<Ast[]>([
    {
      type: "constVariableDeclaration",
      identifierName: "a",
      datatype: DataType.NotCalculated,
      exp: {
        type: "DotMemberAccess",
        left: { type: "identifier", name: "b" },
        right: "c",
      },
    },
  ]);
});

test("Function Call test", () => {
  const input = `
  const a = b(1, 2, 3);
  const c = d(1,2,);
  `;

  const output = convertToAst(convertToTokens(input));

  expect(output).toEqual<Ast[]>([
    {
      type: "constVariableDeclaration",
      identifierName: "a",
      datatype: DataType.NotCalculated,
      exp: {
        type: "FunctionCall",
        left: { type: "identifier", name: "b" },
        arguments: [
          { type: "number", value: 1 },
          { type: "number", value: 2 },
          { type: "number", value: 3 },
        ],
      },
    },
    {
      type: "constVariableDeclaration",
      identifierName: "c",
      datatype: DataType.NotCalculated,
      exp: {
        type: "FunctionCall",
        left: { type: "identifier", name: "d" },
        arguments: [
          { type: "number", value: 1 },
          { type: "number", value: 2 },
        ],
      },
    },
  ]);
});

test("Testing Object Literal Expressions", () => {
  const input = `
  const a = { b : 1, c : { d : 1, e : 2} }`;

  const output = convertToAst(convertToTokens(input));

  expect(output).toEqual<Ast[]>([
    {
      type: "constVariableDeclaration",
      datatype: DataType.NotCalculated,
      identifierName: "a",
      exp: {
        type: "object",
        keys: [
          ["b", { type: "number", value: 1 }],
          [
            "c",
            {
              type: "object",
              keys: [
                ["d", { type: "number", value: 1 }],
                ["e", { type: "number", value: 2 }],
              ],
            },
          ],
        ],
      },
    },
  ]);
});

test("Testing Array literal expression", () => {
  const input = `
  const b = [1, true, [false, true]]`;

  const output = convertToAst(convertToTokens(input));

  expect(output).toEqual<Ast[]>([
    {
      type: "constVariableDeclaration",
      identifierName: "b",
      datatype: DataType.NotCalculated,
      exp: {
        type: "array",
        exps: [
          { type: "number", value: 1 },
          { type: "boolean", value: true },
          {
            type: "array",
            exps: [
              { type: "boolean", value: false },
              { type: "boolean", value: true },
            ],
          },
        ],
      },
    },
  ]);
});

test("Testing reassignment", () => {
  const input = `
  a = 1;
  b.a = 2
  a["a"].b = 1;`;

  const output = convertToAst(convertToTokens(input));

  expect(output).toEqual<Ast[]>([
    {
      type: "ReAssignment",
      path: { type: "IdentifierPath", name: "a" },
      exp: { type: "number", value: 1 },
      assignmentOperator: Token.Assign,
    },
    {
      type: "ReAssignment",
      path: {
        type: "DotMemberPath",
        leftPath: { type: "IdentifierPath", name: "b" },
        rightPath: "a",
      },
      exp: { type: "number", value: 2 },
      assignmentOperator: Token.Assign,
    },
    {
      type: "ReAssignment",
      path: {
        type: "DotMemberPath",
        leftPath: {
          type: "BoxMemberPath",
          leftPath: { type: "IdentifierPath", name: "a" },
          accessExp: { type: "string", value: "a" },
        },
        rightPath: "b",
      },
      exp: { type: "number", value: 1 },
      assignmentOperator: Token.Assign,
    },
  ]);
});

test("Testing Reassignment with PlusAssign Operator", () => {
  const input = `
  a += 1;`;

  const output = convertToAst(convertToTokens(input));

  expect(output).toEqual<Ast[]>([
    {
      type: "ReAssignment",
      assignmentOperator: Token.PlusAssign,
      exp: { type: "number", value: 1 },
      path: { type: "IdentifierPath", name: "a" },
    },
  ]);
});

test("Testing Reassignment with MinusAssign Operator", () => {
  const input = `
  a -= 1;`;

  const output = convertToAst(convertToTokens(input));

  expect(output).toEqual<Ast[]>([
    {
      type: "ReAssignment",
      assignmentOperator: Token.MinusAssign,
      exp: { type: "number", value: 1 },
      path: { type: "IdentifierPath", name: "a" },
    },
  ]);
});

test("Testing Reassignment with StarAssign Operator", () => {
  const input = `
  a *= 1;`;

  const output = convertToAst(convertToTokens(input));

  expect(output).toEqual<Ast[]>([
    {
      type: "ReAssignment",
      assignmentOperator: Token.StarAssign,
      exp: { type: "number", value: 1 },
      path: { type: "IdentifierPath", name: "a" },
    },
  ]);
});

test("Testing Reassignment with SlashAssign Operator", () => {
  const input = `
  a /= 1;`;

  const output = convertToAst(convertToTokens(input));

  expect(output).toEqual<Ast[]>([
    {
      type: "ReAssignment",
      assignmentOperator: Token.SlashAssign,
      exp: { type: "number", value: 1 },
      path: { type: "IdentifierPath", name: "a" },
    },
  ]);
});

test("Testing naked Expressions", () => {
  const input = `
  1;
  a(2);
  b !== 2;`;

  const output = convertToAst(convertToTokens(input));

  expect(output).toEqual<Ast[]>([
    { type: "number", value: 1 },
    {
      type: "FunctionCall",
      left: { type: "identifier", name: "a" },
      arguments: [{ type: "number", value: 2 }],
    },
    {
      type: Token.StrictNotEqual,
      left: { type: "identifier", name: "b" },
      right: { type: "number", value: 2 },
    },
  ]);
});

test("Testing break and continue statement", () => {
  const input = `
  break
  continue;`;

  const output = convertToAst(convertToTokens(input));

  expect(output).toEqual<Ast[]>([
    { type: KeywordTokens.Break },
    { type: KeywordTokens.Continue },
  ]);
});
