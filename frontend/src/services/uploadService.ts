import apiClient from './apiClient';

export const uploadService = {
  uploadImage: async (file: File) => {
    const formData = new FormData();
    formData.append('image', file);
    
    // axios tự động xử lý boundary Content-Type với FormData khi ta xoá Content-Type hoặc dùng multipart/form-data
    const res = await apiClient.post('/uploads', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return res.data;
  },
  deleteImage: async (publicId: string) => {
    const res = await apiClient.delete('/uploads', { data: { publicId } });
    return res.data;
  }
};
