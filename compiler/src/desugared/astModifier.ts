import { DeSugaredAst } from "../tsTypes/desugared";
import { interpret, InterpreterFrom } from "xstate";
import {
  CompilerProvidedFunctionNames,
  createImportMachine,
} from "./machines/importMachines";

export class AstModifier {
  deSugaredAst: DeSugaredAst[];
  interpreter: InterpreterFrom<ReturnType<typeof createImportMachine>>;

  constructor(deSugaredAst: DeSugaredAst[]) {
    this.deSugaredAst = deSugaredAst;
    const importMachine = createImportMachine(deSugaredAst);
    const importMachineService = interpret(importMachine);

    this.interpreter = importMachineService;
    this.interpreter.start();
  }

  importCompilerFn(name: CompilerProvidedFunctionNames) {
    const curState = this.interpreter.state;

    if (curState.matches("beforeImportedFile")) {
      this.interpreter.send("importFile");
    }

    this.interpreter.send({
      type: "importFunction",
      payload: { name },
    });
  }
}
