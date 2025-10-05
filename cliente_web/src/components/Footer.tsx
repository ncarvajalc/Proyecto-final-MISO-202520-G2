const Footer = () => {
  return (
    <footer className="w-full border-t border-brand-200 bg-white">
      {/* Light blue separator line */}
      <div className="w-full h-px bg-brand-200"></div>

      {/* Main footer content */}
      <div className="py-6 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto flex justify-between items-center">
          {/* Left side - Brand */}
          <div className="text-primary font-bold text-lg">MediSupply</div>

          {/* Right side - Copyright */}
          <div className="text-muted-foreground text-sm">
            © 2025 MeddiSupply. Todos los derechos reservados.
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
