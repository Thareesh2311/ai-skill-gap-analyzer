import {
    BrowserRouter,
    Routes,
    Route,
    Navigate
} from "react-router-dom";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Resume from "./pages/Resume";
import Assessments from "./pages/Assessments";

import MCQAssessment from "./pages/MCQAssessment";
import CodingAssessment from "./pages/CodingAssessment";
import CodingResult from "./pages/CodingResult";
import SQLAssessment from "./pages/SQLAssessment";
import SQLResult from "./pages/SQLResult";

import ProtectedRoute from "./components/ProtectedRoute";
import MainLayout from "./layouts/MainLayout";
import Analytics from "./pages/Analytics";
import Learning from "./pages/Learning";



function App() {

    return (

        <BrowserRouter>

            <Routes>


                {/* =================================================
                    PUBLIC ROUTES
                ================================================= */}

                <Route
                    path="/login"
                    element={
                        <Login />
                    }
                />


                <Route
                    path="/register"
                    element={
                        <Register />
                    }
                />


                {/* =================================================
                    DASHBOARD
                ================================================= */}

                <Route
                    path="/dashboard"
                    element={
                        <ProtectedRoute>

                            <MainLayout>

                                <Dashboard />

                            </MainLayout>

                        </ProtectedRoute>
                    }
                />


                {/* =================================================
                    RESUME
                ================================================= */}

                <Route
                    path="/resume"
                    element={
                        <ProtectedRoute>

                            <MainLayout>

                                <Resume />

                            </MainLayout>

                        </ProtectedRoute>
                    }
                />


                {/* =================================================
                    ASSESSMENTS
                ================================================= */}

                <Route
                    path="/assessments"
                    element={
                        <ProtectedRoute>

                            <MainLayout>

                                <Assessments />

                            </MainLayout>

                        </ProtectedRoute>
                    }
                />


                {/* =================================================
                    MCQ ASSESSMENT
                ================================================= */}

                <Route
                    path="/mcq-assessment"
                    element={
                        <ProtectedRoute>

                            <MainLayout>

                                <MCQAssessment />

                            </MainLayout>

                        </ProtectedRoute>
                    }
                />


                {/* =================================================
                    CODING ASSESSMENT
                ================================================= */}

                <Route
                    path="/coding-assessment"
                    element={
                        <ProtectedRoute>

                            <MainLayout>

                                <CodingAssessment />

                            </MainLayout>

                        </ProtectedRoute>
                    }
                />


                {/* =================================================
                    CODING RESULT
                ================================================= */}

                <Route
                    path="/coding-result/:assessmentId"
                    element={
                        <ProtectedRoute>

                            <MainLayout>

                                <CodingResult />

                            </MainLayout>

                        </ProtectedRoute>
                    }
                />


                {/* =================================================
                    SQL ASSESSMENT
                ================================================= */}

                <Route
                    path="/sql-assessment"
                    element={
                        <ProtectedRoute>

                            <MainLayout>

                                <SQLAssessment />

                            </MainLayout>

                        </ProtectedRoute>
                    }
                />


                {/*
                =====================================================
                SQL RESULT

                We will enable this after creating:

                src/pages/SQLResult.jsx
                src/pages/sqlResult.css

                Route will be:

                /sql-result/:assessmentId
                =====================================================
                */}


                {/* =================================================
                    ANALYTICS
                ================================================= */}

                <Route
                    path="/analytics"
                    element={
                        <ProtectedRoute>
                            <MainLayout>
                                <Analytics />
                            </MainLayout>
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/sql-result"
                    element={<SQLResult />}
                />

                <Route
                    path="/sql-result/:assessmentId"
                    element={<SQLResult />}
                />


                {/* =================================================
                    DEFAULT ROUTE
                ================================================= */}

                <Route
                    path="/"
                    element={
                        <Navigate
                            to="/dashboard"
                            replace
                        />
                    }
                />
                <Route
                    path="/learning"
                    element={
                        <ProtectedRoute>
                            <MainLayout>
                                <Learning />
                            </MainLayout>
                        </ProtectedRoute>
                    }
                />


                {/* =================================================
                    UNKNOWN ROUTE
                ================================================= */}

                <Route
                    path="*"
                    element={
                        <Navigate
                            to="/dashboard"
                            replace
                        />
                    }
                />


            </Routes>

        </BrowserRouter>
    );
}


export default App;