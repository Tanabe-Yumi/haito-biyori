const Footer = () => {
  return (
    <footer className="w-full border-t border-accent-foreground bg-background py-6 mt-auto">
      <div className="container flex flex-col items-center justify-center text-sm text-muted-foreground px-4 md:px-8 mx-auto">
        <p>
          &copy; {new Date().getFullYear()} 配当びより. All rights reserved.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
