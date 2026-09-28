import axios from 'axios';

const API_GATEWAY_URL = import.meta.env.VITE_API_URL || 'http://localhost:9000/api/v1';

export const api = axios.create({
  baseURL: API_GATEWAY_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para agregar el token JWT si est\u00e1 disponible
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('jwt_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor de respuesta para manejar expiración de token
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      const token = localStorage.getItem('jwt_token');
      if (token) {
        // El usuario estaba logueado pero su token venció
        localStorage.removeItem('jwt_token');
        
        // Disparamos el evento para que los componentes (ej. Navbar) se enteren y cierren sesión visualmente
        window.dispatchEvent(new Event('storage'));
        
        // Disparamos un evento personalizado para mostrar el Toast en App.tsx o simplemente importamos toast si lo admite.
        // Mejor usar un evento de ventana para desacoplar.
        window.dispatchEvent(new CustomEvent('sessionExpired'));
      }
    }
    return Promise.reject(error);
  }
);
