'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiClient } from '@/lib/api-client';

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    fullName: '', username: '', email: '', password: '', confirmPassword: '', dateOfBirth: '', agreeToTerms: false,
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setFormData({ ...formData, [e.target.name]: value });
    setError('');
  };

  const validateForm = () => {
    if (formData.password.length < 8) { setError('Password must be at least 8 characters'); return false; }
    if (formData.password !== formData.confirmPassword) { setError('Passwords do not match'); return false; }
    if (!formData.agreeToTerms) { setError('You must agree to Terms'); return false; }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!validateForm()) return;
    setLoading(true);
    try {
      const response = await apiClient.auth.register({
        fullName: formData.fullName, username: formData.username,
        email: formData.email, password: formData.password, dateOfBirth: formData.dateOfBirth,
      });
      localStorage.setItem('token', response.access_token);
      localStorage.setItem('user', JSON.stringify(response.user));
      router.push('/feed');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-voch-green-600 mb-2">VOCH</h1>
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">Create Your Account</h2>
          <p className="text-gray-600">Join the community and make your voice heard</p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (<div className="rounded-md bg-red-50 p-4"><p className="text-sm font-medium text-red-800">{error}</p></div>)}
          <div className="space-y-4">
            <div><label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <input id="fullName" name="fullName" type="text" required value={formData.fullName} onChange={handleChange}
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-voch-green-500 sm:text-sm"
                placeholder="Enter your full name" /></div>
            <div><label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">Username</label>
              <input id="username" name="username" type="text" required value={formData.username} onChange={handleChange}
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-voch-green-500 sm:text-sm"
                placeholder="Choose a unique username" /></div>
            <div><label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
              <input id="email" name="email" type="email" required value={formData.email} onChange={handleChange}
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-voch-green-500 sm:text-sm"
                placeholder="your@email.com" /></div>
            <div><label htmlFor="dateOfBirth" className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
              <input id="dateOfBirth" name="dateOfBirth" type="date" required value={formData.dateOfBirth} onChange={handleChange}
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-voch-green-500 sm:text-sm" /></div>
            <div><label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input id="password" name="password" type="password" required value={formData.password} onChange={handleChange}
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-voch-green-500 sm:text-sm"
                placeholder="Create a strong password" />
              <p className="mt-1 text-xs text-gray-500">At least 8 characters</p></div>
            <div><label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
              <input id="confirmPassword" name="confirmPassword" type="password" required value={formData.confirmPassword} onChange={handleChange}
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-voch-green-500 sm:text-sm"
                placeholder="Confirm your password" /></div>
          </div>
          <div className="flex items-start">
            <input id="agreeToTerms" name="agreeToTerms" type="checkbox" checked={formData.agreeToTerms} onChange={handleChange}
              className="h-4 w-4 text-voch-green-600 focus:ring-voch-green-500 border-gray-300 rounded mt-1" />
            <label htmlFor="agreeToTerms" className="ml-2 block text-sm text-gray-900">
              I agree to the <Link href="/terms" className="text-voch-green-600 hover:text-voch-green-500">Terms of Service</Link> and{' '}
              <Link href="/privacy" className="text-voch-green-600 hover:text-voch-green-500">Privacy Policy</Link>
            </label>
          </div>
          <button type="submit" disabled={loading}
            className="w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-voch-green-600 hover:bg-voch-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-voch-green-500 disabled:opacity-50 transition-colors">
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
          <div className="text-center">
            <p className="text-sm text-gray-600">Already have an account?{' '}
              <Link href="/login" className="font-medium text-voch-green-600 hover:text-voch-green-500">Sign in</Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
