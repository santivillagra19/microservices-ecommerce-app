import { api } from './api';

export interface Banner {
  id: number;
  image: string;
  title: string;
  subtitle: string;
}

export interface Category {
  name: string;
  image: string;
  path: string;
}

export interface StoreInfo {
  address: string;
  phone: string;
  email: string;
  schedule: string;
}

// Simulamos una base de datos o CMS para contenido dinámico
export const mockBanners: Banner[] = [
  {
    id: 1,
    image: 'https://images.unsplash.com/photo-1581166397057-235af2b3c6dd?auto=format&fit=crop&w=1920&h=800&q=80',
    title: 'POTENCIA Y PRECISIÓN',
    subtitle: 'NUEVAS LÍNEAS DE HERRAMIENTAS ELÉCTRICAS',
  },
  {
    id: 2,
    image: 'https://images.unsplash.com/photo-1606676539940-12768ce0e762?auto=format&fit=crop&w=1920&h=800&q=80',
    title: 'EQUIPAMIENTO PROFESIONAL',
    subtitle: 'TODO LO QUE TU TALLER NECESITA',
  },
  {
    id: 3,
    image: 'https://images.unsplash.com/photo-1540103711724-ebf833bde8d1?auto=format&fit=crop&w=1920&h=800&q=80',
    title: 'CONSTRUYE SIN LÍMITES',
    subtitle: 'CALIDAD GARANTIZADA EN CADA HERRAMIENTA',
  }
];

export const mockCategorías: Category[] = [
  { name: 'Herramientas Eléctricas', image: 'https://images.unsplash.com/photo-1646640381839-02748ae8ddf0?auto=format&fit=crop&w=600&q=80', path: 'herramientas-electricas' },
  { name: 'Herramientas Manuales', image: 'https://images.unsplash.com/photo-1586864387967-d02ef85d93e8?auto=format&fit=crop&w=600&q=80', path: 'herramientas-manuales' },
  { name: 'Soldadura', image: 'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?auto=format&fit=crop&w=600&q=80', path: 'soldadura' }
];

export const mockStoreInfo: StoreInfo = {
  address: 'Av. Juan B. Justo 1234, CABA, Argentina',
  phone: '0800-123-FERRE',
  email: 'contacto@ferrestore.com.ar',
  schedule: 'Lunes a Viernes de 8:00 a 18:00hs. Sábados de 9:00 a 13:00hs.'
};

export const contentService = {
  getBanners: async (): Promise<Banner[]> => {
    try {
      // Intentamos traerlo del backend si existiera el endpoint
      const response = await api.get('/content/banners');
      return response.data;
    } catch (error) {
      // Si el backend no tiene este endpoint implementado, devolvemos datos mockeados inmediatamente
      return mockBanners;
    }
  },
  
  getCategorías: async (): Promise<Category[]> => {
    try {
      const response = await api.get('/content/categories');
      return response.data;
    } catch (error) {
      return mockCategorías;
    }
  },

  getStoreInfo: async (): Promise<StoreInfo> => {
    try {
      const response = await api.get('/content/store-info');
      return response.data;
    } catch (error) {
      return mockStoreInfo;
    }
  }
};
