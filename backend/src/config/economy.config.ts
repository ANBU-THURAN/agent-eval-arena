export const GOODS = [
  {
    id: 'good-rice',
    name: 'Rice',
    unit: 'kg',
    referencePrice: 100,
  },
  {
    id: 'good-wheat',
    name: 'Wheat',
    unit: 'kg',
    referencePrice: 80,
  },
  {
    id: 'good-corn',
    name: 'Corn',
    unit: 'kg',
    referencePrice: 70,
  },
  {
    id: 'good-lentils',
    name: 'Lentils',
    unit: 'kg',
    referencePrice: 120,
  },
  {
    id: 'good-chickpeas',
    name: 'Chickpeas',
    unit: 'kg',
    referencePrice: 110,
  },
  {
    id: 'good-soybeans',
    name: 'Soybeans',
    unit: 'kg',
    referencePrice: 90,
  },
  {
    id: 'good-oil',
    name: 'Oil',
    unit: 'litre',
    referencePrice: 150,
  },
  {
    id: 'good-ghee',
    name: 'Ghee',
    unit: 'kg',
    referencePrice: 500,
  },
  {
    id: 'good-butter',
    name: 'Butter',
    unit: 'kg',
    referencePrice: 400,
  },
  {
    id: 'good-sugar',
    name: 'Sugar',
    unit: 'kg',
    referencePrice: 60,
  },
  {
    id: 'good-honey',
    name: 'Honey',
    unit: 'kg',
    referencePrice: 300,
  },
  {
    id: 'good-salt',
    name: 'Salt',
    unit: 'kg',
    referencePrice: 20,
  },
  {
    id: 'good-tea',
    name: 'Tea',
    unit: 'kg',
    referencePrice: 250,
  },
  {
    id: 'good-coffee',
    name: 'Coffee',
    unit: 'kg',
    referencePrice: 400,
  },
  {
    id: 'good-flour',
    name: 'Flour',
    unit: 'kg',
    referencePrice: 50,
  },
] as const;

export const INITIAL_CASH = 10000; // ₹10,000

export const INITIAL_INVENTORY = {
  Rice: 45,
  Wheat: 40,
  Corn: 35,
  Lentils: 30,
  Chickpeas: 25,
  Soybeans: 30,
  Oil: 20,
  Ghee: 5,
  Butter: 5,
  Sugar: 40,
  Honey: 5,
  Salt: 50,
  Tea: 10,
  Coffee: 5,
  Flour: 50,
} as const;

// Calculate total starting wealth
export const STARTING_WEALTH =
  INITIAL_CASH +
  GOODS.reduce((total, good) => {
    const quantity = INITIAL_INVENTORY[good.name as keyof typeof INITIAL_INVENTORY];
    return total + (quantity * good.referencePrice);
  }, 0);
