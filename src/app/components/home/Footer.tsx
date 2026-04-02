import { Link } from "react-router";
import logoImg from "../../../assets/84eb31f383e3c5c569c8f83a91ad8f1d232586a2.png";

export function Footer() {
  return (
    <footer className="bg-[#0F3057] dark:bg-gray-950 text-white py-12">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          {/* Logo & Tagline */}
          <div>
            <div className="flex items-center space-x-3 mb-4">
              <img src={logoImg} alt="Mor Events" className="h-10 w-10" />
              <div>
                <h3 className="font-bold text-lg">Mor Events</h3>
                <p className="text-sm text-white/70">
                  Travel. Explore. Experience.
                </p>
              </div>
            </div>
            <p className="text-white/70 text-sm">
              Creating unforgettable adventure experiences across India since
              2024.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-bold mb-4">Quick Links</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <button
                  onClick={() => {
                    const element = document.getElementById("home");
                    element?.scrollIntoView({ behavior: "smooth" });
                  }}
                  className="text-white/70 hover:text-white transition-colors"
                >
                  Home
                </button>
              </li>
              <li>
                <button
                  onClick={() => {
                    const element = document.getElementById("about");
                    element?.scrollIntoView({ behavior: "smooth" });
                  }}
                  className="text-white/70 hover:text-white transition-colors"
                >
                  About Us
                </button>
              </li>
              <li>
                <button
                  onClick={() => {
                    const element = document.getElementById("events");
                    element?.scrollIntoView({ behavior: "smooth" });
                  }}
                  className="text-white/70 hover:text-white transition-colors"
                >
                  Events
                </button>
              </li>
              <li>
                <button
                  onClick={() => {
                    const element = document.getElementById("contact");
                    element?.scrollIntoView({ behavior: "smooth" });
                  }}
                  className="text-white/70 hover:text-white transition-colors"
                >
                  Contact
                </button>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="font-bold mb-4">Contact</h4>
            <ul className="space-y-2 text-sm text-white/70">
              <li>Limbodi, Indore – 452001</li>
              <li>
                <a
                  href="tel:+917024896018"
                  className="hover:text-white transition-colors"
                >
                  +91 7024896018
                </a>
              </li>
              <li>
                <a
                  href="mailto:moreventsofficial@gmail.com"
                  className="hover:text-white transition-colors"
                >
                  moreventsofficial@gmail.com
                </a>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-bold mb-4">Legal</h4>
            <ul className="space-y-2 text-sm text-white/70">
              <li>
                <Link to="/terms" className="hover:text-white transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/terms" className="hover:text-white transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link to="/terms" className="hover:text-white transition-colors">
                  Cancellation Policy
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/20 pt-8 text-center text-sm text-white/70">
          <p>
            © {new Date().getFullYear()} Mor Events. All rights reserved.
            <br />
            Designed & Developed by Mor Events Team
          </p>
        </div>
      </div>
    </footer>
  );
}
