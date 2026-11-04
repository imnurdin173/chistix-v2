import { AppError } from "../utils/AppError";

const WILAYAH_BASE = "https://emsifa.github.io/api-wilayah-indonesia/api";

const wilayahCache = new Map<string, unknown>();

async function fetchWilayah(path: string) {
    if (wilayahCache.has(path)) return wilayahCache.get(path);
    const res = await fetch(`${WILAYAH_BASE}${path}`);
    if(!res.ok) throw new AppError("Wilayah service is unavailable", 502);
    const data = await res.json();
    wilayahCache.set(path, data);
    return data;
}

export const getProvinces = () => fetchWilayah("/province.json");
export const getRegencies = (provinceId: string) =>
    fetchWilayah(`regencies/${provinceId}.json`);