import { convertToTokens } from "../lexer/lexer";
import { Ast, LiteralDataType } from "../parser/ast";
import { convertToAst } from "../parser/parser";
import { typeCheckAst } from "../typesChecker/typeChecker";
import { desugarAst } from "./desugar";

test("Desugar string literals to objects", () => {
  const input = `
    const s = "123"`;

  const output = desugarAst(typeCheckAst(convertToAst(convertToTokens(input))));

  expect(output).toEqual<Ast[]>([
    {
      type: "constVariableDeclaration",
      export: false,
      identifierName: "s",
      exp: {
        type: "object",
        datatype: {
          type: "ObjectDataType",
          keys: {
            value: {
              type: "ArrayDataType",
              baseType: LiteralDataType.Char,
              numberOfElements: 3,
            },
            length: LiteralDataType.Number,
          },
        },
        keys: [
          [
            "value",
            {
              type: "array",
              datatype: {
                type: "ArrayDataType",
                baseType: LiteralDataType.Char,
                numberOfElements: 3,
              },
              exps: [
                { type: "char", value: "1" },
                { type: "char", value: "2" },
                { type: "char", value: "3" },
              ],
            },
          ],
          ["length", { type: "number", value: 3 }],
        ],
      },
      datatype: {
        type: "ObjectDataType",
        keys: {
          value: {
            type: "ArrayDataType",
            baseType: LiteralDataType.Char,
            numberOfElements: 3,
          },
          length: LiteralDataType.Number,
        },
      },
    },
  ]);
});
