const categoryDepartmentMap: Record<string, string> = {
  WATER: "Water Authority",
  STREET_LIGHT: "Municipal Services",
  ROAD: "Municipal Services",
  GARBAGE: "Municipal Services",
  ELECTRICITY: "Electricity Authority",
  TRAFFIC: "Transport Authority",
};

export const getDepartmentName = (category: string): string | null => {
  return categoryDepartmentMap[category] || null;
};