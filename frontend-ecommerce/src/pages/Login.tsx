import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Wrench, Pause, Play, LogIn, ArrowLeft, AlertCircle, CheckCircle } from 'lucide-react';
import { authService } from '../services/authService';
import { Button } from '../components/ui/Button';

type AuthMode = 'login' | 'register' | 'forgot_password' | 'change_password';

export const Login = () => {
  const [mode, setMode] = useState<AuthMode>('login');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoPaused, setVideoPaused] = useState(true);
  const [videoFailed, setVideoFailed] = useState(false);

  useEffect(() => {
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const syncPlayback = () => {
      const video = videoRef.current;
      if (!video) return;
      if (preference.matches) video.pause();
      else video.play().catch(() => setVideoPaused(true));
    };
    syncPlayback();
    preference.addEventListener('change', syncPlayback);
    return () => preference.removeEventListener('change', syncPlayback);
  }, []);

  const toggleVideo = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) video.play().catch(() => setVideoPaused(true));
    else video.pause();
  };

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
    <div className="service-page login-page min-h-screen bg-black flex flex-col justify-center px-4 py-12 sm:px-6 lg:px-8 relative isolate overflow-hidden">

      {!videoFailed && (
        <video
          ref={videoRef}
          src="/videos/login-workshop.mp4"
          muted
          loop
          playsInline
          preload="metadata"
          aria-hidden="true"
          onPlay={() => setVideoPaused(false)}
          onPause={() => setVideoPaused(true)}
          onError={() => setVideoFailed(true)}
          className="pointer-events-none absolute inset-0 h-full w-full object-cover brightness-[0.35] saturate-50"
        />
      )}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/30 via-black/35 to-black/75" />
      {!videoFailed && (
        <button type="button" onClick={toggleVideo} aria-label={videoPaused ? 'Reproducir video de fondo' : 'Pausar video de fondo'} className="absolute right-4 top-4 z-20 flex min-h-11 items-center gap-2 rounded-xl border border-white/20 bg-black/40 px-3 text-sm text-gray-200 backdrop-blur-md transition-colors hover:bg-black/70 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#f26522]">
          {videoPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
          <span className="hidden sm:inline">{videoPaused ? 'Reproducir fondo' : 'Pausar fondo'}</span>
        </button>
      )}
      {/* Elementos decorativos industriales */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-[#f26522]/10 blur-3xl rounded-full"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-white/5 blur-3xl rounded-full"></div>

      <div className="sm:mx-auto sm:w-full sm:max-w-lg relative z-10">
        <Link to="/" aria-label="FerreStore, volver al inicio" className="flex justify-center items-center gap-3 mb-7 hover:opacity-80 transition-opacity">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/20 bg-white/5 backdrop-blur-md">
            <Wrench className="h-5 w-5 text-[#f26522]" strokeWidth={1.5} />
          </span>
          <span className="text-2xl font-semibold tracking-tight text-white">FerreStore</span>
        </Link>
        <h2 className="text-center text-3xl font-semibold tracking-tight text-white sm:text-4xl">
          {mode === 'login' && 'Ingresar a tu cuenta'}
          {mode === 'register' && 'Crear una cuenta'}
          {mode === 'forgot_password' && 'Recuperar acceso'}
          {mode === 'change_password' && 'Cambiar contraseña'}
        </h2>
        <p className="mt-3 text-center text-base leading-relaxed text-gray-300">
          {mode === 'login' && <>Tu cuenta en <span className="font-bold text-[#f26522]">FERRESTORE</span></>}
          {mode === 'register' && 'Accedé a beneficios exclusivos'}
          {mode === 'forgot_password' && 'Te enviaremos las instrucciones a tu correo'}
          {mode === 'change_password' && 'Actualizá tus datos de acceso'}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-lg relative z-10">
        <div className="service-form bg-white py-8 px-6 sm:px-10 border rounded-2xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-start gap-3 text-sm font-medium">
                <AlertCircle className="h-5 w-5 flex-shrink-0" />
                <p>{error}</p>
              </div>
            )}

            {success && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl flex items-start gap-3 text-sm font-medium">
                <CheckCircle className="h-5 w-5 flex-shrink-0" />
                <p>{success}</p>
              </div>
            )}

            <div>
              <label htmlFor="auth-email" className="block text-base font-semibold text-gray-700">Correo Electrónico</label>
              <div className="mt-1">
                <input
                  id="auth-email"
                  name="email"
                  autoComplete="email"
                  type="email"
                  required
                  className="appearance-none block w-full px-4 py-3 border-2 border-gray-200 rounded-none placeholder-gray-400 focus:outline-none focus:ring-0 focus:border-[#f26522] text-base font-normal transition-colors"
                  placeholder="correo@ejemplo.com"
                />
              </div>
            </div>

            {mode === 'register' && (
              <>
                <div>
                  <label htmlFor="auth-firstName" className="block text-base font-semibold text-gray-700">Nombre</label>
                  <div className="mt-1">
                    <input
                      id="auth-firstName"
                  name="firstName"
                  autoComplete="given-name"
                      type="text"
                      required
                      className="appearance-none block w-full px-4 py-3 border-2 border-gray-200 rounded-none placeholder-gray-400 focus:outline-none focus:ring-0 focus:border-[#f26522] text-base font-normal transition-colors"
                      placeholder="Juan"
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="auth-lastName" className="block text-base font-semibold text-gray-700">Apellido</label>
                  <div className="mt-1">
                    <input
                      id="auth-lastName"
                  name="lastName"
                  autoComplete="family-name"
                      type="text"
                      required
                      className="appearance-none block w-full px-4 py-3 border-2 border-gray-200 rounded-none placeholder-gray-400 focus:outline-none focus:ring-0 focus:border-[#f26522] text-base font-normal transition-colors"
                      placeholder="Pérez"
                    />
                  </div>
                </div>
              </>
            )}



            {(mode === 'login' || mode === 'register' || mode === 'change_password') && (
              <div>
                <label htmlFor="auth-password" className="block text-base font-semibold text-gray-700">
                  {mode === 'change_password' ? 'Contraseña Actual' : 'Contraseña'}
                </label>
                <div className="mt-1">
                  <input
                    id="auth-password"
                  name="password"
                    autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
                    type="password"
                    required
                    className="appearance-none block w-full px-4 py-3 border-2 border-gray-200 rounded-none placeholder-gray-400 focus:outline-none focus:ring-0 focus:border-[#f26522] text-base font-normal transition-colors"
                    placeholder="••••••••"
                  />
                </div>
              </div>
            )}

            {mode === 'change_password' && (
              <div>
                <label htmlFor="auth-newPassword" className="block text-base font-semibold text-gray-700">Nueva Contraseña</label>
                <div className="mt-1">
                  <input
                    id="auth-newPassword"
                  name="newPassword"
                    autoComplete="new-password"
                    type="password"
                    required
                    className="appearance-none block w-full px-4 py-3 border-2 border-gray-200 rounded-none placeholder-gray-400 focus:outline-none focus:ring-0 focus:border-[#f26522] text-base font-normal transition-colors"
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
                  className="text-sm font-medium text-gray-600 hover:text-[#f26522] transition-colors"
                >
                  ¿Olvidaste tu contraseña?
                </button>
              </div>
            )}

            <div className="pt-2">
              <Button
                type="submit"
                variant="primary"
                className="service-submit w-full !py-3.5"
                icon={mode === 'login' ? LogIn : undefined}
                disabled={isLoading}
              >
                {isLoading ? 'Procesando...' :
                 mode === 'login' ? 'Ingresar a mi cuenta' :
                 mode === 'register' ? 'Crear mi cuenta' :
                 mode === 'forgot_password' ? 'Enviar instrucciones' :
                 'Confirmar cambio'}
              </Button>
            </div>
          </form>

          <div className="mt-8 border-t-2 border-gray-100 pt-8 flex flex-col gap-4">
            {mode === 'login' ? (
              <div className="text-center text-base font-medium text-gray-600">
                ¿No tenés cuenta?{' '}
                <button onClick={() => { setMode('register'); setError(''); setSuccess(''); }} className="text-[#f26522] hover:text-[#d95316] font-semibold transition-colors">
                  Registrate acá
                </button>
              </div>
            ) : (
              <div className="text-center text-base font-medium text-gray-600">
                ¿Ya tenés cuenta?{' '}
                <button onClick={() => { setMode('login'); setError(''); setSuccess(''); }} className="text-[#f26522] hover:text-[#d95316] font-semibold transition-colors">
                  Iniciá sesión
                </button>
              </div>
            )}

            {mode === 'login' && authService.isAuthenticated() && (
              <div className="text-center text-sm border-t-2 border-gray-100 pt-4">
                <button onClick={() => { setMode('change_password'); setError(''); setSuccess(''); }} className="font-bold text-gray-400 hover:text-black uppercase tracking-wider transition-colors">
                  Cambiar mi contraseña
                </button>
              </div>
            )}

            <div className="mt-4 text-center">
              <Link to="/" className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:border-[#f26522]/40 hover:bg-orange-50 hover:text-[#f26522]">
                <ArrowLeft className="h-4 w-4" />
                Volver a la tienda
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
