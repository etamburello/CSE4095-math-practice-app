import { NavLink } from "react-router-dom";

const LINKS = [
  { to: "/", label: "Home", end: true },
  { to: "/practice/setup", label: "Practice", end: false },
  { to: "/statistics", label: "Statistics", end: false },
  { to: "/settings", label: "Settings", end: false },
];

export function Navigation({ open, onNavigate }: { open: boolean; onNavigate: () => void }) {
  return (
    <nav className={open ? "nav nav-open" : "nav"} aria-label="Main">
      {LINKS.map((link) => (
        <NavLink
          key={link.to}
          to={link.to}
          end={link.end}
          className={({ isActive }) => (isActive ? "nav-link is-active" : "nav-link")}
          onClick={onNavigate}
        >
          {link.label}
        </NavLink>
      ))}
    </nav>
  );
}
