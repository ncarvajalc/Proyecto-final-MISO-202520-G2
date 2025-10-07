import { Suspense } from "react";
import "./App.css";
import { Outlet, useLocation } from "react-router-dom";
import Loading from "./pages/Loading";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import { Toaster } from "./components/ui/sonner";

function App() {
  const location = useLocation();
  const isLoginPage = location.pathname === "/login";

  return (
    <div className="h-screen flex flex-col">
      {!isLoginPage && <Navbar />}
      <div className="flex-1 flex flex-col min-h-0">
        <Suspense fallback={<Loading />}>
          <div className="flex-1 container mx-auto px-4 py-8 overflow-auto">
            <Outlet />
          </div>
        </Suspense>
      </div>
      {!isLoginPage && <Footer />}
      <Toaster />
    </div>
  );
}

export default App;
