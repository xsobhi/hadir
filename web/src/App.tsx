import { lazy, Suspense, type ReactNode } from "react";
import { BrowserRouter, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { useAuth } from "./auth/AuthContext";
import Overview from "./pages/Overview";
import SignIn from "./pages/SignIn";
import Welcome from "./pages/Welcome";

const Course = lazy(() => import("./pages/Course"));
const NewCourse = lazy(() => import("./pages/NewCourse"));
const Live = lazy(() => import("./pages/Live"));
const Students = lazy(() => import("./pages/Students"));
const Student = lazy(() => import("./pages/Student"));
const Assistant = lazy(() => import("./pages/Assistant"));
const Cards = lazy(() => import("./pages/Cards"));
const CaseStudy = lazy(() => import("./pages/CaseStudy"));

function Private({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const location = useLocation();
  if (user === undefined) return <div className="boot" aria-busy="true" />;
  if (user === null) return <Navigate to="/" replace state={{ from: location.pathname }} />;
  return <>{children}</>;
}

export default function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<div className="boot" aria-busy="true" />}>
        <Routes>
          <Route path="/" element={<Welcome />} />
          <Route path="/signin" element={<SignIn mode="in" />} />
          <Route path="/signup" element={<SignIn mode="up" />} />
          <Route path="/about" element={<CaseStudy />} />
          <Route path="/app" element={<Private><Overview /></Private>} />
          <Route path="/app/courses/new" element={<Private><NewCourse /></Private>} />
          <Route path="/app/courses/:id" element={<Private><Course /></Private>} />
          <Route path="/app/live/:id" element={<Private><Live /></Private>} />
          <Route path="/app/students" element={<Private><Students /></Private>} />
          <Route path="/app/students/:id" element={<Private><Student /></Private>} />
          <Route path="/app/assistant" element={<Private><Assistant /></Private>} />
          <Route path="/app/assistant/:threadId" element={<Private><Assistant /></Private>} />
          <Route path="/app/cards/:id" element={<Private><Cards /></Private>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
