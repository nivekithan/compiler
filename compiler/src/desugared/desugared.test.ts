import { convertToTokens } from "../lexer/lexer";
import { convertToAst } from "../parser/parser";
import { DeSugaredAst } from "../tsTypes/desugared";
import { typeCheckAst } from "../typesChecker/typeChecker";
import { deSugarAst } from "./desugar";

test("Test desugaring string literals", () => {
  const input = `
    const a = "234"`;

  const output = deSugarAst(typeCheckAst(convertToAst(convertToTokens(input))));

  expect(output).toEqual<DeSugaredAst[]>([
    {
      type: "constVariableDeclaration",
      export: false,
      exp: {
        type: "object",
        datatype: {
          type: "ObjectDataType",
          keys: {
            value: {
              type: "ArrayDataType",
              baseType: { type: "CharDatatype" },
              numberOfElements: 3,
            },
            length: { type: "NumberDatatype" },
          },
        },
        keys: [
          [
            "value",
            {
              type: "array",
              exps: [
                { type: "char", value: "2" },
                { type: "char", value: "3" },
                { type: "char", value: "4" },
              ],
              datatype: {
                type: "ArrayDataType",
                baseType: { type: "CharDatatype" },
                numberOfElements: 3,
              },
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
            baseType: { type: "CharDatatype" },
            numberOfElements: 3,
          },
          length: { type: "NumberDatatype" },
        },
      },
      identifierName: "a",
    },
  ]);
});

test("desugaring compiler Provide functions", () => {
  const input = `
    const a = printFoo();`;

  const output = deSugarAst(typeCheckAst(convertToAst(convertToTokens(input))));

  expect(output).toEqual<DeSugaredAst[]>([
    {
      type: "importDeclaration",
      from: "compiler",
      importedIdentifires: [
        {
          name: "printFoo",
          type: "identifier",
          dataType: {
            type: "FunctionDataType",
            arguments: {},
            returnType: { type: "BooleanDataType" },
          },
        },
      ],
    },
    {
      type: "constVariableDeclaration",
      identifierName: "a",
      export: false,
      exp: {
        type: "FunctionCall",
        arguments: [],
        left: {
          type: "identifier",
          name: "printFoo",
          datatype: {
            type: "FunctionDataType",
            arguments: {},
            returnType: { type: "BooleanDataType" },
          },
        },
      },
      datatype: { type: "BooleanDataType" },
    },
  ]);
});
