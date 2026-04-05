import apiClient from './apiClient';

export interface Category {
  id: string;
  name: string;
  description: string | null;
  foods?: any[];
}

export const categoryService = {
  getAll: async () => {
    const res = await apiClient.get('/categories');
    return res.data;
  },
  getById: async (id: string) => {
    const res = await apiClient.get(`/categories/${id}`);
    return res.data;
  },
  create: async (data: Partial<Category>) => {
    const res = await apiClient.post('/categories', data);
    return res.data;
  },
  update: async (id: string, data: Partial<Category>) => {
    const res = await apiClient.put(`/categories/${id}`, data);
    return res.data;
  },
  delete: async (id: string) => {
    const res = await apiClient.delete(`/categories/${id}`);
    return res.data;
  }
};
