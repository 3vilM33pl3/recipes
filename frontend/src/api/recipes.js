import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
});

export async function uploadRecipe(imageFile) {
  const formData = new FormData();
  formData.append('image', imageFile);

  const response = await api.post('/recipes', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
}

export async function getRecipes(page = 1, limit = 20) {
  const response = await api.get('/recipes', {
    params: { page, limit },
  });
  return response.data;
}

export async function getRecipe(slug) {
  const response = await api.get(`/recipes/${slug}`);
  return response.data;
}

export async function deleteRecipe(slug) {
  const response = await api.delete(`/recipes/${slug}`);
  return response.data;
}
