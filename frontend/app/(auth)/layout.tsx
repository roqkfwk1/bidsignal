import { Wordmark } from '@/components/auth/AuthForm';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex h-16 w-full max-w-content items-center px-4 sm:px-6 lg:px-7">
          <Wordmark />
        </div>
      </header>
      <main
        id="main-content"
        className="mx-auto flex w-full max-w-content flex-1 items-start justify-center px-4 py-8 sm:px-6 sm:py-12 lg:items-center lg:px-7"
      >
        {children}
      </main>
    </div>
  );
}
