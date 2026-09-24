import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ShoppingCart, LogIn, ArrowLeft, AlertCircle, CheckCircle } from 'lucide-react';
import { authService } from '../services/authService';
import { Button } from '../components/ui/Button';

type AuthMode = 'login' | 'register' | 'forgot_password' | 'change_password';

export const Login = () => {
  const [mode, setMode] = useState<AuthMode>('login');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  // Mantener sesión activa con actividad
  useEffect(() => {
    let activityTimer: ReturnType<typeof setTimeout>;
    
    const resetTimer = () => {
      clearTimeout(activityTimer);
      if (authService.isAuthenticated()) {
        activityTimer = setTimeout(() => {
          authService.refreshToken().catch(() => {
            authService.logout();
            navigate('/login');
          });
        }, 15 * 60 * 1000); // 15 mins
      }
    };

    window.addEventListener('mousemove', resetTimer);
    window.addEventListener('keypress', resetTimer);
    resetTimer();

    return () => {
      window.removeEventListener('mousemove', resetTimer);
      window.removeEventListener('keypress', resetTimer);
      clearTimeout(activityTimer);
    };
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');
    
    const form = e.currentTarget;
    const formData = new FormData(form);
    const email = formData.get('email') as string || '';
    const password = formData.get('password') as string || '';
    const newPassword = formData.get('newPassword') as string || '';
    const firstName = formData.get('firstName') as string || '';
    const lastName = formData.get('lastName') as string || '';

    try {
      if (mode === 'login') {
        await authService.login(email, password);
        navigate('/');
      } else if (mode === 'register') {
        await authService.register(email, email, password, firstName, lastName);
        setSuccess('Cuenta creada exitosamente. Ahora puedes iniciar sesión.');
        setMode('login');
        form.reset();
      } else if (mode === 'forgot_password') {
        await authService.forgotPassword(email);
        setSuccess('Te hemos enviado un enlace para recuperar tu contraseña.');
        setMode('login');
        form.reset();
      } else if (mode === 'change_password') {
        await authService.changePassword(email, password, newPassword);
        setSuccess('Contraseña cambiada exitosamente.');
        setMode('login');
        form.reset();
      }
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Ocurrió un error inesperado.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      
      {/* Elementos decorativos industriales */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-[#f26522]/10 blur-3xl rounded-full"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-white/5 blur-3xl rounded-full"></div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <Link to="/" className="flex justify-center items-center gap-2 mb-6 hover:opacity-80 transition-opacity">
          <div className="bg-[#f26522] p-4 rounded-none shadow-lg shadow-[#f26522]/20">
            <ShoppingCart className="h-8 w-8 text-black" />
          </div>
        </Link>
        <h2 className="text-center text-3xl font-black text-white uppercase tracking-wider">
          {mode === 'login' && 'INGRESAR A TU CUENTA'}
          {mode === 'register' && 'CREAR NUEVA CUENTA'}
          {mode === 'forgot_password' && 'RECUPERAR CLAVE'}
          {mode === 'change_password' && 'CAMBIAR CLAVE'}
        </h2>
        <p className="mt-2 text-center text-sm font-medium text-gray-400 uppercase tracking-widest">
          {mode === 'login' && <>PORTAL OFICIAL DE <span className="font-bold text-[#f26522]">FERRESTORE</span></>}
          {mode === 'register' && 'ACCESO A BENEFICIOS EXCLUSIVOS'}
          {mode === 'forgot_password' && 'TE ENVIAREMOS LAS INSTRUCCIONES'}
          {mode === 'change_password' && 'VERIFICACIÓN DE SEGURIDAD REQUERIDA'}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="bg-white py-8 px-4 shadow-2xl sm:px-10 border-t-4 border-[#f26522] rounded-none">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-none flex items-start gap-3 text-sm font-medium">
                <AlertCircle className="h-5 w-5 flex-shrink-0" />
                <p>{error}</p>
              </div>
            )}
            
            {success && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-none flex items-start gap-3 text-sm font-medium">
                <CheckCircle className="h-5 w-5 flex-shrink-0" />
                <p>{success}</p>
              </div>
            )}

            <div>
              <label className="block text-sm font-black text-black uppercase tracking-wider">Correo Electrónico</label>
              <div className="mt-1">
                <input
                  name="email"
                  type="email"
                  required
                  className="appearance-none block w-full px-4 py-3 border-2 border-gray-200 rounded-none placeholder-gray-400 focus:outline-none focus:ring-0 focus:border-[#f26522] sm:text-sm font-bold transition-colors"
                  placeholder="CORREO@EJEMPLO.COM"
                />
              </div>
            </div>

            {mode === 'register' && (
              <>
                <div>
                  <label className="block text-sm font-black text-black uppercase tracking-wider">Nombre</label>
                  <div className="mt-1">
                    <input
                      name="firstName"
                      type="text"
                      required
                      className="appearance-none block w-full px-4 py-3 border-2 border-gray-200 rounded-none placeholder-gray-400 focus:outline-none focus:ring-0 focus:border-[#f26522] sm:text-sm font-bold transition-colors"
                      placeholder="JUAN"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-black text-black uppercase tracking-wider">Apellido</label>
                  <div className="mt-1">
                    <input
                      name="lastName"
                      type="text"
                      required
                      className="appearance-none block w-full px-4 py-3 border-2 border-gray-200 rounded-none placeholder-gray-400 focus:outline-none focus:ring-0 focus:border-[#f26522] sm:text-sm font-bold transition-colors"
                      placeholder="PÉREZ"
                    />
                  </div>
                </div>
              </>
            )}



            {(mode === 'login' || mode === 'register' || mode === 'change_password') && (
              <div>
                <label className="block text-sm font-black text-black uppercase tracking-wider">
                  {mode === 'change_password' ? 'Contraseña Actual' : 'Contraseña'}
                </label>
                <div className="mt-1">
                  <input
                    name="password"
                    type="password"
                    required
                    className="appearance-none block w-full px-4 py-3 border-2 border-gray-200 rounded-none placeholder-gray-400 focus:outline-none focus:ring-0 focus:border-[#f26522] sm:text-sm font-bold transition-colors"
                    placeholder="••••••••"
                  />
                </div>
              </div>
            )}

            {mode === 'change_password' && (
              <div>
                <label className="block text-sm font-black text-black uppercase tracking-wider">Nueva Contraseña</label>
                <div className="mt-1">
                  <input
                    name="newPassword"
                    type="password"
                    required
                    className="appearance-none block w-full px-4 py-3 border-2 border-gray-200 rounded-none placeholder-gray-400 focus:outline-none focus:ring-0 focus:border-[#f26522] sm:text-sm font-bold transition-colors"
                    placeholder="••••••••"
                  />
                </div>
              </div>
            )}

            {mode === 'login' && (
              <div className="flex items-center justify-end">
                <button 
                  type="button" 
                  onClick={() => { setMode('forgot_password'); setError(''); setSuccess(''); }} 
                  className="text-xs font-black text-gray-500 hover:text-[#f26522] uppercase tracking-wider transition-colors"
                >
                  ¿Olvidaste tu contraseña?
                </button>
              </div>
            )}

            <div className="pt-2">
              <Button 
                type="submit" 
                variant="primary" 
                className="w-full !py-3.5" 
                icon={mode === 'login' ? LogIn : undefined}
                disabled={isLoading}
              >
                {isLoading ? 'PROCESANDO...' : 
                 mode === 'login' ? 'INGRESAR AL SISTEMA' : 
                 mode === 'register' ? 'REGISTRARME AHORA' : 
                 mode === 'forgot_password' ? 'ENVIAR INSTRUCCIONES' : 
                 'CONFIRMAR CAMBIO'}
              </Button>
            </div>
          </form>

          <div className="mt-8 border-t-2 border-gray-100 pt-8 flex flex-col gap-4">
            {mode === 'login' ? (
              <div className="text-center text-sm font-bold text-gray-600">
                ¿NO TIENES CUENTA?{' '}
                <button onClick={() => { setMode('register'); setError(''); setSuccess(''); }} className="text-[#f26522] hover:text-[#d95316] uppercase transition-colors">
                  REGÍSTRATE AQUÍ
                </button>
              </div>
            ) : (
              <div className="text-center text-sm font-bold text-gray-600">
                ¿YA ESTÁS REGISTRADO?{' '}
                <button onClick={() => { setMode('login'); setError(''); setSuccess(''); }} className="text-[#f26522] hover:text-[#d95316] uppercase transition-colors">
                  INICIA SESIÓN
                </button>
              </div>
            )}
            
            {mode === 'login' && authService.isAuthenticated() && (
              <div className="text-center text-sm border-t-2 border-gray-100 pt-4">
                <button onClick={() => { setMode('change_password'); setError(''); setSuccess(''); }} className="font-bold text-gray-400 hover:text-black uppercase tracking-wider transition-colors">
                  CAMBIAR MI CONTRASEÑA
                </button>
              </div>
            )}

            <div className="mt-4 text-center">
              <Link to="/" className="inline-flex items-center gap-2 text-xs font-black text-gray-400 hover:text-white bg-black px-4 py-2 hover:bg-[#f26522] uppercase tracking-widest transition-colors">
                <ArrowLeft className="h-4 w-4" />
                VOLVER A LA TIENDA
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
