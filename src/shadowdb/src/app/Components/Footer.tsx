
import React from 'react';
import Link from 'next/link';



export const FooterSection=()=>{
    return (
            <footer className="bg-gray-900 py-8 px-4">
        <div className="max-w-6xl mx-auto grid md:grid-cols-4 gap-8">
          <div>
            <h3 className="font-bold mb-4">Product</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="#"
                  className="hover:text-purple-400 transition-colors"
                >
                  Features
                </Link>
              </li>
              <li>
                <Link
                  href="SubScription"
                  className="hover:text-purple-400 transition-colors"
                >
                  Pricing
                </Link>
              </li>
              <li>
                <Link
                  href="#"
                  className="hover:text-purple-400 transition-colors"
                >
                  Documentation
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="font-bold mb-4">Company</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="#"
                  className="hover:text-purple-400 transition-colors"
                >
                  About Us
                </Link>
              </li>
              <li>
                <Link
                  href="#"
                  className="hover:text-purple-400 transition-colors"
                >
                  Careers
                </Link>
              </li>
              <li>
                <Link
                  href="#"
                  className="hover:text-purple-400 transition-colors"
                >
                  Contact
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="font-bold mb-4">Resources</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="#"
                  className="hover:text-purple-400 transition-colors"
                >
                  Blog
                </Link>
              </li>
              <li>
                <Link
                  href="#"
                  className="hover:text-purple-400 transition-colors"
                >
                  Case Studies
                </Link>
              </li>
              <li>
                <Link
                  href="#"
                  className="hover:text-purple-400 transition-colors"
                >
                  Help Center
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="font-bold mb-4">Legal</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="#"
                  className="hover:text-purple-400 transition-colors"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  href="#"
                  className="hover:text-purple-400 transition-colors"
                >
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link
                  href="#"
                  className="hover:text-purple-400 transition-colors"
                >
                  Cookie Policy
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-8 text-center text-sm text-gray-400">
          © {new Date().getFullYear()} ShadowDB. All rights reserved.
        </div>
      </footer>
    )
}