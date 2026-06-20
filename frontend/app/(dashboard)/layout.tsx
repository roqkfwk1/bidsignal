import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { NotificationProvider } from '@/lib/context/NotificationContext';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <NotificationProvider>
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar />
        <div className="ml-[220px] flex flex-col flex-1">
          <Header />
          <main className="mt-14 p-6 flex-1 overflow-y-auto">{children}</main>
        </div>
      </div>
    </NotificationProvider>
  );
}
