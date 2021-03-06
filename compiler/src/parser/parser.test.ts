import { listenerCount } from "process";
import { convertToTokens } from "../lexer/lexer";
import { KeywordTokens, Token } from "../lexer/tokens";
import { typeCheckAst } from "../typesChecker/typeChecker";
import { Ast, LiteralDataType } from "./ast";
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
        {
          type: "identifier",
          name: "table",
          dataType: LiteralDataType.NotCalculated,
        },
        {
          type: "identifier",
          name: "Chair",
          dataType: LiteralDataType.NotCalculated,
        },
      ],
    },
    {
      type: "importDeclaration",
      from: "./file2",
      importedIdentifires: [
        {
          type: "identifier",
          name: "so",
          dataType: LiteralDataType.NotCalculated,
        },
        {
          type: "identifier",
          name: "soo",
          dataType: LiteralDataType.NotCalculated,
        },
      ],
    },
    {
      type: "importDeclaration",
      from: "./file3",
      importedIdentifires: [
        {
          type: "identifier",
          name: "so",
          dataType: LiteralDataType.NotCalculated,
        },
        {
          type: "identifier",
          name: "soo",
          dataType: LiteralDataType.NotCalculated,
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
      datatype: LiteralDataType.NotCalculated,
      exp: { type: "string", value: "A" },
      export: false,
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
      datatype: LiteralDataType.NotCalculated,
      export: false,
    },
    {
      type: "constVariableDeclaration",
      identifierName: "b",
      exp: {
        type: "identifier",
        name: "someOtherVar",
        datatype: LiteralDataType.NotCalculated,
      },
      datatype: LiteralDataType.NotCalculated,
      export: false,
    },
    {
      type: "constVariableDeclaration",
      identifierName: "c",
      exp: { type: "number", value: 123 },
      datatype: LiteralDataType.NotCalculated,
      export: false,
    },
    {
      type: "constVariableDeclaration",
      identifierName: "d",
      exp: { type: "boolean", value: true },
      datatype: LiteralDataType.NotCalculated,
      export: false,
    },
    {
      type: "constVariableDeclaration",
      identifierName: "e",
      exp: { type: "boolean", value: false },
      datatype: LiteralDataType.NotCalculated,
      export: false,
    },
    {
      type: "constVariableDeclaration",
      identifierName: "f",
      exp: { type: Token.Plus, argument: { type: "number", value: 123 } },
      datatype: LiteralDataType.NotCalculated,
      export: false,
    },
    {
      type: "constVariableDeclaration",
      identifierName: "g",
      exp: { type: Token.Minus, argument: { type: "number", value: 123 } },
      datatype: LiteralDataType.NotCalculated,
      export: false,
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
      datatype: LiteralDataType.NotCalculated,
      export: false,
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
      datatype: LiteralDataType.NotCalculated,
      identifierName: "a",
      exp: {
        type: Token.Plus,
        left: { type: "number", value: 1 },
        right: { type: "number", value: 2 },
      },
      export: false,
    },
    {
      type: "constVariableDeclaration",
      datatype: LiteralDataType.NotCalculated,
      identifierName: "b",
      exp: {
        type: Token.Minus,
        left: { type: "number", value: 1 },
        right: { type: "number", value: 2 },
      },
      export: false,
    },
    {
      type: "constVariableDeclaration",
      datatype: LiteralDataType.NotCalculated,
      identifierName: "c",
      exp: {
        type: Token.Star,
        left: { type: "number", value: 1 },
        right: { type: "number", value: 2 },
      },
      export: false,
    },
    {
      type: "constVariableDeclaration",
      datatype: LiteralDataType.NotCalculated,
      identifierName: "d",
      exp: {
        type: Token.Slash,
        left: { type: "number", value: 1 },
        right: { type: "number", value: 2 },
      },
      export: false,
    },
    {
      type: "constVariableDeclaration",
      datatype: LiteralDataType.NotCalculated,
      identifierName: "e",
      exp: {
        type: Token.VerticalBar,
        left: { type: "number", value: 1 },
        right: { type: "number", value: 2 },
      },
      export: false,
    },
    {
      type: "constVariableDeclaration",
      datatype: LiteralDataType.NotCalculated,
      identifierName: "f",
      exp: {
        type: Token.Caret,
        left: { type: "number", value: 1 },
        right: { type: "number", value: 2 },
      },
      export: false,
    },
    {
      type: "constVariableDeclaration",
      datatype: LiteralDataType.NotCalculated,
      identifierName: "g",
      exp: {
        type: Token.Ampersand,
        left: { type: "number", value: 1 },
        right: { type: "number", value: 2 },
      },
      export: false,
    },
    {
      type: "constVariableDeclaration",
      datatype: LiteralDataType.NotCalculated,
      identifierName: "h",
      exp: {
        type: Token.StrictEquality,
        left: { type: "number", value: 1 },
        right: { type: "number", value: 2 },
      },
      export: false,
    },
    {
      type: "constVariableDeclaration",
      datatype: LiteralDataType.NotCalculated,
      identifierName: "i",
      exp: {
        type: Token.StrictNotEqual,
        left: { type: "number", value: 1 },
        right: { type: "number", value: 2 },
      },
      export: false,
    },
    {
      type: "constVariableDeclaration",
      datatype: LiteralDataType.NotCalculated,
      identifierName: "j",
      exp: {
        type: Token.LessThan,
        left: { type: "number", value: 1 },
        right: { type: "number", value: 2 },
      },
      export: false,
    },
    {
      type: "constVariableDeclaration",
      datatype: LiteralDataType.NotCalculated,
      identifierName: "k",
      exp: {
        type: Token.LessThanOrEqual,
        left: { type: "number", value: 1 },
        right: { type: "number", value: 2 },
      },
      export: false,
    },
    {
      type: "constVariableDeclaration",
      datatype: LiteralDataType.NotCalculated,
      identifierName: "l",
      exp: {
        type: Token.GreaterThan,
        left: { type: "number", value: 1 },
        right: { type: "number", value: 2 },
      },
      export: false,
    },
    {
      type: "constVariableDeclaration",
      datatype: LiteralDataType.NotCalculated,
      identifierName: "m",
      exp: {
        type: Token.GreaterThanOrEqual,
        left: { type: "number", value: 1 },
        right: { type: "number", value: 2 },
      },
      export: false,
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
      datatype: LiteralDataType.NotCalculated,
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
      export: false,
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
      datatype: LiteralDataType.NotCalculated,
      exp: {
        type: "BoxMemberAccess",
        left: {
          type: "identifier",
          name: "b",
          datatype: LiteralDataType.NotCalculated,
        },
        right: { type: "number", value: 1 },
      },
      export: false,
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
      datatype: LiteralDataType.NotCalculated,
      exp: {
        type: "DotMemberAccess",
        left: {
          type: "identifier",
          name: "b",
          datatype: LiteralDataType.NotCalculated,
        },
        right: "c",
      },
      export: false,
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
      datatype: LiteralDataType.NotCalculated,
      exp: {
        type: "FunctionCall",
        left: {
          type: "identifier",
          name: "b",
          datatype: LiteralDataType.NotCalculated,
        },
        arguments: [
          { type: "number", value: 1 },
          { type: "number", value: 2 },
          { type: "number", value: 3 },
        ],
      },
      export: false,
    },
    {
      type: "constVariableDeclaration",
      identifierName: "c",
      datatype: LiteralDataType.NotCalculated,
      exp: {
        type: "FunctionCall",
        left: {
          type: "identifier",
          name: "d",
          datatype: LiteralDataType.NotCalculated,
        },
        arguments: [
          { type: "number", value: 1 },
          { type: "number", value: 2 },
        ],
      },
      export: false,
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
      datatype: LiteralDataType.NotCalculated,
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
              datatype: LiteralDataType.NotCalculated,
            },
          ],
        ],
        datatype: LiteralDataType.NotCalculated,
      },
      export: false,
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
      datatype: LiteralDataType.NotCalculated,
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
            datatype: LiteralDataType.NotCalculated,
          },
        ],
        datatype: LiteralDataType.NotCalculated,
      },
      export: false,
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
        leftDataType: LiteralDataType.NotCalculated,
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
          leftBaseType: LiteralDataType.NotCalculated,
        },
        leftDataType: LiteralDataType.NotCalculated,
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
      left: {
        type: "identifier",
        name: "a",
        datatype: LiteralDataType.NotCalculated,
      },
      arguments: [{ type: "number", value: 2 }],
    },
    {
      type: Token.StrictNotEqual,
      left: {
        type: "identifier",
        name: "b",
        datatype: LiteralDataType.NotCalculated,
      },
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

test("Testing if block", () => {
  const input = `
  if (1) {
    doSomething();
  }`;

  const output = convertToAst(convertToTokens(input));

  expect(output).toEqual<Ast[]>([
    {
      type: "IfBlockDeclaration",
      condition: { type: "number", value: 1 },
      blocks: [
        {
          type: "FunctionCall",
          left: {
            type: "identifier",
            name: "doSomething",
            datatype: LiteralDataType.NotCalculated,
          },
          arguments: [],
        },
      ],
    },
  ]);
});

test("Testing else if block", () => {
  const input = `
  else if (1) {
    doSomething();
  }`;

  const output = convertToAst(convertToTokens(input));

  expect(output).toEqual<Ast[]>([
    {
      type: "ElseIfBlockDeclaration",
      condition: { type: "number", value: 1 },
      blocks: [
        {
          type: "FunctionCall",
          left: {
            type: "identifier",
            name: "doSomething",
            datatype: LiteralDataType.NotCalculated,
          },
          arguments: [],
        },
      ],
    },
  ]);
});

test("Testing else block", () => {
  const input = `
  else {
    doSomething();
  }`;

  const output = convertToAst(convertToTokens(input));

  expect(output).toEqual<Ast[]>([
    {
      type: "ElseBlockDeclaration",
      blocks: [
        {
          type: "FunctionCall",
          left: {
            type: "identifier",
            name: "doSomething",
            datatype: LiteralDataType.NotCalculated,
          },
          arguments: [],
        },
      ],
    },
  ]);
});

test("Testing while loop declaration", () => {
  const input = `
  while (1) {
    doSomething();
  };`;

  const output = convertToAst(convertToTokens(input));

  expect(output).toEqual<Ast[]>([
    {
      type: "WhileLoopDeclaration",
      condition: { type: "number", value: 1 },
      blocks: [
        {
          type: "FunctionCall",
          left: {
            type: "identifier",
            name: "doSomething",
            datatype: LiteralDataType.NotCalculated,
          },
          arguments: [],
        },
      ],
    },
  ]);
});

test("Testing Do While loop Declaration", () => {
  const input = `
  do {
    doSomething();
  } while (1)`;

  const output = convertToAst(convertToTokens(input));

  expect(output).toEqual<Ast[]>([
    {
      type: "DoWhileLoopDeclaration",
      condition: { type: "number", value: 1 },
      blocks: [
        {
          type: "FunctionCall",
          left: {
            type: "identifier",
            name: "doSomething",
            datatype: LiteralDataType.NotCalculated,
          },
          arguments: [],
        },
      ],
    },
  ]);
});

test("Testing type parsing", () => {
  const input = `
  const a : string = 1;
  const a : number = 1;
  const a : boolean = 1;
  const a : what = 1;`;

  const output = convertToAst(convertToTokens(input));

  expect(output).toEqual<Ast[]>([
    {
      type: "constVariableDeclaration",
      datatype: LiteralDataType.String,
      exp: { type: "number", value: 1 },
      identifierName: "a",
      export: false,
    },
    {
      type: "constVariableDeclaration",
      datatype: LiteralDataType.Number,
      exp: { type: "number", value: 1 },
      identifierName: "a",
      export: false,
    },
    {
      type: "constVariableDeclaration",
      datatype: LiteralDataType.Boolean,
      exp: { type: "number", value: 1 },
      identifierName: "a",
      export: false,
    },
    {
      type: "constVariableDeclaration",
      datatype: { type: "IdentifierDatatype", name: "what" },
      exp: { type: "number", value: 1 },
      identifierName: "a",
      export: false,
    },
  ]);
});

test("Testing export", () => {
  const input = `
  export const x = 1;`;

  const output = convertToAst(convertToTokens(input));

  expect(output).toEqual<Ast[]>([
    {
      type: "constVariableDeclaration",
      exp: { type: "number", value: 1 },
      datatype: LiteralDataType.NotCalculated,
      export: true,
      identifierName: "x",
    },
  ]);
});

test("Testing double export syntax error", () => {
  const input = `
  export export const x = 1;`;

  const getOutput = () => convertToAst(convertToTokens(input));

  expect(getOutput).toThrow();
});

test("Testing exporting non supported statement", () => {
  const input = `
  export x += 1;;`;

  const getOutput = () => convertToAst(convertToTokens(input));

  expect(getOutput).toThrow();
});

/**
 * Making sure explicit Array datatype is ignored
 */
test("Testing Array datatype is ignored", () => {
  const input = `
  const a : string[] = "a"`;

  const output = convertToAst(convertToTokens(input));

  expect(output).toEqual<Ast[]>([
    {
      type: "constVariableDeclaration",
      datatype: LiteralDataType.NotCalculated,
      exp: { type: "string", value: "a" },
      export: false,
      identifierName: "a",
    },
  ]);
});

test("Testing object datatype", () => {
  const input = `
  const a : {b : boolean} = {b : true}`;

  const output = convertToAst(convertToTokens(input));

  expect(output).toEqual<Ast[]>([
    {
      type: "constVariableDeclaration",
      datatype: {
        type: "ObjectDataType",
        keys: { b: LiteralDataType.Boolean },
      },
      exp: {
        type: "object",
        keys: [["b", { type: "boolean", value: true }]],
        datatype: LiteralDataType.NotCalculated,
      },
      export: false,
      identifierName: "a",
    },
  ]);
});

test("Testing parsing Grouped type", () => {
  const input = `
  const a : ((string)) = "a"`;

  const output = convertToAst(convertToTokens(input));

  expect(output).toEqual<Ast[]>([
    {
      type: "constVariableDeclaration",
      datatype: LiteralDataType.String,
      exp: { type: "string", value: "a" },
      export: false,
      identifierName: "a",
    },
  ]);
});

test("Testing function declaration", () => {
  const input = `
  function some(a : number) {
    doSomething(a);
  };`;

  const output = convertToAst(convertToTokens(input));

  expect(output).toEqual<Ast[]>([
    {
      type: "FunctionDeclaration",
      arguments: [["a", LiteralDataType.Number]],
      name: "some",
      returnType: LiteralDataType.NotCalculated,
      export: false,
      blocks: [
        {
          type: "FunctionCall",
          arguments: [
            {
              type: "identifier",
              name: "a",
              datatype: LiteralDataType.NotCalculated,
            },
          ],
          left: {
            type: "identifier",
            name: "doSomething",
            datatype: LiteralDataType.NotCalculated,
          },
        },
      ],
    },
  ]);
});

test("Testing exporting function declaraton", () => {
  const input = `
  export function some(a : number) {
    doSomething(a);
  };`;

  const output = convertToAst(convertToTokens(input));

  expect(output).toEqual<Ast[]>([
    {
      type: "FunctionDeclaration",
      arguments: [["a", LiteralDataType.Number]],
      name: "some",
      returnType: LiteralDataType.NotCalculated,
      export: true,
      blocks: [
        {
          type: "FunctionCall",
          arguments: [
            {
              type: "identifier",
              name: "a",
              datatype: LiteralDataType.NotCalculated,
            },
          ],
          left: {
            type: "identifier",
            name: "doSomething",
            datatype: LiteralDataType.NotCalculated,
          },
        },
      ],
    },
  ]);
});

test("Testing return statements", () => {
  const input = `
  return;
  return 1;`;

  const output = convertToAst(convertToTokens(input));

  expect(output).toEqual<Ast[]>([
    {
      type: "ReturnExpression",
      exp: null,
    },
    {
      type: "ReturnExpression",
      exp: { type: "number", value: 1 },
    },
  ]);
});
