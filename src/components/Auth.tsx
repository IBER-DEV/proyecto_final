import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { Briefcase, User2, Loader2, AlertCircle, CheckCircle, Eye, EyeOff, Info } from 'lucide-react';

interface AuthError {
  message: string;
}

type FieldError = {
  error: boolean;
  message: string;
};

type FieldErrors = {
  email: FieldError;
  password: FieldError;
  fullName: FieldError;
};

export function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<'employer' | 'worker'>('employer');
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({
    email: { error: false, message: '' },
    password: { error: false, message: '' },
    fullName: { error: false, message: '' },
  });
  const { signIn, signUp } = useAuthStore();

  // Clear success message after 5 seconds
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (successMessage) {
      timer = setTimeout(() => {
        setSuccessMessage(null);
      }, 5000);
    }
    return () => clearTimeout(timer);
  }, [successMessage]);

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isValid = emailRegex.test(email);
    
    setFieldErrors(prev => ({
      ...prev,
      email: {
        error: !isValid,
        message: isValid ? '' : 'Por favor, introduce un email válido'
      }
    }));
    
    return isValid;
  };

  const validatePassword = (password: string): boolean => {
    const isValid = password.length >= 8;
    
    setFieldErrors(prev => ({
      ...prev,
      password: {
        error: !isValid,
        message: isValid ? '' : 'La contraseña debe tener al menos 8 caracteres'
      }
    }));
    
    return isValid;
  };

  const validateFullName = (name: string): boolean => {
    const isValid = name.trim().length > 0;
    
    setFieldErrors(prev => ({
      ...prev,
      fullName: {
        error: !isValid,
        message: isValid ? '' : 'Por favor, introduce tu nombre completo'
      }
    }));
    
    return isValid;
  };

  const validateForm = (): boolean => {
    const isEmailValid = validateEmail(email);
    const isPasswordValid = validatePassword(password);
    
    if (!isLogin) {
      const isFullNameValid = validateFullName(fullName);
      const doPasswordsMatch = password === confirmPassword;
      
      if (!doPasswordsMatch) {
        setFieldErrors(prev => ({
          ...prev,
          password: {
            error: true,
            message: 'Las contraseñas no coinciden'
          }
        }));
        return false;
      }
      
      return isEmailValid && isPasswordValid && isFullNameValid && doPasswordsMatch;
    }
    
    return isEmailValid && isPasswordValid;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setGlobalError(null);
    setSuccessMessage(null);
    
    if (!validateForm()) return;
    
    setIsLoading(true);
    try {
      if (isLogin) {
        await signIn(email, password);
        setSuccessMessage('Has iniciado sesión correctamente');
      } else {
        await signUp(email, password, fullName, role);
        setSuccessMessage('Cuenta creada con éxito. Ya puedes iniciar sesión.');
        setIsLogin(true);
      }
    } catch (error) {
      const authError = error as AuthError;
      setGlobalError(authError.message || 'Ocurrió un error durante la autenticación');
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setFullName('');
    setGlobalError(null);
    setSuccessMessage(null);
    setFieldErrors({
      email: { error: false, message: '' },
      password: { error: false, message: '' },
      fullName: { error: false, message: '' },
    });
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    resetForm();
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          {isLogin ? 'Inicia sesión en tu cuenta' : 'Crea tu cuenta'}
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {globalError && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start animate-fadeIn">
              <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 mr-3 flex-shrink-0" />
              <p className="text-red-800 text-sm">{globalError}</p>
            </div>
          )}

          {successMessage && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start animate-fadeIn">
              <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" />
              <p className="text-green-800 text-sm">{successMessage}</p>
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit} noValidate>
            {!isLogin && (
              <>
                <div>
                  <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">
                    Nombre Completo <span className="text-red-500">*</span>
                  </label>
                  <div className="mt-1 relative">
                    <input
                      id="fullName"
                      type="text"
                      required
                      className={`block w-full rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 ${
                        fieldErrors.fullName.error 
                          ? 'border-red-300 pr-10'
                          : fullName.length > 0 
                            ? 'border-green-300 pr-10' 
                            : 'border-gray-300'
                      }`}
                      value={fullName}
                      onChange={(e) => {
                        setFullName(e.target.value);
                        if (e.target.value) validateFullName(e.target.value);
                      }}
                      onBlur={() => validateFullName(fullName)}
                      aria-label="Nombre completo"
                      aria-invalid={fieldErrors.fullName.error}
                      aria-describedby={fieldErrors.fullName.error ? "fullName-error" : undefined}
                      disabled={isLoading}
                    />
                    {fieldErrors.fullName.error && (
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                        <AlertCircle className="h-5 w-5 text-red-500" aria-hidden="true" />
                      </div>
                    )}
                    {!fieldErrors.fullName.error && fullName.length > 0 && (
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                        <CheckCircle className="h-5 w-5 text-green-500" aria-hidden="true" />
                      </div>
                    )}
                  </div>
                  {fieldErrors.fullName.error && (
                    <p className="mt-2 text-sm text-red-600" id="fullName-error">
                      {fieldErrors.fullName.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Rol <span className="text-red-500">*</span></label>
                  <div className="mt-2 grid grid-cols-2 gap-3" role="radiogroup">
                    <button
                      type="button"
                      className={`flex items-center justify-center px-4 py-3 border rounded-md ${
                        role === 'employer'
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-300 bg-white text-gray-700'
                      } ${isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50'}`}
                      onClick={() => setRole('employer')}
                      aria-pressed={role === 'employer'}
                      aria-label="Seleccionar rol de empleador"
                      disabled={isLoading}
                    >
                      <Briefcase className="w-5 h-5 mr-2" aria-hidden="true" />
                      Empleador
                    </button>
                    <button
                      type="button"
                      className={`flex items-center justify-center px-4 py-3 border rounded-md ${
                        role === 'worker'
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-300 bg-white text-gray-700'
                      } ${isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50'}`}
                      onClick={() => setRole('worker')}
                      aria-pressed={role === 'worker'}
                      aria-label="Seleccionar rol de trabajador"
                      disabled={isLoading}
                    >
                      <User2 className="w-5 h-5 mr-2" aria-hidden="true" />
                      Trabajador
                    </button>
                  </div>
                </div>
              </>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Correo electrónico <span className="text-red-500">*</span>
              </label>
              <div className="mt-1 relative">
                <input
                  id="email"
                  type="email"
                  required
                  className={`block w-full rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 ${
                    fieldErrors.email.error 
                      ? 'border-red-300 pr-10'
                      : email.length > 0 
                        ? 'border-green-300 pr-10' 
                        : 'border-gray-300'
                  }`}
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (e.target.value) validateEmail(e.target.value);
                  }}
                  onBlur={() => validateEmail(email)}
                  aria-label="Correo electrónico"
                  aria-invalid={fieldErrors.email.error}
                  aria-describedby={fieldErrors.email.error ? "email-error" : undefined}
                  disabled={isLoading}
                  placeholder="ejemplo@correo.com"
                />
                {fieldErrors.email.error && (
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <AlertCircle className="h-5 w-5 text-red-500" aria-hidden="true" />
                  </div>
                )}
                {!fieldErrors.email.error && email.length > 0 && (
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <CheckCircle className="h-5 w-5 text-green-500" aria-hidden="true" />
                  </div>
                )}
              </div>
              {fieldErrors.email.error && (
                <p className="mt-2 text-sm text-red-600" id="email-error">
                  {fieldErrors.email.message}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Contraseña <span className="text-red-500">*</span>
              </label>
              <div className="mt-1 relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={8}
                  className={`block w-full rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 ${
                    fieldErrors.password.error 
                      ? 'border-red-300 pr-10'
                      : password.length > 0 
                        ? 'border-green-300 pr-10' 
                        : 'border-gray-300'
                  }`}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (e.target.value) validatePassword(e.target.value);
                  }}
                  onBlur={() => validatePassword(password)}
                  aria-label="Contraseña"
                  aria-invalid={fieldErrors.password.error}
                  aria-describedby="password-requirements password-error"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400" aria-hidden="true" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400" aria-hidden="true" />
                  )}
                </button>
              </div>
              {fieldErrors.password.error ? (
                <p className="mt-2 text-sm text-red-600" id="password-error">
                  {fieldErrors.password.message}
                </p>
              ) : (
                <p className="mt-2 text-xs text-gray-500" id="password-requirements">
                  <Info className="inline-block w-4 h-4 mr-1 relative" style={{ top: '2px' }} />
                  La contraseña debe tener al menos 8 caracteres
                </p>
              )}
            </div>

            {!isLogin && (
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                  Confirmar contraseña <span className="text-red-500">*</span>
                </label>
                <div className="mt-1 relative">
                  <input
                    id="confirmPassword"
                    type={showPassword ? "text" : "password"}
                    required
                    className={`block w-full rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 ${
                      password && confirmPassword && password !== confirmPassword
                        ? 'border-red-300'
                        : confirmPassword && password === confirmPassword
                          ? 'border-green-300'
                          : 'border-gray-300'
                    }`}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    aria-label="Confirmar contraseña"
                    disabled={isLoading}
                  />
                  {password && confirmPassword && password !== confirmPassword && (
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <AlertCircle className="h-5 w-5 text-red-500" aria-hidden="true" />
                    </div>
                  )}
                  {confirmPassword && password === confirmPassword && (
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <CheckCircle className="h-5 w-5 text-green-500" aria-hidden="true" />
                    </div>
                  )}
                </div>
                {password && confirmPassword && password !== confirmPassword && (
                  <p className="mt-2 text-sm text-red-600">
                    Las contraseñas no coinciden
                  </p>
                )}
              </div>
            )}

            <div>
              <button
                type="submit"
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {isLogin ? 'Iniciando sesión...' : 'Registrando...'}
                  </>
                ) : (
                  isLogin ? 'Iniciar sesión' : 'Registrarse'
                )}
              </button>
            </div>
          </form>

          <div className="mt-6">
            <button
              type="button"
              className="w-full text-center text-sm text-blue-600 hover:text-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={toggleMode}
              disabled={isLoading}
            >
              {isLogin 
                ? "¿No tienes una cuenta? Regístrate" 
                : "¿Ya tienes una cuenta? Inicia sesión"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Auth;