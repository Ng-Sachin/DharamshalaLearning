import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { UserService } from '../../services/firestore';
import { NotificationService } from '../../services/notificationService';
import { 
  Home,
  Target,
  TrendingUp,
  Users,
  Shield,
  LogOut,
  Menu,
  X,
  User,
  ChevronDown,
  Calendar,
  Mail,
  UserCircle,
  Building,
  AlertCircle,
  Sparkles
} from 'lucide-react';

import BugFeatureModal from './BugFeatureModal';
import WhatsNewModal from './WhatsNewModal';
import { useFeaturesManifest } from '../../hooks/useFeaturesManifest';

interface NavItem {
  label: string
  mobileLabel: string
  path: string
  icon: React.ComponentType<{ className?: string }>
  notificationCount?: number
  comingSoon?: boolean
}

export default function Navigation() {
  const { user, userData, login, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showWhatsNewModal, setShowWhatsNewModal] = useState(false);
  const [showBugModal, setShowBugModal] = useState(false);
  const { shouldShowComingSoon, getWhatsNewFeatures } = useFeaturesManifest();  // Handle ESC key for modals
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showProfileModal) setShowProfileModal(false);
        if (showBugModal) setShowBugModal(false);
        if (showUserMenu) setShowUserMenu(false);
        if (showWhatsNewModal) setShowWhatsNewModal(false);
      }
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [showProfileModal, showBugModal, showUserMenu, showWhatsNewModal]);

  // Fetch pending actions count
  useEffect(() => {
    const fetchPendingCount = async () => {
      if (userData?.id && userData.isMentor) {
        const count = await NotificationService.getPendingMentorActions([userData.id]);
        setPendingCount(count);
      }
    };
    
    fetchPendingCount();
    // Set up interval to check periodically
    const interval = setInterval(fetchPendingCount, 60000); // Check every minute
    
    return () => clearInterval(interval);
  }, [userData?.id, userData?.isMentor]);

  const navigationItems: NavItem[] = [
    {
      label: 'Dashboard',
      mobileLabel: 'Home',
      path: '/student/dashboard',
      icon: Home
    },
    {
      label: 'Goals & Reflections',
      mobileLabel: 'Goals',
      path: '/goals',
      icon: Target
    },
    {
      label: 'Journey',
      mobileLabel: 'Journey',
      path: '/journey',
      icon: TrendingUp
    },
    {
      label: 'Mentor',
      mobileLabel: 'Mentor',
      path: '/mentor/dashboard',
      icon: Users,
      notificationCount: (userData?.isMentor && pendingCount > 0) ? pendingCount : undefined
    }
  ];

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  // Check if we're in admin section
  const isAdminSection = location.pathname.startsWith('/admin');
  
  // All users see the same navigation items
  const filteredNavItems = navigationItems;

  const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(path + '/');

  return (
    <>
      {/* Top Navigation Bar - Desktop & Mobile */}
      <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo and Brand */}
            <div className="flex items-center space-x-4 lg:space-x-8">
              <div className="flex-shrink-0">
                <Link to="/dashboard" className="flex items-center space-x-2">
                  <div className="w-8 h-8 flex items-center justify-center">
                    <img 
                      src="/Logomini.png" 
                      alt="CL" 
                      className="w-8 h-8 object-contain"
                    />
                  </div>
                  <span className="hidden sm:block text-base lg:text-lg font-semibold text-gray-900 truncate">
                    Campus Learning
                  </span>
                </Link>
              </div>

              {/* Desktop Navigation */}
              <div className="hidden md:flex items-center space-x-1">
                {filteredNavItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors relative ${
                        isActive(item.path)
                          ? 'bg-primary-50 text-primary-700'
                          : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                      }`}
                    >
                      <Icon className="h-4 w-4 mr-2" />
                      {item.label}
                      {item.notificationCount !== undefined && (
                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full min-w-[20px] text-center">
                          {item.notificationCount}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Right Side - User Profile */}
            <div className="flex items-center space-x-4">
              {/* Admin View Toggle Button (Desktop) */}
              {userData?.isAdmin && (
                <button
                  onClick={() => navigate(isAdminSection ? '/student/dashboard' : '/admin/dashboard')}
                  className="hidden lg:flex items-center space-x-2 px-3 lg:px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors font-medium shadow-sm text-sm"
                >
                  {isAdminSection ? (
                    <>
                      <UserCircle size={16} />
                      <span className="hidden xl:inline">Student View</span>
                    </>
                  ) : (
                    <>
                      <Shield size={16} />
                      <span className="hidden xl:inline">Admin View</span>
                    </>
                  )}
                </button>
              )}
              
              {/* Desktop User Menu */}
              <div className="hidden md:flex items-center space-x-2 lg:space-x-3 relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center space-x-2 px-2 lg:px-3 py-2 rounded-md hover:bg-gray-100 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center border border-gray-200">
                    {userData?.email ? (
                      <img 
                        src={`https://www.google.com/s2/photos/profile/${userData.email.split('@')[0]}`}
                        alt={userData.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          // Fallback to initials with house colors
                          const target = e.target as HTMLImageElement;
                          const container = target.parentElement!;
                          container.innerHTML = `
                            <div class="w-full h-full flex items-center justify-center ${
                              userData?.house === 'Bageshree' ? 'bg-blue-100' :
                              userData?.house === 'Bhairav' ? 'bg-orange-100' :
                              userData?.house === 'Malhar' ? 'bg-green-100' :
                              'bg-primary-100'
                            }">
                              <span class="text-sm font-medium ${
                                userData?.house === 'Bageshree' ? 'text-blue-700' :
                                userData?.house === 'Bhairav' ? 'text-orange-700' :
                                userData?.house === 'Malhar' ? 'text-green-700' :
                                'text-primary-700'
                              }">
                                ${userData?.name?.charAt(0)?.toUpperCase() || 'U'}
                              </span>
                            </div>
                          `;
                        }}
                      />
                    ) : (
                      <div className={`w-full h-full flex items-center justify-center ${
                        userData?.house === 'Bageshree' ? 'bg-blue-100' :
                        userData?.house === 'Bhairav' ? 'bg-orange-100' :
                        userData?.house === 'Malhar' ? 'bg-green-100' :
                        'bg-primary-100'
                      }`}>
                        <span className={`text-sm font-medium ${
                          userData?.house === 'Bageshree' ? 'text-blue-700' :
                          userData?.house === 'Bhairav' ? 'text-orange-700' :
                          userData?.house === 'Malhar' ? 'text-green-700' :
                          'text-primary-700'
                        }`}>
                          {userData?.name?.charAt(0)?.toUpperCase() || 'U'}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="text-sm text-left hidden lg:block">
                    <p className="font-medium text-gray-700 truncate max-w-24">{userData?.name}</p>
                    {userData?.isAdmin && (
                      <p className="text-xs text-gray-500">Admin</p>
                    )}
                  </div>
                  <ChevronDown size={16} className="text-gray-500" />
                </button>

                {/* User Dropdown Menu */}
                {showUserMenu && (
                  <>
                    <div 
                      className="fixed inset-0 z-10" 
                      onClick={() => setShowUserMenu(false)}
                    />
                    <div className="absolute right-0 top-12 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-20">
                      <div className="px-4 py-3 border-b border-gray-100">
                        <p className="text-sm font-medium text-gray-900">{userData?.name}</p>
                        <p className="text-xs text-gray-500 mt-1">{userData?.email}</p>
                        {userData?.isAdmin && (
                          <span className="inline-block mt-2 px-2 py-1 text-xs font-medium bg-primary-100 text-primary-700 rounded">
                            Admin
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => {
                          setShowUserMenu(false);
                          setShowProfileModal(true);
                        }}
                        className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-3"
                      >
                        <User size={16} />
                        <span>View Profile</span>
                      </button>
                      <button
                        onClick={() => {
                          setShowUserMenu(false);
                          setShowWhatsNewModal(true);
                        }}
                        className="w-full px-4 py-2 text-left text-sm text-purple-700 hover:bg-purple-50 flex items-center space-x-3"
                      >
                        <Sparkles size={16} />
                        <span>What's New!</span>
                      </button>
                      <button
                        onClick={() => {
                          setShowUserMenu(false);
                          setShowBugModal(true);
                        }}
                        className="w-full px-4 py-2 text-left text-sm text-blue-700 hover:bg-blue-50 flex items-center space-x-3"
                      >
                        <AlertCircle size={16} />
                        <span>Report a bug/Feature</span>
                      </button>
      {/* Bug/Feature Report Modal */}
      {showBugModal && (
        <BugFeatureModal onClose={() => setShowBugModal(false)} />
      )}
                      <button
                        onClick={() => {
                          setShowUserMenu(false);
                          handleSignOut();
                        }}
                        className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center space-x-3"
                      >
                        <LogOut size={16} />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </>
                )}
              </div>

              {/* Mobile Menu Button */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              >
                {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 bg-white shadow-lg">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {filteredNavItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center px-3 py-2 rounded-md text-base font-medium relative ${
                      isActive(item.path)
                        ? 'bg-primary-50 text-primary-700'
                        : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                    }`}
                  >
                    <Icon className="h-5 w-5 mr-3" />
                    {item.label}
                    {item.notificationCount !== undefined && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full min-w-[20px] text-center">
                        {item.notificationCount}
                      </span>
                    )}
                  </Link>
                );
              })}
              
              {/* Admin View Toggle (Mobile) */}
              {userData?.isAdmin && (
                <button
                  onClick={() => {
                    navigate(isAdminSection ? '/student/dashboard' : '/admin/dashboard');
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center px-3 py-2 text-base font-medium bg-primary-600 text-white hover:bg-primary-700 rounded-md mb-2"
                >
                  {isAdminSection ? (
                    <>
                      <UserCircle className="h-5 w-5 mr-3" />
                      Student View
                    </>
                  ) : (
                    <>
                      <Shield className="h-5 w-5 mr-3" />
                      Admin View
                    </>
                  )}
                </button>
              )}
              
              {/* Mobile User Section */}
              <div className="border-t border-gray-200 pt-3 mt-3">
                <div className="flex items-center px-3 py-2">
                  <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-primary-700">
                      {userData?.name?.charAt(0)?.toUpperCase() || 'U'}
                    </span>
                  </div>
                  <div className="ml-3 flex-1">
                    <p className="text-base font-medium text-gray-700">{userData?.name}</p>
                    <p className="text-sm text-gray-500">{userData?.email}</p>
                    {userData?.isAdmin && (
                      <p className="text-xs text-primary-600 font-medium">Admin</p>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    setShowProfileModal(true);
                  }}
                  className="w-full flex items-center px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-100 rounded-md mt-2"
                >
                  <User className="h-5 w-5 mr-3" />
                  View Profile
                </button>
                <button
                  onClick={() => {
                    handleSignOut();
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center px-3 py-2 text-base font-medium text-red-600 hover:bg-red-50 rounded-md mt-2"
                >
                  <LogOut className="h-5 w-5 mr-3" />
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Mobile Bottom Navigation (Instagram/YouTube style) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-30">
        <div className="flex justify-around items-center h-16">
          {filteredNavItems.slice(0, 5).map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex flex-col items-center justify-center flex-1 h-full space-y-1 relative ${
                  active ? 'text-primary-600' : 'text-gray-600'
                }`}
              >
                <Icon className={`h-6 w-6 ${active ? 'stroke-2' : 'stroke-1'}`} />
                <span className={`text-xs ${active ? 'font-semibold' : 'font-normal'}`}>
                  {item.mobileLabel || item.label}
                </span>
                {item.notificationCount !== undefined && (
                  <span className="absolute -top-1 right-1/4 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full min-w-[20px] text-center">
                    {item.notificationCount}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Profile Modal */}
      {showProfileModal && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowProfileModal(false)}
        >
          <div 
            className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">Profile</h2>
                <button
                  onClick={() => setShowProfileModal(false)}
                  className="p-1 hover:bg-gray-100 rounded-md transition-colors"
                >
                  <X size={20} className="text-gray-500" />
                </button>
              </div>
            </div>
            
            <div className="p-6">
              <div className="flex flex-col items-center mb-6">
                <div className="w-20 h-20 rounded-full flex items-center justify-center mb-3 overflow-hidden border-4 border-gray-200">
                  {userData?.email ? (
                    <img 
                      src={`https://www.google.com/s2/photos/profile/${userData.email.split('@')[0]}`}
                      alt={userData.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        // Fallback to initials with house colors
                        const target = e.target as HTMLImageElement;
                        const container = target.parentElement!;
                        container.innerHTML = `
                          <div class="w-full h-full flex items-center justify-center text-3xl font-medium text-white ${
                            userData?.house === 'Bageshree' ? 'bg-blue-300' :
                            userData?.house === 'Bhairav' ? 'bg-orange-300' :
                            userData?.house === 'Malhar' ? 'bg-green-300' :
                            'bg-primary-300'
                          }">
                            ${userData?.name?.charAt(0)?.toUpperCase() || 'U'}
                          </div>
                        `;
                      }}
                    />
                  ) : (
                    <div className={`w-full h-full flex items-center justify-center text-3xl font-medium text-white ${
                      userData?.house === 'Bageshree' ? 'bg-blue-300' :
                      userData?.house === 'Bhairav' ? 'bg-orange-300' :
                      userData?.house === 'Malhar' ? 'bg-green-300' :
                      'bg-primary-300'
                    }`}>
                      {userData?.name?.charAt(0)?.toUpperCase() || 'U'}
                    </div>
                  )}
                </div>
                <h3 className="text-xl font-semibold text-gray-900">{userData?.name}</h3>
                {userData?.isAdmin && (
                  <span className="mt-2 px-3 py-1 text-sm font-medium bg-primary-100 text-primary-700 rounded-full">
                    Administrator
                  </span>
                )}
              </div>

              <div className="space-y-4">
                <div className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                  <Mail size={20} className="text-gray-600 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-xs font-medium text-gray-500 uppercase">Email</p>
                    <p className="text-sm text-gray-900 mt-1">{userData?.email}</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                  <Calendar size={20} className="text-gray-600 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-xs font-medium text-gray-500 uppercase">Date Joined</p>
                    <p className="text-sm text-gray-900 mt-1">
                      {userData?.created_at 
                        ? new Date(userData.created_at).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })
                        : 'N/A'}
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                  <Building size={20} className="text-gray-600 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-xs font-medium text-gray-500 uppercase">Campus</p>
                    <select
                      value={userData?.campus || ''}
                      onChange={async (e) => {
                        const newCampus = e.target.value as "Dantewada" | "Dharamshala" | "Eternal" | "Jashpur" | "Kishanganj" | "Pune" | "Raigarh" | "Sarjapura" | "";
                        if (userData && !userData.campus) {
                          try {
                            await UserService.updateUser(userData.id, {
                              campus: newCampus || undefined
                            });
                            setUserData({
                              ...userData,
                              campus: newCampus || undefined
                            });
                          } catch (error) {
                            console.error('Error updating campus:', error);
                            alert('Failed to update campus. Please contact an admin for changes.');
                          }
                        }
                      }}
                      disabled={!!userData?.campus}
                      className="mt-1 block w-full pl-3 pr-10 py-2 text-sm border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 rounded-md disabled:bg-gray-100 disabled:cursor-not-allowed"
                    >
                      <option value="">Select Campus</option>
                      {[
                        'Dantewada',
                        'Dharamshala',
                        'Eternal',
                        'Jashpur',
                        'Kishanganj',
                        'Pune',
                        'Raigarh',
                        'Sarjapura'
                      ].map(campus => (
                        <option key={campus} value={campus}>{campus}</option>
                      ))}
                    </select>
                    {userData?.campus && (
                      <p className="mt-1 text-xs text-gray-500">Contact admin to change campus</p>
                    )}
                  </div>
                </div>

                {/* House selection */}
                <div className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                  <Building size={20} className="text-gray-600 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-xs font-medium text-gray-500 uppercase">House</p>
                    <select
                      value={userData?.house || ''}
                      onChange={async (e) => {
                        const newHouse = e.target.value as 'Bageshree' | 'Malhar' | 'Bhairav' | '';
                        if (userData) {
                          try {
                            await UserService.updateUser(userData.id, {
                              house: newHouse || undefined
                            });
                            setUserData({
                              ...userData,
                              house: newHouse || undefined
                            });
                          } catch (error) {
                            console.error('Error updating house:', error);
                            alert('Failed to update house. Please try again.');
                          }
                        }
                      }}
                      className="mt-1 block w-full pl-3 pr-10 py-2 text-sm border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 rounded-md"
                    >
                      <option value="">Select House</option>
                      {['Bageshree', 'Malhar', 'Bhairav'].map(house => (
                        <option key={house} value={house}>{house}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {userData?.isAdmin && (
                  <div className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                    <Shield size={20} className="text-gray-600 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-xs font-medium text-gray-500 uppercase">Role</p>
                      <p className="text-sm text-gray-900 mt-1">Administrator</p>
                    </div>
                  </div>
                )}

                {userData?.mentor_id && (
                  <div className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                    <Users size={20} className="text-gray-600 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-xs font-medium text-gray-500 uppercase">Mentor</p>
                      <p className="text-sm text-gray-900 mt-1">{userData.mentor_id}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="p-6 bg-gray-50 border-t border-gray-200 rounded-b-lg">
              <button
                onClick={() => setShowProfileModal(false)}
                className="w-full px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}