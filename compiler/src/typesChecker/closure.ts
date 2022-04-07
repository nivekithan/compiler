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

  varInfoHooks: { [name: string]: (() => void)[] | undefined };
  returnTypeHooks: (() => void)[];

  constructor(
    higherClosure: Closure | null,
    { isInsideLoop, functionInfo }: ClosureOpts
  ) {
    this.insideLoop = isInsideLoop;
    this.higherClosure = higherClosure;
    this.varInfoHooks = {};
    this.returnTypeHooks = [];

    this.functionInfo =
      functionInfo === undefined
        ? {
            insideFunctionDeclaration: false,
            returnType: LiteralDataType.NotCalculated,
          }
        : functionInfo;

    this.database = {};
  }

  addHookForVariableInfo(varName: string, callback: () => void) {
    if (this.varInfoHooks[varName] === undefined) {
      this.varInfoHooks[varName] = [callback];
    } else {
      this.varInfoHooks[varName]?.push(callback);
    }
  }

  addHookForReturnType(callback: () => void) {
    if (!this.functionInfo.insideFunctionDeclaration) {
      throw Error("Cannot add Hook in closure which is not a function closure");
    }

    this.returnTypeHooks.push(callback);
  }

  getClosureWithVarName(varName: string): Closure | null {
    const varInfo = this.database[varName];

    if (varInfo !== undefined) {
      return this;
    } else {
      if (this.higherClosure === null) {
        return null;
      }

      return this.higherClosure.getClosureWithVarName(varName);
    }
  }

  getTopClosure(): Closure {
    if (this.higherClosure === null) {
      return this;
    } else {
      return this.higherClosure.getTopClosure();
    }
  }

  insertVariableInfo(info: StoredVariable) {
    if (this.database[info.name] === undefined) {
      this.database[info.name] = info;
      this.callHooksForVarInfo(info.name);
    } else {
      throw Error(`Variable with name ${info.name} is already present`);
    }
  }

  getVariableInfo(name: string): ClosureVariable | null {
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

  updateVariableInfo(info: StoredVariable) {
    if (this.database[info.name] !== undefined) {
      this.database[info.name] = info;
      this.callHooksForVarInfo(info.name);
    } else {
      throw Error(`There is no variable with name ${info.name}`);
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
    this.callHooksForReturnType();
  }

  isTopLevel(): boolean {
    return this.higherClosure === null;
  }

  private getFunctionClosure(): Closure | null {
    if (this.functionInfo.insideFunctionDeclaration) return this;

    if (this.higherClosure === null) return null;

    return this.higherClosure.getFunctionClosure();
  }

  private callHooksForReturnType() {
    const copiedHookForReturnType = clone(this.returnTypeHooks);
    this.returnTypeHooks = [];

    copiedHookForReturnType.forEach((s) => s());
  }

  private callHooksForVarInfo(name: string) {
    const varInfoHooks = this.varInfoHooks[name];

    if (varInfoHooks !== undefined) {
      const copiedHooks = clone(varInfoHooks);
      this.varInfoHooks[name] = [];

      copiedHooks.forEach((s) => s());
    }
  }
}
