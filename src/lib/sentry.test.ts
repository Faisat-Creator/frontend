import { describe, expect, it, vi } from "vitest";
import { captureException } from "./sentry.js";
import * as Sentry from "@sentry/react";

vi.mock("@sentry/react", () => ({
  captureException: vi.fn(),
}));

describe("captureException", () => {
  it("forwards the error and React component stack to Sentry", async () => {
    const error = new Error("render failed");
    await captureException(error, { componentStack: "at BrokenWidget" });

    expect(Sentry.captureException).toHaveBeenCalledWith(error, {
      contexts: { react: { componentStack: "at BrokenWidget" } },
    });
  });

  it("captures errors without optional React metadata", async () => {
    const error = new Error("render failed");
    await captureException(error);

    expect(Sentry.captureException).toHaveBeenCalledWith(error, { contexts: undefined });
  });
});
