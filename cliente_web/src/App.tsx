import { Suspense } from "react";
import "./App.css";
import { Outlet } from "react-router-dom";
import Loading from "./pages/Loading";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";

function App() {
  return (
    <div>
      <main>
        <Suspense fallback={<Loading />}>
          <Navbar />
          <Outlet />
          <Footer />
        </Suspense>
      </main>
    </div>
  );
}

export default App;
