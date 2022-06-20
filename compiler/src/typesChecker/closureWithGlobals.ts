import { Closure } from "./closure";

export const getGlobalClosure = () => {
  const GlobalClosure = new Closure(null, {
    isInsideLoop: false,
    functionInfo: undefined,
  });

  GlobalClosure.insertVariableInfo({
    name: "printFoo",
    isExported: false,
    dataType: {
      type: "FunctionDataType",
      arguments: {},
      returnType: { type: "BooleanDataType" },
    },
    isDeclaredConst: true,
  });
  return GlobalClosure;
};
