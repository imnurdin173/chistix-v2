import Link from "next/link";
import { ShieldAlert, Lock, ArrowLeft, RefreshCw, Layers } from "lucide-react";

// Dictionary Konfigurasi Error
const errorConfig: Record<
  string,
  { title: string; description: string; icon: React.ElementType; color: string }
> = {
  "401": {
    title: "Sesi Berakhir / Belum Login",
    description: "Kamu harus masuk ke akun Chistix terlebih dahulu untuk mengakses halaman ini.",
    icon: Lock,
    color: "text-amber-600 bg-amber-100",
  },
  "403": {
    title: "Akses Ditolak (Forbidden)",
    description: "Kamu tidak memiliki izin/role yang sesuai untuk mengakses area ini.",
    icon: ShieldAlert,
    color: "text-red-600 bg-red-100",
  },
  "409": {
    title: "Konflik Data (Conflict)",
    description: "Permintaan tidak dapat diproses karena terjadi bentrok data (misal: email atau tiket sudah digunakan).",
    icon: Layers,
    color: "text-orange-600 bg-orange-100",
  },
};

export default async function ErrorPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;

  // Gunakan data error sesuai kode, atau fallback jika kode tidak terdaftar
  const error = errorConfig[code] || {
    title: "Terjadi Kesalahan",
    description: "Sistem mengalami kendala saat memproses permintaan kamu.",
    icon: RefreshCw,
    color: "text-gray-600 bg-gray-100",
  };

  const Icon = error.icon;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#FDFBF7] px-4 text-center">
      <div className={`flex h-20 w-20 items-center justify-center rounded-2xl mb-6 shadow-sm ${error.color}`}>
        <Icon className="h-10 w-10" />
      </div>

      <span className="text-xs font-bold uppercase tracking-widest text-gray-500">
        Status Error {code}
      </span>
      <h1 className="mt-2 text-3xl font-extrabold text-gray-900 sm:text-4xl">
        {error.title}
      </h1>
      <p className="mt-3 max-w-md text-sm text-gray-500">
        {error.description}
      </p>

      <div className="mt-8 flex gap-3">
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-xl bg-gray-900 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-gray-800"
        >
          <ArrowLeft className="h-4 w-4" />
          Kembali ke Beranda
        </Link>
      </div>
    </div>
  );
}