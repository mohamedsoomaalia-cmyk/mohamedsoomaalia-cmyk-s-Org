
import { Product, StaffMember, UserRole, Expense } from './types';

export const CATEGORIES = ['All', 'Coffee', 'Tea', 'Snacks', 'Cold Drinks', 'Bakery'];

export const INITIAL_PRODUCTS: Product[] = [
  { id: '1', name: 'Latte', category: 'Coffee', price: 3.5, stock: 45, minStock: 10, image: 'https://picsum.photos/id/42/200/200' },
  { id: '2', name: 'Cappuccino', category: 'Coffee', price: 3.75, stock: 8, minStock: 15, image: 'https://picsum.photos/id/63/200/200' },
  { id: '3', name: 'Espresso', category: 'Coffee', price: 2.5, stock: 100, minStock: 20, image: 'https://picsum.photos/id/102/200/200' },
  { id: '4', name: 'Croissant', category: 'Bakery', price: 2.25, stock: 12, minStock: 5, image: 'https://picsum.photos/id/312/200/200' },
  { id: '5', name: 'Green Tea', category: 'Tea', price: 2.0, stock: 30, minStock: 10, image: 'https://picsum.photos/id/431/200/200' },
  { id: '6', name: 'Iced Americano', category: 'Cold Drinks', price: 3.0, stock: 50, minStock: 10, image: 'https://picsum.photos/id/425/200/200' },
  { id: '7', name: 'Blueberry Muffin', category: 'Bakery', price: 2.5, stock: 4, minStock: 8, image: 'https://picsum.photos/id/1080/200/200' },
];

export const INITIAL_STAFF: StaffMember[] = [
  { id: 'S1', name: 'Ahmed Ali', role: UserRole.ADMIN, phone: '252615000000', gender: 'Male', joinDate: '2023-01-15', status: 'Active', pin: '1234' },
  { id: 'S2', name: 'Fardowsa Jama', role: UserRole.MANAGER, phone: '252615111111', gender: 'Female', joinDate: '2023-03-10', status: 'Active', pin: '1234' },
  { id: 'S3', name: 'Muna Omar', role: UserRole.CASHIER, phone: '252615222222', gender: 'Female', joinDate: '2023-06-05', status: 'Active', pin: '1234' },
  { id: 'S4', name: 'Liban Noor', role: UserRole.WAITER, phone: '252615333333', gender: 'Male', joinDate: '2023-08-20', status: 'Active', pin: '1234' },
];

export const MOCK_EXPENSES: Expense[] = [
  { id: 'E1', title: 'Milk Supply', amount: 150, category: 'Inventory', date: '2023-10-25' },
  { id: 'E2', title: 'Rent October', amount: 1200, category: 'Bills', date: '2023-10-01' },
  { id: 'E3', title: 'Coffee Beans', amount: 300, category: 'Inventory', date: '2023-10-15' },
];
