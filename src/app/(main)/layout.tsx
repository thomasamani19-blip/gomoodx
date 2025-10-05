// This layout can be used for all main app pages that require authentication
import { AppSidebar } from '@/components/layout/AppSidebar';
import { AppHeader } from '@/components/layout/AppHeader';

export default function MainAppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <div className="flex flex-col flex-1">
          <AppHeader />
          <main className="flex-1 p-4 md:p-6 lg:p-8 bg-muted/30">
            {children}
          </main>
        </div>
      </div>
  );
}
