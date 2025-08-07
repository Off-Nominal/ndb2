# Router-Wide Error Handling

This directory contains middleware for handling errors across the entire router.

## errorHandler

The `errorHandler` middleware provides universal error handling for all routes in the router. It catches any unhandled errors and returns a consistent 500 error response.

### How it works

Express error handling middleware has a special signature with 4 parameters: `(err, req, res, next)`. When any route handler throws an error or calls `next(err)`, Express automatically calls the error handling middleware.

### Usage

```typescript
// In your router setup
import { errorHandler } from "./middleware/errorHandler";

export const apiV2Router = express.Router();

// Your routes here
apiV2Router.use("/seasons", mapRoutes([getAllSeasons]));
apiV2Router.use("/predictions", mapRoutes([getPredictionById]));

// Error handling middleware - MUST be last
apiV2Router.use(errorHandler);
```

### Route Handler Simplification

With router-wide error handling, your route handlers become much cleaner:

```typescript
// Before (with try-catch)
router.get("/:id", async (req, res) => {
  try {
    const data = await someAsyncOperation();
    res.json(data);
  } catch (err) {
    logger.error("Route Server Error: ", err);
    return res.status(500).json(/* error response */);
  }
});

// After (no try-catch needed)
router.get("/:id", async (req, res) => {
  const data = await someAsyncOperation();
  res.json(data);
  // Any unhandled errors will be caught by the router-wide error handler
});
```

### Benefits

1. **Much Simpler**: No need for try-catch blocks in every route
2. **Cleaner Code**: Route handlers focus purely on business logic
3. **Consistent Error Handling**: All unhandled errors are handled the same way
4. **Automatic**: Works automatically without any additional code in routes
5. **Express Standard**: Uses Express's built-in error handling mechanism

### Error Response Format

All unhandled errors are returned in this consistent format:

```json
{
  "success": false,
  "errors": [
    {
      "code": "SERVER_ERROR",
      "message": "There was an error processing your request."
    }
  ],
  "data": null
}
```

### Important Notes

- The error handler middleware **must be added last** in your router chain
- It only catches unhandled errors - you can still handle specific errors (404, 400, etc.) in your route logic
- If you need to pass an error to the error handler from within a route, use `next(err)`
