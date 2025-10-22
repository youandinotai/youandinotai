import React, {
    useState,
    useEffect,
    useCallback,
    useRef,
    useContext,
    createContext,
    useMemo,
} from "react";
// Added lucide-react icons used in Landing page
import {
    Heart,
    ShoppingBag,
    MessageCircle,
    User,
    Star,
    X,
    Send,
    ChevronLeft,
    Edit,
    Check,
    XCircle,
} from "lucide-react";

// --- Constants ---
const SWIPE_THRESHOLD = 80; // Pixels threshold to trigger action
const LIKE_COLOR = "rgba(74, 222, 128, 0.7)"; // Green
const PASS_COLOR = "rgba(248, 113, 113, 0.7)"; // Red
const SUPER_LIKE_COLOR = "rgba(96, 165, 250, 0.7)"; // Blue

// --- API Service ---
// Use the full Replit URL as the base
const API_BASE_URL = "https://uandi-not-ai-1-uandinotai.replit.app";

const apiService = {
    getToken: () => localStorage.getItem("you-and-i-token"),
    _fetch: async (urlPath, options = {}) => {
        // Renamed url to urlPath for clarity
        const token = apiService.getToken();
        const headers = {
            "Content-Type": "application/json",
            ...options.headers,
        };
        if (token) {
            headers["Authorization"] = `Bearer ${token}`;
        }
        // Construct the full URL using the URL constructor for robustness
        let fullUrl;
        try {
            // Ensure urlPath starts with a slash if it's meant to be relative to the base
            const path = urlPath.startsWith("/") ? urlPath : "/" + urlPath;
            fullUrl = new URL(path, API_BASE_URL).href;
            // console.log(`Fetching: ${options.method || 'GET'} ${fullUrl}`); // Log the URL being fetched (Uncomment for debugging)
        } catch (e) {
            console.error(
                "URL Parsing Error:",
                e,
                `Base: ${API_BASE_URL}`,
                `Path: ${urlPath}`,
            );
            throw new Error(`Invalid URL construction: ${urlPath}`);
        }

        try {
            const res = await fetch(fullUrl, { ...options, headers }); // Use fullUrl
            if (!res.ok) {
                let errorData = { error: `HTTP error! status: ${res.status}` };
                try {
                    // Try to parse error JSON from backend, but handle cases where it might not be JSON
                    const errorText = await res.text();
                    // console.error(`API Error Response Text (${res.status}):`, errorText); // Log raw error text (Uncomment for debugging)
                    try {
                        errorData = JSON.parse(errorText);
                    } catch (parseError) {
                        // Use the raw text as the error if JSON parsing fails or if it's empty
                        errorData.error =
                            errorText || `HTTP error! Status: ${res.status}`;
                    }
                } catch (e) {
                    /* Ignore text reading error if response was truly empty */
                }
                // Ensure errorData.error is a string before throwing
                const errorMessage =
                    typeof errorData.error === "string"
                        ? errorData.error
                        : `HTTP error! Status: ${res.status}`;
                console.error(`API Error (${res.status}):`, errorMessage); // Log structured error
                throw new Error(errorMessage);
            }
            if (res.status === 204) return { success: true };
            // Handle cases where the response might be empty even on success (e.g., 200 OK with no body)
            const contentType = res.headers.get("content-type");
            if (contentType && contentType.indexOf("application/json") !== -1) {
                const jsonData = await res.json().catch((e) => {
                    console.error("Failed to parse JSON response:", e);
                    throw new Error("Invalid JSON received from server."); // Throw specific error for JSON parsing failure
                });
                return jsonData;
            } else {
                // If not JSON, return success or handle as needed (e.g., return text)
                // Attempt to read text, but default to empty string if body is empty or unreadable
                const textData = await res.text().catch(() => "");
                return { success: true, data: textData };
            }
        } catch (error) {
            // Log network errors (like CORS or DNS issues) which don't have res.ok
            // Log the specific type of error if available
            console.error(
                `API Fetch Error: ${options.method || "GET"} ${fullUrl}`,
                error.name,
                error.message,
                error,
            );
            // Provide a more user-friendly network error message
            if (error instanceof TypeError && error.message.includes("fetch")) {
                // More specific check for fetch failure
                throw new Error(
                    "Network error: Could not connect to the server. Please check the backend is running and accessible.",
                );
            }
            // Re-throw other errors (including the improved HTTP errors from above)
            throw error;
        }
    },
    // Auth
    login: (email, password) =>
        apiService._fetch("/api/auth/login", {
            method: "POST",
            body: JSON.stringify({ email, password }),
        }),
    register: (userData) =>
        apiService._fetch("/api/auth/register", {
            method: "POST",
            body: JSON.stringify(userData),
        }),
    // Profile
    getProfile: () => apiService._fetch("/api/profile"),
    updateProfile: (profileData) =>
        apiService._fetch("/api/profile", {
            method: "PUT",
            body: JSON.stringify(profileData),
        }),
    // Discovery & Matching
    getDiscover: () => apiService._fetch("/api/discover"),
    like: (userId) =>
        apiService._fetch("/api/likes", {
            method: "POST",
            body: JSON.stringify({ userId, type: "regular" }),
        }),
    pass: (userId) =>
        apiService._fetch("/api/passes", {
            method: "POST",
            body: JSON.stringify({ userId }),
        }),
    superLike: (userId) =>
        apiService._fetch("/api/payments/super-like", {
            method: "POST",
            body: JSON.stringify({ userId }),
        }),
    // Matches & Chat
    getMatches: () => apiService._fetch("/api/matches"),
    getMessages: (conversationId) =>
        apiService._fetch(
            `/api/messages/conversations/${conversationId}/messages`,
        ),
    sendMessage: (conversationId, content) =>
        apiService._fetch(
            `/api/messages/conversations/${conversationId}/messages`,
            { method: "POST", body: JSON.stringify({ content }) },
        ),
};

// --- Authentication Context ---
const AuthContext = createContext(null);
const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(() => apiService.getToken());
    const [authLoading, setAuthLoading] = useState(true);
    const [showOnboarding, setShowOnboarding] = useState(
        () => !localStorage.getItem("onboarding_completed"),
    ); // Simplified onboarding check

    useEffect(() => {
        const validateToken = async () => {
            if (token) {
                try {
                    const profileData = await apiService.getProfile();
                    setUser({
                        email: profileData.email,
                        firstName: profileData.first_name,
                        id: profileData.id,
                    });
                    setShowOnboarding(false); // Assume onboarded if token is valid
                    localStorage.setItem("onboarding_completed", "true");
                } catch (error) {
                    console.error("Token validation failed:", error.message);
                    localStorage.removeItem("you-and-i-token");
                    setToken(null);
                    // Don't reset onboarding if token validation fails, maybe they just need to log in again
                }
            }
            setAuthLoading(false);
        };
        validateToken();
    }, [token]);

    const login = async (email, password) => {
        const { token: newToken, user: userData } = await apiService.login(
            email,
            password,
        );
        localStorage.setItem("you-and-i-token", newToken);
        setToken(newToken);
        setUser(userData);
        setShowOnboarding(false); // Reset onboarding state on login
        localStorage.setItem("onboarding_completed", "true");
    };

    const register = async (userData) => {
        const { token: newToken, user: registeredUser } =
            await apiService.register(userData);
        localStorage.setItem("you-and-i-token", newToken);
        setToken(newToken);
        setUser(registeredUser);
        setShowOnboarding(true); // Show onboarding after registration
        localStorage.removeItem("onboarding_completed"); // Ensure onboarding shows for new user
    };

    const logout = () => {
        localStorage.removeItem("you-and-i-token");
        localStorage.removeItem("onboarding_completed"); // Clear onboarding on logout
        setToken(null);
        setUser(null);
        setShowOnboarding(true); // Default to showing onboarding state after logout
    };

    // Functions to manage onboarding state, replacing useOnboarding hook
    const completeOnboarding = () => {
        setShowOnboarding(false);
        localStorage.setItem("onboarding_completed", "true");
    };
    const skipOnboarding = () => {
        setShowOnboarding(false);
        localStorage.setItem("onboarding_completed", "true"); // Treat skipping as completing for now
    };

    const value = useMemo(
        () => ({
            user,
            token,
            isLoading: authLoading,
            login,
            register,
            logout,
            showOnboarding,
            completeOnboarding,
            skipOnboarding,
        }),
        [user, token, authLoading, showOnboarding],
    );

    return (
        <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
    );
};
const useAuth = () => useContext(AuthContext);

// --- Profile Context ---
const ProfileContext = createContext(null);
const ProfileProvider = ({ children }) => {
    const [profile, setProfile] = useState(null);
    const [profileLoading, setProfileLoading] = useState(false);
    const [profileError, setProfileError] = useState("");
    const { token } = useAuth();

    const fetchProfile = useCallback(async () => {
        if (!token) return; // Don't fetch if not logged in
        setProfileLoading(true);
        setProfileError("");
        try {
            const data = await apiService.getProfile();
            setProfile(data);
        } catch (err) {
            setProfileError(err.message);
        } finally {
            setProfileLoading(false);
        }
    }, [token]);

    useEffect(() => {
        fetchProfile();
    }, [fetchProfile]);

    const updateProfile = async (profileData) => {
        setProfileLoading(true);
        setProfileError("");
        try {
            const updatedProfile = await apiService.updateProfile(profileData);
            setProfile(updatedProfile);
            return true; // Indicate success
        } catch (err) {
            setProfileError(err.message);
            return false; // Indicate failure
        } finally {
            setProfileLoading(false);
        }
    };

    const value = useMemo(
        () => ({
            profile,
            isLoading: profileLoading,
            error: profileError,
            fetchProfile,
            updateProfile,
        }),
        [profile, profileLoading, profileError, fetchProfile],
    );

    return (
        <ProfileContext.Provider value={value}>
            {children}
        </ProfileContext.Provider>
    );
};
const useProfile = () => useContext(ProfileContext);

// --- Matches Context ---
const MatchesContext = createContext(null);
const MatchesProvider = ({ children }) => {
    const [matches, setMatches] = useState([]);
    const [matchesLoading, setMatchesLoading] = useState(false);
    const [matchesError, setMatchesError] = useState("");
    const { token } = useAuth();

    const fetchMatches = useCallback(async () => {
        if (!token) return;
        setMatchesLoading(true);
        setMatchesError("");
        try {
            const data = await apiService.getMatches();
            setMatches(data.matches || []);
        } catch (err) {
            setMatchesError(err.message);
        } finally {
            setMatchesLoading(false);
        }
    }, [token]);

    useEffect(() => {
        fetchMatches();
        // Placeholder for WebSocket listener to update matches in real-time
        // const ws = getWebSocket();
        // ws?.on('newMatch', (newMatchData) => {
        //     setMatches(prev => [newMatchData, ...prev]);
        // });
        // return () => ws?.off('newMatch');
    }, [fetchMatches]);

    const value = useMemo(
        () => ({
            matches,
            isLoading: matchesLoading,
            error: matchesError,
            fetchMatches,
        }),
        [matches, matchesLoading, matchesError, fetchMatches],
    );

    return (
        <MatchesContext.Provider value={value}>
            {children}
        </MatchesContext.Provider>
    );
};
const useMatches = () => useContext(MatchesContext);

// --- WebSocket Context (Placeholder) ---
// const WebSocketContext = createContext(null);
// const WebSocketProvider = ({ children }) => { /* ... */ };
// const useWebSocket = () => useContext(WebSocketContext);

// --- ICON COMPONENTS (using lucide-react names) ---
const HeartIcon = Heart;
const XIcon = X;
const StarIcon = Star;
const MessageCircleIcon = MessageCircle;
const UserIcon = User;
const SendIcon = Send;
const ChevronLeftIcon = ChevronLeft;
const EditIcon = Edit;
const CheckIcon = Check;
const XCircleIcon = XCircle;
const ShoppingBagIcon = ShoppingBag; // Added from Landing
// Removed duplicate/inline SVG icons

// --- GENERIC UI COMPONENTS --- //
const Spinner = () => (
    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-pink-500"></div>
);
const FullPageSpinner = () => (
    <div className="flex-1 h-full flex items-center justify-center bg-stone-100">
        <Spinner />
    </div>
);
const ErrorMessage = ({ message }) => (
    <p className="text-red-600 text-sm text-center py-2 font-medium bg-red-100 border border-red-200 rounded-lg">
        {message || "An unexpected error occurred."}
    </p>
);
// Adapted Button component from Landing page style
const Button = ({
    children,
    onClick,
    disabled = false,
    isLoading = false,
    variant = "primary",
    className = "",
    size = "md",
    ...props
}) => {
    const baseStyle =
        "font-bold rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 inline-flex items-center justify-center shadow-sm hover:shadow";
    const sizeStyles = {
        sm: "py-2 px-4 text-sm",
        md: "py-3 px-6 text-base", // Adjusted default padding
        lg: "py-4 px-8 text-lg", // Added large size like landing page button
    };
    const variantStyles = {
        primary: "bg-red-500 hover:bg-red-600 text-white focus:ring-red-500", // Changed primary to red like landing
        secondary:
            "bg-white border border-stone-300 text-slate-700 hover:bg-stone-50 focus:ring-red-500",
        danger: "bg-stone-700 hover:bg-stone-800 text-white focus:ring-stone-500", // Changed danger to dark grey like logout
        ghost: "bg-transparent hover:bg-stone-100 text-slate-700 focus:ring-red-500 shadow-none hover:shadow-none",
    };
    return (
        <button
            onClick={onClick}
            disabled={disabled || isLoading}
            className={`${baseStyle} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
            {...props}
        >
            {isLoading ? <Spinner /> : children}
        </button>
    );
};

const Modal = ({ children, onClose, title } /* ... (same as before) ... */) => (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-fade-in">
        <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-lg relative transform transition-transform duration-300 scale-95 animate-slide-up">
            {title && (
                <h2 className="text-xl font-bold text-slate-800 mb-4">
                    {title}
                </h2>
            )}
            <button
                onClick={onClose}
                className="absolute top-3 right-3 text-stone-400 hover:text-stone-600 p-1 rounded-full hover:bg-stone-100 transition-colors"
            >
                <XIcon className="w-6 h-6" />
            </button>
            {children}
        </div>
    </div>
);
const MatchModal = ({ profile, onClose } /* ... (same as before) ... */) => (
    <Modal onClose={onClose}>
        <div className="text-center">
            <h2 className="text-3xl font-bold text-pink-500 mb-4">
                It's a Match!
            </h2>{" "}
            {/* Kept pink for match emphasis */}
            <p className="text-lg text-slate-700 mb-4">
                You and {profile.first_name} liked each other.
            </p>
            <div className="flex justify-center space-x-4 mb-6">
                <img
                    src={profile.primary_photo}
                    alt={profile.first_name}
                    className="w-24 h-24 rounded-full object-cover border-4 border-pink-500"
                />
            </div>
            <Button onClick={onClose} className="w-full">
                {" "}
                Keep Swiping{" "}
            </Button>
        </div>
    </Modal>
);

// Simplified Onboarding Tutorial Modal (replaces external component)
const OnboardingTutorial = ({ isVisible, onComplete, onSkip }) => {
    if (!isVisible) return null;
    // Basic placeholder, replace with actual tutorial steps if needed
    return (
        <Modal onClose={onSkip} title="Welcome to You&I NotAI!">
            <div className="text-center space-y-4">
                <p className="text-slate-700">
                    Let's quickly show you how things work.
                </p>
                {/* Add tutorial content here */}
                <p className="text-sm text-stone-500">
                    (Tutorial steps would go here)
                </p>
                <Button onClick={onComplete} className="w-full">
                    {" "}
                    Got It!{" "}
                </Button>
                <Button
                    onClick={onSkip}
                    variant="ghost"
                    className="w-full text-sm"
                >
                    {" "}
                    Skip Tutorial{" "}
                </Button>
            </div>
        </Modal>
    );
};

// --- AUTH PAGES --- //
// Simplified Logo component (replaces external component)
const Logo = ({ size = "md", className = "" }) => {
    const sizeClasses = {
        sm: "w-8 h-8",
        md: "w-10 h-10",
        lg: "w-12 h-12",
        xl: "w-16 h-16",
    };
    return (
        // Placeholder simple logo - replace with actual SVG or styled div if needed
        <div
            className={`bg-gradient-to-br from-red-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold shadow-md ${sizeClasses[size]} ${className}`}
        >
            Y&I
        </div>
    );
};
const AuthHeader = () => (
    /* ... (same as before, uses updated tagline) ... */
    <div className="text-center mb-8">
        <div className="mb-6 flex items-center justify-center">
            <Logo
                size="xl"
                className="transform hover:scale-105 transition-transform duration-300"
            />
        </div>
        <div className="text-5xl sm:text-6xl font-extrabold text-slate-800 flex items-center justify-center tracking-tighter">
            <span>You</span>
            <span className="text-red-500 text-6xl sm:text-7xl -mx-2">&</span>
            <span>I</span>
            <div className="text-2xl sm:text-3xl font-bold text-slate-400 line-through ml-2">
                NotAI
            </div>
        </div>
        <p className="text-slate-500 mt-2 text-sm sm:text-base">
            Connect with Actual Humans, Not Algorithms.
        </p>
    </div>
);
function AuthPageLayout({ children, showStoreButton = false, navigateTo }) {
    // Added showStoreButton & navigateTo
    return (
        <div className="min-h-screen bg-stone-100 text-slate-800 flex items-center justify-center p-4 relative animate-fade-in">
            {showStoreButton && (
                <button
                    onClick={() => console.log("Navigate to Store page/modal")} // Update later if store integrated
                    className="absolute top-4 right-4 sm:top-6 sm:right-6 p-2 sm:p-3 bg-white border border-stone-200 hover:bg-stone-50 rounded-full transition-all duration-300 z-10 shadow-sm hover:shadow-md"
                    title="Visit Store"
                >
                    <ShoppingBagIcon className="w-5 h-5 sm:w-6 sm:h-6 text-slate-700" />
                </button>
            )}
            <div className="w-full max-w-md">
                {children}{" "}
                {/* AuthHeader is now called within specific pages */}
            </div>
        </div>
    );
}

// New Landing Page Component
function LandingPage({ navigateTo }) {
    const { showOnboarding, completeOnboarding, skipOnboarding } = useAuth(); // Use state from AuthContext

    return (
        <AuthPageLayout showStoreButton={true} navigateTo={navigateTo}>
            <AuthHeader />
            <div className="bg-white p-8 rounded-2xl shadow-lg border border-stone-200 animate-slide-in-up">
                <h2 className="text-2xl font-bold mb-6 text-center text-slate-700">
                    Get Started
                </h2>
                <div className="space-y-4">
                    <Button
                        onClick={() => navigateTo("login")} // Navigate to login page
                        size="lg" // Use large button size
                        className="w-full"
                    >
                        <HeartIcon className="w-5 h-5 mr-2" />
                        Start Dating / Login
                    </Button>

                    <div className="my-6 flex items-center">
                        <div className="flex-grow border-t border-stone-300"></div>
                        <span className="mx-4 text-stone-500 text-sm">
                            Features
                        </span>
                        <div className="flex-grow border-t border-stone-300"></div>
                    </div>

                    {/* Feature highlights */}
                    <div className="grid grid-cols-3 gap-4 text-center">
                        <div className="flex flex-col items-center">
                            <div className="w-12 h-12 bg-stone-100 rounded-full flex items-center justify-center mb-2">
                                {" "}
                                <HeartIcon className="w-6 h-6 text-red-500" />{" "}
                            </div>
                            <span className="text-xs text-slate-600">
                                Real Profiles
                            </span>
                        </div>
                        <div className="flex flex-col items-center">
                            <div className="w-12 h-12 bg-stone-100 rounded-full flex items-center justify-center mb-2">
                                {" "}
                                <MessageCircleIcon className="w-6 h-6 text-red-500" />{" "}
                            </div>
                            <span className="text-xs text-slate-600">
                                Direct Chat
                            </span>
                        </div>
                        <div className="flex flex-col items-center">
                            <div className="w-12 h-12 bg-stone-100 rounded-full flex items-center justify-center mb-2">
                                {" "}
                                <ShoppingBagIcon className="w-6 h-6 text-red-500" />{" "}
                            </div>
                            <span className="text-xs text-slate-600">
                                Brand Store
                            </span>
                        </div>
                    </div>
                </div>
            </div>
            <p className="text-center text-stone-500 mt-6 text-sm">
                New user?{" "}
                <button
                    onClick={() => navigateTo("register")}
                    className="font-semibold text-red-500 hover:underline"
                >
                    Sign Up Here
                </button>
            </p>
            {/* Onboarding Tutorial Modal */}
            <OnboardingTutorial
                isVisible={showOnboarding}
                onComplete={completeOnboarding}
                onSkip={skipOnboarding}
            />
        </AuthPageLayout>
    );
}

function LoginPage({ navigateTo }) {
    /* ... (mostly same as before, uses AuthPageLayout) ... */
    const { login } = useAuth();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setIsLoading(true);
        try {
            await login(email, password);
        } catch (err) {
            setError(err.message || "Login failed. Please check credentials.");
        } finally {
            setIsLoading(false);
        }
    };
    return (
        <AuthPageLayout navigateTo={navigateTo}>
            {" "}
            <AuthHeader />{" "}
            <div className="bg-white p-8 rounded-2xl shadow-lg border border-stone-200">
                {" "}
                <h2 className="text-2xl font-bold mb-6 text-center text-slate-700">
                    Log In
                </h2>{" "}
                <form onSubmit={handleSubmit} className="space-y-6">
                    {" "}
                    <input
                        type="email"
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-stone-100 text-slate-800 px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                        required
                    />{" "}
                    <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-stone-100 text-slate-800 px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                        required
                    />{" "}
                    {error && <ErrorMessage message={error} />}{" "}
                    <Button
                        type="submit"
                        disabled={isLoading}
                        isLoading={isLoading}
                        className="w-full"
                    >
                        {" "}
                        Log In{" "}
                    </Button>{" "}
                </form>{" "}
                <div className="my-6 flex items-center">
                    <div className="flex-grow border-t border-stone-300"></div>
                    <span className="mx-4 text-stone-500 text-sm">OR</span>
                    <div className="flex-grow border-t border-stone-300"></div>
                </div>{" "}
                <Button
                    onClick={() => console.log("Signing in with Google...")}
                    variant="secondary"
                    className="w-full flex items-center justify-center space-x-2"
                >
                    {" "}
                    <GoogleIcon className="w-6 h-6" />{" "}
                    <span>Sign in with Google</span>{" "}
                </Button>{" "}
                <p className="text-center text-stone-500 mt-6">
                    {" "}
                    Don't have an account?{" "}
                    <button
                        onClick={() => navigateTo("register")}
                        className="font-semibold text-red-500 hover:underline"
                    >
                        {" "}
                        Sign Up{" "}
                    </button>{" "}
                </p>{" "}
            </div>
        </AuthPageLayout>
    );
}
function RegistrationPage({ navigateTo }) {
    /* ... (mostly same as before, uses AuthPageLayout) ... */
    const { register } = useAuth();
    const [formData, setFormData] = useState({
        firstName: "",
        email: "",
        password: "",
        confirmPassword: "",
        dateOfBirth: "",
    });
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (formData.password !== formData.confirmPassword) {
            setError("Passwords do not match.");
            return;
        }
        setError("");
        setIsLoading(true);
        try {
            const { password, confirmPassword, ...apiData } = formData;
            await register({
                ...apiData,
                password: password,
                gender: "prefer-not-to-say",
                interestedIn: ["male", "female", "non-binary", "other"],
            });
        } catch (err) {
            setError(err.message || "Registration failed. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };
    return (
        <AuthPageLayout navigateTo={navigateTo}>
            {" "}
            <AuthHeader />{" "}
            <div className="bg-white p-8 rounded-2xl shadow-lg border border-stone-200">
                <h2 className="text-2xl font-bold mb-6 text-center text-slate-700">
                    Create Account
                </h2>{" "}
                <form onSubmit={handleSubmit} className="space-y-4">
                    {" "}
                    <input
                        type="text"
                        name="firstName"
                        placeholder="First Name"
                        value={formData.firstName}
                        onChange={handleChange}
                        className="w-full bg-stone-100 text-slate-800 px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                        required
                    />{" "}
                    <input
                        type="email"
                        name="email"
                        placeholder="Email"
                        value={formData.email}
                        onChange={handleChange}
                        className="w-full bg-stone-100 text-slate-800 px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                        required
                    />{" "}
                    <input
                        type="password"
                        name="password"
                        placeholder="Password"
                        value={formData.password}
                        onChange={handleChange}
                        className="w-full bg-stone-100 text-slate-800 px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                        required
                    />{" "}
                    <input
                        type="password"
                        name="confirmPassword"
                        placeholder="Confirm Password"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        className="w-full bg-stone-100 text-slate-800 px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                        required
                    />{" "}
                    <div>
                        <label
                            htmlFor="dateOfBirth"
                            className="text-sm text-stone-500 mb-1 block"
                        >
                            Date of Birth
                        </label>
                        <input
                            id="dateOfBirth"
                            type="date"
                            name="dateOfBirth"
                            value={formData.dateOfBirth}
                            onChange={handleChange}
                            className="w-full bg-stone-100 text-slate-800 px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                            required
                        />
                    </div>{" "}
                    {error && <ErrorMessage message={error} />}{" "}
                    <Button
                        type="submit"
                        disabled={isLoading}
                        isLoading={isLoading}
                        className="w-full mt-4"
                    >
                        {" "}
                        Sign Up{" "}
                    </Button>{" "}
                </form>{" "}
                <div className="my-6 flex items-center">
                    <div className="flex-grow border-t border-stone-300"></div>
                    <span className="mx-4 text-stone-500 text-sm">OR</span>
                    <div className="flex-grow border-t border-stone-300"></div>
                </div>{" "}
                <Button
                    onClick={() => console.log("Signing up with Google...")}
                    variant="secondary"
                    className="w-full flex items-center justify-center space-x-2"
                >
                    {" "}
                    <GoogleIcon className="w-6 h-6" />{" "}
                    <span>Sign up with Google</span>{" "}
                </Button>{" "}
                <p className="text-center text-stone-500 mt-6">
                    {" "}
                    Already have an account?{" "}
                    <button
                        onClick={() => navigateTo("login")}
                        className="font-semibold text-red-500 hover:underline"
                    >
                        {" "}
                        Log In{" "}
                    </button>{" "}
                </p>{" "}
            </div>
        </AuthPageLayout>
    );
}

// --- Custom Swipe Hook ---
const useSwipe = (onSwipeLeft, onSwipeRight, onSwipeUp) => {
    /* ... (same as before) ... */
    const cardRef = useRef(null);
    const [dragStart, setDragStart] = useState(null);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [transition, setTransition] = useState("transform 0.3s ease-out");

    const resetCardPosition = useCallback(() => {
        setTransition("transform 0.3s ease-out");
        setIsDragging(false);
        setDragOffset({ x: 0, y: 0 });
        setDragStart(null);
    }, []);

    const triggerAction = useCallback(
        (action) => {
            let finalX = 0,
                finalY = 0;
            if (action === "like") finalX = window.innerWidth;
            if (action === "pass") finalX = -window.innerWidth;
            if (action === "super") finalY = -window.innerHeight / 1.5;

            setTransition("transform 0.3s ease-out"); // Ensure transition is on for the animation
            setIsDragging(false); // Stop manual drag style updates
            setDragOffset({ x: finalX, y: finalY });

            setTimeout(() => {
                if (action === "like" && onSwipeRight) onSwipeRight();
                if (action === "pass" && onSwipeLeft) onSwipeLeft();
                if (action === "super" && onSwipeUp) onSwipeUp();
                // Reset after animation
                setTimeout(() => {
                    setTransition("none"); // Turn off transition for instant reset
                    resetCardPosition();
                    setTimeout(
                        () => setTransition("transform 0.3s ease-out"),
                        50,
                    ); // Restore transition
                }, 50); // Short delay before reset to allow callback to process
            }, 300); // Duration of the swipe out animation
        },
        [onSwipeLeft, onSwipeRight, onSwipeUp, resetCardPosition],
    );

    const handleDragStart = useCallback((e) => {
        // Allow clicks on buttons/links inside the card if needed, otherwise prevent default
        // if (e.target.tagName === 'BUTTON' || e.target.tagName === 'A') return;
        e.preventDefault();
        setTransition("none"); // Turn off transition during drag
        const point = e.touches ? e.touches[0] : e;
        setDragStart({ x: point.clientX, y: point.clientY });
        setIsDragging(true);
    }, []);

    const handleDragMove = useCallback(
        (e) => {
            if (!isDragging || !dragStart) return;
            e.preventDefault();
            const point = e.touches ? e.touches[0] : e;
            setDragOffset({
                x: point.clientX - dragStart.x,
                y: point.clientY - dragStart.y,
            });
        },
        [isDragging, dragStart],
    );

    const handleDragEnd = useCallback(
        (e) => {
            if (!isDragging) return;
            setIsDragging(false); // Do this first
            setTransition("transform 0.3s ease-out"); // Turn transition back on

            if (Math.abs(dragOffset.x) > SWIPE_THRESHOLD) {
                triggerAction(dragOffset.x > 0 ? "like" : "pass");
            } else if (dragOffset.y < -SWIPE_THRESHOLD && onSwipeUp) {
                // Check for upward swipe
                triggerAction("super");
            } else {
                resetCardPosition(); // Snap back if below threshold
            }
            setDragStart(null);
        },
        [isDragging, dragOffset, onSwipeUp, resetCardPosition, triggerAction],
    );

    const getCardStyle = useMemo(() => {
        const rotation = dragOffset.x * 0.05; // Reduced rotation
        return {
            transform: `translate(${dragOffset.x}px, ${dragOffset.y}px) rotate(${rotation}deg)`,
            transition: transition,
            cursor: isDragging ? "grabbing" : "grab",
        };
    }, [dragOffset, isDragging, transition]);

    const getOverlayStyle = useMemo(() => {
        const opacityX = Math.min(
            Math.abs(dragOffset.x) / SWIPE_THRESHOLD,
            0.7,
        );
        const opacityY = Math.min(
            Math.abs(dragOffset.y) / SWIPE_THRESHOLD,
            0.7,
        ); // Opacity for vertical drag
        let opacity = Math.max(opacityX, opacityY); // Use the stronger opacity
        let backgroundColor = "transparent";

        // Determine color based on dominant drag direction
        if (
            Math.abs(dragOffset.y) > Math.abs(dragOffset.x) &&
            dragOffset.y < -10
        ) {
            backgroundColor = SUPER_LIKE_COLOR; // Super like vertical
            opacity = opacityY;
        } else if (dragOffset.x > 10) {
            backgroundColor = LIKE_COLOR; // Like horizontal
            opacity = opacityX;
        } else if (dragOffset.x < -10) {
            backgroundColor = PASS_COLOR; // Pass horizontal
            opacity = opacityX;
        }

        return {
            opacity: opacity,
            backgroundColor: backgroundColor,
            transition: "opacity 0.1s ease-out",
        };
    }, [dragOffset]);

    const handlers = useMemo(
        () => ({
            ref: cardRef,
            style: getCardStyle(),
            onMouseDown: handleDragStart,
            onTouchStart: handleDragStart,
            onMouseMove: handleDragMove,
            onTouchMove: handleDragMove,
            onMouseUp: handleDragEnd,
            onMouseLeave: handleDragEnd, // Handle mouse leaving card mid-drag
            onTouchEnd: handleDragEnd,
            onTouchCancel: handleDragEnd, // Handle touch cancel
        }),
        [getCardStyle, handleDragStart, handleDragMove, handleDragEnd],
    );

    return { handlers, triggerAction, getOverlayStyle };
};

// --- MAIN APP PAGES --- //

function ProfileCard({ profile, handlers, overlayStyle, onClick }) {
    /* ... (same as before) ... */
    if (!profile) return null;
    return (
        <div
            {...handlers}
            onClick={onClick} // Allow clicking the card
            className="absolute inset-0 bg-cover bg-center rounded-2xl shadow-lg overflow-hidden select-none" // Added select-none
            style={{
                ...handlers.style,
                backgroundImage: `url(${profile.primary_photo})`,
            }}
            // Prevent default drag behavior which can interfere
            onDragStart={(e) => e.preventDefault()}
        >
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
            {/* Swipe Overlay */}
            <div
                className="absolute inset-0 pointer-events-none rounded-2xl"
                style={overlayStyle}
            ></div>
            {/* Content */}
            <div className="absolute bottom-0 left-0 p-4 sm:p-6 text-white w-full pointer-events-none">
                {" "}
                {/* Prevent text selection */}
                <h2 className="text-2xl sm:text-3xl font-bold">
                    {profile.first_name}, {profile.age}
                </h2>
                <p className="text-stone-300 text-sm">{profile.occupation}</p>
                <p className="mt-2 text-stone-200 text-sm sm:text-base line-clamp-2">
                    {profile.bio}
                </p>
            </div>
        </div>
    );
}
function ProfileDetailView({ profile, onClose }) {
    /* ... (same as before) ... */
    if (!profile) return null;
    return (
        <Modal onClose={onClose} title={`${profile.first_name}'s Profile`}>
            <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
                <img
                    src={profile.primary_photo}
                    alt={profile.first_name}
                    className="w-full h-64 object-cover rounded-lg mb-4"
                />
                <h2 className="text-2xl font-bold">
                    {profile.first_name}, {profile.age}
                </h2>
                <p className="text-stone-500">
                    {profile.occupation} - {profile.location_city}
                </p>
                <p className="text-slate-700">{profile.bio}</p>
                {/* Add more details like interests, photos etc. */}
                <Button
                    onClick={onClose}
                    variant="ghost"
                    className="w-full mt-4"
                >
                    Close
                </Button>
            </div>
        </Modal>
    );
}
function DiscoveryPage() {
    /* ... (mostly same as before) ... */
    const [profiles, setProfiles] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");
    const [matchInfo, setMatchInfo] = useState(null);
    const [viewingProfile, setViewingProfile] = useState(null); // State for profile detail view

    const fetchProfiles = useCallback(() => {
        setIsLoading(true);
        setError("");
        apiService
            .getDiscover()
            .then((data) => {
                setProfiles(data.profiles || []);
                setCurrentIndex(0); // Reset index on new fetch
                setViewingProfile(null); // Close detail view if open
            })
            .catch((err) => {
                setError(err.message);
                console.error("Fetch Profiles Error:", err);
            })
            .finally(() => {
                setIsLoading(false);
            });
    }, []);

    useEffect(() => {
        fetchProfiles();
    }, [fetchProfiles]);

    const handleSwipe = useCallback(
        async (action, profileId) => {
            // Prevent action if detail view is open
            if (viewingProfile) return;

            let apiCall;
            const profile = profiles.find((p) => p.id === profileId);
            if (!profile) return; // Exit if profile not found (edge case)

            if (action === "like") apiCall = apiService.like(profileId);
            else if (action === "pass") apiCall = apiService.pass(profileId);
            else if (action === "super")
                apiCall = apiService.superLike(profileId);
            else return;

            // Immediately advance the index visually, handle result later
            setCurrentIndex((prev) => prev + 1);

            try {
                const res = await apiCall;
                if (action === "like" && res.isMatch) {
                    setMatchInfo(profile); // Show match modal using the profile data we already have
                }
            } catch (err) {
                console.error(`Failed to ${action}:`, err.message);
                setError(`Failed to ${action}. Please try again later.`);
                // Optionally: Implement an "undo" feature or revert index if API fails,
                // but for simplicity, we let the card disappear.
            }
        },
        [profiles, currentIndex, viewingProfile],
    ); // Added viewingProfile dependency

    const { handlers, triggerAction, getOverlayStyle } = useSwipe(
        () => handleSwipe("pass", profiles[currentIndex]?.id), // onSwipeLeft
        () => handleSwipe("like", profiles[currentIndex]?.id), // onSwipeRight
        () => handleSwipe("super", profiles[currentIndex]?.id), // onSwipeUp
    );

    if (isLoading) return <FullPageSpinner />;

    const currentProfile = profiles[currentIndex];
    const nextProfile = profiles[currentIndex + 1];

    // Handle opening profile detail
    const openProfileDetail = useCallback(() => {
        // Prevent opening detail view while dragging/swiping
        if (
            !handlers.ref.current ||
            handlers.style.transform?.includes("translate")
        )
            return;
        if (currentProfile) {
            setViewingProfile(currentProfile);
        }
    }, [currentProfile, handlers.ref, handlers.style]);

    if (!currentProfile && !isLoading) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center bg-stone-100 text-slate-800 p-4 text-center">
                {" "}
                <h2 className="text-2xl font-bold mb-4">
                    That's everyone for now!
                </h2>{" "}
                <p className="text-stone-500">
                    Check back later for new profiles.
                </p>{" "}
                <Button onClick={fetchProfiles} className="mt-6">
                    {" "}
                    Refresh Profiles{" "}
                </Button>{" "}
                {error && <ErrorMessage message={error} />}{" "}
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col p-2 sm:p-4 bg-stone-100 overflow-hidden touch-none relative">
            {matchInfo && (
                <MatchModal
                    profile={matchInfo}
                    onClose={() => setMatchInfo(null)}
                />
            )}
            {viewingProfile && (
                <ProfileDetailView
                    profile={viewingProfile}
                    onClose={() => setViewingProfile(null)}
                />
            )}
            {error && (
                <div className="absolute top-2 left-1/2 transform -translate-x-1/2 z-20 w-full max-w-sm px-4">
                    <ErrorMessage message={error} />
                </div>
            )}

            <div
                className={`flex-1 flex items-center justify-center relative transition-opacity duration-300 ${viewingProfile ? "opacity-0 pointer-events-none" : "opacity-100"}`}
            >
                {/* Card Stack */}
                <div className="relative w-full max-w-sm h-[70vh] sm:h-[65vh] max-h-[600px]">
                    {/* Next Card (behind) */}
                    {nextProfile && (
                        <div
                            className="absolute inset-0 bg-cover bg-center rounded-2xl shadow-md scale-95 opacity-70 transition-transform duration-300"
                            style={{
                                backgroundImage: `url(${nextProfile.primary_photo})`,
                            }}
                        >
                            <div className="absolute inset-0 bg-stone-100/30 rounded-2xl"></div>
                        </div>
                    )}
                    {/* Current Card (top) */}
                    {currentProfile && (
                        <ProfileCard
                            profile={currentProfile}
                            handlers={handlers}
                            overlayStyle={getOverlayStyle()}
                            onClick={openProfileDetail} // Open detail view on click
                        />
                    )}
                </div>
            </div>

            {/* Action Buttons */}
            <div
                className={`flex justify-center items-center space-x-4 sm:space-x-6 py-4 sm:py-6 transition-opacity duration-300 ${viewingProfile ? "opacity-0 pointer-events-none" : "opacity-100"}`}
            >
                <Button
                    onClick={() => triggerAction("pass")}
                    variant="secondary"
                    className="p-4 sm:p-5 rounded-full !text-red-500 shadow-md"
                >
                    {" "}
                    <XIcon className="w-7 h-7 sm:w-8 sm:h-8" />{" "}
                </Button>
                <Button
                    onClick={() => triggerAction("super")}
                    variant="secondary"
                    className="p-3 sm:p-4 rounded-full !text-blue-500 shadow-md"
                >
                    {" "}
                    <StarIcon className="w-5 h-5 sm:w-6 sm:h-6" />{" "}
                </Button>
                <Button
                    onClick={() => triggerAction("like")}
                    variant="secondary"
                    className="p-4 sm:p-5 rounded-full !text-green-500 shadow-md"
                >
                    {" "}
                    <HeartIcon className="w-7 h-7 sm:w-8 sm:h-8" />{" "}
                </Button>
            </div>
        </div>
    );
}
function MatchesPage({ navigateTo, onChatSelect }) {
    /* ... (mostly same as before) ... */
    const { matches, isLoading, error, fetchMatches } = useMatches();

    return (
        <div className="flex-1 flex flex-col bg-white text-slate-800 h-full">
            <header className="p-4 border-b border-stone-200 sticky top-0 bg-white/90 backdrop-blur-sm z-10">
                <h1 className="text-xl font-bold">Matches & Messages</h1>
            </header>
            <div className="flex-1 overflow-y-auto">
                {isLoading && (
                    <div className="p-4 text-center text-stone-500">
                        Loading matches...
                    </div>
                )}
                {error && (
                    <div className="p-4">
                        <ErrorMessage message={error} />
                        <Button
                            onClick={fetchMatches}
                            className="mt-2 mx-auto block"
                            size="sm"
                        >
                            Retry
                        </Button>
                    </div>
                )}
                {!isLoading && !error && matches.length === 0 && (
                    <div className="p-4 text-center text-stone-500">
                        You have no matches yet. Keep swiping!
                    </div>
                )}
                {!isLoading &&
                    !error &&
                    matches.map((match) => (
                        <div
                            key={match.other_user_id}
                            className="flex items-center p-4 border-b border-stone-200 hover:bg-stone-50 cursor-pointer"
                            onClick={() => onChatSelect(match)}
                        >
                            <img
                                src={
                                    match.photo ||
                                    `https://placehold.co/100x100/cccccc/ffffff?text=${match.first_name?.[0] || "?"}`
                                } // Fallback image
                                alt={match.first_name}
                                className="w-14 h-14 rounded-full object-cover flex-shrink-0"
                            />
                            <div className="flex-1 ml-4 overflow-hidden">
                                <div className="flex justify-between items-baseline">
                                    <h3 className="font-bold truncate mr-2">
                                        {match.first_name}
                                    </h3>
                                    <span className="text-xs text-stone-500 flex-shrink-0">
                                        {match.last_message_at
                                            ? new Date(
                                                  match.last_message_at,
                                              ).toLocaleTimeString([], {
                                                  hour: "2-digit",
                                                  minute: "2-digit",
                                              })
                                            : ""}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center mt-1">
                                    <p className="text-sm text-stone-500 truncate">
                                        {match.last_message || "New Match!"}
                                    </p>
                                    {match.unread_count > 0 && (
                                        <span className="bg-pink-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0 ml-2">
                                            {match.unread_count}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
            </div>
        </div>
    );
}
function ChatPage({ match, onBack }) {
    /* ... (mostly same as before) ... */
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");
    const [isSending, setIsSending] = useState(false);
    const messagesEndRef = useRef(null);
    const { user } = useAuth();

    useEffect(() => {
        setIsLoading(true);
        setError("");
        apiService
            .getMessages(match.conversation_id)
            .then((data) => {
                setMessages(data.messages || []);
            })
            .catch((err) => {
                setError(err.message);
                console.error(err);
            })
            .finally(() => {
                setIsLoading(false);
            });

        // Placeholder: WebSocket listener for new messages in *this* conversation
        // const ws = getWebSocket();
        // const messageHandler = (newMessageData) => {
        //     if (newMessageData.conversation_id === match.conversation_id) {
        //          setMessages(prev => [...prev, newMessageData]);
        //     }
        // };
        // ws?.on('newMessage', messageHandler);
        // return () => ws?.off('newMessage', messageHandler);
    }, [match.conversation_id]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleSend = async () => {
        if (!newMessage.trim() || isSending) return;
        setIsSending(true);
        setError(""); // Clear error on new send attempt
        const optimisticId = "temp-" + Date.now();
        const optimisticMessage = {
            id: optimisticId,
            sender_id: user.id,
            content: newMessage,
            created_at: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, optimisticMessage]);
        const messageToSend = newMessage; // Store message in case of failure
        setNewMessage("");

        try {
            const newMsg = await apiService.sendMessage(
                match.conversation_id,
                messageToSend,
            );
            setMessages((prev) =>
                prev.map((m) => (m.id === optimisticId ? newMsg.message : m)),
            );
        } catch (err) {
            console.error("Failed to send message:", err);
            setError("Failed to send. Please try again.");
            setMessages((prev) => prev.filter((m) => m.id !== optimisticId)); // Remove optimistic
            setNewMessage(messageToSend); // Restore input content
        } finally {
            setIsSending(false);
        }
    };

    return (
        <div className="flex-1 flex flex-col bg-stone-100 text-slate-800 h-full">
            {" "}
            <header className="flex items-center p-3 border-b border-stone-200 bg-white/80 backdrop-blur-lg sticky top-0 z-10">
                {" "}
                <button
                    onClick={onBack}
                    className="mr-3 p-2 rounded-full hover:bg-stone-200 text-stone-600"
                >
                    <ChevronLeftIcon className="w-6 h-6" />
                </button>{" "}
                <img
                    src={
                        match.photo ||
                        `https://placehold.co/100x100/cccccc/ffffff?text=${match.first_name?.[0] || "?"}`
                    }
                    alt={match.first_name}
                    className="w-10 h-10 rounded-full object-cover"
                />{" "}
                <h2 className="ml-3 font-bold">{match.first_name}</h2>{" "}
            </header>{" "}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {" "}
                {isLoading && (
                    <div className="text-center text-stone-500 py-10">
                        <Spinner />
                    </div>
                )}{" "}
                {error && !isSending && <ErrorMessage message={error} />}{" "}
                {/* Only show general error if not currently trying to send */}{" "}
                {messages.map((msg) => (
                    <div
                        key={msg.id}
                        className={`flex ${msg.sender_id === user?.id ? "justify-end" : "justify-start"}`}
                    >
                        {" "}
                        <div
                            className={`max-w-xs md:max-w-md lg:max-w-lg px-4 py-2 rounded-2xl shadow-sm ${msg.sender_id === user?.id ? "bg-pink-600 text-white rounded-br-none" : "bg-white text-slate-800 border border-stone-200 rounded-bl-none"}`}
                        >
                            {" "}
                            <p>{msg.content}</p>{" "}
                            <span
                                className={`text-xs block text-right mt-1 ${msg.sender_id === user?.id ? "text-pink-200" : "text-stone-400"}`}
                            >
                                {new Date(msg.created_at).toLocaleTimeString(
                                    [],
                                    { hour: "2-digit", minute: "2-digit" },
                                )}
                            </span>{" "}
                        </div>{" "}
                    </div>
                ))}{" "}
                <div ref={messagesEndRef} />{" "}
            </div>{" "}
            <div className="p-2 sm:p-4 bg-white/80 backdrop-blur-lg border-t border-stone-200 sticky bottom-0">
                {" "}
                <div className="flex items-center bg-stone-100 rounded-full px-2 border border-stone-200 focus-within:ring-2 focus-within:ring-pink-500">
                    {" "}
                    <input
                        type="text"
                        placeholder="Type a message..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={(e) => e.key === "Enter" && handleSend()}
                        className="flex-1 bg-transparent p-3 text-slate-800 focus:outline-none"
                        disabled={isSending}
                    />{" "}
                    <button
                        onClick={handleSend}
                        className="bg-pink-600 text-white rounded-full p-2 m-1 hover:bg-pink-700 disabled:opacity-50 transition-colors"
                        disabled={isSending}
                    >
                        {" "}
                        <SendIcon className="w-6 h-6" />{" "}
                    </button>{" "}
                </div>{" "}
            </div>{" "}
        </div>
    );
}

// --- Profile/Settings Components ---
const SettingsSection = (
    { title, children } /* ... (same as before) ... */,
) => (
    <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-stone-200">
        <h3 className="text-lg font-bold mb-4 text-slate-800">{title}</h3>
        <div className="space-y-4">{children}</div>
    </div>
);
const SettingsItem = ({ label, children } /* ... (same as before) ... */) => (
    <div>
        <label className="block text-sm font-medium text-stone-600 mb-1">
            {label}
        </label>
        {children}
    </div>
);
const EditableField = ({ label, initialValue, onSave, inputType = "text" }) => {
    /* ... (same as before) ... */
    const [isEditing, setIsEditing] = useState(false);
    const [value, setValue] = useState(initialValue);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const inputRef = useRef(null);

    useEffect(() => {
        setValue(initialValue);
    }, [initialValue]);
    useEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current.focus();
            inputRef.current.select();
        }
    }, [isEditing]);

    const handleSave = async () => {
        setIsLoading(true);
        setError("");
        try {
            const success = await onSave(value);
            if (success) setIsEditing(false);
            else setError("Save failed."); // Generic error if onSave returns false
        } catch (err) {
            setError(err.message || "Save failed.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleCancel = () => {
        setValue(initialValue);
        setIsEditing(false);
        setError("");
    };

    return (
        <SettingsItem label={label}>
            {isEditing ? (
                <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                        <input
                            ref={inputRef}
                            type={inputType}
                            value={value}
                            onChange={(e) => setValue(e.target.value)}
                            className="flex-grow bg-stone-100 text-slate-800 p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 border border-stone-200"
                            disabled={isLoading}
                        />
                        <button
                            onClick={handleSave}
                            disabled={isLoading}
                            className="text-green-600 hover:text-green-800 p-1 rounded-full hover:bg-green-100 transition-colors"
                        >
                            {isLoading ? (
                                <Spinner />
                            ) : (
                                <CheckIcon className="w-5 h-5" />
                            )}
                        </button>
                        <button
                            onClick={handleCancel}
                            disabled={isLoading}
                            className="text-red-600 hover:text-red-800 p-1 rounded-full hover:bg-red-100 transition-colors"
                        >
                            <XCircleIcon className="w-5 h-5" />
                        </button>
                    </div>
                    {error && (
                        <p className="text-red-500 text-xs mt-1">{error}</p>
                    )}
                </div>
            ) : (
                <div className="flex items-center justify-between group">
                    <p className="text-slate-800 py-1">
                        {value || (
                            <span className="text-stone-400 italic">
                                Not set
                            </span>
                        )}
                    </p>
                    <button
                        onClick={() => setIsEditing(true)}
                        className="text-pink-600 hover:text-pink-800 p-1 rounded-full hover:bg-pink-100 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                        <EditIcon className="w-4 h-4" />
                    </button>
                </div>
            )}
        </SettingsItem>
    );
};
function SettingsPage() {
    /* ... (mostly same as before) ... */
    const { logout } = useAuth();
    const { profile, isLoading, error, updateProfile, fetchProfile } =
        useProfile();

    if (isLoading && !profile) return <FullPageSpinner />; // Show spinner only on initial load
    if (error && !profile)
        return (
            <div className="p-4">
                <ErrorMessage message={error} />
                <Button onClick={fetchProfile}>Retry</Button>
            </div>
        );
    if (!profile)
        return (
            <div className="p-4 text-center">Could not load profile data.</div>
        );

    const handleFieldSave = (fieldName) => async (newValue) => {
        try {
            await updateProfile({ [fieldName]: newValue });
            // Optionally show success feedback
            return true;
        } catch (err) {
            console.error("Profile update failed:", err);
            // Error is handled by updateProfile and shown via useProfile().error
            return false;
        }
    };

    const handleBioSave = async (event) => {
        const newBio = event.target.value;
        // Optionally add a debounce here if needed
        await handleFieldSave("bio")(newBio);
    };

    return (
        <div className="flex-1 flex flex-col bg-stone-100 text-slate-800 overflow-y-auto">
            <header className="p-4 border-b border-stone-200 bg-white sticky top-0 z-10">
                <h1 className="text-xl font-bold">Settings & Profile</h1>
            </header>
            <div className="p-4 sm:p-8 space-y-6 pb-24">
                {" "}
                {/* Added padding bottom */}
                {/* Profile Header */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-stone-200 flex items-center space-x-4">
                    <img
                        src={
                            profile.photos?.[0]?.url ||
                            "https://placehold.co/100x100/ec4899/ffffff?text=U"
                        }
                        alt="Profile"
                        className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover border-4 border-pink-500"
                    />
                    <div>
                        <h2 className="text-xl sm:text-2xl font-bold">
                            {profile.first_name} {profile.last_name}
                        </h2>
                        <p className="text-stone-500 text-sm">
                            {profile.email}
                        </p>
                    </div>
                    {/* Placeholder for Edit Photos button */}
                    <button className="ml-auto text-pink-600 hover:text-pink-800 p-2 rounded-full hover:bg-pink-100 transition-colors">
                        <EditIcon className="w-5 h-5" />
                    </button>
                </div>
                {/* Account Settings */}
                <SettingsSection title="Account">
                    {useProfile().isLoading && <Spinner />}{" "}
                    {/* Show spinner during updates */}
                    {useProfile().error && (
                        <ErrorMessage message={useProfile().error} />
                    )}
                    <EditableField
                        label="First Name"
                        initialValue={profile.first_name || ""}
                        onSave={handleFieldSave("first_name")}
                    />
                    <EditableField
                        label="Last Name"
                        initialValue={profile.last_name || ""}
                        onSave={handleFieldSave("last_name")}
                    />
                    <SettingsItem label="Email">
                        {" "}
                        <p className="text-stone-500">{profile.email}</p>{" "}
                    </SettingsItem>
                    <EditableField
                        label="Date of Birth"
                        inputType="date"
                        initialValue={
                            profile.date_of_birth
                                ? profile.date_of_birth.split("T")[0]
                                : ""
                        }
                        onSave={handleFieldSave("date_of_birth")}
                    />
                    {/* Add Gender, Interested In (needs dropdown/multi-select) */}
                </SettingsSection>
                {/* Profile Details */}
                <SettingsSection title="Profile Details">
                    {useProfile().isLoading && <Spinner />}
                    {useProfile().error && (
                        <ErrorMessage message={useProfile().error} />
                    )}
                    <SettingsItem label="Bio">
                        <textarea
                            className="w-full bg-stone-100 text-slate-800 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 border border-stone-200 min-h-[100px]"
                            defaultValue={profile.bio || ""}
                            placeholder="Tell us about yourself..."
                            onBlur={handleBioSave} // Save when user clicks away
                        ></textarea>
                    </SettingsItem>
                    {/* Add Interests, Occupation, Location editing */}
                    <EditableField
                        label="Occupation"
                        initialValue={profile.occupation || ""}
                        onSave={handleFieldSave("occupation")}
                    />
                    <EditableField
                        label="Location (City)"
                        initialValue={profile.location_city || ""}
                        onSave={handleFieldSave("location_city")}
                    />
                </SettingsSection>
                {/* Subscription (Placeholder) */}
                <SettingsSection title="Subscription">
                    <div className="flex justify-between items-center">
                        <div>
                            <p className="font-medium">
                                Current Plan:{" "}
                                <span className="text-pink-600">Free</span>
                            </p>
                            <p className="text-sm text-stone-500">
                                Upgrade for more features!
                            </p>
                        </div>
                        <Button size="sm">Upgrade</Button>
                    </div>
                </SettingsSection>
                {/* Logout */}
                <Button
                    onClick={logout}
                    variant="danger"
                    className="w-full mt-4"
                >
                    {" "}
                    Log Out{" "}
                </Button>
            </div>
        </div>
    );
}

// --- Main Layout & Navigation --- //
function MainLayout({ activePage, navigateTo, children }) {
    const NavButton = ({ page, icon, label }) => (
        <button
            onClick={() => navigateTo(page)}
            className={`flex flex-col items-center justify-center space-y-1 p-2 rounded-md w-16 h-16 ${activePage === page ? "text-pink-500" : "text-stone-500 hover:text-pink-500"}`}
        >
            {icon}
            <span className="text-xs font-bold">{label}</span>
        </button>
    );
    return (
        <div className="h-screen w-screen bg-white flex flex-col md:flex-row overflow-hidden">
            {" "}
            <nav className="md:w-24 bg-white border-t md:border-t-0 md:border-r border-stone-200 order-2 md:order-1 flex-shrink-0">
                {" "}
                <div className="flex md:flex-col justify-around items-center h-full py-1 md:py-8">
                    {/* Ensure NavButtons are inside */}{" "}
                    <NavButton
                        page="discover"
                        icon={<HeartIcon className="w-7 h-7" />}
                        label="Discover"
                    />{" "}
                    <NavButton
                        page="matches"
                        icon={<MessageCircleIcon className="w-7 h-7" />}
                        label="Matches"
                    />{" "}
                    <NavButton
                        page="profile"
                        icon={<UserIcon className="w-7 h-7" />}
                        label="Profile"
                    />{" "}
                </div>{" "}
            </nav>{" "}
            <main className="flex-1 flex flex-col order-1 md:order-2 overflow-hidden h-full">
                {children}
            </main>{" "}
        </div>
    );
}

const AuthNavigator = () => {
    // Manages navigation between Landing, Login, Register
    const [page, setPage] = useState("landing"); // Start at landing

    if (page === "landing") return <LandingPage navigateTo={setPage} />;
    if (page === "login") return <LoginPage navigateTo={setPage} />;
    if (page === "register") return <RegistrationPage navigateTo={setPage} />;
    return null; // Should not happen
};
const MainAppNavigator = () => {
    /* ... (same as before) ... */
    const [appPage, setAppPage] = useState("discover");
    const [activeChat, setActiveChat] = useState(null);
    const { showOnboarding, setShowOnboarding } = useAuth(); // Get onboarding state

    const handleChatSelect = (match) => {
        setActiveChat(match);
        setAppPage("chat");
    };
    const navigateTo = (pageName) => {
        setAppPage(pageName);
    };

    return (
        <>
            {showOnboarding && (
                <OnboardingModal onClose={() => setShowOnboarding(false)} />
            )}
            <MainLayout activePage={appPage} navigateTo={navigateTo}>
                {appPage === "discover" && (
                    <DiscoveryPage /* Pass openProfileDetail if needed */ />
                )}
                {appPage === "matches" && (
                    <MatchesPage
                        navigateTo={navigateTo}
                        onChatSelect={handleChatSelect}
                    />
                )}
                {appPage === "chat" && activeChat && (
                    <ChatPage
                        match={activeChat}
                        onBack={() => setAppPage("matches")}
                    />
                )}
                {appPage === "profile" && <SettingsPage />}
            </MainLayout>
        </>
    );
};

const RootNavigator = () => {
    const { user, isLoading } = useAuth();
    if (isLoading) {
        return (
            <div className="h-screen w-screen flex items-center justify-center bg-stone-100">
                <Spinner />
            </div>
        );
    }
    return user ? <MainAppNavigator /> : <AuthNavigator />;
};

// --- Root Component --- //
export default function App() {
    return (
        <AuthProvider>
            <ProfileProvider>
                <MatchesProvider>
                    {/* <WebSocketProvider> Placeholder */}
                    <RootNavigator />
                    {/* </WebSocketProvider> */}
                </MatchesProvider>
            </ProfileProvider>
        </AuthProvider>
    );
}


import React, { useState, useEffect, useCallback, useRef, useContext, createContext, useMemo } from 'react';
// Added lucide-react icons used in Landing page
import { Heart, ShoppingBag, MessageCircle, User, Star, X, Send, ChevronLeft, Edit, Check, XCircle } from 'lucide-react';


// --- Constants ---
const SWIPE_THRESHOLD = 80; // Pixels threshold to trigger action
const LIKE_COLOR = 'rgba(74, 222, 128, 0.7)'; // Green
const PASS_COLOR = 'rgba(248, 113, 113, 0.7)'; // Red
const SUPER_LIKE_COLOR = 'rgba(96, 165, 250, 0.7)'; // Blue

// --- API Service ---
// Use the full Replit URL as the base
const API_BASE_URL = 'https://uandi-not-ai-1-uandinotai.replit.app';

const apiService = {
  getToken: () => localStorage.getItem('you-and-i-token'),
  _fetch: async (urlPath, options = {}) => { // Renamed url to urlPath for clarity
    const token = apiService.getToken();
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    // Construct the full URL using the URL constructor for robustness
    let fullUrl;
    try {
        // Ensure urlPath starts with a slash if it's meant to be relative to the base
        const path = urlPath.startsWith('/') ? urlPath : '/' + urlPath;
        fullUrl = new URL(path, API_BASE_URL).href;
        // console.log(`Fetching: ${options.method || 'GET'} ${fullUrl}`); // Log the URL being fetched (Uncomment for debugging)
    } catch (e) {
        console.error("URL Parsing Error:", e, `Base: ${API_BASE_URL}`, `Path: ${urlPath}`);
        throw new Error(`Invalid URL construction: ${urlPath}`);
    }

    try {
      const res = await fetch(fullUrl, { ...options, headers }); // Use fullUrl
      if (!res.ok) {
        let errorData = { error: `HTTP error! status: ${res.status}` };
        try {
          // Try to parse error JSON from backend, but handle cases where it might not be JSON
          const errorText = await res.text();
          // console.error(`API Error Response Text (${res.status}):`, errorText); // Log raw error text (Uncomment for debugging)
          try {
              errorData = JSON.parse(errorText);
          } catch(parseError) {
              // Use the raw text as the error if JSON parsing fails or if it's empty
              errorData.error = errorText || `HTTP error! Status: ${res.status}`;
          }
        } catch (e) { /* Ignore text reading error if response was truly empty */ }
         // Ensure errorData.error is a string before throwing
        const errorMessage = typeof errorData.error === 'string' ? errorData.error : `HTTP error! Status: ${res.status}`;
        console.error(`API Error (${res.status}):`, errorMessage); // Log structured error
        throw new Error(errorMessage);
      }
      if (res.status === 204) return { success: true };
      // Handle cases where the response might be empty even on success (e.g., 200 OK with no body)
      const contentType = res.headers.get("content-type");
      if (contentType && contentType.indexOf("application/json") !== -1) {
           const jsonData = await res.json().catch(e => {
               console.error("Failed to parse JSON response:", e);
               throw new Error("Invalid JSON received from server."); // Throw specific error for JSON parsing failure
           });
          return jsonData;
      } else {
          // If not JSON, return success or handle as needed (e.g., return text)
          // Attempt to read text, but default to empty string if body is empty or unreadable
          const textData = await res.text().catch(() => '');
          return { success: true, data: textData };
      }
    } catch (error) {
      // Log network errors (like CORS or DNS issues) which don't have res.ok
      // Log the specific type of error if available
      console.error(`API Fetch Error: ${options.method || 'GET'} ${fullUrl}`, error.name, error.message, error);
      // Provide a more user-friendly network error message
      if (error instanceof TypeError && error.message.includes('fetch')) { // More specific check for fetch failure
          throw new Error('Network error: Could not connect to the server. Please check the backend is running and accessible.');
      }
      // Re-throw other errors (including the improved HTTP errors from above)
      throw error;
    }
  },
  // Auth
  login: (email, password) => apiService._fetch('/api/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  register: (userData) => apiService._fetch('/api/auth/register', { method: 'POST', body: JSON.stringify(userData) }),
  // Profile
  getProfile: () => apiService._fetch('/api/profile'),
  updateProfile: (profileData) => apiService._fetch('/api/profile', { method: 'PUT', body: JSON.stringify(profileData) }),
  // Discovery & Matching
  getDiscover: () => apiService._fetch('/api/discover'),
  like: (userId) => apiService._fetch('/api/likes', { method: 'POST', body: JSON.stringify({ userId, type: 'regular' }) }),
  pass: (userId) => apiService._fetch('/api/passes', { method: 'POST', body: JSON.stringify({ userId }) }),
  superLike: (userId) => apiService._fetch('/api/payments/super-like', { method: 'POST', body: JSON.stringify({ userId }) }),
  // Matches & Chat
  getMatches: () => apiService._fetch('/api/matches'),
  getMessages: (conversationId) => apiService._fetch(`/api/messages/conversations/${conversationId}/messages`),
  sendMessage: (conversationId, content) => apiService._fetch(`/api/messages/conversations/${conversationId}/messages`, { method: 'POST', body: JSON.stringify({ content }) }),
};

// --- Authentication Context ---
const AuthContext = createContext(null);
const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => apiService.getToken());
  const [authLoading, setAuthLoading] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(() => !localStorage.getItem('onboarding_completed')); // Simplified onboarding check

  useEffect(() => {
    const validateToken = async () => {
      if (token) {
        try {
          const profileData = await apiService.getProfile();
          setUser({ email: profileData.email, firstName: profileData.first_name, id: profileData.id });
           setShowOnboarding(false); // Assume onboarded if token is valid
           localStorage.setItem('onboarding_completed', 'true');
        } catch (error) {
          console.error("Token validation failed:", error.message);
          localStorage.removeItem('you-and-i-token');
          setToken(null);
          // Don't reset onboarding if token validation fails, maybe they just need to log in again
        }
      }
      setAuthLoading(false);
    };
    validateToken();
  }, [token]);

  const login = async (email, password) => {
    const { token: newToken, user: userData } = await apiService.login(email, password);
    localStorage.setItem('you-and-i-token', newToken);
    setToken(newToken);
    setUser(userData);
    setShowOnboarding(false); // Reset onboarding state on login
    localStorage.setItem('onboarding_completed', 'true');
  };

  const register = async (userData) => {
    const { token: newToken, user: registeredUser } = await apiService.register(userData);
    localStorage.setItem('you-and-i-token', newToken);
    setToken(newToken);
    setUser(registeredUser);
    setShowOnboarding(true); // Show onboarding after registration
    localStorage.removeItem('onboarding_completed'); // Ensure onboarding shows for new user
  };

  const logout = () => {
    localStorage.removeItem('you-and-i-token');
    localStorage.removeItem('onboarding_completed'); // Clear onboarding on logout
    setToken(null);
    setUser(null);
    setShowOnboarding(true); // Default to showing onboarding state after logout
  };

  // Functions to manage onboarding state, replacing useOnboarding hook
   const completeOnboarding = () => {
        setShowOnboarding(false);
        localStorage.setItem('onboarding_completed', 'true');
    };
   const skipOnboarding = () => {
        setShowOnboarding(false);
        localStorage.setItem('onboarding_completed', 'true'); // Treat skipping as completing for now
    };


  const value = useMemo(() => ({
    user, token, isLoading: authLoading, login, register, logout, showOnboarding, completeOnboarding, skipOnboarding
  }), [user, token, authLoading, showOnboarding]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
const useAuth = () => useContext(AuthContext);

// --- Profile Context ---
const ProfileContext = createContext(null);
const ProfileProvider = ({ children }) => {
    const [profile, setProfile] = useState(null);
    const [profileLoading, setProfileLoading] = useState(false);
    const [profileError, setProfileError] = useState('');
    const { token } = useAuth();

    const fetchProfile = useCallback(async () => {
        if (!token) return; // Don't fetch if not logged in
        setProfileLoading(true);
        setProfileError('');
        try {
            const data = await apiService.getProfile();
            setProfile(data);
        } catch (err) {
            setProfileError(err.message);
        } finally {
            setProfileLoading(false);
        }
    }, [token]);

    useEffect(() => {
        fetchProfile();
    }, [fetchProfile]);

    const updateProfile = async (profileData) => {
        setProfileLoading(true);
        setProfileError('');
        try {
            const updatedProfile = await apiService.updateProfile(profileData);
            setProfile(updatedProfile);
            return true; // Indicate success
        } catch (err) {
            setProfileError(err.message);
            return false; // Indicate failure
        } finally {
            setProfileLoading(false);
        }
    };

    const value = useMemo(() => ({ profile, isLoading: profileLoading, error: profileError, fetchProfile, updateProfile }),
        [profile, profileLoading, profileError, fetchProfile]);

    return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
};
const useProfile = () => useContext(ProfileContext);

// --- Matches Context ---
const MatchesContext = createContext(null);
const MatchesProvider = ({ children }) => {
    const [matches, setMatches] = useState([]);
    const [matchesLoading, setMatchesLoading] = useState(false);
    const [matchesError, setMatchesError] = useState('');
    const { token } = useAuth();

    const fetchMatches = useCallback(async () => {
        if (!token) return;
        setMatchesLoading(true);
        setMatchesError('');
        try {
            const data = await apiService.getMatches();
            setMatches(data.matches || []);
        } catch (err) {
            setMatchesError(err.message);
        } finally {
            setMatchesLoading(false);
        }
    }, [token]);

    useEffect(() => {
        fetchMatches();
        // Placeholder for WebSocket listener to update matches in real-time
        // const ws = getWebSocket();
        // ws?.on('newMatch', (newMatchData) => {
        //     setMatches(prev => [newMatchData, ...prev]);
        // });
        // return () => ws?.off('newMatch');
    }, [fetchMatches]);

    const value = useMemo(() => ({ matches, isLoading: matchesLoading, error: matchesError, fetchMatches }),
        [matches, matchesLoading, matchesError, fetchMatches]);

    return <MatchesContext.Provider value={value}>{children}</MatchesContext.Provider>;
};
const useMatches = () => useContext(MatchesContext);

// --- WebSocket Context (Placeholder) ---
// const WebSocketContext = createContext(null);
// const WebSocketProvider = ({ children }) => { /* ... */ };
// const useWebSocket = () => useContext(WebSocketContext);


// --- ICON COMPONENTS (using lucide-react names) ---
const HeartIcon = Heart;
const XIcon = X;
const StarIcon = Star;
const MessageCircleIcon = MessageCircle;
const UserIcon = User;
const SendIcon = Send;
const ChevronLeftIcon = ChevronLeft;
const EditIcon = Edit;
const CheckIcon = Check;
const XCircleIcon = XCircle;
const ShoppingBagIcon = ShoppingBag; // Added from Landing
// Re-added GoogleIcon component
const GoogleIcon = (props) => ( <svg {...props} viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg> );

// --- GENERIC UI COMPONENTS --- //
const Spinner = () => ( <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-pink-500"></div> );
const FullPageSpinner = () => ( <div className="flex-1 h-full flex items-center justify-center bg-stone-100"><Spinner /></div> );
const ErrorMessage = ({ message }) => ( <p className="text-red-600 text-sm text-center py-2 font-medium bg-red-100 border border-red-200 rounded-lg">{message || "An unexpected error occurred."}</p> );
// Adapted Button component from Landing page style
const Button = ({ children, onClick, disabled = false, isLoading = false, variant = 'primary', className = '', size = 'md', ...props }) => {
    const baseStyle = "font-bold rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 inline-flex items-center justify-center shadow-sm hover:shadow";
    const sizeStyles = {
        sm: "py-2 px-4 text-sm",
        md: "py-3 px-6 text-base", // Adjusted default padding
        lg: "py-4 px-8 text-lg", // Added large size like landing page button
    };
    const variantStyles = {
        primary: "bg-red-500 hover:bg-red-600 text-white focus:ring-red-500", // Changed primary to red like landing
        secondary: "bg-white border border-stone-300 text-slate-700 hover:bg-stone-50 focus:ring-red-500",
        danger: "bg-stone-700 hover:bg-stone-800 text-white focus:ring-stone-500", // Changed danger to dark grey like logout
        ghost: "bg-transparent hover:bg-stone-100 text-slate-700 focus:ring-red-500 shadow-none hover:shadow-none",
    };
    return (
        <button onClick={onClick} disabled={disabled || isLoading} className={`${baseStyle} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`} {...props}>
            {isLoading ? <Spinner /> : children}
        </button>
    );
};

const Modal = ({ children, onClose, title }) => ( /* ... (same as before) ... */
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-fade-in">
        <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-lg relative transform transition-transform duration-300 scale-95 animate-slide-up">
            {title && <h2 className="text-xl font-bold text-slate-800 mb-4">{title}</h2>}
            <button onClick={onClose} className="absolute top-3 right-3 text-stone-400 hover:text-stone-600 p-1 rounded-full hover:bg-stone-100 transition-colors">
                <XIcon className="w-6 h-6"/>
            </button>
            {children}
        </div>
    </div>
);
const MatchModal = ({ profile, onClose }) => ( /* ... (same as before) ... */
    <Modal onClose={onClose}>
        <div className="text-center">
            <h2 className="text-3xl font-bold text-pink-500 mb-4">It's a Match!</h2> {/* Kept pink for match emphasis */}
            <p className="text-lg text-slate-700 mb-4">You and {profile.first_name} liked each other.</p>
            <div className="flex justify-center space-x-4 mb-6">
                <img src={profile.primary_photo} alt={profile.first_name} className="w-24 h-24 rounded-full object-cover border-4 border-pink-500"/>
            </div>
            <Button onClick={onClose} className="w-full"> Keep Swiping </Button>
        </div>
    </Modal>
);

// Simplified Onboarding Tutorial Modal (replaces external component)
const OnboardingTutorial = ({ isVisible, onComplete, onSkip }) => {
    if (!isVisible) return null;
    // Basic placeholder, replace with actual tutorial steps if needed
    return (
        <Modal onClose={onSkip} title="Welcome to You&I NotAI!">
             <div className="text-center space-y-4">
                 <p className="text-slate-700">Let's quickly show you how things work.</p>
                 {/* Add tutorial content here */}
                 <p className="text-sm text-stone-500">(Tutorial steps would go here)</p>
                 <Button onClick={onComplete} className="w-full"> Got It! </Button>
                 <Button onClick={onSkip} variant="ghost" className="w-full text-sm"> Skip Tutorial </Button>
             </div>
        </Modal>
    );
};


// --- AUTH PAGES --- //
// Simplified Logo component (replaces external component)
const Logo = ({ size = 'md', className = '' }) => {
    const sizeClasses = { sm: 'w-8 h-8', md: 'w-10 h-10', lg: 'w-12 h-12', xl: 'w-16 h-16' };
    return (
        // Placeholder simple logo - replace with actual SVG or styled div if needed
        <div className={`bg-gradient-to-br from-red-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold shadow-md ${sizeClasses[size]} ${className}`}>
            Y&I
        </div>
    );
};
const AuthHeader = () => ( /* ... (same as before, uses updated tagline) ... */
    <div className="text-center mb-8">
        <div className="mb-6 flex items-center justify-center">
             <Logo size="xl" className="transform hover:scale-105 transition-transform duration-300" />
        </div>
        <div className="text-5xl sm:text-6xl font-extrabold text-slate-800 flex items-center justify-center tracking-tighter">
            <span>You</span>
            <span className="text-red-500 text-6xl sm:text-7xl -mx-2">&</span>
            <span>I</span>
            <div className="text-2xl sm:text-3xl font-bold text-slate-400 line-through ml-2">NotAI</div>
        </div>
        <p className="text-slate-500 mt-2 text-sm sm:text-base">Connect with Actual Humans, Not Algorithms.</p>
    </div>
);
function AuthPageLayout({ children, showStoreButton = false, navigateTo }) { // Added showStoreButton & navigateTo
    return (
        <div className="min-h-screen bg-stone-100 text-slate-800 flex items-center justify-center p-4 relative animate-fade-in">
             {showStoreButton && (
                 <button
                    onClick={() => console.log("Navigate to Store page/modal")} // Update later if store integrated
                    className="absolute top-4 right-4 sm:top-6 sm:right-6 p-2 sm:p-3 bg-white border border-stone-200 hover:bg-stone-50 rounded-full transition-all duration-300 z-10 shadow-sm hover:shadow-md"
                    title="Visit Store"
                 >
                    <ShoppingBagIcon className="w-5 h-5 sm:w-6 sm:h-6 text-slate-700" />
                 </button>
            )}
            <div className="w-full max-w-md">
                {children} {/* AuthHeader is now called within specific pages */}
            </div>
        </div>
    );
}

// New Landing Page Component
function LandingPage({ navigateTo }) {
     const { showOnboarding, completeOnboarding, skipOnboarding } = useAuth(); // Use state from AuthContext

     return (
        <AuthPageLayout showStoreButton={true} navigateTo={navigateTo}>
            <AuthHeader />
            <div className="bg-white p-8 rounded-2xl shadow-lg border border-stone-200 animate-slide-in-up">
                 <h2 className="text-2xl font-bold mb-6 text-center text-slate-700">Get Started</h2>
                 <div className="space-y-4">
                     <Button
                         onClick={() => navigateTo('login')} // Navigate to login page
                         size="lg" // Use large button size
                         className="w-full"
                     >
                         <HeartIcon className="w-5 h-5 mr-2" />
                         Start Dating / Login
                     </Button>

                     <div className="my-6 flex items-center">
                         <div className="flex-grow border-t border-stone-300"></div>
                         <span className="mx-4 text-stone-500 text-sm">Features</span>
                         <div className="flex-grow border-t border-stone-300"></div>
                     </div>

                     {/* Feature highlights */}
                     <div className="grid grid-cols-3 gap-4 text-center">
                         <div className="flex flex-col items-center">
                             <div className="w-12 h-12 bg-stone-100 rounded-full flex items-center justify-center mb-2"> <HeartIcon className="w-6 h-6 text-red-500" /> </div>
                             <span className="text-xs text-slate-600">Real Profiles</span>
                         </div>
                         <div className="flex flex-col items-center">
                             <div className="w-12 h-12 bg-stone-100 rounded-full flex items-center justify-center mb-2"> <MessageCircleIcon className="w-6 h-6 text-red-500" /> </div>
                             <span className="text-xs text-slate-600">Direct Chat</span>
                         </div>
                         <div className="flex flex-col items-center">
                             <div className="w-12 h-12 bg-stone-100 rounded-full flex items-center justify-center mb-2"> <ShoppingBagIcon className="w-6 h-6 text-red-500" /> </div>
                             <span className="text-xs text-slate-600">Brand Store</span>
                         </div>
                     </div>
                 </div>
            </div>
             <p className="text-center text-stone-500 mt-6 text-sm">
                 New user? <button onClick={() => navigateTo('register')} className="font-semibold text-red-500 hover:underline">Sign Up Here</button>
             </p>
              {/* Onboarding Tutorial Modal */}
             <OnboardingTutorial
                 isVisible={showOnboarding}
                 onComplete={completeOnboarding}
                 onSkip={skipOnboarding}
             />
        </AuthPageLayout>
     );
}


function LoginPage({ navigateTo }) { /* ... (mostly same as before, uses AuthPageLayout) ... */
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Updated Google Sign-in Handler Placeholder
   const handleGoogleSignIn = () => {
        // In a real app, this would redirect the user to the backend Google OAuth route
        // Example: window.location.href = `${API_BASE_URL}/api/auth/google`;
        console.log('Initiating Google Sign-In...');
        // Placeholder for immediate feedback - replace with actual flow
        setError('Google Sign-In not yet implemented.');
   };


  const handleSubmit = async (e) => { e.preventDefault(); setError(''); setIsLoading(true); try { await login(email, password); } catch (err) { setError(err.message || 'Login failed. Please check credentials.'); } finally { setIsLoading(false); } };
  return ( <AuthPageLayout navigateTo={navigateTo}> <AuthHeader/> <div className="bg-white p-8 rounded-2xl shadow-lg border border-stone-200"> <h2 className="text-2xl font-bold mb-6 text-center text-slate-700">Log In</h2> <form onSubmit={handleSubmit} className="space-y-6"> <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-stone-100 text-slate-800 px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500" required /> <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-stone-100 text-slate-800 px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500" required /> {error && <ErrorMessage message={error} />} <Button type="submit" disabled={isLoading} isLoading={isLoading} className="w-full"> Log In </Button> </form> <div className="my-6 flex items-center"><div className="flex-grow border-t border-stone-300"></div><span className="mx-4 text-stone-500 text-sm">OR</span><div className="flex-grow border-t border-stone-300"></div></div> <Button onClick={handleGoogleSignIn} variant="secondary" className="w-full flex items-center justify-center space-x-2"> <GoogleIcon className="w-6 h-6" /> <span>Sign in with Google</span> </Button> <p className="text-center text-stone-500 mt-6"> Don't have an account?{' '} <button onClick={() => navigateTo('register')} className="font-semibold text-red-500 hover:underline"> Sign Up </button> </p> </div></AuthPageLayout> );
}
function RegistrationPage({ navigateTo }) { /* ... (mostly same as before, uses AuthPageLayout) ... */
  const { register } = useAuth();
  const [formData, setFormData] = useState({ firstName: '', email: '', password: '', confirmPassword: '', dateOfBirth: '' });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const handleChange = (e) => { setFormData({ ...formData, [e.target.name]: e.target.value }); };

  // Updated Google Sign-up Handler Placeholder
   const handleGoogleSignUp = () => {
       // Similar to Sign-in, redirects to the backend Google OAuth route
       // Example: window.location.href = `${API_BASE_URL}/api/auth/google`;
       console.log('Initiating Google Sign-Up...');
       setError('Google Sign-Up not yet implemented.');
   };

  const handleSubmit = async (e) => { e.preventDefault(); if (formData.password !== formData.confirmPassword) { setError('Passwords do not match.'); return; } setError(''); setIsLoading(true); try { const { password, confirmPassword, ...apiData } = formData; await register({ ...apiData, password: password, gender: 'prefer-not-to-say', interestedIn: ['male', 'female', 'non-binary', 'other'] }); } catch (err) { setError(err.message || 'Registration failed. Please try again.'); } finally { setIsLoading(false); } };
  return ( <AuthPageLayout navigateTo={navigateTo}> <AuthHeader/> <div className="bg-white p-8 rounded-2xl shadow-lg border border-stone-200"><h2 className="text-2xl font-bold mb-6 text-center text-slate-700">Create Account</h2> <form onSubmit={handleSubmit} className="space-y-4"> <input type="text" name="firstName" placeholder="First Name" value={formData.firstName} onChange={handleChange} className="w-full bg-stone-100 text-slate-800 px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500" required /> <input type="email" name="email" placeholder="Email" value={formData.email} onChange={handleChange} className="w-full bg-stone-100 text-slate-800 px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500" required /> <input type="password" name="password" placeholder="Password" value={formData.password} onChange={handleChange} className="w-full bg-stone-100 text-slate-800 px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500" required /> <input type="password" name="confirmPassword" placeholder="Confirm Password" value={formData.confirmPassword} onChange={handleChange} className="w-full bg-stone-100 text-slate-800 px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500" required /> <div><label htmlFor="dateOfBirth" className="text-sm text-stone-500 mb-1 block">Date of Birth</label><input id="dateOfBirth" type="date" name="dateOfBirth" value={formData.dateOfBirth} onChange={handleChange} className="w-full bg-stone-100 text-slate-800 px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500" required /></div> {error && <ErrorMessage message={error} />} <Button type="submit" disabled={isLoading} isLoading={isLoading} className="w-full mt-4"> Sign Up </Button> </form> <div className="my-6 flex items-center"><div className="flex-grow border-t border-stone-300"></div><span className="mx-4 text-stone-500 text-sm">OR</span><div className="flex-grow border-t border-stone-300"></div></div> <Button onClick={handleGoogleSignUp} variant="secondary" className="w-full flex items-center justify-center space-x-2"> <GoogleIcon className="w-6 h-6" /> <span>Sign up with Google</span> </Button> <p className="text-center text-stone-500 mt-6"> Already have an account?{' '} <button onClick={() => navigateTo('login')} className="font-semibold text-red-500 hover:underline"> Log In </button> </p> </div></AuthPageLayout> );
}

// --- Custom Swipe Hook ---
const useSwipe = (onSwipeLeft, onSwipeRight, onSwipeUp) => { /* ... (same as before) ... */
    const cardRef = useRef(null);
    const [dragStart, setDragStart] = useState(null);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [transition, setTransition] = useState('transform 0.3s ease-out');

    const resetCardPosition = useCallback(() => {
        setTransition('transform 0.3s ease-out');
        setIsDragging(false);
        setDragOffset({ x: 0, y: 0 });
        setDragStart(null);
    }, []);

    const triggerAction = useCallback((action) => {
        let finalX = 0, finalY = 0;
        if (action === 'like') finalX = window.innerWidth;
        if (action === 'pass') finalX = -window.innerWidth;
        if (action === 'super') finalY = -window.innerHeight / 1.5;

        setTransition('transform 0.3s ease-out'); // Ensure transition is on for the animation
        setIsDragging(false); // Stop manual drag style updates
        setDragOffset({ x: finalX, y: finalY });

        setTimeout(() => {
            if (action === 'like' && onSwipeRight) onSwipeRight();
            if (action === 'pass' && onSwipeLeft) onSwipeLeft();
            if (action === 'super' && onSwipeUp) onSwipeUp();
            // Reset after animation
            setTimeout(() => {
                 setTransition('none'); // Turn off transition for instant reset
                 resetCardPosition();
                 setTimeout(() => setTransition('transform 0.3s ease-out'), 50); // Restore transition
            }, 50); // Short delay before reset to allow callback to process
        }, 300); // Duration of the swipe out animation
    }, [onSwipeLeft, onSwipeRight, onSwipeUp, resetCardPosition]);


    const handleDragStart = useCallback((e) => {
        // Allow clicks on buttons/links inside the card if needed, otherwise prevent default
        // if (e.target.tagName === 'BUTTON' || e.target.tagName === 'A') return;
        e.preventDefault();
        setTransition('none'); // Turn off transition during drag
        const point = e.touches ? e.touches[0] : e;
        setDragStart({ x: point.clientX, y: point.clientY });
        setIsDragging(true);
    }, []);

    const handleDragMove = useCallback((e) => {
        if (!isDragging || !dragStart) return;
        e.preventDefault();
        const point = e.touches ? e.touches[0] : e;
        setDragOffset({
            x: point.clientX - dragStart.x,
            y: point.clientY - dragStart.y
        });
    }, [isDragging, dragStart]);

    const handleDragEnd = useCallback((e) => {
        if (!isDragging) return;
        setIsDragging(false); // Do this first
        setTransition('transform 0.3s ease-out'); // Turn transition back on

        if (Math.abs(dragOffset.x) > SWIPE_THRESHOLD) {
            triggerAction(dragOffset.x > 0 ? 'like' : 'pass');
        } else if (dragOffset.y < -SWIPE_THRESHOLD && onSwipeUp) { // Check for upward swipe
             triggerAction('super');
        } else {
            resetCardPosition(); // Snap back if below threshold
        }
        setDragStart(null);
    }, [isDragging, dragOffset, onSwipeUp, resetCardPosition, triggerAction]);

    const getCardStyle = useMemo(() => {
        const rotation = dragOffset.x * 0.05; // Reduced rotation
        return {
            transform: `translate(${dragOffset.x}px, ${dragOffset.y}px) rotate(${rotation}deg)`,
            transition: transition,
            cursor: isDragging ? 'grabbing' : 'grab',
        };
    }, [dragOffset, isDragging, transition]);

    const getOverlayStyle = useMemo(() => {
         const opacityX = Math.min(Math.abs(dragOffset.x) / SWIPE_THRESHOLD, 0.7);
         const opacityY = Math.min(Math.abs(dragOffset.y) / SWIPE_THRESHOLD, 0.7); // Opacity for vertical drag
         let opacity = Math.max(opacityX, opacityY); // Use the stronger opacity
         let backgroundColor = 'transparent';

         // Determine color based on dominant drag direction
         if (Math.abs(dragOffset.y) > Math.abs(dragOffset.x) && dragOffset.y < -10) {
             backgroundColor = SUPER_LIKE_COLOR; // Super like vertical
             opacity = opacityY;
         } else if (dragOffset.x > 10) {
             backgroundColor = LIKE_COLOR; // Like horizontal
             opacity = opacityX;
         } else if (dragOffset.x < -10) {
             backgroundColor = PASS_COLOR; // Pass horizontal
             opacity = opacityX;
         }


         return {
             opacity: opacity,
             backgroundColor: backgroundColor,
             transition: 'opacity 0.1s ease-out',
         };
    }, [dragOffset]);


    const handlers = useMemo(() => ({
        ref: cardRef,
        style: getCardStyle(),
        onMouseDown: handleDragStart,
        onTouchStart: handleDragStart,
        onMouseMove: handleDragMove,
        onTouchMove: handleDragMove,
        onMouseUp: handleDragEnd,
        onMouseLeave: handleDragEnd, // Handle mouse leaving card mid-drag
        onTouchEnd: handleDragEnd,
        onTouchCancel: handleDragEnd, // Handle touch cancel
    }), [getCardStyle, handleDragStart, handleDragMove, handleDragEnd]);

    return { handlers, triggerAction, getOverlayStyle };
};


// --- MAIN APP PAGES --- //

function ProfileCard({ profile, handlers, overlayStyle, onClick }) { /* ... (same as before) ... */
    if (!profile) return null;
    return (
        <div
            {...handlers}
            onClick={onClick} // Allow clicking the card
            className="absolute inset-0 bg-cover bg-center rounded-2xl shadow-lg overflow-hidden select-none" // Added select-none
            style={{ ...handlers.style, backgroundImage: `url(${profile.primary_photo})` }}
            // Prevent default drag behavior which can interfere
            onDragStart={(e) => e.preventDefault()}
        >
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
            {/* Swipe Overlay */}
            <div className="absolute inset-0 pointer-events-none rounded-2xl" style={overlayStyle}></div>
             {/* Content */}
            <div className="absolute bottom-0 left-0 p-4 sm:p-6 text-white w-full pointer-events-none"> {/* Prevent text selection */}
                <h2 className="text-2xl sm:text-3xl font-bold">{profile.first_name}, {profile.age}</h2>
                <p className="text-stone-300 text-sm">{profile.occupation}</p>
                <p className="mt-2 text-stone-200 text-sm sm:text-base line-clamp-2">{profile.bio}</p>
            </div>
        </div>
    );
}
function ProfileDetailView({ profile, onClose }) { /* ... (same as before) ... */
    if (!profile) return null;
     return (
        <Modal onClose={onClose} title={`${profile.first_name}'s Profile`}>
            <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
                 <img src={profile.primary_photo} alt={profile.first_name} className="w-full h-64 object-cover rounded-lg mb-4"/>
                 <h2 className="text-2xl font-bold">{profile.first_name}, {profile.age}</h2>
                 <p className="text-stone-500">{profile.occupation} - {profile.location_city}</p>
                 <p className="text-slate-700">{profile.bio}</p>
                 {/* Add more details like interests, photos etc. */}
                 <Button onClick={onClose} variant="ghost" className="w-full mt-4">Close</Button>
            </div>
        </Modal>
    );
}
function DiscoveryPage() { /* ... (mostly same as before) ... */
    const [profiles, setProfiles] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [matchInfo, setMatchInfo] = useState(null);
    const [viewingProfile, setViewingProfile] = useState(null); // State for profile detail view

    const fetchProfiles = useCallback(() => {
        setIsLoading(true); setError('');
        apiService.getDiscover()
            .then(data => {
                setProfiles(data.profiles || []);
                setCurrentIndex(0); // Reset index on new fetch
                setViewingProfile(null); // Close detail view if open
            })
            .catch(err => {
                setError(err.message);
                console.error("Fetch Profiles Error:", err);
            })
            .finally(() => { setIsLoading(false); });
    }, []);

    useEffect(() => { fetchProfiles(); }, [fetchProfiles]);

    const handleSwipe = useCallback(async (action, profileId) => {
        // Prevent action if detail view is open
        if (viewingProfile) return;

        let apiCall;
        const profile = profiles.find(p => p.id === profileId);
        if (!profile) return; // Exit if profile not found (edge case)

        if (action === 'like') apiCall = apiService.like(profileId);
        else if (action === 'pass') apiCall = apiService.pass(profileId);
        else if (action === 'super') apiCall = apiService.superLike(profileId);
        else return;

        // Immediately advance the index visually, handle result later
        setCurrentIndex(prev => prev + 1);

        try {
            const res = await apiCall;
            if (action === 'like' && res.isMatch) {
                setMatchInfo(profile); // Show match modal using the profile data we already have
            }
        } catch (err) {
            console.error(`Failed to ${action}:`, err.message);
            setError(`Failed to ${action}. Please try again later.`);
            // Optionally: Implement an "undo" feature or revert index if API fails,
            // but for simplicity, we let the card disappear.
        }
    }, [profiles, currentIndex, viewingProfile]); // Added viewingProfile dependency


    const { handlers, triggerAction, getOverlayStyle } = useSwipe(
        () => handleSwipe('pass', profiles[currentIndex]?.id), // onSwipeLeft
        () => handleSwipe('like', profiles[currentIndex]?.id), // onSwipeRight
        () => handleSwipe('super', profiles[currentIndex]?.id) // onSwipeUp
    );

    if (isLoading) return <FullPageSpinner />;

    const currentProfile = profiles[currentIndex];
    const nextProfile = profiles[currentIndex + 1];

     // Handle opening profile detail
    const openProfileDetail = useCallback(() => {
        // Prevent opening detail view while dragging/swiping
        if (!handlers.ref.current || handlers.style.transform?.includes('translate')) return;
        if (currentProfile) {
            setViewingProfile(currentProfile);
        }
    }, [currentProfile, handlers.ref, handlers.style]);


    if (!currentProfile && !isLoading) {
         return ( <div className="flex-1 flex flex-col items-center justify-center bg-stone-100 text-slate-800 p-4 text-center"> <h2 className="text-2xl font-bold mb-4">That's everyone for now!</h2> <p className="text-stone-500">Check back later for new profiles.</p> <Button onClick={fetchProfiles} className="mt-6"> Refresh Profiles </Button> {error && <ErrorMessage message={error} />} </div> );
    }

    return (
        <div className="flex-1 flex flex-col p-2 sm:p-4 bg-stone-100 overflow-hidden touch-none relative">
            {matchInfo && <MatchModal profile={matchInfo} onClose={() => setMatchInfo(null)} />}
            {viewingProfile && <ProfileDetailView profile={viewingProfile} onClose={() => setViewingProfile(null)} />}
            {error && <div className="absolute top-2 left-1/2 transform -translate-x-1/2 z-20 w-full max-w-sm px-4"><ErrorMessage message={error} /></div>}

            <div className={`flex-1 flex items-center justify-center relative transition-opacity duration-300 ${viewingProfile ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
                {/* Card Stack */}
                <div className="relative w-full max-w-sm h-[70vh] sm:h-[65vh] max-h-[600px]">
                    {/* Next Card (behind) */}
                    {nextProfile && (
                        <div className="absolute inset-0 bg-cover bg-center rounded-2xl shadow-md scale-95 opacity-70 transition-transform duration-300" style={{ backgroundImage: `url(${nextProfile.primary_photo})` }}>
                            <div className="absolute inset-0 bg-stone-100/30 rounded-2xl"></div>
                        </div>
                    )}
                    {/* Current Card (top) */}
                    {currentProfile && (
                        <ProfileCard
                            profile={currentProfile}
                            handlers={handlers}
                            overlayStyle={getOverlayStyle()}
                            onClick={openProfileDetail} // Open detail view on click
                         />
                    )}
                </div>
            </div>

            {/* Action Buttons */}
            <div className={`flex justify-center items-center space-x-4 sm:space-x-6 py-4 sm:py-6 transition-opacity duration-300 ${viewingProfile ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
                <Button onClick={() => triggerAction('pass')} variant="secondary" className="p-4 sm:p-5 rounded-full !text-red-500 shadow-md"> <XIcon className="w-7 h-7 sm:w-8 sm:h-8" /> </Button>
                <Button onClick={() => triggerAction('super')} variant="secondary" className="p-3 sm:p-4 rounded-full !text-blue-500 shadow-md"> <StarIcon className="w-5 h-5 sm:w-6 sm:h-6" /> </Button>
                <Button onClick={() => triggerAction('like')} variant="secondary" className="p-4 sm:p-5 rounded-full !text-green-500 shadow-md"> <HeartIcon className="w-7 h-7 sm:w-8 sm:h-8" /> </Button>
            </div>
        </div>
    );
}
function MatchesPage({ navigateTo, onChatSelect }) { /* ... (mostly same as before) ... */
    const { matches, isLoading, error, fetchMatches } = useMatches();

    return (
        <div className="flex-1 flex flex-col bg-white text-slate-800 h-full">
            <header className="p-4 border-b border-stone-200 sticky top-0 bg-white/90 backdrop-blur-sm z-10">
                <h1 className="text-xl font-bold">Matches & Messages</h1>
            </header>
            <div className="flex-1 overflow-y-auto">
                {isLoading && <div className="p-4 text-center text-stone-500">Loading matches...</div>}
                {error && <div className="p-4"><ErrorMessage message={error} /><Button onClick={fetchMatches} className="mt-2 mx-auto block" size="sm">Retry</Button></div>}
                {!isLoading && !error && matches.length === 0 && <div className="p-4 text-center text-stone-500">You have no matches yet. Keep swiping!</div>}
                {!isLoading && !error && matches.map(match => (
                    <div key={match.other_user_id} className="flex items-center p-4 border-b border-stone-200 hover:bg-stone-50 cursor-pointer" onClick={() => onChatSelect(match)}>
                        <img src={match.photo || `https://placehold.co/100x100/cccccc/ffffff?text=${match.first_name?.[0] || '?'}`} // Fallback image
                             alt={match.first_name} className="w-14 h-14 rounded-full object-cover flex-shrink-0" />
                        <div className="flex-1 ml-4 overflow-hidden">
                            <div className="flex justify-between items-baseline">
                                <h3 className="font-bold truncate mr-2">{match.first_name}</h3>
                                <span className="text-xs text-stone-500 flex-shrink-0">{match.last_message_at ? new Date(match.last_message_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : ''}</span>
                            </div>
                            <div className="flex justify-between items-center mt-1">
                                <p className="text-sm text-stone-500 truncate">{match.last_message || "New Match!"}</p>
                                {match.unread_count > 0 && <span className="bg-pink-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0 ml-2">{match.unread_count}</span>}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
function ChatPage({ match, onBack }) { /* ... (mostly same as before) ... */
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [isSending, setIsSending] = useState(false);
    const messagesEndRef = useRef(null);
    const { user } = useAuth();

    useEffect(() => {
        setIsLoading(true); setError('');
        apiService.getMessages(match.conversation_id)
            .then(data => { setMessages(data.messages || []); })
            .catch(err => { setError(err.message); console.error(err); })
            .finally(() => { setIsLoading(false); });

        // Placeholder: WebSocket listener for new messages in *this* conversation
        // const ws = getWebSocket();
        // const messageHandler = (newMessageData) => {
        //     if (newMessageData.conversation_id === match.conversation_id) {
        //          setMessages(prev => [...prev, newMessageData]);
        //     }
        // };
        // ws?.on('newMessage', messageHandler);
        // return () => ws?.off('newMessage', messageHandler);

    }, [match.conversation_id]);

    useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

    const handleSend = async () => {
        if (!newMessage.trim() || isSending) return;
        setIsSending(true); setError(''); // Clear error on new send attempt
        const optimisticId = 'temp-' + Date.now();
        const optimisticMessage = { id: optimisticId, sender_id: user.id, content: newMessage, created_at: new Date().toISOString() };
        setMessages(prev => [...prev, optimisticMessage]);
        const messageToSend = newMessage; // Store message in case of failure
        setNewMessage('');


        try {
            const newMsg = await apiService.sendMessage(match.conversation_id, messageToSend);
            setMessages(prev => prev.map(m => m.id === optimisticId ? newMsg.message : m));
        } catch (err) {
            console.error("Failed to send message:", err);
            setError("Failed to send. Please try again.");
            setMessages(prev => prev.filter(m => m.id !== optimisticId)); // Remove optimistic
            setNewMessage(messageToSend); // Restore input content
        } finally {
            setIsSending(false);
        }
    };

    return ( <div className="flex-1 flex flex-col bg-stone-100 text-slate-800 h-full"> <header className="flex items-center p-3 border-b border-stone-200 bg-white/80 backdrop-blur-lg sticky top-0 z-10"> <button onClick={onBack} className="mr-3 p-2 rounded-full hover:bg-stone-200 text-stone-600"><ChevronLeftIcon className="w-6 h-6" /></button> <img src={match.photo || `https://placehold.co/100x100/cccccc/ffffff?text=${match.first_name?.[0] || '?'}`} alt={match.first_name} className="w-10 h-10 rounded-full object-cover" /> <h2 className="ml-3 font-bold">{match.first_name}</h2> </header> <div className="flex-1 overflow-y-auto p-4 space-y-4"> {isLoading && <div className="text-center text-stone-500 py-10"><Spinner/></div>} {error && !isSending && <ErrorMessage message={error} />} {/* Only show general error if not currently trying to send */} {messages.map(msg => ( <div key={msg.id} className={`flex ${msg.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}> <div className={`max-w-xs md:max-w-md lg:max-w-lg px-4 py-2 rounded-2xl shadow-sm ${msg.sender_id === user?.id ? 'bg-pink-600 text-white rounded-br-none' : 'bg-white text-slate-800 border border-stone-200 rounded-bl-none'}`}> <p>{msg.content}</p> <span className={`text-xs block text-right mt-1 ${msg.sender_id === user?.id ? 'text-pink-200' : 'text-stone-400'}`}>{new Date(msg.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span> </div> </div> ))} <div ref={messagesEndRef} /> </div> <div className="p-2 sm:p-4 bg-white/80 backdrop-blur-lg border-t border-stone-200 sticky bottom-0"> <div className="flex items-center bg-stone-100 rounded-full px-2 border border-stone-200 focus-within:ring-2 focus-within:ring-pink-500"> <input type="text" placeholder="Type a message..." value={newMessage} onChange={(e) => setNewMessage(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleSend()} className="flex-1 bg-transparent p-3 text-slate-800 focus:outline-none" disabled={isSending}/> <button onClick={handleSend} className="bg-pink-600 text-white rounded-full p-2 m-1 hover:bg-pink-700 disabled:opacity-50 transition-colors" disabled={isSending}> <SendIcon className="w-6 h-6" /> </button> </div> </div> </div> );
}

// --- Profile/Settings Components ---
const SettingsSection = ({ title, children }) => ( /* ... (same as before) ... */
    <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-stone-200">
        <h3 className="text-lg font-bold mb-4 text-slate-800">{title}</h3>
        <div className="space-y-4">
            {children}
        </div>
    </div>
);
const SettingsItem = ({ label, children }) => ( /* ... (same as before) ... */
    <div>
        <label className="block text-sm font-medium text-stone-600 mb-1">{label}</label>
        {children}
    </div>
);
const EditableField = ({ label, initialValue, onSave, inputType = "text" }) => { /* ... (same as before) ... */
    const [isEditing, setIsEditing] = useState(false);
    const [value, setValue] = useState(initialValue);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const inputRef = useRef(null);

    useEffect(() => { setValue(initialValue); }, [initialValue]);
    useEffect(() => { if (isEditing && inputRef.current) { inputRef.current.focus(); inputRef.current.select(); } }, [isEditing]);

    const handleSave = async () => {
        setIsLoading(true); setError('');
        try {
             const success = await onSave(value);
             if (success) setIsEditing(false);
             else setError('Save failed.'); // Generic error if onSave returns false
        } catch(err) {
             setError(err.message || 'Save failed.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleCancel = () => { setValue(initialValue); setIsEditing(false); setError(''); };

    return (
        <SettingsItem label={label}>
            {isEditing ? (
                 <div className="space-y-1">
                     <div className="flex items-center space-x-2">
                        <input
                            ref={inputRef}
                            type={inputType}
                            value={value}
                            onChange={(e) => setValue(e.target.value)}
                            className="flex-grow bg-stone-100 text-slate-800 p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 border border-stone-200"
                            disabled={isLoading}
                        />
                        <button onClick={handleSave} disabled={isLoading} className="text-green-600 hover:text-green-800 p-1 rounded-full hover:bg-green-100 transition-colors">
                            {isLoading ? <Spinner/> : <CheckIcon className="w-5 h-5"/>}
                        </button>
                        <button onClick={handleCancel} disabled={isLoading} className="text-red-600 hover:text-red-800 p-1 rounded-full hover:bg-red-100 transition-colors">
                            <XCircleIcon className="w-5 h-5"/>
                        </button>
                    </div>
                     {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
                </div>
            ) : (
                <div className="flex items-center justify-between group">
                    <p className="text-slate-800 py-1">{value || <span className="text-stone-400 italic">Not set</span>}</p>
                    <button onClick={() => setIsEditing(true)} className="text-pink-600 hover:text-pink-800 p-1 rounded-full hover:bg-pink-100 opacity-0 group-hover:opacity-100 transition-opacity">
                        <EditIcon className="w-4 h-4"/>
                    </button>
                </div>
            )}
        </SettingsItem>
    );
};
function SettingsPage() { /* ... (mostly same as before) ... */
    const { logout } = useAuth();
    const { profile, isLoading, error, updateProfile, fetchProfile } = useProfile();

    if (isLoading && !profile) return <FullPageSpinner />; // Show spinner only on initial load
    if (error && !profile) return <div className="p-4"><ErrorMessage message={error} /><Button onClick={fetchProfile}>Retry</Button></div>;
    if (!profile) return <div className="p-4 text-center">Could not load profile data.</div>;

    const handleFieldSave = (fieldName) => async (newValue) => {
        try {
            await updateProfile({ [fieldName]: newValue });
             // Optionally show success feedback
            return true;
        } catch(err) {
             console.error("Profile update failed:", err);
             // Error is handled by updateProfile and shown via useProfile().error
            return false;
        }
    };

     const handleBioSave = async (event) => {
        const newBio = event.target.value;
        // Optionally add a debounce here if needed
        await handleFieldSave('bio')(newBio);
    };


    return (
        <div className="flex-1 flex flex-col bg-stone-100 text-slate-800 overflow-y-auto">
            <header className="p-4 border-b border-stone-200 bg-white sticky top-0 z-10">
                <h1 className="text-xl font-bold">Settings & Profile</h1>
            </header>
            <div className="p-4 sm:p-8 space-y-6 pb-24"> {/* Added padding bottom */}
                 {/* Profile Header */}
                 <div className="bg-white p-6 rounded-2xl shadow-sm border border-stone-200 flex items-center space-x-4">
                     <img src={profile.photos?.[0]?.url || 'https://placehold.co/100x100/ec4899/ffffff?text=U'} alt="Profile" className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover border-4 border-pink-500"/>
                     <div>
                         <h2 className="text-xl sm:text-2xl font-bold">{profile.first_name} {profile.last_name}</h2>
                         <p className="text-stone-500 text-sm">{profile.email}</p>
                     </div>
                      {/* Placeholder for Edit Photos button */}
                      <button className="ml-auto text-pink-600 hover:text-pink-800 p-2 rounded-full hover:bg-pink-100 transition-colors">
                          <EditIcon className="w-5 h-5"/>
                      </button>
                 </div>

                {/* Account Settings */}
                 <SettingsSection title="Account">
                    {useProfile().isLoading && <Spinner/>} {/* Show spinner during updates */}
                    {useProfile().error && <ErrorMessage message={useProfile().error} />}
                    <EditableField label="First Name" initialValue={profile.first_name || ''} onSave={handleFieldSave('first_name')} />
                    <EditableField label="Last Name" initialValue={profile.last_name || ''} onSave={handleFieldSave('last_name')} />
                    <SettingsItem label="Email"> <p className="text-stone-500">{profile.email}</p> </SettingsItem>
                    <EditableField label="Date of Birth" inputType="date" initialValue={profile.date_of_birth ? profile.date_of_birth.split('T')[0] : ''} onSave={handleFieldSave('date_of_birth')} />
                      {/* Add Gender, Interested In (needs dropdown/multi-select) */}
                 </SettingsSection>

                 {/* Profile Details */}
                  <SettingsSection title="Profile Details">
                     {useProfile().isLoading && <Spinner/>}
                     {useProfile().error && <ErrorMessage message={useProfile().error} />}
                     <SettingsItem label="Bio">
                         <textarea
                            className="w-full bg-stone-100 text-slate-800 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 border border-stone-200 min-h-[100px]"
                            defaultValue={profile.bio || ''}
                            placeholder="Tell us about yourself..."
                            onBlur={handleBioSave} // Save when user clicks away
                         ></textarea>
                     </SettingsItem>
                       {/* Add Interests, Occupation, Location editing */}
                     <EditableField label="Occupation" initialValue={profile.occupation || ''} onSave={handleFieldSave('occupation')} />
                     <EditableField label="Location (City)" initialValue={profile.location_city || ''} onSave={handleFieldSave('location_city')} />

                 </SettingsSection>

                {/* Subscription (Placeholder) */}
                 <SettingsSection title="Subscription">
                     <div className="flex justify-between items-center">
                         <div>
                            <p className="font-medium">Current Plan: <span className="text-pink-600">Free</span></p>
                            <p className="text-sm text-stone-500">Upgrade for more features!</p>
                         </div>
                        <Button size="sm">Upgrade</Button>
                     </div>
                 </SettingsSection>

                {/* Logout */}
                <Button onClick={logout} variant="danger" className="w-full mt-4"> Log Out </Button>
            </div>
        </div>
    );
}


// --- Main Layout & Navigation --- //
function MainLayout({ activePage, navigateTo, children }) {
    const NavButton = ({ page, icon, label }) => ( <button onClick={() => navigateTo(page)} className={`flex flex-col items-center justify-center space-y-1 p-2 rounded-md w-16 h-16 ${activePage === page ? 'text-pink-500' : 'text-stone-500 hover:text-pink-500'}`}>{icon}<span className="text-xs font-bold">{label}</span></button> );
    return ( <div className="h-screen w-screen bg-white flex flex-col md:flex-row overflow-hidden"> <nav className="md:w-24 bg-white border-t md:border-t-0 md:border-r border-stone-200 order-2 md:order-1 flex-shrink-0"> <div className="flex md:flex-col justify-around items-center h-full py-1 md:py-8">{/* Ensure NavButtons are inside */} <NavButton page="discover" icon={<HeartIcon className="w-7 h-7"/>} label="Discover" /> <NavButton page="matches" icon={<MessageCircleIcon className="w-7 h-7"/>} label="Matches" /> <NavButton page="profile" icon={<UserIcon className="w-7 h-7"/>} label="Profile" /> </div> </nav> <main className="flex-1 flex flex-col order-1 md:order-2 overflow-hidden h-full">{children}</main> </div> );
}

const AuthNavigator = () => {
    // Manages navigation between Landing, Login, Register
    const [page, setPage] = useState('landing'); // Start at landing

    if (page === 'landing') return <LandingPage navigateTo={setPage} />;
    if (page === 'login') return <LoginPage navigateTo={setPage} />;
    if (page === 'register') return <RegistrationPage navigateTo={setPage} />;
    return null; // Should not happen
};
const MainAppNavigator = () => { /* ... (same as before) ... */
    const [appPage, setAppPage] = useState('discover');
    const [activeChat, setActiveChat] = useState(null);
    const { showOnboarding, setShowOnboarding } = useAuth(); // Get onboarding state

    const handleChatSelect = (match) => { setActiveChat(match); setAppPage('chat'); };
    const navigateTo = (pageName) => { setAppPage(pageName); };

    return (
        <>
            {showOnboarding && <OnboardingModal onClose={() => setShowOnboarding(false)} />}
            <MainLayout activePage={appPage} navigateTo={navigateTo}>
                {appPage === 'discover' && <DiscoveryPage /* Pass openProfileDetail if needed */ />}
                {appPage === 'matches' && <MatchesPage navigateTo={navigateTo} onChatSelect={handleChatSelect} />}
                {appPage === 'chat' && activeChat && <ChatPage match={activeChat} onBack={() => setAppPage('matches')} />}
                {appPage === 'profile' && <SettingsPage />}
            </MainLayout>
        </>
    );
};

const RootNavigator = () => {
    const { user, isLoading } = useAuth();
    if (isLoading) { return ( <div className="h-screen w-screen flex items-center justify-center bg-stone-100"><Spinner /></div> ); }
    return user ? <MainAppNavigator /> : <AuthNavigator />;
};

// --- Root Component --- //
export default function App() {
  return (
    <AuthProvider>
        <ProfileProvider>
            <MatchesProvider>
                 {/* <WebSocketProvider> Placeholder */}
                    <RootNavigator />
                 {/* </WebSocketProvider> */}
            </MatchesProvider>
        </ProfileProvider>
    </AuthProvider>
  );
}


import React, { useState, useEffect, useCallback, useRef, useContext, createContext, useMemo } from 'react';



