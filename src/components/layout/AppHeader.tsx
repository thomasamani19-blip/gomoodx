'use client';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { LogOut, Settings, User as UserIcon, Menu } from 'lucide-react';
import Link from 'next/link';
// import { useAuth } from '@/hooks/useAuth';

export function AppHeader() {
  // const { user, logout } = useAuth();

  const user = { // MOCK USER
    displayName: "Eva Sensuelle",
    email: "creator@gomoodx.com",
    avatarUrl: "https://picsum.photos/seed/avatar1/100/100"
  };
  const logout = () => console.log("logout");


  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6">
       <Button variant="ghost" size="icon" className="md:hidden">
          <Menu />
          <span className="sr-only">Toggle Sidebar</span>
       </Button>
      
      <div className="flex w-full items-center gap-4 md:ml-auto md:gap-2 lg:gap-4">
        <div className="ml-auto flex-1 sm:flex-initial">
          {/* Search or other actions can go here */}
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-10 w-10 rounded-full">
              <Avatar className="h-10 w-10">
                {user?.avatarUrl && <AvatarImage src={user.avatarUrl} alt={user.displayName} />}
                <AvatarFallback>{user?.displayName?.charAt(0)?.toUpperCase() ?? 'U'}</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{user?.displayName}</p>
                <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/account/profile">
                <UserIcon className="mr-2 h-4 w-4" />
                <span>Profil</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Settings className="mr-2 h-4 w-4" />
              <span>Paramètres</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => logout()}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>Déconnexion</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
