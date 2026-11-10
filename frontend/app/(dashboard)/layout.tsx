import { TopNav } from '@/components/layout/TopNav';
import { NotificationProvider } from '@/lib/context/NotificationContext';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <NotificationProvider>
      <div className="flex min-h-screen flex-col bg-background">
        <TopNav />
        <main
          id="main-content"
          tabIndex={-1}
          className="mx-auto w-full max-w-content flex-1 px-4 pt-6 pb-16 focus:outline-none sm:px-6 lg:px-7 lg:pt-10 lg:pb-24"
        >
          {children}
        </main>
      </div>
    </NotificationProvider>
  );
}
