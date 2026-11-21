import type { ReactNode } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./auth/AuthContext";
import Assistant from "./pages/Assistant";
import Cards from "./pages/Cards";
import Course from "./pages/Course";
import Live from "./pages/Live";
import NewCourse from "./pages/NewCourse";
import Overview from "./pages/Overview";
import Settings from "./pages/Settings";
import SignIn from "./pages/SignIn";
import Student from "./pages/Student";
import Students from "./pages/Students";
import Welcome from "./pages/Welcome";

// Pages are imported eagerly: the server renders whichever one is asked for, and the browser must hydrate the
// same tree without waiting for a lazy chunk.
function Private({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  if (user === undefined) return <div className="boot" aria-busy="true" />;
  if (user === null) return <Navigate to="/" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Welcome />} />
      <Route path="/signin" element={<SignIn mode="in" />} />
      <Route path="/signup" element={<SignIn mode="up" />} />
      <Route path="/app/settings" element={<Private><Settings /></Private>} />
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
  );
}
