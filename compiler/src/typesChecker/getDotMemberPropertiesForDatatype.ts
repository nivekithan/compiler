import { DataType, LiteralDataType, ObjectDatatype } from "../parser/ast";
import { isObjectDatatype } from "../utils/utils";

export const getDotMemberPropForDatatype = (
  datatype: DataType
): Record<string, DataType | undefined> | null => {
  if (datatype === LiteralDataType.String) {
    return getDotMemberPropForStringDatatype(datatype);
  } else if (isObjectDatatype(datatype)) {
    return getDotMemberPropForObjectDatatype(datatype);
  }

  return null;
};

const getDotMemberPropForStringDatatype = (
  dataType: LiteralDataType.String
) => {
  return {
    length: LiteralDataType.Number,
  };
};

const getDotMemberPropForObjectDatatype = (dataType: ObjectDatatype) => {
  return dataType.keys;
};
