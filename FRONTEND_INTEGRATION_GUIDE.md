# Frontend Integration Guide

## Overview

This guide provides comprehensive instructions for integrating the VOCH backend APIs with the Next.js frontend. It covers authentication flows, API integration patterns, state management, and best practices for building a scalable React application.

## Table of Contents

1. [Project Structure](#project-structure)
2. [Environment Setup](#environment-setup)
3. [API Client Configuration](#api-client-configuration)
4. [Authentication Integration](#authentication-integration)
5. [State Management](#state-management)
6. [API Integration Patterns](#api-integration-patterns)
7. [Component Examples](#component-examples)
8. [Error Handling](#error-handling)
9. [Performance Optimization](#performance-optimization)
10. [Best Practices](#best-practices)

---

## Project Structure

```
frontend/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (auth)/            # Auth group routes
│   │   │   ├── login/
│   │   │   └── register/
│   │   ├── (dashboard)/       # Protected routes
│   │   │   ├── posts/
│   │   │   ├── profile/
│   │   │   └── settings/
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/            # Reusable components
│   │   ├── ui/               # Base UI components
│   │   ├── forms/            # Form components
│   │   └── layouts/          # Layout components
│   ├── lib/                  # Utility libraries
│   │   ├── api/              # API client
│   │   ├── auth/             # Auth utilities
│   │   └── utils/            # Helper functions
│   ├── hooks/                # Custom React hooks
│   ├── store/                # State management
│   ├── types/                # TypeScript types
│   └── constants/            # App constants
└── public/                   # Static assets
```

---

## Environment Setup

### Create .env.local

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_APP_NAME=VOCH
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Install Dependencies

```bash
cd frontend
npm install

# Additional packages needed
npm install axios
npm install zustand
npm install react-query
npm install zod
npm install react-hook-form
npm install @hookform/resolvers
```

---

## API Client Configuration

### Create API Client (`lib/api/client.ts`)

```typescript
import axios, { AxiosError, AxiosRequestConfig } from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// Create axios instance
export const apiClient = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Important for cookies
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    // Get token from localStorage or cookie
    const token = localStorage.getItem('access_token');
    
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };

    // Handle 401 Unauthorized
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Attempt to refresh token
        const { data } = await axios.post(
          `${API_URL}/api/auth/refresh`,
          {},
          { withCredentials: true }
        );

        // Update token
        localStorage.setItem('access_token', data.access_token);

        // Retry original request
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${data.access_token}`;
        }

        return apiClient(originalRequest);
      } catch (refreshError) {
        // Redirect to login
        if (typeof window !== 'undefined') {
          localStorage.removeItem('access_token');
          window.location.href = '/login';
        }
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
```

### API Response Types (`types/api.ts`)

```typescript
export interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  message?: string;
}

export interface ApiError {
  success: false;
  message: string;
  errors?: Record<string, string[]>;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
```

---

## Authentication Integration

### Auth Store (`store/authStore.ts`)

```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import apiClient from '@/lib/api/client';

interface User {
  id: string;
  email: string;
  username: string;
  role: 'USER' | 'MODERATOR' | 'ADMIN';
  profile?: {
    avatar?: string;
    bio?: string;
  };
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  fetchUser: () => Promise<void>;
}

interface RegisterData {
  email: string;
  username: string;
  password: string;
}

export const useAuthStore = create<AuthState>()(persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,

      login: async (email: string, password: string) => {
        set({ isLoading: true });
        try {
          const { data } = await apiClient.post('/auth/login', { email, password });
          localStorage.setItem('access_token', data.access_token);
          set({ user: data.user, isAuthenticated: true, isLoading: false });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      register: async (registerData: RegisterData) => {
        set({ isLoading: true });
        try {
          const { data } = await apiClient.post('/auth/register', registerData);
          localStorage.setItem('access_token', data.access_token);
          set({ user: data.user, isAuthenticated: true, isLoading: false });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      logout: async () => {
        try {
          await apiClient.post('/auth/logout');
          localStorage.removeItem('access_token');
          set({ user: null, isAuthenticated: false });
        } catch (error) {
          console.error('Logout error:', error);
        }
      },

      fetchUser: async () => {
        try {
          const { data } = await apiClient.get('/auth/me');
          set({ user: data, isAuthenticated: true });
        } catch (error) {
          set({ user: null, isAuthenticated: false });
        }
      },
    }),
    {
      name: 'auth-storage',
    }
  )
);
```

### Login Component (`app/(auth)/login/page.tsx`)

```typescript
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuthStore();
  const [error, setError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginForm) => {
    try {
      await login(data.email, data.password);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="max-w-md w-full space-y-8">
        <h2 className="text-3xl font-bold">Login to VOCH</h2>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label htmlFor="email">Email</label>
            <input
              {...register('email')}
              type="email"
              className="w-full p-2 border rounded"
            />
            {errors.email && (
              <p className="text-red-500 text-sm">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="password">Password</label>
            <input
              {...register('password')}
              type="password"
              className="w-full p-2 border rounded"
            />
            {errors.password && (
              <p className="text-red-500 text-sm">{errors.password.message}</p>
            )}
          </div>

          {error && <p className="text-red-500">{error}</p>}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-blue-500 text-white p-2 rounded"
          >
            {isSubmitting ? 'Logging in...' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  );
}
```

---

## API Integration Patterns

### Posts API (`lib/api/posts.ts`)

```typescript
import apiClient from './client';
import { ApiResponse, PaginatedResponse } from '@/types/api';

export interface Post {
  id: string;
  title: string;
  content: string;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  userId: string;
  user: {
    username: string;
    profile?: { avatar?: string };
  };
  createdAt: string;
  updatedAt: string;
}

export const postsApi = {
  // Get all posts
  getAll: async (params?: { page?: number; limit?: number; status?: string }) => {
    const { data } = await apiClient.get<PaginatedResponse<Post>>('/posts', { params });
    return data;
  },

  // Get single post
  getById: async (id: string) => {
    const { data } = await apiClient.get<ApiResponse<Post>>(`/posts/${id}`);
    return data.data;
  },

  // Create post
  create: async (postData: Partial<Post>) => {
    const { data } = await apiClient.post<ApiResponse<Post>>('/posts', postData);
    return data.data;
  },

  // Update post
  update: async (id: string, postData: Partial<Post>) => {
    const { data } = await apiClient.put<ApiResponse<Post>>(`/posts/${id}`, postData);
    return data.data;
  },

  // Delete post
  delete: async (id: string) => {
    await apiClient.delete(`/posts/${id}`);
  },
};
```

### Custom Hook (`hooks/usePosts.ts`)

```typescript
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { postsApi, Post } from '@/lib/api/posts';

export const usePosts = (params?: { page?: number; limit?: number }) => {
  return useQuery(['posts', params], () => postsApi.getAll(params), {
    keepPreviousData: true,
  });
};

export const usePost = (id: string) => {
  return useQuery(['post', id], () => postsApi.getById(id), {
    enabled: !!id,
  });
};

export const useCreatePost = () => {
  const queryClient = useQueryClient();
  
  return useMutation(postsApi.create, {
    onSuccess: () => {
      queryClient.invalidateQueries(['posts']);
    },
  });
};

export const useUpdatePost = () => {
  const queryClient = useQueryClient();
  
  return useMutation(
    ({ id, data }: { id: string; data: Partial<Post> }) => postsApi.update(id, data),
    {
      onSuccess: (_, variables) => {
        queryClient.invalidateQueries(['posts']);
        queryClient.invalidateQueries(['post', variables.id]);
      },
    }
  );
};

export const useDeletePost = () => {
  const queryClient = useQueryClient();
  
  return useMutation(postsApi.delete, {
    onSuccess: () => {
      queryClient.invalidateQueries(['posts']);
    },
  });
};
```

---

## Component Examples

### Posts List Component

```typescript
'use client';

import { usePosts } from '@/hooks/usePosts';

export default function PostsList() {
  const { data, isLoading, error } = usePosts({ page: 1, limit: 10 });

  if (isLoading) return <div>Loading posts...</div>;
  if (error) return <div>Error loading posts</div>;

  return (
    <div className="space-y-4">
      {data?.data.map((post) => (
        <div key={post.id} className="border p-4 rounded">
          <h3 className="text-xl font-bold">{post.title}</h3>
          <p className="text-gray-600">{post.content}</p>
          <div className="mt-2 text-sm text-gray-500">
            By {post.user.username} • {new Date(post.createdAt).toLocaleDateString()}
          </div>
        </div>
      ))}
    </div>
  );
}
```

---

## Error Handling

### Error Handler Utility

```typescript
import { AxiosError } from 'axios';
import { ApiError } from '@/types/api';

export const handleApiError = (error: unknown): string => {
  if (error instanceof AxiosError) {
    const apiError = error.response?.data as ApiError;
    return apiError?.message || 'An unexpected error occurred';
  }
  return 'An unexpected error occurred';
};

export const getFieldErrors = (error: unknown): Record<string, string> => {
  if (error instanceof AxiosError) {
    const apiError = error.response?.data as ApiError;
    if (apiError?.errors) {
      return Object.entries(apiError.errors).reduce((acc, [key, value]) => {
        acc[key] = value[0]; // Get first error message
        return acc;
      }, {} as Record<string, string>);
    }
  }
  return {};
};
```

---

## Best Practices

1. **Use React Query for Server State**
   - Automatic caching and refetching
   - Optimistic updates
   - Background synchronization

2. **Use Zustand for Client State**
   - Simple and lightweight
   - No boilerplate
   - TypeScript support

3. **Implement Proper Loading States**
   - Show skeletons during loading
   - Disable buttons during submissions
   - Handle empty states

4. **Error Boundaries**
   - Catch and display errors gracefully
   - Provide fallback UI
   - Log errors for monitoring

5. **TypeScript Everywhere**
   - Define types for all API responses
   - Use strict mode
   - Avoid `any` type

6. **Security**
   - Never store sensitive data in localStorage (only tokens)
   - Use HTTP-only cookies when possible
   - Sanitize user inputs
   - Implement CSP headers

---

## Quick Reference

### Making API Calls

```typescript
// GET request
const { data } = await apiClient.get('/posts');

// POST request
const { data } = await apiClient.post('/posts', { title, content });

// PUT request
const { data } = await apiClient.put(`/posts/${id}`, { title });

// DELETE request
await apiClient.delete(`/posts/${id}`);
```

### Using Auth Store

```typescript
const { user, isAuthenticated, login, logout } = useAuthStore();
```

### Using Query Hooks

```typescript
const { data, isLoading, error } = usePosts();
const createMutation = useCreatePost();
await createMutation.mutateAsync(postData);
```

---

**Last Updated:** November 6, 2024  
**Version:** 1.0  
**Maintainer:** VOCH Development Team
