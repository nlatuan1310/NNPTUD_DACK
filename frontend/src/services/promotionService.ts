import apiClient from './apiClient';

export interface Promotion {
  id: string;
  code: string;
  discountPercentage: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
}

export const promotionService = {
  getAll: async () => {
    const res = await apiClient.get('/promotions');
    return res.data;
  },
  create: async (data: Partial<Promotion>) => {
    const res = await apiClient.post('/promotions', data);
    return res.data;
  },
  update: async (id: string, data: Partial<Promotion>) => {
    const res = await apiClient.put(`/promotions/${id}`, data);
    return res.data;
  },
  delete: async (id: string) => {
    const res = await apiClient.delete(`/promotions/${id}`);
    return res.data;
  }
};
