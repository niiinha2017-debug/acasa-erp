const API_URL = import.meta.env.VITE_API_URL;

export const api = {
  get: async (endpoint) => {
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    return response.json();
  },

  post: async (endpoint, body) => {
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    return response.json();
  },
};
