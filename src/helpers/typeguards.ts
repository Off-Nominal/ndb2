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
