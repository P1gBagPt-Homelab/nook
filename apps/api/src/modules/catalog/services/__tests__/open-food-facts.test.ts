import { describe, it, expect, vi, afterEach } from "vitest";
import { resolveOpenFoodFacts } from "../open-food-facts";

describe("Open Food Facts Service", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should resolve a valid product from Open Food Facts API response", async () => {
    const mockResponse = {
      status: 1,
      product: {
        product_name: "Organic Oats",
        brands: "Quaker",
        categories_tags: ["en:breakfast-cereals", "en:cereals-and-potatoes"],
        quantity: "500g",
        image_front_url: "https://images.openfoodfacts.org/oats.jpg",
      },
    };

    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    } as Response);

    const result = await resolveOpenFoodFacts("737628064502");
    expect(result).toEqual({
      barcode: "737628064502",
      title: "Organic Oats",
      brand: "Quaker",
      category: "breakfast-cereals",
      unit: "500g",
      imageUrl: "https://images.openfoodfacts.org/oats.jpg",
    });
  });

  it("should return null if status is not 1", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      json: async () => ({ status: 0 }),
    } as Response);

    const result = await resolveOpenFoodFacts("0000000000000");
    expect(result).toBeNull();
  });

  it("should return null on HTTP error response", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: false,
      status: 404,
    } as Response);

    const result = await resolveOpenFoodFacts("0000000000000");
    expect(result).toBeNull();
  });

  it("should return null on network failure or abort timeout", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValueOnce(new Error("Network timeout"));

    const result = await resolveOpenFoodFacts("0000000000000");
    expect(result).toBeNull();
  });
});
