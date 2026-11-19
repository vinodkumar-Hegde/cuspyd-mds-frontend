import { ArrowLeft, ArrowRight, KeyRound, Lock, Mail, ShieldCheck } from 'lucide-react';
import React, { useState } from 'react';
import { useAuth } from '../AuthContext';
import { authApi } from '../services/authApi';

type Mode = 'login' | 'register' | 'forgot';
type Stage = 'details' | 'code';

interface Details {
  name: string;
  email: string;
  mobile: string;
  college: string;
  state: string;
  password: string;
  newPassword: string;
  code: string;
}

const blank: Details = { name: '', email: '', mobile: '', college: '', state: '', password: '', newPassword: '', code: '' };

function message(error: unknown): string {
  return error instanceof Error ? error.message : 'Request failed. Please try again.';
}

export default function Landing() {
  const { login } = useAuth();
  const [mode, setMode] = useState<Mode>('login');
  const [stage, setStage] = useState<Stage>('details');
  const [values, setValues] = useState<Details>(blank);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  function changeMode(next: Mode) {
    setMode(next);
    setStage('details');
    setValues(v => ({ ...v, password: '', newPassword: '', code: '' }));
    setError(null);
    setNotice(null);
  }

  function input(field: keyof Details, label: string, type = 'text', required = true, autocomplete?: string) {
    return (
      <label className="block space-y-1.5" key={field}>
        <span className="block text-sm font-medium text-slate-700">{label}</span>
        <input
          className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
          type={type}
          required={required}
          autoComplete={autocomplete}
          value={values[field]}
          onChange={e => setValues(v => ({ ...v, [field]: e.target.value }))}
          minLength={type === 'password' && (field === 'newPassword' || (mode === 'register' && field === 'password')) ? 12 : undefined}
          maxLength={field === 'code' ? 6 : type === 'password' ? 128 : undefined}
          inputMode={field === 'code' ? 'numeric' : field === 'mobile' ? 'tel' : undefined}
          pattern={field === 'code' ? '[0-9]{6}' : undefined}
        />
      </label>
    );
  }

  async function sendCode() {
    if (mode === 'register') {
      return authApi.register({ name: values.name.trim(), email: values.email.trim(), password: values.password,
        mobile: values.mobile.trim(), college: values.college.trim(), state: values.state.trim() });
    }
    return authApi.requestPasswordReset(values.email.trim());
  }

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      if (mode === 'login') {
        const result = await login(values.email.trim(), values.password);
        if (result.error) throw new Error(result.error.message);
        return;
      }
      if (stage === 'details') {
        await sendCode();
        setStage('code');
        setNotice(mode === 'register' ? 'A six-digit code has been sent. Check your inbox and spam folder.' : 'If the address is eligible, a six-digit code has been sent. Check your inbox and spam folder.');
        return;
      }
      if (mode === 'register') {
        await authApi.verifyRegistration(values.email.trim(), values.code);
        setNotice('Email verified. Please sign in with your new account.');
      } else {
        await authApi.confirmPasswordReset(values.email.trim(), values.code, values.newPassword);
        setNotice('Password updated. Please sign in.');
      }
      setStage('details');
      setMode('login');
      setValues(v => ({ ...v, password: '', newPassword: '', code: '' }));
    } catch (e) {
      setError(message(e));
    } finally {
      setBusy(false);
    }
  }

  async function resend() {
    if (busy) return;
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      await sendCode();
      setNotice('If eligible, a fresh code has been sent. Only the most recent code is valid.');
    } catch (e) {
      setError(message(e));
    } finally {
      setBusy(false);
    }
  }

  const action = mode === 'login' ? 'Sign in' : mode === 'register' ? 'Create account' : 'Reset password';

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-12 flex items-center justify-center">
      <div className="w-full max-w-md space-y-6">
        <header className="text-center space-y-2">
          <img src="/logo.png" alt="Cuspyd" className="mx-auto h-14 w-auto object-contain" />
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900">MDSPrep</h1>
          <p className="text-sm text-slate-500">by Cuspyd · NEET MDS preparation</p>
        </header>
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          {mode !== 'login' && (
            <button type="button" onClick={() => changeMode('login')} className="mb-5 inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900">
              <ArrowLeft size={16} /> Back to sign in
            </button>
          )}
          <div className="mb-6 flex items-center gap-3">
            <div className="rounded-xl bg-blue-50 p-3 text-blue-700">
              {mode === 'login' ? <Lock size={20} /> : stage === 'code' ? <ShieldCheck size={20} /> : <KeyRound size={20} />}
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900">{stage === 'code' ? 'Verify your email' : action}</h2>
              <p className="text-sm text-slate-500">
                {stage === 'code' ? `Verification code sent to ${values.email}` : mode === 'login' ? 'Use your email and password' : mode === 'register' ? 'Verify your email to activate an account' : 'Recover access to your account'}
              </p>
            </div>
          </div>
          {error && <p role="alert" className="mb-5 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
          {notice && <p role="status" className="mb-5 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">{notice}</p>}
          <form onSubmit={submit} className="space-y-4">
            {stage === 'details' && mode === 'register' && (
              <>
                {input('name', 'Full name', 'text', true, 'name')}
                {input('mobile', 'Mobile number', 'tel', true, 'tel')}
                {input('college', 'College or university', 'text', true, 'organization')}
                {input('state', 'State')}
              </>
            )}
            {stage === 'details' && input('email', 'Email address', 'email', true, 'email')}
            {stage === 'details' && mode !== 'forgot' && input('password', mode === 'register' ? 'Create password (minimum 12 characters)' : 'Password', 'password', true, mode === 'register' ? 'new-password' : 'current-password')}
            {stage === 'code' && (
              <>
                {input('code', 'Six-digit email code', 'text', true, 'one-time-code')}
                {mode === 'forgot' && input('newPassword', 'New password (minimum 12 characters)', 'password', true, 'new-password')}
                <p className="text-xs text-slate-500">Codes expire after 5 minutes. Allow 60 seconds before requesting another.</p>
              </>
            )}
            <button type="submit" disabled={busy} className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3 font-medium text-white transition hover:bg-slate-800 disabled:opacity-50">
              {busy ? 'Processing…' : stage === 'code' ? mode === 'register' ? 'Verify and activate' : 'Verify and reset password' : mode === 'login' ? 'Sign in' : 'Send email code'}
              {!busy && <ArrowRight size={17} />}
            </button>
          </form>
          {stage === 'code' && (
            <div className="mt-5 flex items-center justify-between gap-3 text-sm">
              <button type="button" disabled={busy} onClick={() => { setStage('details'); setValues(v => ({ ...v, code: '' })); }} className="text-slate-600 underline disabled:opacity-50">Change email</button>
              <button type="button" disabled={busy} onClick={() => void resend()} className="font-medium text-blue-700 underline disabled:opacity-50">Resend code</button>
            </div>
          )}
          {mode === 'login' && (
            <div className="mt-6 flex flex-col gap-3 border-t border-slate-100 pt-5 text-sm">
              <button type="button" onClick={() => changeMode('forgot')} className="inline-flex items-center justify-center gap-2 font-medium text-blue-700"><Mail size={16} /> Forgot password?</button>
              <button type="button" onClick={() => changeMode('register')} className="font-medium text-slate-700">New student? Create an account</button>
            </div>
          )}
          {mode === 'register' && <p className="mt-5 text-center text-xs text-slate-500">Already registered, including migrated accounts? Use Forgot password on the sign-in screen.</p>}
        </section>
      </div>
    </main>
  );
}
