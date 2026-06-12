export const MENU_ITEMS = [
  // Hot Drinks
  { name: 'Classic Espresso', category: 'hot_drinks', price: 180 },
  { name: 'Americano', category: 'hot_drinks', price: 200 },
  { name: 'Cappuccino', category: 'hot_drinks', price: 250 },
  { name: 'Latte', category: 'hot_drinks', price: 280 },
  { name: 'Flat White', category: 'hot_drinks', price: 290 },
  { name: 'Mocha', category: 'hot_drinks', price: 320 },
  { name: 'Caramel Macchiato', category: 'hot_drinks', price: 340 },
  { name: 'Hot Chocolate', category: 'hot_drinks', price: 260 },
  { name: 'Chai Latte', category: 'hot_drinks', price: 220 },
  { name: 'Matcha Latte', category: 'hot_drinks', price: 310 },

  // Cold Drinks
  { name: 'Iced Americano', category: 'cold_drinks', price: 230 },
  { name: 'Iced Latte', category: 'cold_drinks', price: 300 },
  { name: 'Cold Brew', category: 'cold_drinks', price: 280 },
  { name: 'Iced Mocha', category: 'cold_drinks', price: 340 },
  { name: 'Frappe', category: 'cold_drinks', price: 360 },
  { name: 'Mango Smoothie', category: 'cold_drinks', price: 320 },
  { name: 'Berry Blast Smoothie', category: 'cold_drinks', price: 340 },
  { name: 'Iced Matcha', category: 'cold_drinks', price: 330 },
  { name: 'Coconut Cold Brew', category: 'cold_drinks', price: 310 },
  { name: 'Vanilla Shake', category: 'cold_drinks', price: 290 },

  // Food - Breakfast
  { name: 'Avocado Toast', category: 'food_breakfast', price: 320 },
  { name: 'Croissant', category: 'food_breakfast', price: 180 },
  { name: 'Egg & Cheese Sandwich', category: 'food_breakfast', price: 250 },
  { name: 'Granola Bowl', category: 'food_breakfast', price: 290 },
  { name: 'Pancake Stack', category: 'food_breakfast', price: 350 },

  // Food - Snacks
  { name: 'Chocolate Muffin', category: 'food_snacks', price: 160 },
  { name: 'Blueberry Scone', category: 'food_snacks', price: 180 },
  { name: 'Banana Bread', category: 'food_snacks', price: 150 },
  { name: 'Cookie (Choc Chip)', category: 'food_snacks', price: 120 },
  { name: 'Brownie', category: 'food_snacks', price: 170 },

  // Food - Lunch
  { name: 'Grilled Panini', category: 'food_lunch', price: 380 },
  { name: 'Caesar Salad', category: 'food_lunch', price: 350 },
  { name: 'Pasta Bowl', category: 'food_lunch', price: 420 },
  { name: 'Chicken Wrap', category: 'food_lunch', price: 360 },
  { name: 'Quinoa Bowl', category: 'food_lunch', price: 390 },

  // Combos
  { name: 'Breakfast Combo (Coffee + Croissant)', category: 'combo', price: 380 },
  { name: 'Lunch Combo (Coffee + Panini)', category: 'combo', price: 520 },
  { name: 'Snack Combo (Coffee + Muffin)', category: 'combo', price: 350 },
  { name: 'Power Combo (Smoothie + Granola)', category: 'combo', price: 480 },
  { name: 'Date Night Combo (2 Lattes + Brownie)', category: 'combo', price: 580 },
] as const;

export type MenuItem = typeof MENU_ITEMS[number];
