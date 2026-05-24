import * as SecureStore from "expo-secure-store";

// const API_URL = "http://10.0.2.2:8000"; // Android emulator → host
export const API_BASE_URL = "http://localhost:8000"; // iOS simulator → host

const API_URL = API_BASE_URL;

let refreshInFlight: Promise<boolean> | null = null;

export async function getToken(): Promise<string | null> {
  return await SecureStore.getItemAsync("access_token");
}

export async function setTokens(access: string, refresh: string) {
  await SecureStore.setItemAsync("access_token", access);
  await SecureStore.setItemAsync("refresh_token", refresh);
}

export async function clearTokens() {
  await SecureStore.deleteItemAsync("access_token");
  await SecureStore.deleteItemAsync("refresh_token");
}

async function refreshAccessToken(): Promise<boolean> {
  if (refreshInFlight) {
    return refreshInFlight;
  }
  refreshInFlight = (async (): Promise<boolean> => {
    try {
      const rt = await SecureStore.getItemAsync("refresh_token");
      if (!rt) {
        await clearTokens();
        return false;
      }
      const res = await fetch(`${API_URL}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh_token: rt }),
      });
      if (!res.ok) {
        await clearTokens();
        return false;
      }
      const data = (await res.json()) as {
        access_token: string;
        refresh_token: string;
      };
      await setTokens(data.access_token, data.refresh_token);
      return true;
    } catch {
      return false;
    } finally {
      refreshInFlight = null;
    }
  })();
  return refreshInFlight;
}

type RequestOptions = {
  method?: string;
  body?: unknown;
  auth?: boolean;
};

export async function api<T = unknown>(
  path: string,
  options: RequestOptions = {}
): Promise<T> {
  const { method = "GET", body, auth = true } = options;

  const doFetch = () => {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    return (async () => {
      if (auth) {
        const token = await getToken();
        if (token) {
          headers["Authorization"] = `Bearer ${token}`;
        }
      }
      return fetch(`${API_URL}${path}`, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
      });
    })();
  };

  let res = await doFetch();

  if (res.status === 401 && auth && !path.startsWith("/auth/refresh")) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      res = await doFetch();
    }
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Request failed" }));
    throw new Error(err.detail || "Request failed");
  }

  return res.json();
}
