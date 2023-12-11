import vm, { Context } from "vm";

export const runInContext = (code: string, context: Context) => {
  vm.runInNewContext(code, context);
  return context;
};
