import { Function as LLVMFunction } from "llvm-bindings";

export class TLLVMFunction {
  llvmFunction: LLVMFunction;
  tempCounter: 0;

  constructor(llvmFunction: LLVMFunction) {
    this.llvmFunction = llvmFunction;
    this.tempCounter = 0;
  }

  getTempName() {
    const name = `${this.tempCounter}`;
    this.increaseCounter();
    return name;
  }

  getLLVMFunction(): LLVMFunction {
    return this.llvmFunction;
  }

  protected increaseCounter() {
    this.tempCounter++;
  }
}
