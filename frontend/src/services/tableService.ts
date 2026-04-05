import apiClient from './apiClient';

export interface Table {
  id: string;
  tableNumber: number;
  floor: number;
  capacity: number;
  status: 'AVAILABLE' | 'OCCUPIED' | 'RESERVED';
}

export const tableService = {
  getAll: async (params?: any) => {
    const res = await apiClient.get('/tables', { params });
    return res.data;
  },
  getById: async (id: string) => {
    const res = await apiClient.get(`/tables/${id}`);
    return res.data;
  },
  create: async (data: Partial<Table>) => {
    const res = await apiClient.post('/tables', data);
    return res.data;
  },
  update: async (id: string, data: Partial<Table>) => {
    const res = await apiClient.put(`/tables/${id}`, data);
    return res.data;
  },
  delete: async (id: string) => {
    const res = await apiClient.delete(`/tables/${id}`);
    return res.data;
  }
};
