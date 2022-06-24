import { DataType } from "../tsTypes/ast";

const fieldsForDatatype: Partial<
  Record<DataType["type"], Record<string, DataType | undefined>>
> = {
  StringDatatype: { length: { type: "NumberDatatype" } },
};

export const getFieldsForDatatype = (passedDatatype: DataType) => {
  const { type } = passedDatatype;

  if (type === "ObjectDataType") {
    return passedDatatype.keys;
  }

  return fieldsForDatatype[type];
};
