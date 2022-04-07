import { AllocaInst, Function as LLVMFunction } from "llvm-bindings";

export class TLLVMFunction {
  llvmFunction: LLVMFunction;

  varDatabase: { [varName: string]: AllocaInst | undefined };

  constructor(llvmFunction: LLVMFunction) {
    this.llvmFunction = llvmFunction;
    this.varDatabase = {};
  }

  getLLVMFunction(): LLVMFunction {
    return this.llvmFunction;
  }

  insertVarName(varName: string, pointerValue: AllocaInst) {
    if (this.varDatabase[varName] === undefined) {
      this.varDatabase[varName] = pointerValue;
    } else {
      throw Error(`There is already a variable with name ${varName}`);
    }
  }

  getVarInfo(varName: string) {
    const inst = this.varDatabase[varName];

    if (inst === undefined) {
      throw Error(`There is no variable with name ${varName}`);
    } else {
      return inst;
    }
  }
}
