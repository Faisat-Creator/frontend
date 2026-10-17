import { describe, it, expect, vi, beforeEach } from "vitest";
import { fetchCatalogWithCache } from "./catalogCache.js";
import { fetchCatalog } from "../api/resources.js";
import { ApiError } from "../api/http.js";

vi.mock("../api/resources.js", () => ({
  fetchCatalog: vi.fn(),
}));

describe("fetchCatalogWithCache", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
  });

  it("returns fresh data when the network request succeeds", async () => {
    vi.mocked(fetchCatalog).mockResolvedValue([{ id: "1", title: "A" }]);

    const result = await fetchCatalogWithCache({ search: "test" });

    expect(result.stale).toBe(false);
    expect(result.data).toEqual([{ id: "1", title: "A" }]);
    expect(result.syncedAt).toBeInstanceOf(Date);
  });

  it("returns cached data with stale=true when the network fails", async () => {
    vi.mocked(fetchCatalog)
      .mockResolvedValueOnce([{ id: "1", title: "A" }])
      .mockRejectedValueOnce(new ApiError("Network down", "unreachable"));

    await fetchCatalogWithCache();
    const result = await fetchCatalogWithCache();

    expect(result.stale).toBe(true);
    expect(result.data).toEqual([{ id: "1", title: "A" }]);
    expect(result.syncedAt).toBeInstanceOf(Date);
  });

  it("rethrows when there is no cache and the network fails", async () => {
    vi.mocked(fetchCatalog).mockRejectedValue(new ApiError("Network down", "unreachable"));

    await expect(fetchCatalogWithCache()).rejects.toThrow("Network down");
  });

  it("rethrows non-network errors even when cached data exists", async () => {
    vi.mocked(fetchCatalog)
      .mockResolvedValueOnce([{ id: "1", title: "A" }])
      .mockRejectedValueOnce(new ApiError("Forbidden", "http", 403));

    await fetchCatalogWithCache();

    await expect(fetchCatalogWithCache()).rejects.toThrow("Forbidden");
  });
});
