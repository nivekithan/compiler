export type Ast = ImportDeclaration | ConstVariableDeclaration | IdentifierAst | { type: "EOF" };

export type ImportDeclaration = {
  type: "importDeclaration";
  from: string;
  importedIdentifires: IdentifierAst[];
};

export type ConstVariableDeclaration = {
  type: "constVariableDeclaration";
  identifierName: string;
  exp: Expression;
  datatype: DataType;
};

export type IdentifierAst = {
  type: "identifier";
  name: string;
  dataType: DataType;
};

export type Expression = StringLiteralExp | IdentifierExp | NumberLiteralExp | BooleanLiteralExp;

export type StringLiteralExp = { type: "string"; value: string };
export type NumberLiteralExp = {type : "number", value : number};
export type BooleanLiteralExp = {type : "boolean", value : boolean};
export type IdentifierExp = {type : "identifier", name : string};


export enum DataType {
  Boolean = "Boolean",
  String = "String",
  Number = "Number",
  Unknown = "Unknown",
  NotCalculated = "NotCalculated",
}
