import clone from "clone";
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
import { CharLiteralExp, ConstVariableDeclaration } from "../tsTypes/base";
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

export const deSugarAst = (
  typeCheckedAst: TypeCheckedAst[]
): DeSugaredAst[] => {
  const DeSugar = new DeSugarAstFactory(typeCheckedAst);
  return DeSugar.deSugarAst();
};

class DeSugarAstFactory {
  asts: TypeCheckedAst[];
  curPos: number | null;

  constructor(typeCheckedAst: TypeCheckedAst[]) {
    this.asts = typeCheckedAst;
    this.curPos = 0;
  }

  deSugarAst(): DeSugaredAst[] {
    const deSugaredAst: DeSugaredAst[] = [];
    while (this.curPos !== null) {
      const curAst = this.getCurAst();

      if (curAst === null) return deSugaredAst;

      if (
        curAst.type === "constVariableDeclaration" ||
        curAst.type === "letVariableDeclaration"
      ) {
        this.deSugarVariableDeclaration(curAst);
      }

      throw new Error(
        `Expression of type ${curAst.type} is still not yet supported to deSugared`
      );
    }

    return deSugaredAst;
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

    return {
      type: "array",
      exps: Array.from(exp.value).map((s): CharLiteralExp => {
        return { type: "char", value: s };
      }),
      datatype: {
        type: "ArrayDataType",
        baseType: { type: "CharDatatype" },
        numberOfElements: exp.value.length,
      },
    };
  }

  deSugarIdentifierLiteralExp(exp: TypeCheckedExpression): DeSugaredExpression {
    if (!isIdentifierLiteralExp(exp)) {
      throw new Error(
        `Expected expression to be of type array but instead got ${exp.type}`
      );
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

    const newLeftExpression = this.deSugarExpression(exp.left);
    const newRightExpression = this.deSugarExpression(exp.right);

    return {
      type: "BoxMemberAccess",
      left: newLeftExpression,
      right: newRightExpression,
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
        type: "ArrayDataType",
        baseType: { type: "CharDatatype" },
        numberOfElements: dataType.length,
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
