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
