import apiClient from './apiClient';

export interface OrderItem {
  id?: string;
  foodId: string;
  quantity: number;
  priceAtTimeOfOrder: number;
  notes?: string;
  food?: {
    name: string;
    imageUrl: string;
  };
}

export interface Order {
  id: string;
  status: 'PENDING' | 'PREPARING' | 'SERVED' | 'CANCELLED' | 'PAID';
  totalAmount: number;
  createdAt: string;
  tableId: string;
  staffId: string;
  orderItems: OrderItem[];
}

export const orderService = {
  getAll: async (params?: any) => {
    const res = await apiClient.get('/orders', { params });
    return res.data;
  },
  getById: async (id: string) => {
    const res = await apiClient.get(`/orders/${id}`);
    return res.data;
  },
  create: async (data: any) => {
    const res = await apiClient.post('/orders', data);
    return res.data;
  },
  updateStatus: async (id: string, status: string) => {
    const res = await apiClient.put(`/orders/${id}/status`, { status });
    return res.data;
  },
  addItem: async (id: string, data: { foodId: string; quantity: number; notes?: string }) => {
    const res = await apiClient.post(`/orders/${id}/items`, data);
    return res.data;
  },
  updateItem: async (itemId: string, data: { quantity?: number; notes?: string }) => {
    const res = await apiClient.put(`/orders/items/${itemId}`, data);
    return res.data;
  },
  removeItem: async (itemId: string) => {
    const res = await apiClient.delete(`/orders/items/${itemId}`);
    return res.data;
  }
};
