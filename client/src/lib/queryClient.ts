import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const res = await fetch(url, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const res = await fetch(queryKey.join("/") as string, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes instead of Infinity for better data freshness
      gcTime: 10 * 60 * 1000, // 10 minutes garbage collection
      retry: 1, // Allow one retry for network issues
    },
    mutations: {
      retry: 1, // Allow one retry for mutations
    },
  },
});

// Optimized query keys for better cache management
export const queryKeys = {
  users: {
    all: ['api', 'admin', 'users'] as const,
    byId: (id: string) => ['api', 'user', id] as const,
    profile: (id: string) => ['api', 'profile', id] as const,
  },
  businesses: {
    all: ['api', 'admin', 'businesses'] as const,
    byUser: (userId: string) => ['api', 'user', userId, 'businesses'] as const,
    allByUser: (userId: string) => ['api', 'user', userId, 'all-businesses'] as const,
    byId: (id: string) => ['api', 'businesses', id] as const,
  },
  affiliates: {
    main: ['api', 'affiliates', 'main'] as const,
    secondary: ['api', 'affiliates', 'secondary'] as const,
    userSecondary: (userId: string) => ['api', 'affiliates', 'user', userId] as const,
  },
  collaborations: {
    invitations: (userId: string) => ['api', 'collaborations', 'invitations', userId] as const,
    businesses: (userId: string) => ['api', 'collaborations', 'user', userId, 'businesses'] as const,
  },
} as const;
