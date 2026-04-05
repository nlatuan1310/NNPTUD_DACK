import apiClient from './apiClient';

export interface Food {
  id: string;
  name: string;
  description: string | null;
  price: number;
  imageUrl: string | null;
  categoryId: string;
  status: boolean;
  category?: {
    id: string;
    name: string;
  };
}

export const foodService = {
  getAll: async (categoryId?: string) => {
    const url = categoryId ? `/foods?categoryId=${categoryId}` : '/foods';
    const res = await apiClient.get(url);
    return res.data;
  },
  getById: async (id: string) => {
    const res = await apiClient.get(`/foods/${id}`);
    return res.data;
  },
  create: async (data: Partial<Food>) => {
    const res = await apiClient.post('/foods', data);
    return res.data;
  },
  update: async (id: string, data: Partial<Food>) => {
    const res = await apiClient.put(`/foods/${id}`, data);
    return res.data;
  },
  delete: async (id: string) => {
    const res = await apiClient.delete(`/foods/${id}`);
    return res.data;
  }
};
