export const CITIES = [
  { name: 'Mumbai', weight: 0.25, stores: ['Bandra', 'Andheri', 'Colaba', 'Powai'] },
  { name: 'Delhi', weight: 0.20, stores: ['Connaught Place', 'Hauz Khas', 'Saket', 'Khan Market'] },
  { name: 'Bangalore', weight: 0.20, stores: ['Koramangala', 'Indiranagar', 'MG Road', 'Whitefield'] },
  { name: 'Pune', weight: 0.12, stores: ['Koregaon Park', 'FC Road', 'Viman Nagar'] },
  { name: 'Hyderabad', weight: 0.12, stores: ['Jubilee Hills', 'Banjara Hills', 'Hitech City'] },
  { name: 'Chennai', weight: 0.11, stores: ['T Nagar', 'Anna Nagar', 'Adyar'] },
] as const;

export function pickCity(): { city: string; store: string } {
  const rand = Math.random();
  let cumulative = 0;
  for (const c of CITIES) {
    cumulative += c.weight;
    if (rand <= cumulative) {
      const store = c.stores[Math.floor(Math.random() * c.stores.length)];
      return { city: c.name, store: `${c.name} - ${store}` };
    }
  }
  const last = CITIES[CITIES.length - 1];
  return { city: last.name, store: `${last.name} - ${last.stores[0]}` };
}
