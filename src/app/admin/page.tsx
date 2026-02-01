import { redirect } from 'next/navigation';
import { getSession, isAdmin } from '@/lib/auth';
import { AdminClient } from './AdminClient';

export default async function AdminPage() {
  const session = await getSession();

  if (!session) {
    redirect('/');
  }

  if (!isAdmin(session.email)) {
    redirect('/webinar');
  }

  return <AdminClient userEmail={session.email} />;
}
