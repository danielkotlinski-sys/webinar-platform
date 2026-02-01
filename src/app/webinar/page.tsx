import { redirect } from 'next/navigation';
import { getSession, isAdmin } from '@/lib/auth';
import { WebinarClient } from './WebinarClient';

export default async function WebinarPage() {
  const session = await getSession();

  if (!session) {
    redirect('/');
  }

  // Redirect admin to admin panel
  if (isAdmin(session.email)) {
    redirect('/admin');
  }

  return <WebinarClient userEmail={session.email} />;
}
