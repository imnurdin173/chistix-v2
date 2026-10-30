import FooterSingle from "@/components/menubar/footerSingle";
import Image from "next/image";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center bg-radial from-white to-amber-100 overflow-hidden">
      <div className="absolute bottom-0 right-0 pointer-events-none z-0 overflow-hidden transform translate-x-1/4 translate-y-1/4 sm:translate-x-10 sm:translate-y-10">
        <svg
          width="655"
          height="474"
          viewBox="0 0 655 474"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-100 h-auto sm:w-137.5 md:w-163.75 opacity-80"
        >
          <path
            d="M691.403 150.483C744.008 180.187 794.542 233.117 795.118 286.605C795.693 339.982 746.195 393.917 693.59 444.725C640.984 495.533 585.385 543.215 522.189 550.585C458.993 557.955 388.2 525.013 330.644 474.205C273.089 423.397 228.771 354.722 243.851 300.675C258.815 246.517 333.292 207.098 390.848 177.283C448.403 147.58 489.037 127.48 536.693 120.78C584.349 114.08 638.912 120.668 691.403 150.483Z"
            fill="url(#paint0_linear_162_4510)"
          />
          <defs>
            <linearGradient
              id="paint0_linear_162_4510"
              x1="518"
              y1="118.387"
              x2="518"
              y2="551.613"
              gradientUnits="userSpaceOnUse"
            >
              <stop stopColor="#F86F00" />
              <stop offset="1" stopColor="#C01C0D" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      <div className="relative z-10 mb-8 text-center">
        <Image
          src="/chistix-logo.png"
          alt="Chistix"
          width={200}
          height={70}
          className="h-18 w-auto"
          priority
        />
      </div>

      <div className="relative z-10 w-full max-w-100 bg-white rounded-xl shadow-xl p-8 border border-gray-100">
        {children}
      </div>

      <FooterSingle />
    </div>
  );
}
