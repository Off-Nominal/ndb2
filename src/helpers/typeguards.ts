export const isInteger = (val: any): val is number => {
  let num: number;
  if (typeof val === "number") {
    num = val;
  } else if (typeof val === "string") {
    num = Number(val);
  } else {
    return false;
  }

  return Number.isSafeInteger(num);
};

export const isNumber = (val: any): val is number => {
  if (typeof val === "number") {
    return true;
  }

  if (typeof val !== "string") {
    return false;
  }

  const num = Number(val);

  return !isNaN(num);
};

export const isNoMoreThan = (val: number, max: number): boolean => {
  return max > val;
};

export const isNumberParseableString = (val: any): val is string => {
  if (typeof val !== "string") {
    return false;
  }

  const numString = Number(val);

  return !isNaN(numString);
};

export const isIntegerParseableString = (val: any): val is string => {
  if (typeof val !== "string") {
    return false;
  }

  const numString = Number(val);

  return Number.isSafeInteger(numString);
};

export const isUuid = (val: any): val is string => {
  if (typeof val !== "string") {
    return false;
  }

  const validator = val.match(
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  );

  return validator !== null;
};

export const isString = (val: any): val is string => {
  if (typeof val === "string") {
    return true;
  }

  return typeof val === "number";
};

export const isBoolean = (val: any): val is boolean => {
  if (typeof val === "boolean") {
    return true;
  }

  if (typeof val !== "string") {
    return false;
  }

  return val === "true" || val === "false";
};
