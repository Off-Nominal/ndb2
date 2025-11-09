import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { validate } from "./validate";
import * as API from "@offnominal/ndb2-api-types/v2";

// Helper type to extract Request type from a validator function
type ValidatorRequest<T> = T extends (
  req: infer R,
  res: Response,
  next: NextFunction
) => void
  ? R
  : never;

// Helper function to create a properly typed mock request
function createMockRequest<
  T extends (req: any, res: Response, next: NextFunction) => void
>(validator: T): ValidatorRequest<T> {
  return {
    params: {},
    query: {},
    body: {},
  } as ValidatorRequest<T>;
}

describe("validate middleware", () => {
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;
  let statusSpy: ReturnType<typeof vi.fn>;
  let jsonSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    // Reset mocks before each test
    statusSpy = vi.fn().mockReturnThis();
    jsonSpy = vi.fn().mockReturnThis();

    mockRes = {
      status: statusSpy,
      json: jsonSpy,
    };

    mockNext = vi.fn();
  });

  describe("params validation", () => {
    it("should pass validation when params match schema", () => {
      const validator = validate({
        params: z.object({ id: z.string() }),
      });

      const mockReq = createMockRequest(validator);
      mockReq.params = { id: "123" };

      validator(mockReq, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledTimes(1);
      expect(statusSpy).not.toHaveBeenCalled();
      expect(jsonSpy).not.toHaveBeenCalled();
    });

    it("should return 400 when params do not match schema", () => {
      const validator = validate({
        params: z.object({ id: z.string() }),
      });

      const mockReq = createMockRequest(validator);
      // Use Record to allow invalid type for testing
      (mockReq.params as Record<string, unknown>) = { id: 123 };

      validator(mockReq, mockRes as Response, mockNext);

      expect(mockNext).not.toHaveBeenCalled();
      expect(statusSpy).toHaveBeenCalledWith(400);
      expect(jsonSpy).toHaveBeenCalledTimes(1);

      const responseBody = jsonSpy.mock.calls[0][0];
      expect(responseBody).toHaveProperty("success", false);
      expect(responseBody).toHaveProperty("errors");
      expect(responseBody.errors).toHaveLength(1);
      expect(responseBody.errors[0].code).toBe(API.Errors.MALFORMED_URL_PARAMS);
    });

    it("should return 400 when required params are missing", () => {
      const validator = validate({
        params: z.object({ id: z.string() }),
      });

      const mockReq = createMockRequest(validator);
      (mockReq.params as Record<string, unknown>) = {};

      validator(mockReq, mockRes as Response, mockNext);

      expect(mockNext).not.toHaveBeenCalled();
      expect(statusSpy).toHaveBeenCalledWith(400);
      expect(jsonSpy).toHaveBeenCalledTimes(1);

      const responseBody = jsonSpy.mock.calls[0][0];
      expect(responseBody.errors[0].code).toBe(API.Errors.MALFORMED_URL_PARAMS);
    });
  });

  describe("query validation", () => {
    it("should pass validation when query matches schema", () => {
      const validator = validate({
        query: z.object({ limit: z.coerce.number().optional() }),
      });

      const mockReq = createMockRequest(validator);
      mockReq.query = { limit: "10" };

      validator(mockReq, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledTimes(1);
      expect(statusSpy).not.toHaveBeenCalled();
      expect(jsonSpy).not.toHaveBeenCalled();
    });

    it("should return 400 when query does not match schema", () => {
      const validator = validate({
        query: z.object({ limit: z.coerce.number() }),
      });

      const mockReq = createMockRequest(validator);
      mockReq.query = { limit: "not-a-number" };

      validator(mockReq, mockRes as Response, mockNext);

      expect(mockNext).not.toHaveBeenCalled();
      expect(statusSpy).toHaveBeenCalledWith(400);
      expect(jsonSpy).toHaveBeenCalledTimes(1);

      const responseBody = jsonSpy.mock.calls[0][0];
      expect(responseBody.errors[0].code).toBe(
        API.Errors.MALFORMED_QUERY_PARAMS
      );
    });

    it("should pass validation when optional query param is missing", () => {
      const validator = validate({
        query: z.object({ limit: z.coerce.number().optional() }),
      });

      const mockReq = createMockRequest(validator);
      mockReq.query = {};

      validator(mockReq, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledTimes(1);
      expect(statusSpy).not.toHaveBeenCalled();
      expect(jsonSpy).not.toHaveBeenCalled();
    });
  });

  describe("body validation", () => {
    it("should pass validation when body matches schema", () => {
      const validator = validate({
        body: z.object({ name: z.string(), email: z.string().email() }),
      });

      const mockReq = createMockRequest(validator);
      mockReq.body = { name: "John Doe", email: "john@example.com" };

      validator(mockReq, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledTimes(1);
      expect(statusSpy).not.toHaveBeenCalled();
      expect(jsonSpy).not.toHaveBeenCalled();
    });

    it("should return 400 when body does not match schema", () => {
      const validator = validate({
        body: z.object({ name: z.string(), email: z.string().email() }),
      });

      const mockReq = createMockRequest(validator);
      mockReq.body = { name: "John Doe", email: "invalid-email" };

      validator(mockReq, mockRes as Response, mockNext);

      expect(mockNext).not.toHaveBeenCalled();
      expect(statusSpy).toHaveBeenCalledWith(400);
      expect(jsonSpy).toHaveBeenCalledTimes(1);

      const responseBody = jsonSpy.mock.calls[0][0];
      expect(responseBody.errors[0].code).toBe(API.Errors.MALFORMED_BODY_DATA);
    });

    it("should return 400 when required body fields are missing", () => {
      const validator = validate({
        body: z.object({ name: z.string(), email: z.string().email() }),
      });

      const mockReq = createMockRequest(validator);
      mockReq.body = { name: "John Doe" }; // Missing email

      validator(mockReq, mockRes as Response, mockNext);

      expect(mockNext).not.toHaveBeenCalled();
      expect(statusSpy).toHaveBeenCalledWith(400);
      expect(jsonSpy).toHaveBeenCalledTimes(1);

      const responseBody = jsonSpy.mock.calls[0][0];
      expect(responseBody.errors[0].code).toBe(API.Errors.MALFORMED_BODY_DATA);
    });
  });

  describe("combined validation - params, query, and body", () => {
    it("should pass validation when all three are valid", () => {
      const validator = validate({
        params: z.object({ id: z.string() }),
        query: z.object({ limit: z.coerce.number().optional() }),
        body: z.object({ name: z.string() }),
      });

      const mockReq = createMockRequest(validator);
      mockReq.params = { id: "123" };
      (mockReq.query as Record<string, unknown>) = { limit: "10" };
      (mockReq.body as Record<string, unknown>) = { name: "John Doe" };

      validator(mockReq, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledTimes(1);
      expect(statusSpy).not.toHaveBeenCalled();
      expect(jsonSpy).not.toHaveBeenCalled();
    });

    it("should return 400 with all errors when all three are invalid", () => {
      const validator = validate({
        params: z.object({ id: z.string() }),
        query: z.object({ limit: z.coerce.number() }),
        body: z.object({ name: z.string() }),
      });

      const mockReq = createMockRequest(validator);
      (mockReq.params as Record<string, unknown>) = { id: 123 }; // Wrong type
      (mockReq.query as Record<string, unknown>) = { limit: "not-a-number" }; // Invalid
      (mockReq.body as Record<string, unknown>) = {}; // Missing required field

      validator(mockReq, mockRes as Response, mockNext);

      expect(mockNext).not.toHaveBeenCalled();
      expect(statusSpy).toHaveBeenCalledWith(400);
      expect(jsonSpy).toHaveBeenCalledTimes(1);

      const responseBody = jsonSpy.mock.calls[0][0];
      expect(responseBody.errors).toHaveLength(3);

      // Check that all three error types are present
      const errorCodes = responseBody.errors.map(
        (err: API.Utils.ErrorInfo) => err.code
      );
      expect(errorCodes).toContain(API.Errors.MALFORMED_URL_PARAMS);
      expect(errorCodes).toContain(API.Errors.MALFORMED_QUERY_PARAMS);
      expect(errorCodes).toContain(API.Errors.MALFORMED_BODY_DATA);
    });

    it("should return 400 with only params error when params is invalid but query and body are valid", () => {
      const validator = validate({
        params: z.object({ id: z.string() }),
        query: z.object({ limit: z.coerce.number().optional() }),
        body: z.object({ name: z.string() }),
      });

      const mockReq = createMockRequest(validator);
      (mockReq.params as Record<string, unknown>) = { id: 123 }; // Invalid
      (mockReq.query as Record<string, unknown>) = { limit: "10" }; // Valid
      (mockReq.body as Record<string, unknown>) = { name: "John Doe" }; // Valid

      validator(mockReq, mockRes as Response, mockNext);

      expect(mockNext).not.toHaveBeenCalled();
      expect(statusSpy).toHaveBeenCalledWith(400);
      expect(jsonSpy).toHaveBeenCalledTimes(1);

      const responseBody = jsonSpy.mock.calls[0][0];
      expect(responseBody.errors).toHaveLength(1);
      expect(responseBody.errors[0].code).toBe(API.Errors.MALFORMED_URL_PARAMS);
    });

    it("should return 400 with only query error when query is invalid but params and body are valid", () => {
      const validator = validate({
        params: z.object({ id: z.string() }),
        query: z.object({ limit: z.coerce.number() }),
        body: z.object({ name: z.string() }),
      });

      const mockReq = createMockRequest(validator);
      mockReq.params = { id: "123" }; // Valid
      (mockReq.query as Record<string, unknown>) = { limit: "not-a-number" }; // Invalid
      (mockReq.body as Record<string, unknown>) = { name: "John Doe" }; // Valid

      validator(mockReq, mockRes as Response, mockNext);

      expect(mockNext).not.toHaveBeenCalled();
      expect(statusSpy).toHaveBeenCalledWith(400);
      expect(jsonSpy).toHaveBeenCalledTimes(1);

      const responseBody = jsonSpy.mock.calls[0][0];
      expect(responseBody.errors).toHaveLength(1);
      expect(responseBody.errors[0].code).toBe(
        API.Errors.MALFORMED_QUERY_PARAMS
      );
    });

    it("should return 400 with only body error when body is invalid but params and query are valid", () => {
      const validator = validate({
        params: z.object({ id: z.string() }),
        query: z.object({ limit: z.coerce.number().optional() }),
        body: z.object({ name: z.string(), email: z.string().email() }),
      });

      const mockReq = createMockRequest(validator);
      mockReq.params = { id: "123" }; // Valid
      (mockReq.query as Record<string, unknown>) = { limit: "10" }; // Valid
      (mockReq.body as Record<string, unknown>) = {
        name: "John Doe",
        email: "invalid-email",
      }; // Invalid email

      validator(mockReq, mockRes as Response, mockNext);

      expect(mockNext).not.toHaveBeenCalled();
      expect(statusSpy).toHaveBeenCalledWith(400);
      expect(jsonSpy).toHaveBeenCalledTimes(1);

      const responseBody = jsonSpy.mock.calls[0][0];
      expect(responseBody.errors).toHaveLength(1);
      expect(responseBody.errors[0].code).toBe(API.Errors.MALFORMED_BODY_DATA);
    });

    it("should return 400 with params and query errors when both are invalid but body is valid", () => {
      const validator = validate({
        params: z.object({ id: z.string() }),
        query: z.object({ limit: z.coerce.number() }),
        body: z.object({ name: z.string() }),
      });

      const mockReq = createMockRequest(validator);
      (mockReq.params as Record<string, unknown>) = { id: 123 }; // Invalid
      (mockReq.query as Record<string, unknown>) = { limit: "not-a-number" }; // Invalid
      (mockReq.body as Record<string, unknown>) = { name: "John Doe" }; // Valid

      validator(mockReq, mockRes as Response, mockNext);

      expect(mockNext).not.toHaveBeenCalled();
      expect(statusSpy).toHaveBeenCalledWith(400);
      expect(jsonSpy).toHaveBeenCalledTimes(1);

      const responseBody = jsonSpy.mock.calls[0][0];
      expect(responseBody.errors).toHaveLength(2);

      const errorCodes = responseBody.errors.map(
        (err: API.Utils.ErrorInfo) => err.code
      );
      expect(errorCodes).toContain(API.Errors.MALFORMED_URL_PARAMS);
      expect(errorCodes).toContain(API.Errors.MALFORMED_QUERY_PARAMS);
      expect(errorCodes).not.toContain(API.Errors.MALFORMED_BODY_DATA);
    });

    it("should return 400 with query and body errors when both are invalid but params is valid", () => {
      const validator = validate({
        params: z.object({ id: z.string() }),
        query: z.object({ limit: z.coerce.number() }),
        body: z.object({ name: z.string() }),
      });

      const mockReq = createMockRequest(validator);
      mockReq.params = { id: "123" }; // Valid
      (mockReq.query as Record<string, unknown>) = { limit: "not-a-number" }; // Invalid
      (mockReq.body as Record<string, unknown>) = {}; // Invalid - missing name

      validator(mockReq, mockRes as Response, mockNext);

      expect(mockNext).not.toHaveBeenCalled();
      expect(statusSpy).toHaveBeenCalledWith(400);
      expect(jsonSpy).toHaveBeenCalledTimes(1);

      const responseBody = jsonSpy.mock.calls[0][0];
      expect(responseBody.errors).toHaveLength(2);

      const errorCodes = responseBody.errors.map(
        (err: API.Utils.ErrorInfo) => err.code
      );
      expect(errorCodes).toContain(API.Errors.MALFORMED_QUERY_PARAMS);
      expect(errorCodes).toContain(API.Errors.MALFORMED_BODY_DATA);
      expect(errorCodes).not.toContain(API.Errors.MALFORMED_URL_PARAMS);
    });

    it("should return 400 with params and body errors when both are invalid but query is valid", () => {
      const validator = validate({
        params: z.object({ id: z.string() }),
        query: z.object({ limit: z.coerce.number().optional() }),
        body: z.object({ name: z.string() }),
      });

      const mockReq = createMockRequest(validator);
      (mockReq.params as Record<string, unknown>) = { id: 123 }; // Invalid
      (mockReq.query as Record<string, unknown>) = { limit: "10" }; // Valid
      (mockReq.body as Record<string, unknown>) = {}; // Invalid - missing name

      validator(mockReq, mockRes as Response, mockNext);

      expect(mockNext).not.toHaveBeenCalled();
      expect(statusSpy).toHaveBeenCalledWith(400);
      expect(jsonSpy).toHaveBeenCalledTimes(1);

      const responseBody = jsonSpy.mock.calls[0][0];
      expect(responseBody.errors).toHaveLength(2);

      const errorCodes = responseBody.errors.map(
        (err: API.Utils.ErrorInfo) => err.code
      );
      expect(errorCodes).toContain(API.Errors.MALFORMED_URL_PARAMS);
      expect(errorCodes).toContain(API.Errors.MALFORMED_BODY_DATA);
      expect(errorCodes).not.toContain(API.Errors.MALFORMED_QUERY_PARAMS);
    });
  });
});
