export function createLogger(verbose: boolean) {
  return (message: string) => {
    if (verbose) {
      console.log(message);
    }
  };
}
