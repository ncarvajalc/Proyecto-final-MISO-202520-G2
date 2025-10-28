import logo from "/logo.svg";
import { Button } from "./ui/button";
import { Link, useNavigate } from "react-router-dom";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "./ui/navigation-menu";
import { useAuth } from "@/contexts/auth-hooks";

const catalogLinks = [
  { to: "/catalogos/proveedores", label: "Proveedores" },
  { to: "/catalogos/productos", label: "Productos" },
];

const commercialLinks = [
  { to: "/comercial/vendedores", label: "Vendedores" },
  { to: "/comercial/planes-venta", label: "Planes de venta" },
  { to: "/comercial/informes-comerciales", label: "Informes comerciales" },
];

const renderNavigationLinks = (
  links: Array<{ to: string; label: string }>
) => (
  <ul className="grid w-[200px] gap-2">
    {links.map(({ to, label }) => (
      <li key={to}>
        <NavigationMenuLink asChild>
          <Link to={to} className="flex items-center justify-between">
            {label}
          </Link>
        </NavigationMenuLink>
      </li>
    ))}
  </ul>
);

const Navbar = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <>
      {/* Top black strip */}

      {/* Main navbar */}
      <nav className="bg-white shadow-sm flex">
        <div className="w-full">
          <div className="flex justify-between items-center h-20 px-4">
            {/* Logo and Navigation Menu */}
            <div className="flex items-center space-x-8">
              <Link to="/">
                <img src={logo} alt="logo" className="h-12 w-auto" />
              </Link>

              {/* Navigation Menu */}
              <NavigationMenu viewport={false}>
                <NavigationMenuList>
                  {/* Gestión de catálogos */}
                  <NavigationMenuItem>
                  <NavigationMenuTrigger>
                    <Link to="/catalogos">Gestión de catálogos</Link>
                  </NavigationMenuTrigger>
                  <NavigationMenuContent>
                    {renderNavigationLinks(catalogLinks)}
                  </NavigationMenuContent>
                </NavigationMenuItem>

                {/* Gestión comercial */}
                <NavigationMenuItem>
                  <NavigationMenuTrigger>
                    <Link to="/comercial">Gestión comercial</Link>
                  </NavigationMenuTrigger>
                  <NavigationMenuContent>
                    {renderNavigationLinks(commercialLinks)}
                  </NavigationMenuContent>
                </NavigationMenuItem>

                  {/* Gestión logística - Simple link */}
                  <NavigationMenuItem>
                    <NavigationMenuLink asChild>
                      <Link
                        to="/logistica"
                        className="px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground rounded-md transition-colors"
                      >
                        Gestión logística
                      </Link>
                    </NavigationMenuLink>
                  </NavigationMenuItem>
                </NavigationMenuList>
              </NavigationMenu>
            </div>

            {/* Logout button */}
            <Button variant="default" onClick={handleLogout}>
              Cerrar sesión
            </Button>
          </div>
        </div>
      </nav>
    </>
  );
};

export default Navbar;
