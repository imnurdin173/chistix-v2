import { Request, Response, NextFunction } from "express";
import { successResponse } from "../utils/response";
import { getProvinces, getRegencies } from "../services/wilayah.service";

export const getProvincesHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const data = await getProvinces();
        return successResponse(res, 200, "Province fetched successfully", data);
    } catch (err) {
        next(err);
    }
};

// export const getRegenciesHandler = async (req: Request, res: Response, next:nextFunction) => {
//     try{
//         const {provinceId} = regencyParamsSchema.parse(req.params);
//         const data = await getRegencies(provinceId);
//         return successResponse(res, 200, "Regencies fetched successfully", data);
//     } catch (err) {
//         next(err);
//     }
// }