import { AuthAPI } from '../api/auth.api';

export const AuthService = {
  login: async (data: any) => {
    const token = await AuthAPI.login(data);
    // guardamos el token localmente
    localStorage.setItem("token", token as string);
    return token;
  },
  register: async (data: any) => {
    return AuthAPI.register(data);
  },
  logout: () => {
    // borramos el token
    localStorage.removeItem("token");
  }
};
