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

  // Add scroll to top handler
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  };

  return (
    <>
      <header
        className={cn(
          "fixed top-0 left-0 right-0 z-50 transition-all duration-300 ease-in-out",
          isScrolled
            ? "bg-white/80 backdrop-blur-sm shadow-sm"
            : "bg-white/40",
          "header"
        )}
      >
        {/* Main Navbar Container */}
        <div className="container mx-auto px-4 py-3 lg:py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link 
              to="/" 
              onClick={scrollToTop} 
              className="flex items-center space-x-2"
            >
              <span className="text-xl md:text-2xl font-bold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
                ExpertiseStation
              </span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center space-x-8">
              {navItems.map((item) => (
                <Link
                  key={item.label}
                  to={item.href}
                  onClick={scrollToTop}
                  className="text-sm font-medium text-gray-700 hover:text-primary transition-colors"
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            {/* Auth Buttons / Profile */}
            <div className="hidden lg:flex items-center space-x-4">
              {isAuthenticated ? (
                <DropdownMenu>
                  <DropdownMenuTrigger className="outline-none">
                    <Avatar className="h-9 w-9 cursor-pointer hover:ring-2 ring-primary/20 transition-all">
                      <AvatarImage src={userData?.profile?.avatar} />
                      <AvatarFallback className="bg-primary text-white">
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
                      scrollToTop();
                      // Check user role and navigate to appropriate dashboard
                      if (userData?.role === "solution_seeker") {
                        navigate('/seekerdashboard');
                      } else if (userData?.role === "expert") {
                        navigate('/dashboard'); // Changed from dynamic route to simple dashboard route
                      }
                      
                    }}>
                      <User className="mr-2 h-4 w-4" />
                      <span>Dashboard</span>
                    </DropdownMenuItem>
                    
                    <DropdownMenuItem onClick={() => {
                      scrollToTop();
                      navigate('/appointments');
                    }}>
                      <Calendar className="mr-2 h-4 w-4" />
                      <span>Appointment Log</span>
                    </DropdownMenuItem>
                    
                    <DropdownMenuSeparator />
                    
                    <DropdownMenuItem onClick={() => {
                      scrollToTop();
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
                  className="bg-primary text-white px-6 py-2 rounded-full text-sm font-medium
                    hover:bg-primary/90 transition-colors"
                >
                  Get Started
                </button>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              className="lg:hidden p-2 rounded-md hover:bg-gray-100"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        <div className={`
          lg:hidden fixed inset-x-0 top-[65px] bg-white/95 backdrop-blur-lg shadow-lg
          transition-all duration-300 ease-in-out overflow-hidden
          ${isMobileMenuOpen ? 'max-h-[calc(100vh-65px)]' : 'max-h-0'}
        `}>
          <div className="container mx-auto px-4 py-4 space-y-4">
            {/* Mobile Nav Items */}
            {navItems.map((item) => (
              <Link
                key={item.label}
                to={item.href}
                onClick={() => {
                  scrollToTop();
                  setIsMobileMenuOpen(false);
                }}
                className="block py-2 text-gray-700 hover:text-primary transition-colors"
              >
                {item.label}
              </Link>
            ))}

            {/* Mobile Auth Section */}
            <div className="pt-4 border-t border-gray-100">
              {isAuthenticated ? (
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={userData?.profile?.avatar} />
                      <AvatarFallback className="bg-primary text-white">
                        {getInitials()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{userData?.profile?.first_name}</p>
                      <p className="text-sm text-gray-500">{userData?.role}</p>
                    </div>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center space-x-2 px-4 py-2 text-red-600 
                      hover:bg-red-50 rounded-md transition-colors"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Logout</span>
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => {
                    setShowModal(true);
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full bg-primary text-white py-2 rounded-md text-sm font-medium
                    hover:bg-primary/90 transition-colors"
                >
                  Get Started
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Role Selection Modal */}
      {showModal && (
        <>
          <div className="fixed inset-0 bg-transparent z-40" onClick={() => setShowModal(false)} />
          <div className="fixed z-50 w-56 bg-white rounded-md shadow-md border border-gray-100
            top-[4rem] right-4 transform-gpu animate-in fade-in slide-in-from-top-2 duration-200"
          >
            <div className="p-3">
              <div className="flex justify-between items-center mb-2">
                <h2 className="text-base font-medium text-gray-900">Choose Your Role</h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                  title="Close"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
              
              <label htmlFor="role-select" className="sr-only">
                Choose Your Role
              </label>
              <select
                id="role-select"
                value={selectedRole}
                onChange={handleRoleSelect}
                className="w-full px-2.5 py-1.5 text-sm bg-gray-50 border border-gray-100 
                  rounded focus:outline-none focus:ring-1 focus:ring-primary 
                  focus:border-transparent"
                aria-label="Choose Your Role"
              >
                <option value="">Select a role...</option>
                <option value="solution-seeker">Solution Seeker</option>
                <option value="expert">Expert</option>
              </select>
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default Navbar;
