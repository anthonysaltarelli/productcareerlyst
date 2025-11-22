export const Footer = () => {
  return (
    <footer className="bg-gradient-to-br from-slate-800 to-slate-900 border-t-4 border-slate-700">
      <div className="max-w-7xl mx-auto px-6 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand Section */}
          <div className="md:col-span-2">
            <div className="inline-block px-6 py-3 rounded-[1.5rem] bg-gradient-to-br from-pink-200 to-purple-200 shadow-[0_6px_0_0_rgba(147,51,234,0.3)] border-2 border-purple-300 mb-4">
              <span className="text-lg font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                Product Careerlyst
              </span>
            </div>
            <p className="text-gray-300 font-medium mb-4">
              Your AI-powered career operating system. Stop feeling stuck. Start crushing it.
            </p>
            <div className="flex gap-4">
              <a
                href="https://www.youtube.com/@ProductManagerAnthony"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-[0.75rem] bg-slate-700 hover:bg-purple-500 flex items-center justify-center transition-all duration-200 border-2 border-slate-600 hover:border-purple-400"
                aria-label="YouTube"
                tabIndex={0}
              >
                <span className="text-white font-bold">▶</span>
              </a>
              <a
                href="https://www.linkedin.com/company/productcareerlyst/"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-[0.75rem] bg-slate-700 hover:bg-purple-500 flex items-center justify-center transition-all duration-200 border-2 border-slate-600 hover:border-purple-400"
                aria-label="LinkedIn"
                tabIndex={0}
              >
                <span className="text-white font-bold">in</span>
              </a>
              <a
                href="mailto:team@productcareerlyst.com"
                className="w-10 h-10 rounded-[0.75rem] bg-slate-700 hover:bg-purple-500 flex items-center justify-center transition-all duration-200 border-2 border-slate-600 hover:border-purple-400"
                aria-label="Email"
                tabIndex={0}
              >
                <span className="text-white font-bold">✉</span>
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white font-bold text-lg mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <a
                  href="#features"
                  className="text-gray-300 hover:text-purple-400 font-medium transition-colors duration-200"
                  tabIndex={0}
                >
                  Features
                </a>
              </li>
              <li>
                <a
                  href="#testimonials"
                  className="text-gray-300 hover:text-purple-400 font-medium transition-colors duration-200"
                  tabIndex={0}
                >
                  Testimonials
                </a>
              </li>
              <li>
                <a
                  href="#pricing"
                  className="text-gray-300 hover:text-purple-400 font-medium transition-colors duration-200"
                  tabIndex={0}
                >
                  Pricing
                </a>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-white font-bold text-lg mb-4">Legal</h3>
            <ul className="space-y-2">
              <li>
                <a
                  href="/privacy"
                  className="text-gray-300 hover:text-purple-400 font-medium transition-colors duration-200"
                  tabIndex={0}
                >
                  Privacy Policy
                </a>
              </li>
              <li>
                <a
                  href="/terms"
                  className="text-gray-300 hover:text-purple-400 font-medium transition-colors duration-200"
                  tabIndex={0}
                >
                  Terms of Service
                </a>
              </li>
              <li>
                <a
                  href="/refund"
                  className="text-gray-300 hover:text-purple-400 font-medium transition-colors duration-200"
                  tabIndex={0}
                >
                  Refund Policy
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t-2 border-slate-700">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-gray-400 font-medium text-sm">
              © {new Date().getFullYear()} Product Careerlyst. All rights reserved.
            </p>
            <p className="text-gray-400 font-medium text-sm">
              Made with 💜 for Product Managers everywhere
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

