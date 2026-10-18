import { Gem, Heart, Landmark, Mountain, Palmtree, UtensilsCrossed, Wallet } from 'lucide-react'

// The ids must match the keys in VIBE_GUIDES in backend/app/prompts/templates.py
export const VIBES = [
  { id: 'cultural', label: 'Cultural', icon: Landmark, hint: 'History, heritage, local life' },
  { id: 'relaxed', label: 'Relaxed', icon: Palmtree, hint: 'Slow days and scenic calm' },
  { id: 'adventure', label: 'Adventure', icon: Mountain, hint: 'Outdoors and thrills' },
  { id: 'luxury', label: 'Luxury', icon: Gem, hint: 'Premium and exclusive' },
  { id: 'budget', label: 'Budget', icon: Wallet, hint: 'Free and low-cost finds' },
  { id: 'romantic', label: 'Romantic', icon: Heart, hint: 'Sunsets and quiet dinners' },
  { id: 'foodie', label: 'Foodie', icon: UtensilsCrossed, hint: 'Street food to fine dining' },
]

export const PACES = [
  { id: 'relaxed', label: 'Relaxed', hint: '2-3 activities a day' },
  { id: 'moderate', label: 'Moderate', hint: '3-4 activities a day' },
  { id: 'fast', label: 'Fast', hint: '4-5 activities a day' },
]

export const INTERESTS = [
  'beaches', 'food', 'culture', 'history', 'nature',
  'adventure', 'shopping', 'nightlife', 'wellness', 'photography',
]

export const DIETARY = ['vegetarian', 'vegan', 'jain', 'halal', 'gluten-free', 'lactose-free']