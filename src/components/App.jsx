import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

/* Import Components */
import Home from "./Home";
import Header from "./Header";
import Footer from "./Footer";
import Contact from "./Contact";
import BranchSelection from '../pages/BranchSelection';
import Login from '../pages/Login';
import ScrollToTop from "../utils/ScrollToTop";
import Attendance from "../pages/Attendance";
import Marks from "../pages/Marks";
import PostStudent from "../pages/PostStudent";
import ReportsPage from "../pages/ReportsPage";
import MarksReport from "../pages/MarksReport"
import AttendanceReport from "../pages/AttendanceReport";
import ProgressReport from "../pages/ProgressReport";
import VerifyStudent from "../pages/VerifyStudent"
import InternalMarks from "../pages/InternalMarks";
import CourseOutcomeForm from "../pages/CourseOutcomeForm";
import AttainmentReport from "../pages/AttainmentReport";
import SEEAttainmentReport from "../pages/SEEAttainmentReport";
import DirectCOAttainmentReport from "../pages/DirectCOAttainmentReport";
import IndirectAttainment from "../pages/IndirectAttainment";
import IndirectCOAttainmentReport from "../pages/IndirectCOAttainmentReport";
import OverallCOAttainmentReport from "../pages/OverallCOAttainmentReport";
import POAttainmentReport from "../pages/POAttainmentReport";
import AboutUs from "./AboutUs";

const App = () => {
  const selectedBranch = localStorage.getItem('selectedBranch'); // Check if branch is selected
  return (
    <Router>
      <Header />
      <Routes>
        {/* If no branch selected, show BranchSelection as the default route */}
        <Route path="/" element={selectedBranch ? <Navigate to="/login" /> : <BranchSelection />} />

        {/* Route to Login after branch selection */}
        <Route path="/login" element={<Login />} />

        {/* Route to home after login */}
        <Route path="/home" element={<Home />} />

        <Route path="/contact" element={<Contact />} />
        <Route path="/about" element={<AboutUs />} />

        {/* Routes for Attendance and Marks are now accessible without login */}
        <Route path="/attendance" element={<Attendance />} />
        <Route path="/marks" element={<Marks />} />
        <Route path="/reports" element={<ReportsPage />} />

        <Route path="/reports/marks" element={<MarksReport />} />
        <Route path="/reports/attendance" element={<AttendanceReport />} />

        <Route path="/progressreport" element={<ProgressReport />} />

        <Route path="/poststudent" element={<PostStudent />} />
        <Route path="/verify" element={<VerifyStudent />} />

        <Route path="/internalmarks" element={<InternalMarks />} />

        <Route path="/course-outcome" element={<CourseOutcomeForm />} />

        <Route path="/attainment" element={<AttainmentReport />} />
        <Route path="/attainment/see" element={<SEEAttainmentReport />} /> 

        <Route path="/attainment/direct" element={<DirectCOAttainmentReport />} />
        <Route path="/attainment/indirect" element={<IndirectCOAttainmentReport />} />
        <Route path="/attainment/overall" element={<OverallCOAttainmentReport />} />
        <Route path="/attainment/po" element={<POAttainmentReport />} />

        <Route path="/attainment/entry" element={<IndirectAttainment />} />

        {/* Redirect any unknown path to the root (Branch Selection) */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
      <Footer />
      <ScrollToTop />
    </Router>
  );
};

export default App;
