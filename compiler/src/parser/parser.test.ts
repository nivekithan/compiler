import { convertToTokens } from "../lexer/lexer";
import { Ast, DataType } from "./ast";
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

test("Const variable declaration", () => {
  const input = `
  const a = "A"
  const b = someOtherVar;
  const c = 123
  const d = true;
  const e = false `;

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
  ]);
});
