import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { useState } from 'react';
import { Menu } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from './ui/sheet';

const Layout = () => {
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen bg-black flex">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 flex-col fixed inset-y-0 z-50 bg-black border-r border-white/5">
        <Sidebar />
      </aside>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 h-16 bg-black border-b border-white/5 flex items-center px-4">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <button 
              data-testid="mobile-menu-btn"
              className="p-2 hover:bg-white/5 rounded-sm transition-colors"
            >
              <Menu className="h-5 w-5 text-white" />
            </button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0 bg-black border-r border-white/5">
            <Sidebar onNavigate={() => setOpen(false)} />
          </SheetContent>
        </Sheet>
        <h1 className="ml-4 font-serif text-lg tracking-wider text-white">ANELY</h1>
      </div>

      {/* Main Content */}
      <main className="flex-1 md:ml-64 mt-16 md:mt-0">
        <div className="p-4 md:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default Layout;
