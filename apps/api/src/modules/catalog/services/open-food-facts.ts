export interface OpenFoodFactsProduct {
  barcode: string;
  title: string;
  brand: string | null;
  category: string;
  unit: string;
  imageUrl: string | null;
}

export async function resolveOpenFoodFacts(barcode: string): Promise<OpenFoodFactsProduct | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2500); // 2.5s timeout

    const res = await fetch(`https://world.openfoodfacts.org/api/v2/product/${barcode}.json`, {
      headers: { "User-Agent": "Nook - OpenSource Household App - contact@nook.app" },
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!res.ok) return null;
    const data = (await res.json()) as { status?: number; product?: Record<string, any> };
    if (data.status !== 1 || !data.product) return null;

    const p = data.product;
    return {
      barcode,
      title: p.product_name || p.generic_name || "Unknown Product",
      brand: p.brands || null,
      category: p.categories_tags?.[0]?.replace(/^en:/, "") || "General",
      unit: p.quantity || "pcs",
      imageUrl: p.image_front_url || p.image_url || null,
    };
  } catch {
    return null; // Silent fallback on external timeout
  }
}
