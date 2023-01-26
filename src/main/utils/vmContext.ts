import vm from 'vm';

export const runInContext = <T>(code: string, context: T) => {
  vm.runInNewContext(code, context);
  return context;
};
