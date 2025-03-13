
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Menu, X } from "lucide-react";
import { Link } from "react-router-dom";

const navItems = [
  { label: "Home", href: "/" },
  { label: "Network", href: "/network" },
  { label: "Products", href: "/products" },
  { label: "Features", href: "/features" },
  { label: "Insights", href: "/insights" },
  { label: "Webinar", href: "/webinar" },
  { label: "Contact", href: "/contact" },
];

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [selectedRole, setSelectedRole] = useState("");

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
      const path = role === "solution-seeker" ? "/exp/auth/seeker" : "/exp/auth/expert";
      window.location.href = path;
    }
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
            {navItems.map((item) => (
              <Link
                key={item.label}
                to={item.href}
                className="font-medium link-underline text-foreground/80 hover:text-foreground transition-colors"
              >
                {item.label}
              </Link>
            ))}
            <button
              onClick={() => setShowModal(true)}
              className="btn-primary"
            >
              Get Started
            </button>
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
              <button
                onClick={() => {
                  setShowModal(true);
                  setIsMobileMenuOpen(false);
                }}
                className="btn-primary text-center"
              >
                Get Started
              </button>
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
            <select
              value={selectedRole}
              onChange={handleRoleSelect}
              className="w-full px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
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
