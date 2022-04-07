import { unlink } from "fs";
import { AllocaInst, Function as LLVMFunction, Value } from "llvm-bindings";

export class TLLVMFunction {
  llvmFunction: LLVMFunction;

  localVarDatabase: { [varName: string]: Value | undefined };
  globalVarDatabase: { [varName: string]: Value | undefined };

  constructor(
    llvmFunction: LLVMFunction,
    globalVarDatabase: { [varName: string]: Value | undefined }
  ) {
    this.llvmFunction = llvmFunction;
    this.localVarDatabase = {};
    this.globalVarDatabase = globalVarDatabase;
  }

  getLLVMFunction(): LLVMFunction {
    return this.llvmFunction;
  }

  insertVarName(varName: string, pointerValue: Value) {
    if (this.localVarDatabase[varName] === undefined) {
      this.localVarDatabase[varName] = pointerValue;
    } else {
      throw Error(`There is already a variable with name ${varName}`);
    }
  }

  getVarInfo(varName: string): Value | null {
    const inst = this.localVarDatabase[varName];

    if (inst === undefined) {
      return null;
    } else {
      return inst;
    }
  }
}
