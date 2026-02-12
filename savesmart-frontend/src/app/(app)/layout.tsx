import Header from '@/components/Header';
import ChatFAB from '@/components/ChatFAB';

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-gray-50">
        {children}
      </main>
      <ChatFAB />
    </>
  );
}
