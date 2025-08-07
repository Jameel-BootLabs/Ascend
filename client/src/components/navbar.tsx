import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/useAuth";
import { ChevronsUp, LogOut, Settings, User } from "lucide-react";
import { Link, useLocation } from "wouter";

export default function Navbar() {
  const { user, isAuthenticated } = useAuth();
  const [location] = useLocation();

  if (!isAuthenticated || !user) return null;

  const getInitials = (firstName?: string, lastName?: string) => {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase() || 'U';
  };

  const handleLogout = () => {
    window.location.href = '/api/logout';
  };

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="flex items-center">
            <ChevronsUp className="text-primary mr-2" size={25}/>
            <span className="text-xl font-semibold text-on-surface">Ascend</span>
          </Link>
          
          <div className="flex items-center space-x-4">
            <Link href="/">
              <Button
                variant={location === '/' ? 'default' : 'ghost'}
                className="flex items-center"
              >
                <User className="mr-2 h-4 w-4" />
                Dashboard
              </Button>
            </Link>
            
            {user.role === 'admin' && (
              <Link href="/admin">
                <Button
                  variant={location === '/admin' ? 'default' : 'ghost'}
                  className="flex items-center"
                >
                  <Settings className="mr-2 h-4 w-4" />
                  Admin
                </Button>
              </Link>
            )}
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user.profileImageUrl || undefined} alt={user.firstName || 'User'} />
                    <AvatarFallback>{getInitials(user.firstName, user.lastName)}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <div className="flex flex-col space-y-1 p-2">
                  <p className="text-sm font-medium leading-none">{user.firstName} {user.lastName}</p>
                  <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </nav>
  );
}
