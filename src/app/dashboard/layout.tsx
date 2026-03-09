import { Sidebar } from '@/components/ui/sidebar';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen">
      <Sidebar />
      <main className="flex-1 overflow-y-auto bg-gray-50/50 dark:bg-gray-950 p-4 pt-14 md:p-8 md:pt-8">
        {children}
      </main>
    </div>
  );
}
