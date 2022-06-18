import { Function as LLVMFunction, Value } from "llvm-bindings";

export class TLLVMFunction {
  llvmFunction: LLVMFunction;

  localVarDatabase: { [varName: string]: Value | undefined };

  contextId = 0;
  context: string = "";

  basicBlockTempCounter = 0;

  constructor(llvmFunction: LLVMFunction) {
    this.llvmFunction = llvmFunction;
    this.localVarDatabase = {};
  }

  getLLVMFunction(): LLVMFunction {
    return this.llvmFunction;
  }

  insertVarName(resolvedVarName: string, pointerValue: Value) {
    if (this.localVarDatabase[resolvedVarName] === undefined) {
      this.localVarDatabase[resolvedVarName] = pointerValue;
    } else {
      throw Error(
        `There is already a variable with name ${resolvedVarName}. Make sure you are resolving varName before inserting`
      );
    }
  }

  getVarInfo(varName: string): Value | null {
    const varNameWithContext = `${varName}${this.context}`;
    const splitedVarNameWithContext = varNameWithContext.split(":");

    while (splitedVarNameWithContext.length !== 0) {
      const varNameWithContext = splitedVarNameWithContext.join(":");

      if (this.localVarDatabase[varNameWithContext] === undefined) {
        splitedVarNameWithContext.pop();
        continue;
      }

      return this.localVarDatabase[varNameWithContext] as Value;
    }

    return null;
  }

  parsingChildContext() {
    this.context = `${this.context}:${this.contextId}`;
    this.contextId++;
  }

  finishedParsingChildContext() {
    const splitedContext = this.context.split(":");

    if (splitedContext.length <= 1) {
      throw new Error(
        "There is no child context, this usually means that finishedParsingChildContext is called before parsingChildContext"
      );
    }

    splitedContext.pop();
    this.context = splitedContext.join(":");
  }

  getBasicBlockTempName() {
    const name = `BB.${this.basicBlockTempCounter}`;

    this.basicBlockTempCounter++;

    return name;
  }
}
