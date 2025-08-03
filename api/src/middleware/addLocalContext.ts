import { Request, Response, NextFunction } from "express";

// Type to extract the Locals type from a middleware function
type ExtractLocals<T> = T extends (
  req: Request<any, any, any, any, infer L>,
  res: Response,
  next: NextFunction
) => any
  ? L
  : never;

// Type to merge multiple Locals types into a single object type
type MergeLocals<T extends readonly any[]> = T extends readonly [
  infer First,
  ...infer Rest
]
  ? First extends never
    ? MergeLocals<Rest>
    : Rest extends readonly any[]
    ? First & MergeLocals<Rest>
    : First
  : {};

// Type to ensure all middlewares in the array have the same signature
type MiddlewareArray<T extends readonly any[]> = {
  [K in keyof T]: T[K] extends (
    req: Request<any, any, any, any, any>,
    res: Response,
    next: NextFunction
  ) => any
    ? T[K]
    : never;
};

export const addLocalContext = <T extends readonly any[]>(
  middlewares: MiddlewareArray<T>
) => {
  return (
    req: Request<
      any,
      any,
      any,
      any,
      MergeLocals<{ [K in keyof T]: ExtractLocals<T[K]> }>
    >,
    res: Response,
    next: NextFunction
  ) => {
    // Execute all middlewares in sequence
    let index = 0;

    const executeNext = () => {
      if (index >= middlewares.length) {
        return next();
      }

      const middleware = middlewares[index];
      index++;

      middleware(req, res, executeNext);
    };

    executeNext();
  };
};
