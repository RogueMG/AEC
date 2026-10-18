import type { Brand } from "./types";

const words = ["no", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine"];

// Numbers under ten in words, the rest as figures.
export function countWord(n: number): string {
  return n < words.length ? words[n] : String(n);
}

export function dealerBrands(brands: Brand[]): Brand[] {
  return brands.filter((brand) => !brand.inHouse);
}

// "Stanley, Kobe, CP Grat-Ex" plus how many are left, for sentences like "… and seven more".
export function leadBrands(dealers: Brand[], lead = 3): { names: string; rest: number } {
  return {
    names: dealers
      .slice(0, lead)
      .map((b) => b.name)
      .join(", "),
    rest: Math.max(0, dealers.length - lead),
  };
}
