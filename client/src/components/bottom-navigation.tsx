import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { 
  Home, 
  User, 
  QrCode, 
  Activity, 
  LogOut
} from "lucide-react";
import { authManager } from "@/lib/auth";

export default function BottomNavigation() {
  const [location, setLocation] = useLocation();
  const user = authManager.getCurrentUser();

  const handleLogout = () => {
    authManager.logout();
    setLocation('/login');
  };

  if (!user) return null;

  const isActive = (path: string) => location === path;

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-2xl z-50">
      <div className="flex items-center justify-between px-4 py-3">
        {/* Dashboard */}
        <Link href="/dashboard" className="flex-1 flex justify-center">
          <Button 
            variant="ghost" 
            className={`h-14 w-14 flex flex-col items-center justify-center space-y-1 transition-all duration-200 rounded-full ${
              isActive('/dashboard') 
                ? 'text-[hsl(var(--asean-blue))] bg-blue-50/80' 
                : 'text-slate-600 hover:text-[hsl(var(--asean-blue))] hover:bg-slate-50'
            }`}
          >
            <Home className={`w-5 h-5 transition-colors duration-200 ${isActive('/dashboard') ? 'text-[hsl(var(--asean-blue))]' : ''}`} />
            <span className="text-xs font-medium">Dashboard</span>
          </Button>
        </Link>

        {/* Profile */}
        <Link href="/profile-form" className="flex-1 flex justify-center">
          <Button 
            variant="ghost" 
            className={`h-14 w-14 flex flex-col items-center justify-center space-y-1 transition-all duration-200 rounded-full ${
              isActive('/profile-form') 
                ? 'text-[hsl(var(--asean-green))] bg-green-50/80' 
                : 'text-slate-600 hover:text-[hsl(var(--asean-green))] hover:bg-slate-50'
            }`}
          >
            <User className={`w-5 h-5 transition-colors duration-200 ${isActive('/profile-form') ? 'text-[hsl(var(--asean-green))]' : ''}`} />
            <span className="text-xs font-medium">Profile</span>
          </Button>
        </Link>

        {/* Scan QR - Centered Blue Circle */}
        <div className="flex-1 flex justify-center">
          <Link href="/scan-qr">
            <div className="h-16 w-16 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-lg transition-all duration-200 flex items-center justify-center cursor-pointer">
              <QrCode className="w-6 h-6" />
            </div>
          </Link>
        </div>

        {/* Activities */}
        <Link href="/activities" className="flex-1 flex justify-center">
          <Button 
            variant="ghost" 
            className={`h-14 w-14 flex flex-col items-center justify-center space-y-1 transition-all duration-200 rounded-full ${
              isActive('/activities') 
                ? 'text-[hsl(var(--asean-yellow))] bg-yellow-50/80' 
                : 'text-slate-600 hover:text-[hsl(var(--asean-yellow))] hover:bg-slate-50'
            }`}
          >
            <Activity className={`w-5 h-5 transition-colors duration-200 ${isActive('/activities') ? 'text-[hsl(var(--asean-yellow))]' : ''}`} />
            <span className="text-xs font-medium">Activities</span>
          </Button>
        </Link>

        {/* Logout */}
        <div className="flex-1 flex justify-center">
          <Button 
            variant="ghost" 
            onClick={handleLogout}
            className="h-14 w-14 flex flex-col items-center justify-center space-y-1 text-slate-600 hover:text-red-600 hover:bg-red-50 transition-all duration-200 rounded-full"
          >
            <LogOut className="w-5 h-5" />
            <span className="text-xs font-medium">Logout</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
