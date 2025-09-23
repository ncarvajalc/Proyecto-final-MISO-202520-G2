import logo from "/logo.svg";
import { Button } from "./ui/button";

const Navbar = () => {
  return (
    <>
      {/* Top black strip */}

      {/* Main navbar */}
      <nav className="bg-white shadow-sm flex">
        <div className="w-full">
          <div className="flex justify-between items-center h-16 px-4">
            {/* Logo and brand */}
            <div className="flex items-center space-x-2">
              <img src={logo} alt="logo" className="w-32 h-32" />
            </div>

            {/* Navigation links */}

            {/* Logout button */}
            <Button variant="default">Cerrar sesión</Button>
          </div>
        </div>
      </nav>
    </>
  );
};

export default Navbar;
