import { createContext, useContext, useEffect, useState } from "react";
import authService from "../services/authService";
const AuthContext = createContext(null);
export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) {
            setLoading(false);
            return;
        }
        const loadUser = async () => {
            try {
                const response = await authService.getProfile();
                setUser(
                    response.data?.user ||
                    response.user ||
                    response.data ||
                    null
                );
            } catch (error) {
                localStorage.removeItem("token");
                setUser(null);
            } finally {
                setLoading(false);
            }
        };
        loadUser();
    }, []);
    const register = async (userData) => {
        const response = await authService.register(userData);
        return response;
    };
    const login = async (userData) => {
        const response = await authService.login(userData);
        const token =
            response.data?.token ||
            response.token;
        if (!token) {
            throw new Error("Authentication token was not returned.");
        }
        localStorage.setItem("token", token);
        setUser(
            response.data?.user ||
            response.user ||
            null
        );
        return response;
    };
    const logout = () => {
        localStorage.removeItem("token");
        setUser(null);
    };
    return (
        <AuthContext.Provider
            value={{
                user,
                loading,
                register,
                login,
                logout,
                isAuthenticated: !!user
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};
export const useAuth = () => {
    return useContext(AuthContext);
};