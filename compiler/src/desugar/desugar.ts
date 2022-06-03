import {
  ArrayDatatype,
  ArrayLiteralExp,
  Ast,
  CharLiteralExp,
  ConstVariableDeclaration,
  Expression,
  LetVariableDeclaration,
  LiteralDataType,
  NumberLiteralExp,
  ObjectDatatype,
  ObjectLiteralExp,
  StringLiteralExp,
} from "../parser/ast";
import { getDatatypeOfTypeCheckedExp } from "../utils/utils";

export const desugarAst = (typeCheckedAst: Readonly<Ast[]>): Ast[] => {
  const TDeSugar = new DeSugarAst(typeCheckedAst);

  return TDeSugar.getDeSugaredAst();
};

export class DeSugarAst {
  readonly typeCheckedAst: Readonly<Ast[]>;
  curPos: number | null;

  constructor(typeCheckedAst: Readonly<Ast[]>) {
    this.typeCheckedAst = typeCheckedAst;

    this.curPos = 0;
  }

  getDeSugaredAst() {
    const deSugaredAst: Ast[] = [];

    while (this.getCurAst() !== null) {
      const curAst = this.getCurAst();

      if (curAst?.type === "constVariableDeclaration") {
        deSugaredAst.push(this.deSugarVariableDeclaration(curAst));
      } else if (curAst?.type === "letVariableDeclaration") {
        deSugaredAst.push(this.deSugarVariableDeclaration(curAst));
      } else if (curAst !== null) {
        deSugaredAst.push(curAst);
      }

      this.next();
    }

    return deSugaredAst;
  }

  /**
   * Desugar the const variable declaration
   */

  deSugarVariableDeclaration(
    ast: ConstVariableDeclaration | LetVariableDeclaration
  ): ConstVariableDeclaration | LetVariableDeclaration {
    const deSugaredExp = this.desugarExpression(ast.exp);
    const dataTypeDeSugared = getDatatypeOfTypeCheckedExp(deSugaredExp);

    return { ...ast, exp: deSugaredExp, datatype: dataTypeDeSugared };
  }

  /**
   * Desugar the expression
   */
  desugarExpression(exp: Expression) {
    if (exp.type === "string") {
      return this.desugarStringLiteral(exp);
    }

    return exp;
  }

  /**
   * Converts "123" to {value : ["1", "2", "3"], length : 3 }
   *
   */
  desugarStringLiteral(curAst: StringLiteralExp): ObjectLiteralExp {
    const valueField = curAst.value.split("").map((s): CharLiteralExp => {
      return { type: "char", value: s };
    });

    const valueDatatype: ArrayDatatype = {
      type: "ArrayDataType",
      baseType: LiteralDataType.Char,
      numberOfElements: valueField.length,
    };

    const valueExp: ArrayLiteralExp = {
      type: "array",
      datatype: valueDatatype,
      exps: valueField,
    };

    const lengthField = curAst.value.length;

    const legnthExp: NumberLiteralExp = { type: "number", value: lengthField };

    const deSugaredStringDatatype: ObjectDatatype = {
      type: "ObjectDataType",
      keys: { value: valueDatatype, length: LiteralDataType.Number },
    };

    const deSugaredStringExp: ObjectLiteralExp = {
      type: "object",
      datatype: deSugaredStringDatatype,
      keys: [
        ["value", valueExp],
        ["length", legnthExp],
      ],
    };

    return deSugaredStringExp;
  }

  next() {
    if (this.curPos === null || this.curPos >= this.typeCheckedAst.length - 1) {
      this.curPos = null;
    } else {
      this.curPos++;
    }
  }

  getCurAst(): Ast | null {
    if (this.curPos === null) {
      return null;
    } else {
      const ast = this.typeCheckedAst[this.curPos];

      if (ast === undefined) {
        throw Error("Expected this.curPos to be always in bound of this.asts");
      }

      return ast;
    }
  }
}
