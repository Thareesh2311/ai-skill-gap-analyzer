import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
const Navbar = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const handleLogout = () => {
        logout();
        navigate("/login");
    };
    const navItems = [
        {
            name: "Dashboard",
            path: "/dashboard"
        },
        {
            name: "Resume",
            path: "/resume"
        },
        {
            name: "Assessments",
            path: "/assessments"
        },
        {
            name: "Analytics",
            path: "/analytics"
        }
    ];
    return (
        <header className="navbar">
            <div className="navbar-container">
                <NavLink to="/dashboard" className="navbar-logo">
                    <span className="logo-icon">⚡</span>
                    <span>
                        Skill<span className="gradient-text">Gap</span>
                        <span className="logo-ai"> AI</span>
                    </span>
                </NavLink>
                <nav className="navbar-links">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className={({ isActive }) =>
                                `navbar-link ${
                                    isActive ? "active" : ""
                                }`
                            }
                        >
                            {item.name}
                        </NavLink>
                    ))}
                </nav>
                <div className="navbar-user">
                    <div className="user-info">
                        <div className="user-avatar">
                            {user?.name
                                ? user.name.charAt(0).toUpperCase()
                                : "U"}
                        </div>
                        <div className="user-details">
                            <span className="user-name">
                                {user?.name || "User"}
                            </span>
                            <span className="user-role">
                                Candidate
                            </span>
                        </div>
                    </div>
                    <button
                        className="logout-btn"
                        onClick={handleLogout}
                        title="Logout"
                    >
                        ⇥
                    </button>
                </div>
            </div>
        </header>
    );
};
export default Navbar;