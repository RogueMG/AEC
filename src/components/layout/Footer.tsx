import { Link } from "react-router";
import Logo from "@/components/brand/Logo";
import { company, navItems } from "@/data/site";

function Footer() {
  return (
    <footer className="border-t border-ink-line bg-ink text-surface">
      <div className="page flex flex-col gap-8 py-10 lg:flex-row lg:items-center lg:justify-between">
        <Link to="/" aria-label="Asiatic Engineering Co., home">
          <Logo />
        </Link>
        <nav aria-label="Footer">
          <ul className="type-small flex flex-wrap gap-x-7 gap-y-3 font-medium">
            {navItems.map((item) => (
              <li key={item.to}>
                <Link to={item.to} className="text-ink-muted hover:text-surface">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
      <div className="border-t border-ink-line">
        <div className="page type-small flex flex-col gap-2 py-5 text-ink-muted sm:flex-row sm:justify-between">
          <p>
            © {new Date().getFullYear()} {company.name}
          </p>
          <p>MSME Udyam registration {company.msmeUdyam}</p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
