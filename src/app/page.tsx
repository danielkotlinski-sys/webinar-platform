'use client';

import { useState } from 'react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim()) {
      setError('Podaj swój adres email');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          password: password || undefined,
        }),
        credentials: 'include',
      });

      const data = await response.json();

      if (data.requiresPassword) {
        setShowPassword(true);
        setError('');
        return;
      }

      if (response.ok && data.success) {
        window.location.href = data.redirectTo;
      } else {
        setError(data.error || 'Logowanie nie powiodło się. Spróbuj ponownie.');
      }
    } catch (err) {
      setError('Błąd sieci. Sprawdź połączenie internetowe.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#e8e6e1] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-serif mb-3 text-black">Dołącz do webinaru</h1>
          <p className="text-[#6b6b6b]">
            Wpisz email, na który została wysłana rejestracja.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="sr-only">
              Adres email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError('');
                setShowPassword(false);
                setPassword('');
              }}
              placeholder="twoj@email.pl"
              autoComplete="email"
              autoFocus
              disabled={isLoading}
              className={`
                w-full px-5 py-4 bg-white border rounded-lg
                text-lg text-black placeholder:text-[#6b6b6b]
                focus:outline-none focus:ring-2 focus:ring-[#285943] focus:border-transparent
                transition-all
                ${error && !showPassword ? 'border-[#c45c3e]' : 'border-[#d4d2cd]'}
                ${isLoading ? 'opacity-60 cursor-not-allowed' : ''}
              `}
            />
          </div>

          {showPassword && (
            <div>
              <label htmlFor="password" className="sr-only">
                Hasło administratora
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError('');
                }}
                placeholder="Hasło administratora"
                autoComplete="current-password"
                autoFocus
                disabled={isLoading}
                className={`
                  w-full px-5 py-4 bg-white border rounded-lg
                  text-lg text-black placeholder:text-[#6b6b6b]
                  focus:outline-none focus:ring-2 focus:ring-[#285943] focus:border-transparent
                  transition-all
                  ${error ? 'border-[#c45c3e]' : 'border-[#d4d2cd]'}
                  ${isLoading ? 'opacity-60 cursor-not-allowed' : ''}
                `}
              />
            </div>
          )}

          {error && (
            <div className="px-4 py-3 rounded-lg bg-[#c45c3e]/10 border border-[#c45c3e]/30">
              <p className="text-[#c45c3e] text-sm">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className={`
              w-full py-4 rounded-lg font-medium text-lg text-white
              bg-[#285943] hover:bg-[#1e4633]
              focus:outline-none focus:ring-2 focus:ring-[#285943] focus:ring-offset-2 focus:ring-offset-[#e8e6e1]
              transition-colors
              ${isLoading ? 'opacity-60 cursor-not-allowed' : ''}
            `}
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <svg
                  className="animate-spin h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Weryfikacja...
              </span>
            ) : showPassword ? (
              'Zaloguj jako administrator'
            ) : (
              'Wejdź na webinar'
            )}
          </button>
        </form>

        <p className="mt-8 text-center text-sm text-[#6b6b6b]">
          Dostęp mają tylko zarejestrowani uczestnicy.
          <br />
          Skontaktuj się z organizatorem, jeśli nie możesz się zalogować.
        </p>
      </div>
    </div>
  );
}
