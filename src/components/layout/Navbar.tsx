import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Menu, X, User, LogOut, Settings, MessageCircle, Calendar } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "react-hot-toast";

const navItems = [
  { label: "Home", href: "/" },
  { label: "About", href: "/about" },
  { label: "Network", href: "/network" },
  { label: "Products", href: "/products" },
  { label: "Features", href: "/features" },
  { label: "Insights", href: "/insights" },
  { label: "Webinar", href: "/webinar" },
  { label: "Contact", href: "/contact" },
];

// Auth-specific navigation items
const authenticatedNavItems = [
  // { label: "Dashboard", href: "/dashboard" },
  // { label: "Messages", href: "/messages" },
];

const Navbar = () => {
  const navigate = useNavigate();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [selectedRole, setSelectedRole] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userData, setUserData] = useState<{
    user_id?: string;
    role?: string;
    profile?: {
      first_name?: string;
      last_name?: string;
      designation?: string;
      avatar?: string;
    };
  }>({});

  // Check for authentication on component mount
  useEffect(() => {
    const checkAuth = () => {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        try {
          const parsedUserData = JSON.parse(storedUser);
          setUserData(parsedUserData);
          setIsAuthenticated(true);
        } catch (error) {
          console.error('Error parsing user data:', error);
        }
      }
    };

    checkAuth();
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleRoleSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const role = e.target.value;
    setSelectedRole(role);
    if (role) {
      setShowModal(false);
      const path = role === "solution-seeker" ? "/auth/seeker" : "/auth/expert";
      window.location.href = path;
    }
  };

  const handleLogout = () => {
    // Clear user data from localStorage
    localStorage.removeItem('user');
    
    // Update state
    setIsAuthenticated(false);
    setUserData({});
    
    // Show success message
    toast.success('Logged out successfully');
    
    // Navigate to home page
    navigate('/');
  };

  // Get user's initials for avatar fallback
  const getInitials = () => {
    const firstName = userData?.profile?.first_name || '';
    const lastName = userData?.profile?.last_name || '';
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  return (
    <>
      <header
        className={cn(
          "fixed top-0 left-0 right-0 z-50 transition-all duration-300 ease-in-out py-4 px-4 sm:px-6 lg:px-8",
          isScrolled
            ? "bg-white/80 backdrop-blur-lg shadow-sm"
            : "bg-transparent"
        )}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link to="/" className="text-2xl font-display font-bold text-gradient">
            ExpertiseStation
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            {/* Show general nav items to everyone */}
            {navItems.map((item) => (
              <Link
                key={item.label}
                to={item.href}
                className="font-medium link-underline text-foreground/80 hover:text-foreground transition-colors"
              >
                {item.label}
              </Link>
            ))}
            
            {/* Conditionally show auth-specific nav items only to authenticated users */}
            {isAuthenticated && authenticatedNavItems.map((item) => (
              <Link
                key={item.label}
                to={item.href}
                className="font-medium link-underline text-foreground/80 hover:text-foreground transition-colors"
              >
                {item.label}
              </Link>
            ))}

            {/* Show either Login button or User Profile dropdown based on auth state */}
            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger className="outline-none">
                  <Avatar className="h-9 w-9 cursor-pointer">
                    <AvatarImage 
                      src={userData?.profile?.avatar} 
                      alt={`${userData?.profile?.first_name || ''}`} 
                    />
                    <AvatarFallback className="bg-primary text-white font-medium">
                      {getInitials()}
                    </AvatarFallback>
                  </Avatar>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div className="flex flex-col">
                      <span className="font-bold">
                        {userData?.profile?.first_name || ''} {userData?.profile?.last_name || ''}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {userData?.profile?.designation || userData?.role || ''}
                      </span>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  
                  <DropdownMenuItem onClick={() => {
                    window.scrollTo({top:0, behavior:'smooth'});
                    navigate(`/dashboard`);
                  }}>
                    <User className="mr-2 h-4 w-4" />
                    <span>Dashboard</span>
                  </DropdownMenuItem>
                  
                  {/* <DropdownMenuItem onClick={() => {
                    window.scrollTo({top:0, behavior:'smooth'});
                    navigate('/messages');
                  }}>
                    <MessageCircle className="mr-2 h-4 w-4" />
                    <span>Messages</span>
                  </DropdownMenuItem> */}
                  
                  <DropdownMenuItem onClick={() => {
                    window.scrollTo({top:0, behavior:'smooth'});
                    navigate('/appointments');
                  }}>
                    <Calendar className="mr-2 h-4 w-4" />
                    <span>Appointment Log</span>
                  </DropdownMenuItem>
                  
                  {/* <DropdownMenuItem onClick={() => {
                    window.scrollTo({top:0, behavior:'smooth'});
                    navigate('/settings');
                  }}>
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                  </DropdownMenuItem> */}
                  
                  <DropdownMenuSeparator />
                  
                  <DropdownMenuItem onClick={() => {
                    window.scrollTo({top:0, behavior:'smooth'});
                    handleLogout();
                  }}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Logout</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <button
                onClick={() => setShowModal(true)}
                className="btn-primary"
              >
                Get Started
              </button>
            )}
          </nav>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <nav className="md:hidden mt-4 p-4 bg-white/95 backdrop-blur-lg rounded-xl shadow-lg animate-fade-in">
            <div className="flex flex-col space-y-4">
              {/* Common nav items */}
              {navItems.map((item) => (
                <Link
                  key={item.label}
                  to={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="font-medium text-foreground/80 hover:text-foreground py-2 transition-colors"
                >
                  {item.label}
                </Link>
              ))}
              
              {/* Auth-specific nav items */}
              {isAuthenticated && authenticatedNavItems.map((item) => (
                <Link
                  key={item.label}
                  to={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="font-medium text-foreground/80 hover:text-foreground py-2 transition-colors"
                >
                  {item.label}
                </Link>
              ))}
              
              {/* User profile section for mobile */}
              {isAuthenticated ? (
                <>
                  <div className="py-2 border-t border-gray-200">
                    <div className="flex items-center space-x-3 py-2">
                      <Avatar className="h-9 w-9">
                        <AvatarImage src={userData?.profile?.avatar} alt={userData?.profile?.first_name[0]} />
                        <AvatarFallback className="bg-primary text-white font-medium">
                          {getInitials()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">
                          {userData?.profile?.first_name[0]} {userData?.profile?.last_name[0]}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {userData?.profile?.designation || userData?.role}
                        </div>
                      </div>
                    </div>
                    
                    <Link
                      to={`/${userData.role}/dashboard/${userData.user_id}`}
                      onClick={() => {
                        window.scrollTo({top:0, behavior:'smooth'});
                        setIsMobileMenuOpen(false);
                      }}
                      className="flex items-center space-x-2 py-2 text-foreground/80 hover:text-foreground"
                    >
                      <User className="h-4 w-4" />
                      <span>Dashboard</span>
                    </Link>
                    
                    {/* <Link
                      to="/messages"
                      onClick={() => {
                        window.scrollTo({top:0, behavior:'smooth'});
                        setIsMobileMenuOpen(false);
                      }}
                      className="flex items-center space-x-2 py-2 text-foreground/80 hover:text-foreground"
                    >
                      <MessageCircle className="h-4 w-4" />
                      <span>Messages</span>
                    </Link>
                     */}
                    {/* <Link
                      to="/settings"
                      onClick={() => {
                        window.scrollTo({top:0, behavior:'smooth'});
                        setIsMobileMenuOpen(false);
                      }}
                      className="flex items-center space-x-2 py-2 text-foreground/80 hover:text-foreground"
                    >
                      <Settings className="h-4 w-4" />
                      <span>Settings</span>
                    </Link> */}
                    
                    <button
                      onClick={() => {
                        window.scrollTo({top:0, behavior:'smooth'});
                        handleLogout();
                        setIsMobileMenuOpen(false);
                      }}
                      className="flex items-center space-x-2 py-2 text-red-500 hover:text-red-600 w-full text-left"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>Logout</span>
                    </button>
                  </div>
                </>
              ) : (
                <button
                  onClick={() => {
                    setShowModal(true);
                    setIsMobileMenuOpen(false);
                  }}
                  className="btn-primary text-center"
                >
                  Get Started
                </button>
              )}
            </div>
          </nav>
        )}
      </header>

      {/* Role Selection Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 relative">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
            >
              ×
            </button>
            <h2 className="text-2xl font-bold mb-4">Choose Your Role</h2>
            <label htmlFor="role-select" className="sr-only">
              Choose Your Role
            </label>
            <select
              id="role-select"
              value={selectedRole}
              onChange={handleRoleSelect}
              className="w-full px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              aria-label="Choose Your Role"
            >
              <option value="">Select a role...</option>
              <option value="solution-seeker">Solution Seeker</option>
              <option value="expert">Expert</option>
            </select>
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;
