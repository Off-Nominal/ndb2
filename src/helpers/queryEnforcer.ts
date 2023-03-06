export const queryEnforcer = {
  stringEnforcer(param: string | string[] | undefined, enforce: boolean) {
    const isAString = typeof param === "string";
    const isANumber = !isNaN(Number(param));

    const sendError =
      (enforce && !param) || // but is undefined
      (enforce && !isAString) || // but is not a string
      (enforce && isANumber) || // but is a number
      (!enforce && isAString && !isANumber); // but is a string

    return sendError
      ? {
          status: 400,
          error: `Parameter ${param} must ${
            enforce ? "" : "not "
          }be a single non-numeric String.`,
        }
      : null;
  },

  isString(param: string | string[] | undefined) {
    return this.stringEnforcer(param, true);
  },

  isNotString(param: string | string[] | undefined) {
    return this.stringEnforcer(param, false);
  },

  numberEnforcer(param: string | string[] | undefined, enforce: boolean) {
    const isArray = Array.isArray(param);
    const isANumber = !isNaN(Number(param));
    const sendError =
      (enforce && !param) || // but is undefined
      (enforce && isArray) || // but is an array
      (enforce && !isANumber) || // but is not a number
      (!enforce && isANumber && !isArray); // but is a number

    return sendError
      ? {
          status: 400,
          error: `Parameter ${param} must ${
            enforce ? "" : "not "
          }be parseable as a Number.`,
        }
      : null;
  },

  isNumber(param: string | string[] | undefined) {
    return this.numberEnforcer(param, true);
  },

  isNotNumber(param: string | string[] | undefined) {
    return this.numberEnforcer(param, false);
  },

  arrayEnforcer(param: string | string[] | undefined, enforce: boolean) {
    const isArray = Array.isArray(param);
    const sendError = (enforce && !isArray) || (!enforce && isArray);

    return sendError
      ? {
          status: 400,
          error: `Parameter ${param} must ${
            enforce ? "" : "not "
          }be parseable as an Array`,
        }
      : null;
  },

  isArray(param: string | string[] | undefined) {
    return this.arrayEnforcer(param, true);
  },

  isNotArray(param: string | string[] | undefined) {
    return this.arrayEnforcer(param, false);
  },
};
