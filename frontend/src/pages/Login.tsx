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
    { role: 'Chief', email: 'chief@maango.com', pass: 'chief123' },
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
    <div className="min-h-screen w-screen flex items-center justify-center bg-bg-dark bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-950/20 via-bg-dark to-bg-dark px-4 py-12 sm:px-6 lg:px-8">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md space-y-8 glass-panel p-8 sm:p-10 rounded-3xl shadow-2xl relative overflow-hidden"
      >
        {/* Visual Glow */}
        <div className="absolute -top-24 -left-24 h-48 w-48 rounded-full bg-primary/20 blur-3xl" />
        <div className="absolute -bottom-24 -right-24 h-48 w-48 rounded-full bg-secondary/15 blur-3xl" />

        {/* Logo and welcome header */}
        <div className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-white shadow-xl shadow-primary/30">
            <Shield size={32} />
          </div>
          <h2 className="mt-6 text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent">
            MaAngo Tech Labs ERP
          </h2>
          <p className="mt-2 text-sm text-text-gray">
            Sign in to access your dashboard
          </p>
        </div>

        {/* Error Message banner */}
        {errorMsg && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-2 p-3.5 rounded-xl bg-red-950/40 border border-red-500/20 text-red-400 text-sm"
          >
            <AlertCircle size={18} className="shrink-0" />
            <span>{errorMsg}</span>
          </motion.div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4">
            
            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-xs font-semibold text-text-gray uppercase tracking-wider mb-2">
                Email Address
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">
                  <Mail size={18} />
                </div>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  {...register('email')}
                  className="block w-full rounded-xl border border-border-dark bg-slate-950/50 pl-10 pr-4 py-3 text-white placeholder-gray-600 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-sm"
                  placeholder="name@company.com"
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-xs text-red-400">{errors.email.message}</p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-xs font-semibold text-text-gray uppercase tracking-wider mb-2">
                Password
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">
                  <Lock size={18} />
                </div>
                <input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  {...register('password')}
                  className="block w-full rounded-xl border border-border-dark bg-slate-950/50 pl-10 pr-4 py-3 text-white placeholder-gray-600 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-sm"
                  placeholder="••••••••"
                />
              </div>
              {errors.password && (
                <p className="mt-1 text-xs text-red-400">{errors.password.message}</p>
              )}
            </div>

          </div>

          {/* Remember me & Forgot Password links */}
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-sm text-text-gray cursor-pointer select-none">
              <input
                type="checkbox"
                {...register('rememberMe')}
                className="h-4 w-4 rounded border-border-dark bg-slate-950 text-primary focus:ring-primary focus:ring-offset-bg-dark"
              />
              <span>Remember Me</span>
            </label>

            <a 
              href="#"
              onClick={(e) => { e.preventDefault(); alert("Please contact your IT administrator to reset your password."); }} 
              className="text-sm text-primary hover:text-indigo-400 transition-colors"
            >
              Forgot password?
            </a>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="group relative flex w-full justify-center rounded-xl bg-primary px-4 py-3.5 text-sm font-bold text-white hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-bg-dark disabled:opacity-50 transition-all shadow-lg shadow-primary/30"
          >
            {isSubmitting ? (
              <Loader2 className="animate-spin mr-2" size={18} />
            ) : null}
            <span>Sign In</span>
          </button>
        </form>

        {/* Easy Login Shortcuts */}
        <div className="border-t border-border-dark/60 pt-6 mt-6">
          <h4 className="text-[10px] font-bold text-text-gray uppercase tracking-wider mb-3 text-center">
            Demo Easy Login Shortcuts
          </h4>
          <div className="grid grid-cols-3 gap-2">
            {easyLogins.map((loginItem) => (
              <button
                key={loginItem.role}
                type="button"
                onClick={() => handleEasyLogin(loginItem.email, loginItem.pass)}
                className="px-2 py-1.5 rounded-lg border border-border-dark bg-slate-900/40 text-[10px] font-semibold text-gray-300 hover:border-primary hover:text-white hover:bg-slate-800 transition-all text-center cursor-pointer"
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
