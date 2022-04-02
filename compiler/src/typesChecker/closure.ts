import clone = require("clone");
import { DataType, Expression, LiteralDataType } from "../parser/ast";

export type ClosureVariable = {
  name: string;
  dataType: DataType;
  presentInCurrentClosure: boolean;
  isDeclaredConst: boolean;
  isExported: boolean;
};

type StoredVariable = {
  name: string;
  dataType: DataType;
  isDeclaredConst: boolean;
  isExported: boolean;
};

type FunctionClosureInfo = {
  insideFunctionDeclaration: boolean;
  returnType: DataType;
};

export type ClosureOpts = {
  isInsideLoop: boolean;
  functionInfo?: FunctionClosureInfo;
};
export class Closure {
  higherClosure: Closure | null;

  database: { [index: string]: StoredVariable | undefined };
  insideLoop: boolean;
  functionInfo: FunctionClosureInfo;

  constructor(
    higherClosure: Closure | null,
    { isInsideLoop, functionInfo }: ClosureOpts
  ) {
    this.insideLoop = isInsideLoop;
    this.higherClosure = higherClosure;

    this.functionInfo =
      functionInfo === undefined
        ? {
            insideFunctionDeclaration: false,
            returnType: LiteralDataType.NotCalculated,
          }
        : functionInfo;

    this.database = {};
  }

  insertVariableInfo(info: StoredVariable) {
    if (this.database[info.name] === undefined) {
      this.database[info.name] = info;
    } else {
      throw Error(`Variable with name ${info.name} is already present`);
    }
  }

  getVariableInfo(name: string): ClosureVariable | null {
    // console.log(this.database);
    const varInfo = this.database[name];

    if (varInfo === undefined) {
      if (this.higherClosure !== null) {
        const info = this.higherClosure.getVariableInfo(name);

        if (info === null) {
          return null;
        }

        const clonedInfo = clone(info);

        return { ...clonedInfo, presentInCurrentClosure: false };
      }
      return null;
    } else {
      const clonedInfo = clone(varInfo);
      return { ...clonedInfo, presentInCurrentClosure: true };
    }
  }

  isInsideLoop(): boolean {
    if (this.insideLoop) return true;

    if (this.higherClosure === null) {
      return false;
    } else {
      return this.higherClosure.isInsideLoop();
    }
  }

  isInsideFunctionDeclaration(): boolean {
    const closure = this.getFunctionClosure();

    if (closure === null) return false;

    return true;
  }

  getReturnType(): DataType | null {
    const functionClosure = this.getFunctionClosure();

    if (functionClosure === null) return null;

    return functionClosure.functionInfo.returnType;
  }

  setReturnType(dataType: DataType) {
    const functionClosure = this.getFunctionClosure();

    if (functionClosure === null)
      throw Error(
        "Can only call this function inside when isInsideFunctionDelcaration is true"
      );

    functionClosure.functionInfo.returnType = dataType;
  }

  private getFunctionClosure(): Closure | null {
    if (this.functionInfo.insideFunctionDeclaration) return this;

    if (this.higherClosure === null) return null;

    return this.higherClosure.getFunctionClosure();
  }
}
