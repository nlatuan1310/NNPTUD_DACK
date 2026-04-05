import apiClient from './apiClient';
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  count?: number;
}

export interface Ingredient {
  id: string;
  name: string;
  unit: string;
  stockQuantity: number;
  reorderLevel: number;
}

export const getAllIngredients = async () => {
  const response = await apiClient.get<ApiResponse<Ingredient[]>>('/ingredients');
  return response.data;
};

export const getIngredientById = async (id: string) => {
  const response = await apiClient.get<ApiResponse<Ingredient>>(`/ingredients/${id}`);
  return response.data;
};

export interface CreateIngredientData {
  name: string;
  unit: string;
  stockQuantity: number;
  reorderLevel: number;
}

export const createIngredient = async (ingredientData: CreateIngredientData) => {
  const response = await apiClient.post<ApiResponse<Ingredient>>('/ingredients', ingredientData);
  return response.data;
};

export interface UpdateIngredientData {
  name?: string;
  unit?: string;
  stockQuantity?: number;
  reorderLevel?: number;
}

export const updateIngredient = async (id: string, ingredientData: UpdateIngredientData) => {
  const response = await apiClient.put<ApiResponse<Ingredient>>(`/ingredients/${id}`, ingredientData);
  return response.data;
};

export const deleteIngredient = async (id: string) => {
  const response = await apiClient.delete<ApiResponse<null>>(`/ingredients/${id}`);
  return response.data;
};
