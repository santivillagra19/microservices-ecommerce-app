import { api } from './api';

export interface ContactRequest {
  nombre: string;
  email: string;
  telefono?: string;
  empresa?: string;
  mensaje: string;
  tipoConsulta?: string;
}

export const notificationService = {
  submitContactForm: async (data: ContactRequest): Promise<string> => {
    const response = await api.post('/notification/contact', data);
    return response.data;
  }
};
