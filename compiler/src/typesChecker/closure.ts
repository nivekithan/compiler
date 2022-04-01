import clone = require("clone");
import { DataType } from "../parser/ast";

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

export class Closure {
  higherClosure: Closure | null;

  database: { [index: string]: StoredVariable | undefined };
  insideLoop: boolean;

  constructor(higherClosure: Closure | null, isInsideLoop: boolean) {
    this.insideLoop = isInsideLoop;
    this.higherClosure = higherClosure;
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
}
