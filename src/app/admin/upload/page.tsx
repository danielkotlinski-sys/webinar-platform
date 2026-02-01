'use client';

import { useState, useCallback, useEffect } from 'react';
import { parseCSV } from '@/lib/csv-parser';
import type { RegisteredUser } from '@/types/database';

export default function UploadPage() {
  const [isDragging, setIsDragging] = useState(false);
  const [parsedEmails, setParsedEmails] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);
  const [registeredUsers, setRegisteredUsers] = useState<RegisteredUser[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [isClearing, setIsClearing] = useState(false);
  const [deletingUserId, setDeletingUserId] = useState<number | null>(null);

  const fetchRegisteredUsers = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/users');
      if (response.ok) {
        const data = await response.json();
        setRegisteredUsers(data.users);
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setIsLoadingUsers(false);
    }
  }, []);

  useEffect(() => {
    fetchRegisteredUsers();
  }, [fetchRegisteredUsers]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const processFile = useCallback(async (file: File) => {
    const text = await file.text();
    const emails = parseCSV(text);
    setParsedEmails(emails);
    setUploadResult(null);
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file && (file.name.endsWith('.csv') || file.type === 'text/csv')) {
      await processFile(file);
    }
  }, [processFile]);

  const handleFileInput = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await processFile(file);
    }
  }, [processFile]);

  const handleUpload = async () => {
    if (parsedEmails.length === 0) return;

    setIsUploading(true);
    setUploadResult(null);

    try {
      const response = await fetch('/api/admin/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emails: parsedEmails }),
      });

      const data = await response.json();

      if (response.ok) {
        setUploadResult({
          success: true,
          message: `Pomyślnie wgrano ${data.totalCount} emaili.`,
        });
        setParsedEmails([]);
        await fetchRegisteredUsers();
      } else {
        setUploadResult({
          success: false,
          message: data.error || 'Wgrywanie nie powiodło się',
        });
      }
    } catch (error) {
      setUploadResult({
        success: false,
        message: 'Błąd sieci. Spróbuj ponownie.',
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleClearAll = async () => {
    if (!confirm('Czy na pewno chcesz usunąć wszystkich zarejestrowanych użytkowników? Tej operacji nie można cofnąć.')) {
      return;
    }

    setIsClearing(true);

    try {
      const response = await fetch('/api/admin/upload', {
        method: 'DELETE',
      });

      if (response.ok) {
        setRegisteredUsers([]);
        setUploadResult({
          success: true,
          message: 'Wszyscy zarejestrowani użytkownicy zostali usunięci.',
        });
      }
    } catch (error) {
      setUploadResult({
        success: false,
        message: 'Nie udało się usunąć użytkowników. Spróbuj ponownie.',
      });
    } finally {
      setIsClearing(false);
    }
  };

  const handleDeleteUser = async (userId: number, email: string) => {
    if (!confirm(`Czy na pewno chcesz usunąć użytkownika ${email}?`)) {
      return;
    }

    setDeletingUserId(userId);

    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setRegisteredUsers((prev) => prev.filter((u) => u.id !== userId));
        setUploadResult({
          success: true,
          message: `Użytkownik ${email} został usunięty.`,
        });
      } else {
        const data = await response.json();
        setUploadResult({
          success: false,
          message: data.error || 'Nie udało się usunąć użytkownika.',
        });
      }
    } catch (error) {
      setUploadResult({
        success: false,
        message: 'Błąd sieci. Spróbuj ponownie.',
      });
    } finally {
      setDeletingUserId(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#e8e6e1] p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <a
            href="/admin"
            className="text-[#6b6b6b] hover:text-black transition-colors text-sm"
          >
            &larr; Powrót do panelu
          </a>
        </div>

        <h1 className="text-3xl font-serif text-black mb-2">Wgraj rejestracje</h1>
        <p className="text-[#6b6b6b] mb-8">
          Wgraj plik CSV z adresami email zarejestrowanych uczestników.
        </p>

        {/* Drop Zone */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`
            relative border-2 border-dashed rounded-lg p-12 text-center transition-all bg-white
            ${isDragging
              ? 'border-[#285943] bg-[#285943]/5'
              : 'border-[#d4d2cd] hover:border-[#285943]/50'
            }
          `}
        >
          <input
            type="file"
            accept=".csv,text/csv"
            onChange={handleFileInput}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
          <div className="pointer-events-none">
            <svg
              className="w-12 h-12 mx-auto mb-4 text-[#6b6b6b]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
            <p className="text-lg text-black mb-2">
              {isDragging ? 'Upuść plik CSV tutaj' : 'Przeciągnij i upuść plik CSV tutaj'}
            </p>
            <p className="text-sm text-[#6b6b6b]">lub kliknij, aby wybrać plik</p>
          </div>
        </div>

        {/* Parsed Emails Preview */}
        {parsedEmails.length > 0 && (
          <div className="mt-8 p-6 bg-white rounded-lg border border-[#d4d2cd]">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-serif text-black">
                Znaleziono {parsedEmails.length} {parsedEmails.length === 1 ? 'email' : 'emaili'}
              </h2>
              <div className="flex gap-3">
                <button
                  onClick={() => setParsedEmails([])}
                  className="px-4 py-2 text-sm text-[#6b6b6b] hover:text-black transition-colors"
                >
                  Anuluj
                </button>
                <button
                  onClick={handleUpload}
                  disabled={isUploading}
                  className="px-6 py-2 bg-[#285943] hover:bg-[#1e4633] text-white disabled:opacity-50 disabled:cursor-not-allowed rounded-md text-sm font-medium transition-colors"
                >
                  {isUploading ? 'Wgrywanie...' : 'Wgraj do bazy danych'}
                </button>
              </div>
            </div>
            <div className="max-h-48 overflow-y-auto">
              <div className="flex flex-wrap gap-2">
                {parsedEmails.slice(0, 50).map((email, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-[#f5f4f2] rounded-full text-sm text-[#6b6b6b]"
                  >
                    {email}
                  </span>
                ))}
                {parsedEmails.length > 50 && (
                  <span className="px-3 py-1 text-sm text-[#6b6b6b]">
                    +{parsedEmails.length - 50} więcej
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Upload Result */}
        {uploadResult && (
          <div
            className={`mt-6 p-4 rounded-lg ${
              uploadResult.success
                ? 'bg-[#285943]/10 border border-[#285943]/30 text-[#285943]'
                : 'bg-[#c45c3e]/10 border border-[#c45c3e]/30 text-[#c45c3e]'
            }`}
          >
            {uploadResult.message}
          </div>
        )}

        {/* Currently Registered Users */}
        <div className="mt-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-serif text-black">
              Zarejestrowani użytkownicy ({registeredUsers.length})
            </h2>
            {registeredUsers.length > 0 && (
              <button
                onClick={handleClearAll}
                disabled={isClearing}
                className="px-4 py-2 text-sm text-[#c45c3e] hover:bg-[#c45c3e]/10 rounded-md transition-colors disabled:opacity-50"
              >
                {isClearing ? 'Usuwanie...' : 'Usuń wszystkich'}
              </button>
            )}
          </div>

          {isLoadingUsers ? (
            <div className="text-center py-8 text-[#6b6b6b]">Ładowanie...</div>
          ) : registeredUsers.length === 0 ? (
            <div className="text-center py-12 text-[#6b6b6b] bg-white rounded-lg border border-[#d4d2cd]">
              Brak zarejestrowanych użytkowników. Wgraj plik CSV, aby rozpocząć.
            </div>
          ) : (
            <div className="bg-white rounded-lg border border-[#d4d2cd] overflow-hidden">
              <div className="max-h-96 overflow-y-auto">
                <table className="w-full">
                  <thead className="sticky top-0 bg-white">
                    <tr className="border-b border-[#d4d2cd]">
                      <th className="text-left py-3 px-4 text-sm font-medium text-[#6b6b6b]">
                        Email
                      </th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-[#6b6b6b]">
                        Dodano
                      </th>
                      <th className="w-16"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {registeredUsers.map((user) => (
                      <tr
                        key={user.id}
                        className="border-b border-[#d4d2cd] last:border-b-0 group hover:bg-[#f5f4f2]"
                      >
                        <td className="py-3 px-4 font-mono text-sm text-black">
                          {user.email}
                        </td>
                        <td className="py-3 px-4 text-right text-sm text-[#6b6b6b]">
                          {new Date(user.created_at).toLocaleDateString('pl-PL')}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => handleDeleteUser(user.id, user.email)}
                            disabled={deletingUserId === user.id}
                            className="opacity-0 group-hover:opacity-100 p-1.5 text-[#6b6b6b] hover:text-[#c45c3e] hover:bg-[#c45c3e]/10 rounded transition-all disabled:opacity-50"
                            title="Usuń użytkownika"
                          >
                            {deletingUserId === user.id ? (
                              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                              </svg>
                            ) : (
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            )}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
