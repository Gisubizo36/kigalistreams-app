import React from "react";
import { Mail, Phone } from "lucide-react";

const ContactView = ({ navigate }) => (
  <div className="relative w-full min-h-screen pt-16 flex items-center justify-center">
    <div
      className="absolute inset-0 z-0 performant-bg"
      style={{ marginTop: "-4rem" }}
    ></div>
    <div className="relative z-10 container mx-auto py-8 px-4 sm:px-6 max-w-lg">
      <div className="bg-gray-800 p-8 rounded-xl shadow-2xl">
        {/* --- CHANGED: Title Updated --- */}
        <h1 className="text-3xl font-bold text-white mb-6 text-center">
          Contact Developers
        </h1>
        {/* ------------------------------ */}
        <p className="text-gray-400 mb-8 text-center">
          Have questions, feedback, or content requests? We'd love to hear from
          you!
        </p>
        <div className="space-y-4">
          <a
            href="mailto:kigalistream.s@gmai.com"
            className={`flex items-center justify-center bg-amber-600 hover:bg-emerald-700 text-white font-semibold py-4 rounded-xl transition shadow-lg shadow-emerald-600/30`}
          >
            <Mail size={24} className="mr-3" />
            Email Us
          </a>

          {/* --- CHANGED: Added New Numbers --- */}
          <a
            href="https://wa.me/250795389739"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-xl transition shadow-lg shadow-green-600/30"
          >
            <Phone size={20} className="mr-3" />
            WhatsApp (+250795389739)
          </a>
          <a
            href="https://wa.me/250798871939"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-xl transition shadow-lg shadow-green-600/30"
          >
            <Phone size={20} className="mr-3" />
            WhatsApp (+250798871939)
          </a>
          <a
            href="https://wa.me/250795484704"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-xl transition shadow-lg shadow-green-600/30"
          >
            <Phone size={20} className="mr-3" />
            WhatsApp (+250795484704)
          </a>
          {/* ---------------------------------- */}
        </div>
      </div>
    </div>
  </div>
);

export default ContactView;