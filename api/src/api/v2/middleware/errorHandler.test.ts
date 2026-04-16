import express from "express";
import request from "supertest";
import * as API from "@offnominal/ndb2-api-types/v2";
import { errorHandler } from "./errorHandler";

/**
 * Express forwards **synchronous** `throw` from route handlers to error middleware.
 *
 * **`async` handlers:** call `next(err)` so failures reach `errorHandler` (see async test).
 * A bare `throw` inside `async` is not wired to `next` in Express 4: the request can
 * hang (supertest never settles) and Node may report an unhandled rejection, so we do
 * not integration-test that path here.
 */
describe("errorHandler", () => {
  function expectServerErrorPayload(response: {
    status: number;
    body: unknown;
  }) {
    expect(response.status).toBe(500);
    const body = response.body as API.Utils.ErrorResponse;
    expect(body.success).toBe(false);
    expect(body.data).toBeNull();
    expect(
      body.errors?.some(
        (e: API.Utils.ErrorInfo) => e.code === API.Errors.SERVER_ERROR,
      ),
    ).toBe(true);
    expect(
      body.errors?.some((e: API.Utils.ErrorInfo) =>
        /processing your request/i.test(e.message),
      ),
    ).toBe(true);
  }

  const mockThrow = async () => {
    return Promise.resolve().then(() => {
      throw new Error("intentional test failure");
    });
  };

  it("responds with 500 and SERVER_ERROR when a route throws synchronously", async () => {
    const app = express();
    app.get("/boom", () => {
      throw new Error("intentional test failure");
    });
    app.use(errorHandler);

    const response = await request(app).get("/boom");
    expectServerErrorPayload(response);
  });

  it("responds with 500 and SERVER_ERROR when an async route calls next(err)", async () => {
    const app = express();
    app.get("/async-boom", async (_req, _res, next) => {
      next(new Error("intentional async failure"));
    });
    app.use(errorHandler);

    const response = await request(app).get("/async-boom");
    expectServerErrorPayload(response);
  });
});
