export type InventoryProduct = {
  id: string; name: string; category: string; subcategory: string; stage: string;
  price: number; cost: number; stock: number; minimum: number; published: boolean;
  images: string[]; platforms: string[]; power: string; diameter: string;
  material: string; description: string; revision: number;
};
