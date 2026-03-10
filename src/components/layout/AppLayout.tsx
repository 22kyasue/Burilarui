import { ReactNode, useState } from 'react';
import Header from './Header';
import Sidebar from './Sidebar';
import { Sheet, SheetContent, SheetTitle } from '../ui/sheet';
import { Menu } from 'lucide-react';
import { Button } from '../ui/button';
import * as VisuallyHidden from '@radix-ui/react-visually-hidden';

interface AppLayoutProps {
  children: ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        onMenuClick={() => setMobileOpen(true)}
        menuButton={
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>
        }
      />

      <div className="flex">
        {/* Desktop sidebar */}
        <aside className="hidden md:flex w-64 border-r bg-white h-[calc(100vh-3.5rem)] sticky top-14">
          <Sidebar />
        </aside>

        {/* Mobile sidebar */}
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetContent side="left" className="w-72 p-0">
            <VisuallyHidden.Root>
              <SheetTitle>Navigation</SheetTitle>
            </VisuallyHidden.Root>
            <Sidebar onNewTracking={() => setMobileOpen(false)} />
          </SheetContent>
        </Sheet>

        {/* Main content */}
        <main className="flex-1 min-w-0">{children}</main>
      </div>
    </div>
  );
}
