import clone from "clone";
import { KeywordTokens } from "../lexer/tokens";
import {
  isArrayDatatype,
  isArrayLiteralExp,
  isBinaryExp,
  isBooleanDatatype,
  isBooleanLiteralExp,
  isBoxMemberAccessExp,
  isDotMemberAccessExp,
  isFunctionCallExp,
  isFunctionDatatype,
  isIdentifierLiteralExp,
  isNumberDatatype,
  isNumberLiteralExp,
  isObjectDatatype,
  isObjectLiteralExp,
  isStringDatatype,
  isStringLiteralExp,
  isUniaryExp,
} from "../tsTypes/all";
import {
  ArrayDatatype,
  ArrayLiteralExp,
  CharLiteralExp,
  ConstVariableDeclaration,
  DotMemberAccessExp,
  IdentifierAst,
  NumberDatatype,
  NumberLiteralExp,
  ReAssignmentPath,
} from "../tsTypes/base";
import {
  DeSugaredAst,
  DeSugaredDatatype,
  DeSugaredExpression,
  getDataTypeOfDeSugaredExpression,
} from "../tsTypes/desugared";
import {
  TypeCheckedAst,
  TypeCheckedDatatype,
  TypeCheckedExpression,
} from "../tsTypes/typechecked";
import { getDatatypeOfTypeCheckedExp } from "../utils/utils";
import { AstModifier } from "./astModifier";

export const deSugarAst = (
  typeCheckedAst: TypeCheckedAst[]
): DeSugaredAst[] => {
  const DeSugar = new DeSugarAstFactory(typeCheckedAst);
  return DeSugar.deSugarAst();
};

class DeSugarAstFactory {
  asts: TypeCheckedAst[];
  curPos: number | null;
  deSugaredAst: DeSugaredAst[];
  modifier: AstModifier;

  constructor(typeCheckedAst: TypeCheckedAst[]) {
    this.asts = typeCheckedAst;
    this.curPos = 0;
    this.deSugaredAst = [];
    this.modifier = new AstModifier(this.deSugaredAst);
  }

  deSugarAst(): DeSugaredAst[] {
    this.deSugaredAst = [];
    this.modifier = new AstModifier(this.deSugaredAst);

    while (this.curPos !== null) {
      const curAst = this.getCurAst();

      if (curAst === null) return this.deSugaredAst;

      if (
        curAst.type === "constVariableDeclaration" ||
        curAst.type === "letVariableDeclaration"
      ) {
        const newAst = this.deSugarVariableDeclaration(curAst);
        this.deSugaredAst.push(newAst);
      } else if (curAst.type === "ReAssignment") {
        const newAst = this.deSugarReAssignment(curAst);
        this.deSugaredAst.push(newAst);
      } else if (curAst.type === "WhileLoopDeclaration") {
        const newAst = this.deSugarWhileLoopDeclaration(curAst);
        this.deSugaredAst.push(newAst);
      } else if (curAst.type === "DoWhileLoopDeclaration") {
        const newAst = this.deSugarDoWhileLoopDeclaration(curAst);
        this.deSugaredAst.push(newAst);
      } else if (curAst.type === "FunctionDeclaration") {
        const newAst = this.deSugarFunctionDeclaration(curAst);
        this.deSugaredAst.push(newAst);
      } else if (curAst.type === "ReturnExpression") {
        const newAst = this.deSugarReturnExpression(curAst);
        this.deSugaredAst.push(newAst);
      } else if (curAst.type === "typeCheckedIfBlockDeclaration") {
        const newAst = this.deSugarIsBlockDeclaration(curAst);
        this.deSugaredAst.push(newAst);
      } else if (
        curAst.type === KeywordTokens.Continue ||
        curAst.type === KeywordTokens.Break
      ) {
        const newAst = clone(curAst);
        this.deSugaredAst.push(newAst);
      } else if (curAst.type === "importDeclaration") {
      } else {
        throw new Error(
          `Expression of type ${curAst.type} is still not yet supported to deSugared`
        );
      }

      this.next();
    }

    return this.deSugaredAst;
  }

  deSugarImportDeclaration(curAst: TypeCheckedAst): DeSugaredAst {
    if (curAst.type !== "importDeclaration")
      throw new Error(
        `Expected curAst to be type of importDeclaration but instead got ${curAst.type}`
      );

    const newImportedIdentifiers = curAst.importedIdentifires.map(
      (identifierAst) => {
        const newIdentifierAst: IdentifierAst<DeSugaredDatatype> = {
          type: "identifier",
          name: identifierAst.name,
          dataType: this.deSugarDataType(identifierAst.dataType),
        };

        return newIdentifierAst;
      }
    );

    return {
      type: "importDeclaration",
      importedIdentifires: newImportedIdentifiers,
      from: curAst.from,
    };
  }

  deSugarVariableDeclaration(curAst: TypeCheckedAst): DeSugaredAst {
    if (
      curAst.type !== "constVariableDeclaration" &&
      curAst.type !== "letVariableDeclaration"
    ) {
      throw new Error(
        `Expected curAst to be of type constVariableDeclaration or letVariableDeclaration but instead got ${curAst.type}`
      );
    }

    const newExpression = this.deSugarExpression(curAst.exp);
    const newDataType = getDataTypeOfDeSugaredExpression(newExpression);

    return {
      ...curAst,
      exp: newExpression,
      datatype: newDataType,
    };
  }

  deSugarReAssignment(curAst: TypeCheckedAst): DeSugaredAst {
    if (curAst.type !== "ReAssignment")
      throw new Error(
        `Expected curAst to be type of ReAssignment but instead got ${curAst.type}`
      );

    const newReAssignmentPath = this.deSugarReassignmentPath(curAst.path);
    const newExp = this.deSugarExpression(curAst.exp);

    return { ...curAst, path: newReAssignmentPath, exp: newExp };
  }

  deSugarReassignmentPath(
    curAst: ReAssignmentPath<TypeCheckedExpression, TypeCheckedDatatype>
  ): ReAssignmentPath<DeSugaredExpression, DeSugaredDatatype> {
    if (curAst.type === "IdentifierPath") {
      return clone(curAst);
    } else if (curAst.type === "BoxMemberPath") {
      const newAccessExp = this.deSugarExpression(curAst.accessExp);
      const newLeftBaseType = this.deSugarDataType(curAst.leftBaseType);
      const newLeftPath = this.deSugarReassignmentPath(curAst.leftPath);
      return {
        type: "BoxMemberPath",
        accessExp: newAccessExp,
        leftBaseType: newLeftBaseType,
        leftPath: newLeftPath,
      };
    } else if (curAst.type === "DotMemberPath") {
      const newLeftDatatype = this.deSugarDataType(curAst.leftDataType);
      const newLeftPath = this.deSugarReassignmentPath(curAst.leftPath);
      return {
        type: "DotMemberPath",
        leftDataType: newLeftDatatype,
        leftPath: newLeftPath,
        rightPath: curAst.rightPath,
      };
    }

    throw new Error(
      `Ast of type ${curAst} is still not yet supported in deSugarReAssignmentPath`
    );
  }

  deSugarWhileLoopDeclaration(curAst: TypeCheckedAst): DeSugaredAst {
    if (curAst.type !== "WhileLoopDeclaration")
      throw new Error(
        `Expected curAst to be type of whileLoopDeclaration but instead got ${curAst.type}`
      );

    const newCondition = this.deSugarExpression(curAst.condition);

    const whileBlockDeSugarer = new DeSugarAstFactory(curAst.blocks);
    const newBlocks = whileBlockDeSugarer.deSugarAst();

    return {
      type: "WhileLoopDeclaration",
      blocks: newBlocks,
      condition: newCondition,
    };
  }

  deSugarDoWhileLoopDeclaration(curAst: TypeCheckedAst): DeSugaredAst {
    if (curAst.type !== "DoWhileLoopDeclaration")
      throw new Error(
        `Expected curAst to be of type of doWhileLoopDeclaration but instead got ${curAst.type}`
      );

    const newCondition = this.deSugarExpression(curAst.condition);
    const doWhileBlockDeSugarer = new DeSugarAstFactory(curAst.blocks);
    const newBlocks = doWhileBlockDeSugarer.deSugarAst();

    return {
      type: "DoWhileLoopDeclaration",
      condition: newCondition,
      blocks: newBlocks,
    };
  }

  deSugarFunctionDeclaration(curAst: TypeCheckedAst): DeSugaredAst {
    if (curAst.type !== "FunctionDeclaration")
      throw new Error(
        `Expected curAst to be of type deSugarFunctionDeclaration but instead got ${curAst.type}`
      );

    const newArguments = curAst.arguments.map(
      ([name, dataType]): [string, DeSugaredDatatype] => {
        return [name, this.deSugarDataType(dataType)];
      }
    );

    const newReturnType = this.deSugarDataType(curAst.returnType);

    const fnDecDeSugarer = new DeSugarAstFactory(curAst.blocks);
    const newBlocks = fnDecDeSugarer.deSugarAst();

    return {
      ...curAst,
      arguments: newArguments,
      blocks: newBlocks,
      returnType: newReturnType,
    };
  }

  deSugarReturnExpression(curAst: TypeCheckedAst): DeSugaredAst {
    if (curAst.type !== "ReturnExpression")
      throw new Error(
        `Expected curAst to be type of ReturnExpression but instead got ${curAst.type}`
      );

    const newExp =
      curAst.exp === null ? null : this.deSugarExpression(curAst.exp);
    return { type: "ReturnExpression", exp: newExp };
  }

  deSugarIsBlockDeclaration(curAst: TypeCheckedAst): DeSugaredAst {
    if (curAst.type !== "typeCheckedIfBlockDeclaration")
      throw new Error(
        `Expected curAst to be type of IfBlockDeclaration but instead got ${curAst.type}`
      );

    const newIfBlockCond = this.deSugarExpression(curAst.ifBlock.condition);
    const newIfBlocks = new DeSugarAstFactory(
      curAst.ifBlock.blocks
    ).deSugarAst();

    const newIfBlock = {
      type: "IfBlockDeclaration",
      blocks: newIfBlocks,
      condition: newIfBlockCond,
    } as const;

    const oldElseBlock = curAst.elseBlock;

    oldElseBlock?.blocks;
    const newElseBlocks = oldElseBlock
      ? new DeSugarAstFactory(oldElseBlock.blocks).deSugarAst()
      : undefined;

    const newElseBlock = newElseBlocks
      ? ({ type: "ElseBlockDeclaration", blocks: newElseBlocks } as const)
      : undefined;

    const newElseIfBlocks = curAst.elseIfBlocks.map((elseIfBlock) => {
      const newElseIfBlockCond = this.deSugarExpression(elseIfBlock.condition);
      const newElseIfBlocks = new DeSugarAstFactory(
        elseIfBlock.blocks
      ).deSugarAst();

      return {
        type: "ElseIfBlockDeclaration",
        blocks: newElseIfBlocks,
        condition: newElseIfBlockCond,
      } as const;
    });

    return {
      type: "typeCheckedIfBlockDeclaration",
      elseIfBlocks: newElseIfBlocks,
      ifBlock: newIfBlock,
      elseBlock: newElseBlock,
    };
  }

  deSugarExpression(exp: TypeCheckedExpression): DeSugaredExpression {
    if (isStringLiteralExp(exp)) {
      return this.deSugarStringExpression(exp);
    } else if (isNumberLiteralExp(exp)) {
      return clone(exp);
    } else if (isBooleanLiteralExp(exp)) {
      return clone(exp);
    } else if (isArrayLiteralExp(exp)) {
      return this.deSugarArrayLiteralExp(exp);
    } else if (isObjectLiteralExp(exp)) {
      return this.deSugarObjectLiteralExp(exp);
    } else if (isIdentifierLiteralExp(exp)) {
      return this.deSugarIdentifierLiteralExp(exp);
    } else if (isBoxMemberAccessExp(exp)) {
      return this.deSugarBoxMemberAccessExp(exp);
    } else if (isDotMemberAccessExp(exp)) {
      return this.deSugarDotMemberAccessExp(exp);
    } else if (isFunctionCallExp(exp)) {
      return this.deSugarFunctionCallExp(exp);
    } else if (isUniaryExp(exp)) {
      return this.deSugarUninaryExp(exp);
    } else if (isBinaryExp(exp)) {
      return this.deSugarBinaryExp(exp);
    }

    throw new Error(
      `Expression of type ${exp} is still not supported to be deSugared`
    );
  }

  deSugarStringExpression(exp: TypeCheckedExpression): DeSugaredExpression {
    if (!isStringLiteralExp(exp))
      throw new Error(
        `Expected expression to be of type string but instead got ${exp.type}`
      );

    const valueDatatype: ArrayDatatype<DeSugaredDatatype> = {
      type: "ArrayDataType",
      baseType: { type: "CharDatatype" },
      numberOfElements: exp.value.length,
    };

    const valueField: ArrayLiteralExp<DeSugaredExpression, DeSugaredDatatype> =
      {
        type: "array",
        exps: Array.from(exp.value).map((s): CharLiteralExp => {
          return { type: "char", value: s };
        }),
        datatype: valueDatatype,
      };

    const lengthField: NumberLiteralExp = {
      type: "number",
      value: exp.value.length,
    };

    const lengthDatatype: NumberDatatype = { type: "NumberDatatype" };

    return {
      type: "object",
      datatype: {
        type: "ObjectDataType",
        keys: { value: valueDatatype, length: lengthDatatype },
      },
      keys: [
        ["value", valueField],
        ["length", lengthField],
      ],
    };
  }

  deSugarIdentifierLiteralExp(exp: TypeCheckedExpression): DeSugaredExpression {
    if (!isIdentifierLiteralExp(exp)) {
      throw new Error(
        `Expected expression to be of type array but instead got ${exp.type}`
      );
    }

    if (exp.name === "printFoo") {
      this.modifier.importCompilerFn("printFoo");
    }

    const newIdentifierDatatype = this.deSugarDataType(exp.datatype);

    return { ...exp, datatype: newIdentifierDatatype };
  }

  deSugarArrayLiteralExp(exp: TypeCheckedExpression): DeSugaredExpression {
    if (!isArrayLiteralExp(exp))
      throw new Error(
        `Expected expression to be of type array but instead got ${exp.type}`
      );

    const newElementExps = exp.exps.map((exp) => this.deSugarExpression(exp));
    const baseType = getDataTypeOfDeSugaredExpression(newElementExps[0]);

    return {
      type: "array",
      exps: newElementExps,
      datatype: {
        type: "ArrayDataType",
        baseType,
        numberOfElements: newElementExps.length,
      },
    };
  }

  deSugarObjectLiteralExp(exp: TypeCheckedExpression): DeSugaredExpression {
    if (exp.type !== "object")
      throw new Error(
        `Expected expression to be of type object but instead got ${exp.type}`
      );

    const newKeys = exp.keys.map(
      ([name, exp]): [string, DeSugaredExpression] => [
        name,
        this.deSugarExpression(exp),
      ]
    );

    const newDataType: DeSugaredDatatype = {
      type: "ObjectDataType",
      keys: newKeys.reduce(
        (acc: Record<string, DeSugaredDatatype>, [curName, exp]) => {
          acc[curName] = getDataTypeOfDeSugaredExpression(exp);
          return acc;
        },
        {}
      ),
    };

    return { type: "object", datatype: newDataType, keys: newKeys };
  }

  deSugarBoxMemberAccessExp(exp: TypeCheckedExpression): DeSugaredExpression {
    if (!isBoxMemberAccessExp(exp))
      throw new Error(
        `Expected expression to be of type BoxMemberAccessExp but instead got ${exp.type}`
      );

    const isLeftStringDatatype =
      getDatatypeOfTypeCheckedExp(exp).type === "StringDatatype";

    if (isLeftStringDatatype) {
      return this.deSugarStringBoxMemberAccessExp(exp.left, exp.right);
    }

    const newLeftExpression: DeSugaredExpression = this.deSugarExpression(
      exp.left
    );
    const newRightExpression = this.deSugarExpression(exp.right);

    return {
      type: "BoxMemberAccess",
      left: newLeftExpression,
      right: newRightExpression,
    };
  }

  deSugarStringBoxMemberAccessExp(
    left: TypeCheckedExpression,
    right: TypeCheckedExpression
  ): DeSugaredExpression {
    const leftDatatype = getDatatypeOfTypeCheckedExp(left);

    if (!isStringDatatype(leftDatatype)) {
      throw new Error(
        `Expected left datatype to be string datatype but instead got ${leftDatatype.type}`
      );
    }

    const rightDatatype = getDatatypeOfTypeCheckedExp(right);

    if (!isNumberDatatype(rightDatatype)) {
      throw new Error(
        `Expected right datatype to be number datatype but instead got ${rightDatatype.type}`
      );
    }

    const leftValueField: DotMemberAccessExp<DeSugaredExpression> = {
      type: "DotMemberAccess",
      left: this.deSugarExpression(left),
      right: "value",
    };

    const lengthField: NumberLiteralExp = { type: "number", value: 1 };

    const valueField: ArrayLiteralExp<DeSugaredExpression, DeSugaredDatatype> =
      {
        type: "array",
        exps: [
          {
            type: "BoxMemberAccess",
            left: leftValueField,
            right: this.deSugarExpression(right),
          },
        ],
        datatype: {
          type: "ArrayDataType",
          baseType: { type: "CharDatatype" },
          numberOfElements: 1,
        },
      };

    return {
      type: "object",
      datatype: {
        type: "ObjectDataType",
        keys: {
          value: {
            type: "ArrayDataType",
            baseType: { type: "CharDatatype" },
            numberOfElements: 1,
          },
          length: { type: "NumberDatatype" },
        },
      },
      keys: [
        ["value", valueField],
        ["length", lengthField],
      ],
    };
  }

  deSugarDotMemberAccessExp(exp: TypeCheckedExpression): DeSugaredExpression {
    if (!isDotMemberAccessExp(exp))
      throw new Error(
        `Expected expression to be of type DotMemberAccessExp but instead got ${exp.type}`
      );

    const newLeftExpression = this.deSugarExpression(exp.left);

    return {
      type: "DotMemberAccess",
      left: newLeftExpression,
      right: exp.right,
    };
  }

  deSugarFunctionCallExp(exp: TypeCheckedExpression): DeSugaredExpression {
    if (!isFunctionCallExp(exp))
      throw new Error(
        `Expected expression to be functionCall but instead got ${exp.type}`
      );

    const newArguments = exp.arguments.map((exp) =>
      this.deSugarExpression(exp)
    );

    const newLeft = this.deSugarExpression(exp.left);

    return { type: "FunctionCall", left: newLeft, arguments: newArguments };
  }

  deSugarUninaryExp(exp: TypeCheckedExpression): DeSugaredExpression {
    if (!isUniaryExp(exp))
      throw new Error(
        `Expected expression to be uniary expression but instead got ${exp.type}`
      );

    const newArgument = this.deSugarExpression(exp.argument);

    return { ...exp, argument: newArgument };
  }

  deSugarBinaryExp(exp: TypeCheckedExpression): DeSugaredExpression {
    if (!isBinaryExp(exp)) {
      throw new Error(
        `Expected expression to be binary expression but instead got ${exp.type}`
      );
    }

    const newLeft = this.deSugarExpression(exp.left);
    const newRight = this.deSugarExpression(exp.right);

    return {
      type: exp.type,
      left: newLeft,
      right: newRight,
    } as DeSugaredExpression;
  }

  deSugarDataType(dataType: TypeCheckedDatatype): DeSugaredDatatype {
    if (isStringDatatype(dataType)) {
      return {
        type: "ObjectDataType",
        keys: {
          value: {
            type: "ArrayDataType",
            baseType: { type: "CharDatatype" },
            numberOfElements: dataType.length,
          },
          length: { type: "NumberDatatype" },
        },
      };
    } else if (isNumberDatatype(dataType)) {
      return clone(dataType);
    } else if (isBooleanDatatype(dataType)) {
      return clone(dataType);
    } else if (isArrayDatatype(dataType)) {
      const newBaseType = this.deSugarDataType(dataType.baseType);
      return { ...dataType, baseType: newBaseType };
    } else if (isObjectDatatype(dataType)) {
      const newKeys = Object.keys(dataType.keys).reduce(
        (acc: Record<string, DeSugaredDatatype>, curkey) => {
          acc[curkey] = this.deSugarDataType(dataType.keys[curkey]!);

          return acc;
        },
        {}
      );
      return { ...dataType, keys: newKeys };
    } else if (isFunctionDatatype(dataType)) {
      const newArguments = Object.keys(dataType.arguments).reduce(
        (acc: Record<string, DeSugaredDatatype>, curkey) => {
          acc[curkey] = this.deSugarDataType(dataType.arguments[curkey]!);

          return acc;
        },
        {}
      );

      const newReturnType = this.deSugarDataType(dataType.returnType);

      return {
        type: "FunctionDataType",
        arguments: newArguments,
        returnType: newReturnType,
      };
    }

    throw new Error(`it is not yet supported to deSugar datatype ${dataType}`);
  }

  next() {
    if (this.curPos === null || this.curPos >= this.asts.length - 1) {
      this.curPos = null;
    } else {
      this.curPos++;
    }
  }

  getCurAst(): TypeCheckedAst | null {
    if (this.curPos === null) {
      return null;
    } else {
      const ast = this.asts[this.curPos];

      if (ast === undefined) {
        throw Error("Expected this.curPos to be always in bound of this.asts");
      }

      return ast;
    }
  }
}
