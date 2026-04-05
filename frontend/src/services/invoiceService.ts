import apiClient from './apiClient';

export interface Invoice {
  id: string;
  orderId: string;
  finalAmount: number;
  paymentMethod: string;
  paymentStatus: 'UNPAID' | 'PAID' | 'REFUNDED';
  promotionId?: string | null;
  createdAt: string;
}

export const invoiceService = {
  getAll: async (params?: any) => {
    const res = await apiClient.get('/invoices', { params });
    return res.data;
  },
  getById: async (id: string) => {
    const res = await apiClient.get(`/invoices/${id}`);
    return res.data;
  },
  checkout: async (data: { orderId: string; promotionCode?: string; paymentMethod: string }) => {
    const res = await apiClient.post('/invoices/checkout', data);
    return res.data;
  },
  pay: async (id: string) => {
    const res = await apiClient.put(`/invoices/${id}/pay`, {});
    return res.data;
  }
};
