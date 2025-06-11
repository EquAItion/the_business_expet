import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Menu, X, User, LogOut, Settings, MessageCircle, Calendar, Bell } from "lucide-react";
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

// Update UserData interface to handle both structures
interface UserData {
  id?: string;
  user_id?: string; // Add this field
  email: string;
  token: string;
  role: 'solution_seeker' | 'expert';
  name?: string;
  mobile_number?: string;
  profile_completed?: boolean;
}

// Update the type guard to handle both id structures
const isValidUserData = (data: any): data is UserData => {
  return (
    typeof data === 'object' &&
    data !== null &&
    // Check for either id or user_id
    ((typeof data.id === 'string') || (typeof data.user_id === 'string')) &&
    typeof data.email === 'string' &&
    typeof data.token === 'string' &&
    (data.role === 'solution_seeker' || data.role === 'expert')
  );
};

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
    user_role?: string;
    userRole?: string;
    name?: string;
    email?: string;
    first_name?: string;
    last_name?: string;
    profile?: {
      first_name?: string;
      last_name?: string;
      designation?: string;
      avatar?: string;
    };
  }>({});

  // Check for authentication on component mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const userData = localStorage.getItem('user');
        if (!userData) {
          console.log('No user data in localStorage');
          setIsAuthenticated(false);
          return;
        }

        const user = JSON.parse(userData);
        
        // Normalize the user ID
        const userId = user.id || user.user_id;
        if (!userId) {
          throw new Error('User ID not found');
        }

        // First set basic authentication state
        setIsAuthenticated(true);
        setUserData(user);

        // Get current path
        const currentPath = window.location.pathname;

        // Skip profile check if on profile forms or login pages
        if (currentPath.includes('/auth/SeekerProfileForm') || 
            currentPath.includes('/auth/ExpertProfileForm') ||  // Add this line
            currentPath === '/auth/seeker' || 
            currentPath === '/auth/expert') {
          return;
        }

        // If we already know profile status, use that
        if (typeof user.profile_completed === 'boolean') {
          if (!user.profile_completed) {
            if (user.role === 'solution_seeker') {
              console.log('Seeker profile incomplete, redirecting to form');
              navigate('/auth/SeekerProfileForm');
            } else if (user.role === 'expert') {
              console.log('Expert profile incomplete, redirecting to form');
              navigate('/auth/ExpertProfileForm');
            }
          }
          return;
        }

        // Check profile status from API
        const API_BASE_URL = import.meta.env.VITE_API_URL;
        if (!API_BASE_URL) {
          throw new Error('API URL not configured');
        }

        console.log(`Checking profile for user: ${userId}, role: ${user.role}`);

        const profileEndpoint = user.role === 'expert' 
          ? `/api/experts/profile/${userId}`  // Update this endpoint
          : `/api/profiles/seeker/${userId}`;

        const response = await fetch(`${API_BASE_URL}${profileEndpoint}`, {
          headers: {
            'Authorization': `Bearer ${user.token}`,
            'Accept': 'application/json'
          }
        });

        if (response.status === 404) {
          // Update user data to indicate incomplete profile
          const updatedUser = {
            ...user,
            profile_completed: false
          };
          localStorage.setItem('user', JSON.stringify(updatedUser));
          setUserData(updatedUser);

          // Redirect based on role
          if (user.role === 'solution_seeker') {
            console.log('Seeker profile not found, redirecting to form');
            navigate('/auth/SeekerProfileForm');
          } else if (user.role === 'expert') {
            console.log('Expert profile not found, redirecting to form');
            navigate('/auth/ExpertProfileForm');
          }
          return;
        }

        if (response.ok) {
          const result = await response.json();
          const updatedUser = {
            ...user,
            ...result.data,
            profile_completed: true
          };
          localStorage.setItem('user', JSON.stringify(updatedUser));
          setUserData(updatedUser);
        }

      } catch (error) {
        console.error('Auth check error:', error);
        
        // Only clear data for serious errors, not 404s
        if (error instanceof Error && 
            !error.message.includes('404') && 
            !error.message.includes('Profile not found')) {
          localStorage.clear();
          setIsAuthenticated(false);
          setUserData({});
          navigate('/auth/seeker');
        }
      }
    };

    checkAuth();
}, [navigate]);

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

  // Update the getInitials function to handle different user data structures
  const getInitials = () => {
    // Try different possible locations for name data
    const firstName = userData?.profile?.first_name || 
                     userData?.first_name || 
                     userData?.name?.split(' ')[0] || '';
    
    const lastName = userData?.profile?.last_name || 
                    userData?.last_name || 
                    userData?.name?.split(' ')[1] || '';
    
    // If we have both first and last name
    if (firstName && lastName) {
      return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
    }
    
    // If we only have first name
    if (firstName) {
      return firstName.charAt(0).toUpperCase();
    }
    
    // Fallback to email initial if available
    if (userData?.email) {
      return userData.email.charAt(0).toUpperCase();
    }
    
    // Final fallback
    return 'U';
  };

  // Add scroll to top handler
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  };

  // Enhanced getDisplayName function
  const getDisplayName = () => {
    // Try to get name from profile first
    const firstName = userData?.profile?.first_name || 
                     userData?.first_name || 
                     userData?.name?.split(' ')[0];
    
    const lastName = userData?.profile?.last_name || 
                    userData?.last_name || 
                    userData?.name?.split(' ')[1];
    
    // If we have both names
    if (firstName && lastName) {
      return `${firstName} ${lastName}`;
    }
    
    // If we have just first name
    if (firstName) {
      return firstName;
    }
    
    // Try full name field
    const fullName = userData?.name;
    if (fullName) {
      return fullName;
    }
    
    // Fallback to email username (before @)
    if (userData?.email) {
      return userData.email.split('@')[0];
    }
    
    // Final fallback
    return 'User';
  };

  // Enhanced getDesignation function with more role detection
  const getDesignation = () => {
    // First try to get from profile designation
    let designation = userData?.profile?.designation;
    
    // If no designation, try to format from role
    if (!designation) {
      const role = userData?.role || userData?.user_role || userData?.userRole;
      
      if (role) {
        switch (role.toLowerCase()) {
          case 'solution_seeker':
          case 'solution-seeker':
          case 'seeker':
            designation = 'Solution Seeker';
            break;
          
          case 'expert':
          case 'domain_expert':
          case 'domain-expert':
            designation = 'Expert';
            break;
          
          default:
            // Format other roles nicely
            designation = role.split(/[_-]/).map(word => 
              word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
            ).join(' ');
        }
      }
    }
    
    // If we have a proper designation, return it
    if (designation && designation !== 'User') {
      return designation;
    }
    
    // Final fallback - check if we can determine role from stored data
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        const role = parsedUser.role || parsedUser.user_role;
        
        if (role === 'solution_seeker' || role === 'seeker') {
          return 'Solution Seeker';
        } else if (role === 'expert') {
          return 'Expert';
        }
      } catch (e) {
        console.error('Error parsing stored user data for role:', e);
      }
    }
    
    return 'User';
  };

  return (
    <>
      <header
        className={cn(
          "fixed top-0 left-0 right-0 z-50 transition-all duration-300 ease-in-out py-2 px-2 sm:px-3 md:px-4", // Adjusted padding
          isScrolled
            ? "bg-white/80 shadow-sm backdrop-blur-sm"
            : "bg-white/40 backdrop-blur-sm"
        )}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link 
            to="/" 
            onClick={scrollToTop} 
            className="text-lg sm:text-xl md:text-2xl font-display font-bold text-gradient whitespace-nowrap"
          >
            ExpertiseStation
          </Link>

          {/* Desktop & Tablet Navigation */}
          <nav className="hidden md:flex items-center">
            {/* Show all nav items with optimized spacing */}
            <div className="flex items-center flex-wrap">
              {navItems.map((item) => (
                <Link
                  key={item.label}
                  to={item.href}
                  onClick={scrollToTop}
                  className="text-[11px] lg:text-sm font-medium text-foreground/80 hover:text-foreground 
                    transition-colors whitespace-nowrap
                    px-1.5 md:px-2 lg:px-3 py-0.5
                    hover:bg-gray-50/50 rounded-sm"
                >
                  {item.label}
                </Link>
              ))}
            </div>

            {/* Auth button/dropdown with compact spacing */}
            <div className="ml-2 lg:ml-4">
              {isAuthenticated ? (
                <DropdownMenu>
                  <DropdownMenuTrigger className="outline-none">
                    <Avatar className="h-6 w-6 lg:h-8 lg:w-8 cursor-pointer">
                      <AvatarImage src={userData?.profile?.avatar} />
                      <AvatarFallback className="bg-primary text-white text-[10px] lg:text-sm">
                        {getInitials()}
                      </AvatarFallback>
                    </Avatar>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48 sm:w-52">
                    <DropdownMenuLabel>
                      <div className="flex flex-col">
                        <span className="font-bold">
                          {getDisplayName()}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {getDesignation()}
                        </span>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    
                    <DropdownMenuItem onClick={() => {
                      scrollToTop();
                      
                      // Get user data from the correct localStorage key
                      const storedUser = localStorage.getItem('user');
                      if (storedUser) {
                        try {
                          const parsedUserData = JSON.parse(storedUser);
                          console.log('🔍 Dashboard navigation - User role:', parsedUserData.role);
                          
                          // Check user role and navigate accordingly
                          if (parsedUserData.role === 'solution_seeker' || parsedUserData.role === 'seeker') {
                            console.log('✅ Navigating to seeker dashboard');
                            navigate('/seekerdashboard');
                          } else if (parsedUserData.role === 'expert') {
                            console.log('✅ Navigating to expert dashboard');
                            navigate('/dashboard');
                          } else {
                            console.log('⚠ Unknown role, defaulting to general dashboard');
                            navigate('/dashboard');
                          }
                        } catch (error) {
                          console.error('❌ Error parsing user data for navigation:', error);
                          navigate('/dashboard'); // Fallback
                        }
                      } else {
                        console.log('⚠ No user data found, redirecting to login');
                        navigate('/auth/seeker'); // Redirect to login if no user data
                      }
                    }}>
                      <User className="mr-2 h-4 w-4" />
                      <span>Dashboard</span>
                    </DropdownMenuItem>

                    <DropdownMenuItem onClick={() => {
                      scrollToTop();
                      navigate('/notifications');
                    }}>
                      <Bell className="mr-2 h-4 w-4" />
                      <span>Notification</span>
                    </DropdownMenuItem>
                    
                    {/* <DropdownMenuItem onClick={() => {
                      scrollToTop();
                      navigate('/messages');
                    }}>
                      <MessageCircle className="mr-2 h-4 w-4" />
                      <span>Messages</span>
                    </DropdownMenuItem> */}
                    
                    <DropdownMenuItem onClick={() => {
                      scrollToTop();
                      navigate('/appointment-log');
                    }}>
                      <Calendar className="mr-2 h-4 w-4" />
                      <span>Appointment Log</span>
                    </DropdownMenuItem>
                    
                    {/* <DropdownMenuItem onClick={() => {
                      scrollToTop();
                      navigate('/settings');
                    }}>
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Settings</span>
                    </DropdownMenuItem> */}
                    
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
                  className="btn-primary text-xs lg:text-sm px-2 lg:px-4 py-1.5"
                >
                  Get Started
                </button>
              )}
            </div>
          </nav>

          {/* Mobile Menu Button with adjusted positioning */}
          <button
            className="md:hidden p-1 -mr-1"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </button>
        </div>

        {/* Mobile & Tablet Navigation Menu */}
        {isMobileMenuOpen && (
          <nav className="md:hidden mt-2 mx-2 p-2 sm:p-3 bg-white/95 backdrop-blur-lg rounded-lg shadow-lg 
            animate-fade-in divide-y divide-gray-100">
            {/* Navigation Links */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1 pb-2">
              {navItems.map((item) => (
                <Link
                  key={item.label}
                  to={item.href}
                  onClick={() => {
                    scrollToTop();
                    setIsMobileMenuOpen(false);
                  }}
                  className="font-medium text-sm text-foreground/80 hover:text-foreground py-2 px-2 
                    rounded-md hover:bg-gray-50 transition-colors"
                >
                  {item.label}
                </Link>
              ))}
            </div>
            
            {/* User Profile Section for Mobile */}
            {isAuthenticated ? (
              <div className="pt-2 space-y-1">
                <div className="flex items-center gap-3 p-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={userData?.profile?.avatar} />
                    <AvatarFallback className="bg-primary text-white text-sm">
                      {getInitials()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">
                      {getDisplayName()}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {getDesignation()}
                    </p>
                  </div>
                </div>

                {/* Mobile Menu Actions */}
                <div className="space-y-1 pt-2">
                  <Link
                    to="#"
                    onClick={(e) => {
                      e.preventDefault(); // Prevent default link behavior
                      scrollToTop();
                      setIsMobileMenuOpen(false);
                      
                      // Get user data from the correct localStorage key
                      const storedUser = localStorage.getItem('user');
                      if (storedUser) {
                        try {
                          const parsedUserData = JSON.parse(storedUser);
                          console.log('🔍 Mobile Dashboard navigation - User role:', parsedUserData.role);
                          
                          // Check user role and navigate accordingly
                          if (parsedUserData.role === 'solution_seeker' || parsedUserData.role === 'seeker') {
                            console.log('✅ Navigating to seeker dashboard (mobile)');
                            navigate('/seekerdashboard');
                          } else if (parsedUserData.role === 'expert') {
                            console.log('✅ Navigating to expert dashboard (mobile)');
                            navigate('/dashboard');
                          } else {
                            console.log('⚠ Unknown role, defaulting to general dashboard (mobile)');
                            navigate('/dashboard');
                          }
                        } catch (error) {
                          console.error('❌ Error parsing user data for mobile navigation:', error);
                          navigate('/dashboard'); // Fallback
                        }
                      } else {
                        console.log('⚠ No user data found, redirecting to login (mobile)');
                        navigate('/auth/seeker'); // Redirect to login if no user data
                      }
                    }}
                    className="flex items-center gap-2 px-2 py-2 text-sm text-foreground/80 hover:text-foreground
                      hover:bg-gray-50 rounded-md transition-colors"
                  >
                    <User className="h-4 w-4" />
                    <span>Dashboard</span>
                  </Link>
                  
                  <Link
                    to="/notifications"
                    onClick={() => {
                      scrollToTop();
                      setIsMobileMenuOpen(false);
                    }}
                    className="flex items-center gap-2 px-2 py-2 text-sm text-foreground/80 hover:text-foreground
                      hover:bg-gray-50 rounded-md transition-colors"
                  >
                    <Bell className="h-4 w-4" />
                    <span>Notifications</span>
                  </Link>
                  
                  <Link
                    to="/appointment-log"
                    onClick={() => {
                      scrollToTop();
                      setIsMobileMenuOpen(false);
                    }}
                    className="flex items-center gap-2 px-2 py-2 text-sm text-foreground/80 hover:text-foreground
                      hover:bg-gray-50 rounded-md transition-colors"
                  >
                    <Calendar className="h-4 w-4" />
                    <span>Appointment Log</span>
                  </Link>
                  
                  <button
                    onClick={() => {
                      scrollToTop();
                      handleLogout();
                      setIsMobileMenuOpen(false);
                    }}
                    className="flex w-full items-center gap-2 px-2 py-2 text-sm text-foreground/80 hover:text-foreground
                      hover:bg-gray-50 rounded-md transition-colors"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Logout</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="pt-2">
                <button
                  onClick={() => {
                    setShowModal(true);
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full btn-primary text-sm px-4 py-2 rounded-md"
                >
                  Get Started
                </button>
              </div>
            )}
          </nav>
        )}
      </header>

      {/* Role Selection Modal */}
      {showModal && (
        <>
          <div 
            className="fixed inset-0 bg-transparent z-40" 
            onClick={() => setShowModal(false)} 
          />
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