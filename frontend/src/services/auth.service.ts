import { AuthAPI } from '../api/auth.api';

export const AuthService = {
  login: async (data: any) => {
    const token = await AuthAPI.login(data);
    localStorage.setItem("token", token as string);
    return token;
  },

  register: async (data: any) => {
    return AuthAPI.register(data);
  },

  logout: () => {
    localStorage.removeItem("token");
  },

  getToken: (): string | null => {
    return localStorage.getItem("token");
  },

  // decodifica el payload del jwt sin libreria externa
  getRole: (): string | null => {
    const token = localStorage.getItem("token");
    if (!token) return null;
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      return payload.role ?? null;
    } catch {
      return null;
    }
  },

  getUsername: (): string | null => {
    const token = localStorage.getItem("token");
    if (!token) return null;
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      return payload.sub ?? null;
    } catch {
      return null;
    }
  },

  isAdmin: (): boolean => {
    return AuthService.getRole() === "ROLE_ADMIN";
  },

  isWarehouse: (): boolean => {
    return AuthService.getRole() === "ROLE_WAREHOUSE";
  },

  isAdminOrWarehouse: (): boolean => {
    const role = AuthService.getRole();
    return role === "ROLE_ADMIN" || role === "ROLE_WAREHOUSE";
  },
};
