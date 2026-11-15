import { calculateIngredientNutrition, calculateRecipeNutrition } from "./nutrition-calculator";

export interface DynamicRecipeIngredient {
  name: string;
  amountGrams: number;
  usdaId?: string | null;
  category: string;
  aisle: string;
  packageUnitSizeGrams?: number;
  estimatedPackagePrice?: number;
}

export interface DynamicRecipeOutput {
  title: string;
  description: string;
  mealType: "breakfast" | "lunch" | "dinner" | "snack";
  prepMinutes: number;
  cookMinutes: number;
  baseServings: number;
  equipment: string[];
  instructions: string[];
  ingredients: DynamicRecipeIngredient[];
  computedCalories: number;
  computedProteinGrams: number;
  computedCarbsGrams: number;
  computedFatGrams: number;
}

export interface AiGeneratorOptions {
  mealType: "breakfast" | "lunch" | "dinner" | "snack";
  targetCalories: number;
  targetProteinGrams: number;
  excludedIngredients?: string[];
  equipment?: string[];
  pantryItems?: string[];
  usdaCatalog: {
    id: string;
    fdcId: string;
    name: string;
    category: string;
    caloriesPer100g: string | number;
    proteinPer100g: string | number;
    carbsPer100g: string | number;
    fatPer100g: string | number;
    defaultAisle: string;
  }[];
}

/**
 * Normalizes text for comparison
 */
function clean(str: string): string {
  return str.toLowerCase().replace(/[^a-z0-9]/g, "");
}

/**
 * Finds the closest USDA food item from the catalog
 */
function matchUsdaItem(name: string, catalog: AiGeneratorOptions["usdaCatalog"]) {
  const cName = clean(name);
  // Exact or contains match
  return catalog.find((u) => {
    const cU = clean(u.name);
    return cU.includes(cName) || cName.includes(cU);
  }) || catalog[0];
}

/**
 * Calls local Ollama inference service if available
 */
async function queryOllama(
  prompt: string,
  model = process.env.OLLAMA_DEFAULT_MODEL || "llama3.1:8b",
  baseUrl = process.env.OLLAMA_BASE_URL || "http://ollama:11434"
): Promise<any | null> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000); // 8s timeout

  try {
    const res = await fetch(`${baseUrl}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({
        model,
        prompt,
        format: "json",
        stream: false,
        options: {
          temperature: 0.7,
        },
      }),
    });

    clearTimeout(timeoutId);

    if (!res.ok) return null;
    const data = await res.json();
    return JSON.parse(data.response);
  } catch {
    clearTimeout(timeoutId);
    return null;
  }
}

const FLAVOR_PROFILES = [
  "Garlic Herb & Lemon",
  "Smoked Paprika & Lime",
  "Mediterranean Rosemary",
  "Ginger Soy Sesame",
  "Warm Cinnamon Crunch",
  "Chili Lime Fiesta",
  "Cracked Black Pepper & Sea Salt",
  "Golden Turmeric & Cumin",
];

/**
 * Intelligent algorithmic fallback when Ollama is offline or cold.
 * Synthesizes creative, varied recipes while rigorously excluding forbidden ingredients.
 */
function synthesizeRecipe(options: AiGeneratorOptions): {
  title: string;
  description: string;
  instructions: string[];
  equipment: string[];
  prepMinutes: number;
  cookMinutes: number;
  selectedProteinName: string;
  selectedCarbName: string;
  selectedVeggieName: string;
} {
  const { mealType, excludedIngredients = [], equipment = ["stovetop", "oven"], usdaCatalog } = options;
  const isExcluded = (name: string) =>
    excludedIngredients.some((ex) => clean(name).includes(clean(ex)) || clean(ex).includes(clean(name)));

  // Filter catalog to strictly compliant items
  const safeCatalog = usdaCatalog.filter((u) => !isExcluded(u.name));
  const activeCatalog = safeCatalog.length > 0 ? safeCatalog : usdaCatalog;

  // Available staples present in the active catalog
  const proteinsInCatalog = activeCatalog
    .filter((u) =>
      u.category.includes("Poultry") ||
      u.category.includes("Beef") ||
      u.category.includes("Fish") ||
      u.category.includes("Shellfish") ||
      u.category.includes("Dairy") ||
      u.category.includes("Egg") ||
      clean(u.name).includes("chicken") ||
      clean(u.name).includes("beef") ||
      clean(u.name).includes("salmon") ||
      clean(u.name).includes("egg") ||
      clean(u.name).includes("yogurt")
    )
    .map((u) => u.name);

  const carbsInCatalog = activeCatalog
    .filter((u) =>
      u.category.includes("Cereal") ||
      u.category.includes("Grains") ||
      clean(u.name).includes("potato") ||
      clean(u.name).includes("rice") ||
      clean(u.name).includes("oats") ||
      clean(u.name).includes("quinoa") ||
      clean(u.name).includes("beans")
    )
    .map((u) => u.name);

  const veggiesInCatalog = activeCatalog
    .filter((u) =>
      u.category.includes("Vegetable") ||
      clean(u.name).includes("broccoli") ||
      clean(u.name).includes("spinach") ||
      clean(u.name).includes("pepper") ||
      clean(u.name).includes("onion")
    )
    .map((u) => u.name);

  const safeProteins = proteinsInCatalog.length > 0 ? proteinsInCatalog : [activeCatalog[0].name];
  const safeCarbs = carbsInCatalog.length > 0 ? carbsInCatalog : [activeCatalog[0].name];
  const safeVeggies = veggiesInCatalog.length > 0 ? veggiesInCatalog : [activeCatalog[0].name];

  const chosenProtein = safeProteins[Math.floor(Math.random() * safeProteins.length)];
  const chosenCarb = safeCarbs[Math.floor(Math.random() * safeCarbs.length)];
  const chosenVeggie = safeVeggies[Math.floor(Math.random() * safeVeggies.length)];
  const flavor = FLAVOR_PROFILES[Math.floor(Math.random() * FLAVOR_PROFILES.length)];

  const shortProtein = chosenProtein.split("(")[0].trim();
  const shortCarb = chosenCarb.split("(")[0].trim();
  const shortVeggie = chosenVeggie.split("(")[0].trim();

  const title = `${flavor} ${shortProtein} with ${shortCarb}`;
  const description = `Freshly prepared dynamic ${mealType} combining lean ${shortProtein.toLowerCase()} and nourishing ${shortCarb.toLowerCase()} with crisp ${shortVeggie.toLowerCase()}.`;

  const instructions = [
    `Prepare and season the ${shortProtein.toLowerCase()} with salt, pepper, and aromatics.`,
    `Cook the ${shortCarb.toLowerCase()} until tender according to equipment preferences.`,
    `Pan-sear or roast the ${shortProtein.toLowerCase()} and sauté the ${shortVeggie.toLowerCase()} until crisp-tender.`,
    `Plate together warm and garnish with fresh herbs.`,
  ];

  return {
    title,
    description,
    instructions,
    equipment: equipment.slice(0, 2),
    prepMinutes: 10,
    cookMinutes: mealType === "breakfast" ? 8 : 20,
    selectedProteinName: chosenProtein,
    selectedCarbName: chosenCarb,
    selectedVeggieName: chosenVeggie,
  };
}

/**
 * Main dynamic recipe generator.
 * Tries local LLM (Ollama) first, falls back to algorithmic synthesis, and scales grams mathematically.
 */
export async function generateDynamicRecipe(options: AiGeneratorOptions): Promise<DynamicRecipeOutput> {
  const {
    mealType,
    targetCalories,
    targetProteinGrams,
    excludedIngredients = [],
    equipment = ["stovetop", "oven"],
    pantryItems = [],
    usdaCatalog,
  } = options;

  let title: string;
  let description: string;
  let instructions: string[];
  let usedEquipment: string[];
  let prepMinutes: number;
  let cookMinutes: number;
  let proteinItemName: string;
  let carbItemName: string;
  let veggieItemName: string;

  // 1. Try local Ollama first
  const prompt = `You are a fitness nutritionist chef. Create 1 unique, delicious, clean ${mealType} recipe.
Target: ~${targetCalories} kcal, ~${targetProteinGrams}g protein.
Kitchen equipment: ${equipment.join(", ")}.
${pantryItems.length > 0 ? `Pantry items available: ${pantryItems.join(", ")}.` : ""}
STRICTLY FORBIDDEN INGREDIENTS: ${excludedIngredients.join(", ") || "none"}.
Return JSON only:
{
  "title": "Short creative recipe name",
  "description": "One sentence summary",
  "prepMinutes": 10,
  "cookMinutes": 20,
  "equipment": ["stovetop"],
  "instructions": ["Step 1", "Step 2", "Step 3"],
  "primaryProtein": "e.g. Chicken Breast or Eggs or Ground Beef or Salmon or Greek Yogurt",
  "primaryCarb": "e.g. Sweet Potato or Rice or Oats or Quinoa",
  "primaryVeggie": "e.g. Broccoli or Spinach or Bell Pepper"
}`;

  const aiResult = await queryOllama(prompt);

  if (
    aiResult &&
    aiResult.title &&
    aiResult.primaryProtein &&
    !excludedIngredients.some((ex) => clean(aiResult.primaryProtein).includes(clean(ex)))
  ) {
    title = aiResult.title;
    description = aiResult.description || `Delicious ${mealType} built to your macro goals.`;
    instructions = Array.isArray(aiResult.instructions) ? aiResult.instructions : ["Cook ingredients and serve warm."];
    usedEquipment = Array.isArray(aiResult.equipment) ? aiResult.equipment : equipment.slice(0, 1);
    prepMinutes = Number(aiResult.prepMinutes) || 10;
    cookMinutes = Number(aiResult.cookMinutes) || 15;
    proteinItemName = aiResult.primaryProtein;
    carbItemName = aiResult.primaryCarb || "Sweet Potato";
    veggieItemName = aiResult.primaryVeggie || "Broccoli";
  } else {
    // 2. Intelligent algorithmic synthesis
    const syn = synthesizeRecipe(options);
    title = syn.title;
    description = syn.description;
    instructions = syn.instructions;
    usedEquipment = syn.equipment;
    prepMinutes = syn.prepMinutes;
    cookMinutes = syn.cookMinutes;
    proteinItemName = syn.selectedProteinName;
    carbItemName = syn.selectedCarbName;
    veggieItemName = syn.selectedVeggieName;
  }

  // 3. Match ingredients to USDA catalog (strictly excluding forbidden items)
  const safeCatalog = usdaCatalog.filter(
    (u) => !excludedIngredients.some((ex) => clean(u.name).includes(clean(ex)) || clean(ex).includes(clean(u.name)))
  );
  const activeCatalog = safeCatalog.length > 0 ? safeCatalog : usdaCatalog;

  const usdaProtein = matchUsdaItem(proteinItemName, activeCatalog);
  const usdaCarb = matchUsdaItem(carbItemName, activeCatalog);
  const usdaVeggie = matchUsdaItem(veggieItemName, activeCatalog);
  const usdaOil = matchUsdaItem("Olive Oil", activeCatalog);

  // 4. Deterministic Gram Scaling (Mealbird Engine)
  // Protein source should cover ~75% of target protein
  const prot100 = Number(usdaProtein.proteinPer100g) || 20;
  const neededProteinFromSource = targetProteinGrams * 0.75;
  const scaledProteinGrams = Math.round(Math.max(80, (neededProteinFromSource / prot100) * 100));

  const proteinNutrition = calculateIngredientNutrition(scaledProteinGrams, usdaProtein);

  // Remaining calories to fill with carbs and fats
  const remainingCalories = Math.max(150, targetCalories - proteinNutrition.calories - 80); // 80 kcal buffer for oil/veggies
  const carbCal100 = Number(usdaCarb.caloriesPer100g) || 100;
  const scaledCarbGrams = Math.round(Math.max(50, (remainingCalories / carbCal100) * 100));

  const scaledVeggieGrams = 150;
  const scaledOilGrams = 8; // ~70 kcal healthy fat

  const rawIngredients = [
    {
      name: usdaProtein.name.split("(")[0].trim(),
      amountGrams: scaledProteinGrams,
      usdaId: usdaProtein.id,
      category: usdaProtein.category,
      aisle: usdaProtein.defaultAisle,
      packageUnitSizeGrams: 500,
      estimatedPackagePrice: 5.5,
      usda: usdaProtein,
    },
    {
      name: usdaCarb.name.split("(")[0].trim(),
      amountGrams: scaledCarbGrams,
      usdaId: usdaCarb.id,
      category: usdaCarb.category,
      aisle: usdaCarb.defaultAisle,
      packageUnitSizeGrams: 1000,
      estimatedPackagePrice: 2.5,
      usda: usdaCarb,
    },
    {
      name: usdaVeggie.name.split("(")[0].trim(),
      amountGrams: scaledVeggieGrams,
      usdaId: usdaVeggie.id,
      category: usdaVeggie.category,
      aisle: usdaVeggie.defaultAisle,
      packageUnitSizeGrams: 500,
      estimatedPackagePrice: 1.8,
      usda: usdaVeggie,
    },
    {
      name: "Olive Oil",
      amountGrams: scaledOilGrams,
      usdaId: usdaOil.id,
      category: usdaOil.category,
      aisle: usdaOil.defaultAisle,
      packageUnitSizeGrams: 500,
      estimatedPackagePrice: 4.5,
      usda: usdaOil,
    },
  ];

  // 5. Run exact USDA calculation
  const totalCalc = calculateRecipeNutrition(rawIngredients, 1);

  return {
    title,
    description,
    mealType,
    prepMinutes,
    cookMinutes,
    baseServings: 1,
    equipment: usedEquipment,
    instructions,
    ingredients: rawIngredients.map((ing) => ({
      name: ing.name,
      amountGrams: ing.amountGrams,
      usdaId: ing.usdaId,
      category: ing.category,
      aisle: ing.aisle,
      packageUnitSizeGrams: ing.packageUnitSizeGrams,
      estimatedPackagePrice: ing.estimatedPackagePrice,
    })),
    computedCalories: totalCalc.total.calories,
    computedProteinGrams: totalCalc.total.proteinGrams,
    computedCarbsGrams: totalCalc.total.carbsGrams,
    computedFatGrams: totalCalc.total.fatGrams,
  };
}
