import axios from 'axios';
import { notFound, redirect } from 'next/navigation';
import { getAccessToken } from './getAccessToken';

export const baseAPI = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL,
  timeout: 20000,
});

baseAPI.interceptors.request.use(async (config) => {
  const isServer = typeof window === 'undefined';

  if (isServer) {
    const { cookies } = await import('next/headers');
    const cookieStore = await cookies();
    const token = cookieStore.get('accessToken')?.value;
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } else {
    const token = await getAccessToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }

  return config;
});

baseAPI.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const status = error.response?.status;
    if (status) {
      if (status === 401) {
        redirect('/signin?error=unauthorized');
      }
      if (status === 404) {
        notFound();
      }
    }

    return Promise.reject(error);
  },
);
