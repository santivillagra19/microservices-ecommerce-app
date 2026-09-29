import axios from 'axios';
import { api } from './api';

// Using Vite proxy to bypass CORS
const KEYCLOAK_URL = '/auth';
const REALM = 'ecommerce-realm';
const CLIENT_ID = 'admin-cli';

export const authService = {
  login: async (username: string, password: string):Promise<string> => {
    const params = new URLSearchParams();
    params.append('grant_type', 'password');
    params.append('client_id', CLIENT_ID);
    params.append('username', username);
    params.append('password', password);
    params.append('scope', 'openid');
    

    try {
      const response = await axios.post(
        `${KEYCLOAK_URL}/realms/${REALM}/protocol/openid-connect/token`,
        params,
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      );

      const token = response.data.access_token;
      localStorage.setItem('jwt_token', token);
      return token;
    } catch (error: any) {
      if (error.response) {
        if (error.response.status === 401) {
          throw new Error("Usuario y/o contraseña incorrectos");
        }
        if (error.response.status >= 500) {
          throw new Error("En este momento el servidor no está disponible");
        }
      } else if (error.request) {
        throw new Error("En este momento el servidor no está disponible");
      }
      throw error;
    }
  },
  
  register: async (username: string, email: string, password: string, firstName: string, lastName: string):Promise<boolean> => {
    try {
      await api.post('/users/register', { username, email, password, firstName, lastName });
      return true;
    } catch (error: any) {
      if (error.response) {
        if (error.response.status === 409) {
          throw new Error("Usuario ya registrado, inicie sesión.");
        }
        if (error.response.status >= 500) {
          throw new Error("En este momento el servidor no está disponible");
        }
      } else if (error.request) {
        throw new Error("En este momento el servidor no está disponible");
      }
      throw error;
    }
  },

  forgotPassword: async (email: string):Promise<boolean> => {
    // Simulación de email de recuperación
    return new Promise((resolve) => setTimeout(() => resolve(true), 800));
  },

  changePassword: async (username: string, oldPassword: string, newPassword: string):Promise<boolean> => {
    // Requiere validar oldPassword primero (re-autenticación implícita)
    await authService.login(username, oldPassword);
    // Simulación de cambio de contraseña
    return new Promise((resolve) => setTimeout(() => resolve(true), 800));
  },

  refreshToken: async ():Promise<string> => {
    // Simulación de refresco de token para mantener sesión activa
    const currentToken = localStorage.getItem('jwt_token');
    if (!currentToken) throw new Error('No hay sesión activa');
    
    // Aquí iría el endpoint real de refresh token de Keycloak
    const newToken = currentToken + '_refreshed';
    localStorage.setItem('jwt_token', newToken);
    return newToken;
  },

  logout: () => {
    localStorage.removeItem('jwt_token');
    // We can also clear cart here if imported, but we don't have the import here. 
    // Wait, I will just leave the Navbar one which handles explicit user interaction.
  },
  
  getToken: () => {
    return localStorage.getItem('jwt_token') || 
           localStorage.getItem('token') || 
           localStorage.getItem('access_token') ||
           sessionStorage.getItem('jwt_token') ||
           sessionStorage.getItem('token') ||
           sessionStorage.getItem('access_token');
  },

  isAuthenticated: () => {
    return !!authService.getToken();
  },

  hasRole: (role: string): boolean => {
    const rawToken = authService.getToken();
    if (!rawToken) {
      return false;
    }
    try {
      // Limpiar posibles comillas, prefijo Bearer o espacios
      const cleanToken = rawToken.replace(/^Bearer\s+/i, '').replace(/^"|"$/g, '').trim();
      const parts = cleanToken.split('.');
      if (parts.length < 2) return false;

      // Base64url a Base64 estándar con padding requerido por atob
      let base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
      const pad = base64.length % 4;
      if (pad) {
        base64 += '='.repeat(4 - pad);
      }

      let decodedJson: string;
      const rawDecoded = window.atob(base64);
      try {
        decodedJson = decodeURIComponent(
          rawDecoded
            .split('')
            .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
            .join('')
        );
      } catch {
        decodedJson = rawDecoded;
      }
      
      // Token JWT decodificado en una variable
      const decodedToken = JSON.parse(decodedJson);

      // Recopilar todos los roles disponibles en el payload del token dinámico
      const allRoles: string[] = [];

      // 1. Roles de Realm en Keycloak (realm_access.roles)
      if (Array.isArray(decodedToken.realm_access?.roles)) {
        allRoles.push(...decodedToken.realm_access.roles);
      }

      // 2. Roles de Cliente en Keycloak (resource_access.*.roles)
      if (decodedToken.resource_access && typeof decodedToken.resource_access === 'object') {
        Object.values(decodedToken.resource_access).forEach((client: any) => {
          if (Array.isArray(client?.roles)) {
            allRoles.push(...client.roles);
          }
        });
      }

      // 3. Claims directos de roles o authorities (Spring Security / JWT estándar)
      if (Array.isArray(decodedToken.roles)) {
        allRoles.push(...decodedToken.roles);
      }
      if (Array.isArray(decodedToken.authorities)) {
        decodedToken.authorities.forEach((a: any) => {
          if (typeof a === 'string') allRoles.push(a);
          else if (a && typeof a.authority === 'string') allRoles.push(a.authority);
        });
      }
      if (typeof decodedToken.role === 'string') {
        allRoles.push(decodedToken.role);
      }
      if (Array.isArray(decodedToken.user_roles)) {
        allRoles.push(...decodedToken.user_roles);
      }
      if (typeof decodedToken.scope === 'string') {
        allRoles.push(...decodedToken.scope.split(' '));
      }

      

      // Comparación normalizada: insensible a mayúsculas/minúsculas y tolerando prefijo 'ROLE_'
      const target = role.toUpperCase().replace(/^ROLE_/, '').trim();
      const hasMatch = allRoles.some((r) => {
        if (typeof r !== 'string') return false;
        const normalized = r.toUpperCase().replace(/^ROLE_/, '').trim();
        return normalized === target;
      });


      return hasMatch;
    } catch (e) {
      return false;
    }
  }
};

if (typeof window !== 'undefined') {
  (window as any).authService = authService;
}






