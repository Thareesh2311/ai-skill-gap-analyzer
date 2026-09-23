import Navbar from "../components/Navbar";
const MainLayout = ({ children }) => {
    return (
        <div className="app-layout">
            <Navbar />
            <main className="main-content">
                {children}
            </main>
        </div>
    );
};
export default MainLayout;