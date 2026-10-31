import Navbar from "@/components/menubar/navbar";
import Footer from "@/components/menubar/footer";
import CustomerSidebar from "@/components/sidebar/customerSidebar";

// Shared frame for all customer dashboard pages
export default function MyAccountLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      <div className="flex-1 bg-[#faf8f4]">
        <div className="mx-auto flex max-w-7xl flex-col items-start gap-6 p-4 md:flex-row md:p-8">
          <CustomerSidebar />
          <div className="w-full min-w-0 flex-1">{children}</div>
        </div>
      </div>
      <Footer />
    </>
  );
}