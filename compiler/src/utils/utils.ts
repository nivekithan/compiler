import {
  isAmpersandBinaryExp,
  isArrayDatatype,
  isArrayLiteralExp,
  isBangUniaryExp,
  isBooleanLiteralExp,
  isBoxMemberAccessExp,
  isCaretBinaryExp,
  isDotMemberAccessExp,
  isFunctionCallExp,
  isFunctionDatatype,
  isGreaterThanBinaryExp,
  isGreaterThanOrEqualBinaryExp,
  isIdentifierLiteralExp,
  isLessThanBinaryExp,
  isLessThanOrEqualBinaryExp,
  isMinusBinaryExp,
  isMinusUninaryExp,
  isNumberLiteralExp,
  isObjectDatatype,
  isObjectLiteralExp,
  isPlusBinaryExp,
  isPlusUninaryExp,
  isSlashBinaryExp,
  isStarBinaryExp,
  isStrictEqualityBinaryExp,
  isStrictNotEqualBinaryExp,
  isStringLiteralExp,
  isVerticalBarBinaryExp,
} from "../tsTypes/all";

import { LiteralDataType } from "../tsTypes/base";
import {
  TypeCheckedDatatype,
  TypeCheckedExpression,
} from "../tsTypes/typechecked";

/**
 * Finds the datatype of Exp. It assumes the exp to be typechecked and it
 * does not verify it
 *
 * @param exp - Ast which has been typechecked
 * @return Datatype of exp
 */
export const getDatatypeOfTypeCheckedExp = (
  exp: TypeCheckedExpression
): TypeCheckedDatatype => {
  // if (isCharLiteralexp(exp)) return LiteralDataType.Char;
  if (isStringLiteralExp(exp)) return LiteralDataType.String;
  if (isIdentifierLiteralExp(exp)) return exp.datatype;
  if (isNumberLiteralExp(exp)) return LiteralDataType.Number;
  if (isBooleanLiteralExp(exp)) return LiteralDataType.Boolean;
  if (isObjectLiteralExp(exp)) return exp.datatype;
  if (isArrayLiteralExp(exp)) return exp.datatype;
  if (isFunctionCallExp(exp)) {
    const leftDatatype = getDatatypeOfTypeCheckedExp(exp.left);

    if (isFunctionDatatype(leftDatatype)) {
      return leftDatatype.returnType;
    } else {
      throw Error("Expected leftDatatype to be function datatype");
    }
  }
  if (isPlusUninaryExp(exp) || isMinusUninaryExp(exp)) {
    return LiteralDataType.Number;
  }
  if (isBangUniaryExp(exp)) {
    return LiteralDataType.Boolean;
  }
  if (
    isPlusBinaryExp(exp) ||
    isMinusBinaryExp(exp) ||
    isStarBinaryExp(exp) ||
    isSlashBinaryExp(exp) ||
    isVerticalBarBinaryExp(exp) ||
    isCaretBinaryExp(exp) ||
    isAmpersandBinaryExp(exp)
  ) {
    return LiteralDataType.Number;
  }

  if (
    isStrictEqualityBinaryExp(exp) ||
    isStrictNotEqualBinaryExp(exp) ||
    isLessThanBinaryExp(exp) ||
    isLessThanOrEqualBinaryExp(exp) ||
    isGreaterThanBinaryExp(exp) ||
    isGreaterThanOrEqualBinaryExp(exp)
  ) {
    return LiteralDataType.Boolean;
  }
  if (isDotMemberAccessExp(exp)) {
    const leftDatatype = getDatatypeOfTypeCheckedExp(exp.left);

    if (isObjectDatatype(leftDatatype)) {
      const elementDatatype = leftDatatype.keys[exp.right];

      if (elementDatatype === undefined)
        throw Error("Did not expect elementDatatype to be undefined");

      return elementDatatype;
    } else {
      throw Error("Expected leftDatatype to ObjectDatatype ");
    }
  }
  if (isBoxMemberAccessExp(exp)) {
    const leftDatatype = getDatatypeOfTypeCheckedExp(exp.left);

    if (isArrayDatatype(leftDatatype)) {
      return leftDatatype.baseType;
    } else {
      throw Error("Expected leftDatatype to be Array");
    }
  }

  throw Error(`It is not supported for getting datatype for exp ${exp}`);
};

// export const isCharLiteralexp = (exp: Expression): exp is CharLiteralExp => {
//   return exp.type === "char";
// };
