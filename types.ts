
export enum UserRole {
  ADMIN = 'Admin',
  MANAGER = 'Manager',
  WAITER = 'Waiter',
  CASHIER = 'CASHIER',
  STORE_KEEPER = 'Store Keeper'
}

export type Language = 'Somali' | 'English';

export type View = 'DASHBOARD' | 'POS' | 'INVENTORY' | 'STAFF' | 'REPORTS' | 'FINANCE' | 'SETTINGS' | 'CUSTOMER_BOOK';

export interface SystemConfig {
  name: string;
  description: string;
  primaryColor: string;
  secondaryColor: string;
  logoUrl: string;
  loginBgUrl: string;
  appBgUrl: string;
  currencySymbol: string;
  address: string;
  phone: string;
  accountNumbers: string;
  enabledModules: View[];
  version: string; 
  autoUpdate: boolean;
  autoPrintReceipts: boolean; 
  language: Language; // Added
  dayShiftStart: number;
  nightShiftStart: number;
  autoLogoutMinutes: number;
}

export interface Category {
  id: string;
  name: string;
}

export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  image: string;
  minStock: number;
}

export interface OrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
}

export type PaymentMethod = 'Cash' | 'EVC Plus' | 'E-Dahab' | 'Merchant' | 'Card' | 'Credit';

export interface Order {
  id: string;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  total: number;
  discount: number;
  paymentMethod: PaymentMethod;
  timestamp: Date;
  staffId: string;
  customerName?: string;
  customerId?: string;
  settlementId?: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  gender: 'Male' | 'Female';
  totalDebt: number;
  creditLimit: number;
  registrationDate: Date;
  expiryDate: Date;
  lastTransaction: Date;
  guarantorName?: string;
  guarantorPhone?: string;
  notes?: string;
}

export interface PendingOrder {
  id: string;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  total: number;
  waiterId: string;
  waiterName: string;
  timestamp: Date;
  tableNumber?: string;
}

export interface Expense {
  id: string;
  title: string;
  amount: number;
  category: string;
  date: string;
}

export interface StaffMember {
  id: string;
  name: string;
  role: UserRole;
  phone: string;
  gender: 'Male' | 'Female';
  joinDate: string;
  status: 'Active' | 'On Leave' | 'Inactive';
  pin: string;
  image?: string;
  guarantorName?: string;
  guarantorPhone?: string;
  lastLogin?: Date;
  lastLogout?: Date;
  fingerprintId?: string;
}

export interface StaffLog {
  id: string;
  staffId: string;
  staffName: string;
  type: 'LOGIN' | 'LOGOUT';
  timestamp: Date;
  shift?: 'Day' | 'Night';
  authMethod?: 'PIN' | 'FINGERPRINT' | 'SYSTEM';
}

export interface Settlement {
  id: string;
  staffId: string;
  staffName: string;
  date: string;
  totalCollected: number;
  paymentMethods: Record<string, number>;
  timestamp: Date;
  closedBy: string; // Manager ID
}
