import Link from "next/link";
import Image from "next/image";

const services = [
  { label: "Events", href: "/events" },
  { label: "Blog", href: "/blog" },
  { label: "Business Partner", href: "#" },
  { label: "Advertisement", href: "#" },
];

const supports = [
  { label: "Chistix Help Center", href: "#" },
  { label: "Privacy Policy", href: "#" },
  { label: "Terms & Conditions", href: "#" },
  { label: "About Chistix", href: "#" },
];

const payments = [
  { name: "DANA", src: "/finlogo/dana.svg", width: 80, height: 24 },
  { name: "QRIS", src: "/finlogo/qris.svg", width: 64, height: 24 },
];

const socials = [
  {
    label: "Chistix di X",
    href: "#",
    icon: (
      <>
        <path d="M4 4h4l12 16h-4z" />
        <path d="M4 20l6.8-7.3M13.2 10.7 20 4" />
      </>
    ),
  },
  {
    label: "Chistix di Instagram",
    href: "#",
    icon: (
      <>
        <rect x="3" y="3" width="18" height="18" rx="5" />
        <circle cx="12" cy="12" r="4" />
        <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" />
      </>
    ),
  },
  {
    label: "Chistix di Facebook",
    href: "#",
    icon: (
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    ),
  },
  {
    label: "Chistix di YouTube",
    href: "#",
    icon: (
      <>
        <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z" />
        <path d="m9.75 15.02 5.75-3.27-5.75-3.27z" />
      </>
    ),
  },
  {
    label: "Chistix di Threads",
    href: "#",
    icon: (
      <>
        <circle cx="12" cy="12" r="4" />
        <path d="M16 8v5a3 3 0 0 0 6 0v-1a10 10 0 1 0-3.92 7.94" />
      </>
    ),
  },
  {
    label: "Chistix di WhatsApp",
    href: "#",
    icon: (
      <>
        <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
        <path d="M9 8.5c0 3 2.5 5.5 5.5 6.5l1.2-1.4-1.9-1-.8.8c-.9-.4-1.7-1.2-2.1-2.1l.8-.8-1-1.9z" />
      </>
    ),
  },
];

export default function Footer() {
  return (
    <footer className="mt-auto w-full border-t bg-amber-100">
      <div className="container mx-auto max-w-8xl px-4 pt-10 sm:px-6">
        <div className="grid grid-cols-2 gap-8 lg:grid-cols-4">
          <div className="col-span-2 flex flex-col items-start gap-4 lg:col-span-1">
            <Link href="/">
              <Image
                src="/chistix-logo.png"
                alt="chistix"
                width={200}
                height={80}
                className="h-12 w-auto"
              />
            </Link>
            <div className="flex flex-col gap-1 mt-5 ml-2">
              <span className="text-xs text-gray-600">Powered by</span>
              <Link href="#" target="_blank" rel="noopener noreferrer">
                <Image
                  src="/logopwdk-text.png"
                  alt="purwadhika"
                  width={100}
                  height={40}
                  className="h-5 w-auto"
                />
              </Link>
            </div>
          </div>

          <div>
            <h2 className="mb-3 text-sm font-bold text-gray-900">Services</h2>
            <ul className="flex flex-col gap-2">
              {services.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="text-sm text-gray-700">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="mb-3 text-sm font-bold text-gray-900">Supports</h2>
            <ul className="flex flex-col gap-2">
              {supports.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="text-sm text-gray-700">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="col-span-2 lg:col-span-1">
            <h2 className="mb-3 text-sm font-bold text-gray-900">Payments</h2>
            <ul className="flex flex-wrap items-center gap-x-4 gap-y-3">
              {payments.map((plogo) => (
                <li key={plogo.name}>
                  <Image
                    src={plogo.src}
                    alt={plogo.name}
                    width={plogo.width}
                    height={plogo.height}
                    className="h-5 w-auto"
                  />
                </li>
              ))}
            </ul>
          </div>

          <ul className="mt-10 col-span-full flex flex-wrap items-center justify-center gap-3 md:gap-6">
            {socials.map((sosmed) => (
              <li key={sosmed.label}>
                <a
                  href={sosmed.href}
                  aria-label={sosmed.label}
                  className="inline-flex text-amber-500 transition-colors hover:text-amber-700"
                >
                  <svg
                    className="size-6"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    {sosmed.icon}
                  </svg>
                </a>
              </li>
            ))}
          </ul>
        </div>
        <p className="mt-6 border-t border-amber-200 py-4 text-center text-sm text-gray-700">
          © {new Date().getFullYear()} Chistix Team. All Rights Reserved.
        </p>
      </div>
    </footer>
  );
}
