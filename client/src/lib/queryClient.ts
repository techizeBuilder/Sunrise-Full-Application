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
): Promise<any> {
  const token = localStorage.getItem('token');
  
  console.log(`API Request: ${method} ${url}`, data || '(no data)');
  console.log('Token available:', token ? 'Yes' : 'No');

  const res = await fetch(`/api${url}`, {
    method,
    headers: { 
      "Content-Type": "application/json",
      "Accept": "application/json",
      ...(token && { "Authorization": `Bearer ${token}` })
    },
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  console.log(`API Response: ${res.status} ${res.statusText}`);
  
  // Check if response is HTML (404 page) instead of JSON
  const contentType = res.headers.get('content-type');
  if (contentType && contentType.includes('text/html')) {
    console.error('Received HTML instead of JSON - likely 404 or routing issue');
    throw new Error(`404: ${method} ${url} - Route not found`);
  }

  await throwIfResNotOk(res);
  return res.json();
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const token = localStorage.getItem('token');
    
    console.log(`Query Request: GET ${queryKey[0]}`);
    console.log('Token available:', token ? 'Yes' : 'No');

    const res = await fetch(queryKey[0] as string, {
      headers: {
        "Accept": "application/json",
        ...(token && { "Authorization": `Bearer ${token}` })
      },
      credentials: "include",
    });

    console.log(`Query Response: ${res.status} ${res.statusText}`);

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    // Check if response is HTML (404 page) instead of JSON
    const contentType = res.headers.get('content-type');
    if (contentType && contentType.includes('text/html')) {
      console.error('Received HTML instead of JSON - likely 404 or routing issue');
      throw new Error(`404: GET ${queryKey[0]} - Route not found`);
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
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
