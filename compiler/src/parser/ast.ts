export type Ast = ImportDeclaration | IdentifierAst | {type : "EOF"};


export type ImportDeclaration = {
  type: "importDeclaration";
  from: string;
  importedIdentifires: IdentifierAst[];
};
export type IdentifierAst = { type : "identifier", name: string; dataType: DataType };

export enum DataType {
  Boolean = "Boolean",
  String = "String",
  Number = "Number",
  Unknown = "Unknown",
  NotCalculated = "NotCalculated",
}

