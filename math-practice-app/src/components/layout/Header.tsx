import { useState } from "react";
import { Link } from "react-router-dom";
import { Navigation } from "./Navigation";

export function Header() {
  const [open, setOpen] = useState(false);
  return (
    <header className="header">
      <div className="header-bar">
        <Link className="brand" to="/" onClick={() => setOpen(false)}>
          <span className="brand-mark" aria-hidden="true">
            +
          </span>
          <span className="brand-name">Math Practice</span>
        </Link>
        <button
          type="button"
          className="menu-button"
          aria-expanded={open}
          aria-controls="main-navigation"
          onClick={() => setOpen((value) => !value)}
        >
          {open ? "Close" : "Menu"}
        </button>
        <div id="main-navigation">
          <Navigation open={open} onNavigate={() => setOpen(false)} />
        </div>
      </div>
    </header>
  );
}
