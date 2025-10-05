import { Suspense } from "react";
import "./App.css";
import { Outlet } from "react-router-dom";
import Loading from "./pages/Loading";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";

function App() {
  return (
    <div className="h-screen flex flex-col">
      <Navbar />
      <div className="flex-1 flex flex-col min-h-0">
        <Suspense fallback={<Loading />}>
          <div className="flex-1 container mx-auto px-4 py-8 text-center overflow-auto">
            <Outlet />
          </div>
        </Suspense>
      </div>
      <Footer />
    </div>
  );
}

export default App;
