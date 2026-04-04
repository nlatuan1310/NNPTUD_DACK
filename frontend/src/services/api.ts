import axios from 'axios';

const API_URL = 'http://localhost:5000/api/v1';

const commonAxios = axios.create({
  baseURL: API_URL,
});

// Service cho Category
export const categoryService = {
  getAll: () => commonAxios.get('/categories'),
  create: (data: { name: string; description?: string }) => commonAxios.post('/categories', data),
  update: (id: string, data: { name: string; description?: string }) => commonAxios.put(`/categories/${id}`, data),
  delete: (id: string) => commonAxios.delete(`/categories/${id}`),
};

// Service cho Food
export const foodService = {
  getAll: () => commonAxios.get('/foods'),
  getById: (id: string) => commonAxios.get(`/foods/${id}`),
  create: (data: any) => commonAxios.post('/foods', data),
  update: (id: string, data: any) => commonAxios.put(`/foods/${id}`, data),
  delete: (id: string) => commonAxios.delete(`/foods/${id}`),
};

// Service cho Ingredient
export const ingredientService = {
  getAll: () => commonAxios.get('/ingredients'),
  getById: (id: string) => commonAxios.get(`/ingredients/${id}`),
  create: (data: any) => commonAxios.post('/ingredients', data),
  update: (id: string, data: any) => commonAxios.put(`/ingredients/${id}`, data),
  delete: (id: string) => commonAxios.delete(`/ingredients/${id}`),
};
