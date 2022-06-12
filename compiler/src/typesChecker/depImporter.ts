import { DataType } from "../tsTypes/ast";
import { resolve } from "path";

type AlreadyKnownDatatypes = {
  [fileName: string]: { [varName: string]: DataType | undefined } | undefined;
};

export class DepImporter {
  curFileName: string;
  alreadyKnownDatatype: AlreadyKnownDatatypes;

  constructor(
    curFileName: string,
    alreadyKnownDatatype: AlreadyKnownDatatypes
  ) {
    this.curFileName = curFileName;
    this.alreadyKnownDatatype = alreadyKnownDatatype;
  }

  getDatatypeFrom(varName: string, fromFileName: string): DataType {
    const fromAbsoluteFileName = resolve(this.curFileName, fromFileName);

    const fileVarToDatatypes = this.alreadyKnownDatatype[fromAbsoluteFileName];

    if (fileVarToDatatypes === undefined) throw Error("Not yet implemented");

    const varDatatype = fileVarToDatatypes[varName];

    if (varDatatype === undefined) throw Error("Not yet implemented");

    return varDatatype;
  }
}
