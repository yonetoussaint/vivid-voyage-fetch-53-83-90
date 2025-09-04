
import { useState } from 'react';

export interface Product {
  id: string; // Changed from number to string for compatibility with ProductProps
  name: string;
  price: number;
  category: string;
  imageUrl: string;
  image: string;
  rating: number;
  reviewCount: number;
}

const mockProducts: Product[] = [
  {
    id: "1", // Changed from numeric 1 to string "1"
    name: "Wireless Headphones",
    price: 89.99,
    category: "Electronics",
    imageUrl: "https://picsum.photos/seed/headphones/300/300",
    image: "https://picsum.photos/seed/headphones/300/300",
    rating: 4.5,
    reviewCount: 120
  },
  {
    id: "2", // Changed from numeric 2 to string "2"
    name: "Smart Watch",
    price: 199.99,
    category: "Electronics",
    imageUrl: "https://picsum.photos/seed/smartwatch/300/300",
    image: "https://picsum.photos/seed/smartwatch/300/300",
    rating: 4.7,
    reviewCount: 95
  },
  {
    id: "3", // Changed from numeric 3 to string "3"
    name: "Portable Speaker",
    price: 49.99,
    category: "Electronics",
    imageUrl: "https://picsum.photos/seed/speaker/300/300",
    image: "https://picsum.photos/seed/speaker/300/300",
    rating: 4.3,
    reviewCount: 78
  },
  {
    id: "4", // Changed from numeric 4 to string "4"
    name: "Running Shoes",
    price: 79.99,
    category: "Sports",
    imageUrl: "https://picsum.photos/seed/shoes/300/300",
    image: "https://picsum.photos/seed/shoes/300/300",
    rating: 4.8,
    reviewCount: 150
  },
  {
    id: "5", // Changed from numeric 5 to string "5"
    name: "Coffee Maker",
    price: 129.99,
    category: "Home",
    imageUrl: "https://picsum.photos/seed/coffeemaker/300/300",
    image: "https://picsum.photos/seed/coffeemaker/300/300",
    rating: 4.6,
    reviewCount: 89
  },
  {
    id: "6", // Changed from numeric 6 to string "6"
    name: "Backpack",
    price: 39.99,
    category: "Fashion",
    imageUrl: "https://picsum.photos/seed/backpack/300/300",
    image: "https://picsum.photos/seed/backpack/300/300",
    rating: 4.4,
    reviewCount: 65
  }
];

export const useProducts = () => {
  const [data] = useState<Product[]>(mockProducts);
  const [isLoading] = useState(false);
  const [error] = useState<Error | null>(null);

  return {
    data,
    isLoading,
    error
  };
};
