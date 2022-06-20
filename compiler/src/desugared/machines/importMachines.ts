import { assign, createMachine, StateNode } from "xstate";
import { DeSugaredAst, DeSugaredDatatype } from "../../tsTypes/desugared";

export type CompilerProvidedFunctionNames = "printFoo";

export type ImportMachineContext = {
  importedFiles: Record<string, boolean | undefined>;
};

export type ImportMachineEvents =
  | { type: "importFile" }
  | {
      type: "importFunction";
      payload: { name: CompilerProvidedFunctionNames };
    };

export const createImportMachine = (deSugaredAst: DeSugaredAst[]) => {
  const importMachine = createMachine(
    {
      id: "importMachine",
      context: {
        importedFiles: {},
      },
      tsTypes: {} as import("./importMachines.typegen").Typegen0,
      initial: "beforeImportedFile",
      states: {
        beforeImportedFile: {
          on: {
            importFile: {
              target: "importedFile",
              actions: ["importFile"],
            },
          },
        },
        importedFile: {
          on: {
            importFunction: {
              actions: ["importFunction"],
            },
          },
        },
      },
      schema: {
        context: {} as ImportMachineContext,
        events: {} as ImportMachineEvents,
      },
    },
    {
      actions: {
        importFile() {
          deSugaredAst.unshift({
            type: "importDeclaration",
            from: "compiler",
            importedIdentifires: [],
          });
        },

        importFunction: assign((ctx, event) => {
          const functionName = event.payload.name;

          if (ctx.importedFiles[functionName]) {
            return ctx;
          }

          const importFromCompilerFileDec = deSugaredAst[0];

          if (
            importFromCompilerFileDec.type !== "importDeclaration" ||
            importFromCompilerFileDec.from !== "compiler"
          ) {
            throw new Error(
              `Expected first element of deSugaredAst to be importDeclaration from file compiler`
            );
          }

          importFromCompilerFileDec.importedIdentifires.push({
            type: "identifier",
            name: functionName,
            dataType: getDataTypeForCompilerFn(functionName),
          });

          ctx.importedFiles[functionName] = true;

          return ctx;
        }),
      },
    }
  );

  return importMachine;
};

const getDataTypeForCompilerFn = (
  name: CompilerProvidedFunctionNames
): DeSugaredDatatype => {
  if (name === "printFoo") {
    return {
      type: "FunctionDataType",
      arguments: {},
      returnType: { type: "BooleanDataType" },
    };
  }

  throw new Error(`There is no compiler provided fn with name ${name}`);
};
