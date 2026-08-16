import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Shield, Mail, Lock, Loader2, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  rememberMe: z.boolean().optional(),
});

type LoginSchemaType = z.infer<typeof loginSchema>;

export const Login: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<LoginSchemaType>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false,
    }
  });

  const easyLogins = [
    { role: 'Admin', email: 'admin@maango.com', pass: 'admin123' },
    { role: 'Manager', email: 'manager@maango.com', pass: 'manager123' },
    { role: 'Employee', email: 'employee@maango.com', pass: 'employee123' },
    { role: 'Intern', email: 'intern@maango.com', pass: 'intern123' },
    { role: 'Fellow', email: 'fellow@maango.com', pass: 'fellow123' },
  ];

  const handleEasyLogin = (email: string, pass: string) => {
    setValue('email', email);
    setValue('password', pass);
    setErrorMsg(null);
    setTimeout(() => {
      handleSubmit(onSubmit)();
    }, 100);
  };

  const onSubmit = async (data: LoginSchemaType) => {
    setErrorMsg(null);
    try {
      await login(data.email, data.password);
      if (data.rememberMe) {
        localStorage.setItem('remembered_email', data.email);
      } else {
        localStorage.removeItem('remembered_email');
      }
      navigate('/');
    } catch (err: any) {
      if (err.response?.status === 401) {
        setErrorMsg('Invalid email or password. Please try again.');
      } else {
        setErrorMsg('Something went wrong. Please check your network connection.');
      }
    }
  };

  return (
    <div className="min-h-screen w-screen flex items-center justify-center bg-bg-dark px-4 py-12 sm:px-6 lg:px-8 transition-colors duration-200">
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-md space-y-8 bg-card-dark border border-border-dark p-8 sm:p-10 rounded-[24px] shadow-sm relative overflow-hidden"
      >
        {/* Logo and welcome header */}
        <div className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-maango-gradient text-white shadow-sm">
            <Shield size={28} />
          </div>
          <h2 className="mt-6 text-2xl font-bold tracking-tight text-text-white">
            MaAngo ERP
          </h2>
          <p className="mt-2 text-sm text-text-gray">
            Sign in to access your company operating system
          </p>
        </div>

        {/* Error Message banner */}
        {errorMsg && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-2 p-3.5 rounded-xl bg-danger/10 border border-danger/20 text-danger text-xs font-medium"
          >
            <AlertCircle size={16} className="shrink-0" />
            <span>{errorMsg}</span>
          </motion.div>
        )}

        <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4">
            
            {/* Email Field */}
            <div className="space-y-1">
              <label htmlFor="email" className="block text-[10px] font-bold text-text-gray uppercase tracking-wider">
                Email Address
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-text-gray">
                  <Mail size={16} />
                </div>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  {...register('email')}
                  className="block w-full rounded-[12px] border border-border-dark bg-bg-dark pl-10 pr-4 py-2.5 text-text-white placeholder-text-gray/50 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-sm"
                  placeholder="name@company.com"
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-xs text-danger">{errors.email.message}</p>
              )}
            </div>

            {/* Password Field */}
            <div className="space-y-1">
              <label htmlFor="password" className="block text-[10px] font-bold text-text-gray uppercase tracking-wider">
                Password
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-text-gray">
                  <Lock size={16} />
                </div>
                <input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  {...register('password')}
                  className="block w-full rounded-[12px] border border-border-dark bg-bg-dark pl-10 pr-4 py-2.5 text-text-white placeholder-text-gray/50 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-sm"
                  placeholder="••••••••"
                />
              </div>
              {errors.password && (
                <p className="mt-1 text-xs text-danger">{errors.password.message}</p>
              )}
            </div>

          </div>

          {/* Remember me & Forgot Password links */}
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-xs text-text-gray cursor-pointer select-none">
              <input
                type="checkbox"
                {...register('rememberMe')}
                className="h-4 w-4 rounded border-border-dark bg-bg-dark text-primary focus:ring-primary"
              />
              <span>Remember Me</span>
            </label>

            <a 
              href="#"
              onClick={(e) => { e.preventDefault(); alert("Please contact your IT administrator to reset your password."); }} 
              className="text-xs text-primary hover:opacity-80 transition-colors font-medium"
            >
              Forgot password?
            </a>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="group relative flex w-full justify-center rounded-xl bg-primary px-4 py-3 text-sm font-bold text-white hover:opacity-90 disabled:opacity-50 transition-all cursor-pointer shadow-sm"
          >
            {isSubmitting ? (
              <Loader2 className="animate-spin mr-2" size={16} />
            ) : null}
            <span>Sign In</span>
          </button>
        </form>

        {/* Easy Login Shortcuts */}
        <div className="border-t border-border-dark pt-5 mt-5">
          <h4 className="text-[9px] font-bold text-text-gray uppercase tracking-wider mb-3 text-center">
            Demo Easy Login Shortcuts
          </h4>
          <div className="grid grid-cols-5 gap-1.5">
            {easyLogins.map((loginItem) => (
              <button
                key={loginItem.role}
                type="button"
                onClick={() => handleEasyLogin(loginItem.email, loginItem.pass)}
                className="px-1 py-2 rounded-lg border border-border-dark bg-bg-dark text-[9px] font-bold text-text-gray hover:border-primary hover:text-primary transition-all text-center cursor-pointer truncate"
              >
                {loginItem.role}
              </button>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
};
