import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { authManager } from "@/lib/auth";

export default function Navigation() {
  const [location, setLocation] = useLocation();
  const user = authManager.getCurrentUser();

  const handleLogout = () => {
    authManager.logout();
    setLocation('/login');
  };

  if (!user) return null;

  return (
    <nav className="bg-white shadow-sm border-b border-slate-200" data-testid="navigation">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/dashboard" className="flex-shrink-0 flex items-center">
              <h1 className="text-xl font-bold text-[hsl(var(--asean-blue))]" data-testid="logo">
                MSME Passport
              </h1>
            </Link>
          </div>
          <div className="hidden md:flex items-center space-x-4">
            {user?.email !== "admin@example.com" && (
              <Link href="/dashboard">
                <Button 
                  variant="ghost" 
                  className="text-slate-600 hover:text-[hsl(var(--asean-blue))]"
                  data-testid="nav-dashboard"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5a2 2 0 012-2h4a2 2 0 012 2v6H8V5z" />
                  </svg>
                  Dashboard
                </Button>
              </Link>
            )}
                         {user?.email === "admin@example.com" ? (
               <>
                 <Link href="/admin-approve">
                   <Button 
                     variant="ghost" 
                     className="text-slate-600 hover:text-[hsl(var(--asean-green))]"
                     data-testid="nav-admin"
                   >
                     <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                     </svg>
                     Approve Users
                   </Button>
                 </Link>
                 <Link href="/admin-businesses">
                   <Button 
                     variant="ghost" 
                     className="text-slate-600 hover:text-[hsl(var(--asean-blue))]"
                     data-testid="nav-admin-businesses"
                   >
                     <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                     </svg>
                     Manage Businesses
                   </Button>
                 </Link>
                 <Link href="/admin-manage-users">
                   <Button 
                     variant="ghost" 
                     className="text-slate-600 hover:text-[hsl(var(--asean-blue))]"
                     data-testid="nav-manage-users"
                   >
                     <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                     </svg>
                     Manage Users
                   </Button>
                 </Link>
               </>
             ) : (
              <Link href="/profile-form">
                <Button 
                  variant="ghost" 
                  className="text-slate-600 hover:text-[hsl(var(--asean-green))]"
                  data-testid="nav-profile"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Profile
                </Button>
              </Link>
            )}
            <Button 
              onClick={handleLogout}
              className="asean-red"
              data-testid="button-logout"
            >
              Logout
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
}
