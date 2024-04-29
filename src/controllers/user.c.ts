import { Request, Response } from 'express';
import { User } from "../entities/User";
import { getRepository } from "typeorm";
const cloudinary = require("cloudinary").v2;
import { getFileName } from "../utils/index"
import UserRepository from "../repository/user";
// import Cache from '../config/node-cache';

interface MulterFileRequest extends Request {
    file: any; // Adjust this to match the type of your uploaded file
}

const userController = {
    getAllUsers: async (req: Request, res: Response) => {
        const rs = await UserRepository.getAllUsers();

        return res.status(rs?.code).json(rs?.data);
    },
    getUserById: async (req: Request, res: Response) => {
        const user_id = req.params.id; // Lấy id từ URL params
        const userDb = await UserRepository.getUserById(user_id);

        return res.status(userDb?.code).json({ msg: userDb?.msg });
    },

    getProfile: async (req: Request, res: Response) => {
        const userId: any = req.headers['userId'] || "";
        // const valueCache = await Cache.get(userId + "user");

        // if (valueCache) { 
        //     console.log("get from cache")
        //     return res.json({
        //         status: "success",
        //         profile: valueCache
        //     });
        // }

        const userDb = await UserRepository.getProfile(userId);

        return res.json({
            status: userDb?.status,
            profile: userDb?.data,
            msg: userDb?.msg
        });
    },

    updateProfile: async (req: Request | MulterFileRequest, res: Response) => {
        const userId: any = req.headers['userId'] || "";

        let avatar = "", filename = ""
        if ('file' in req && req.file) {
            avatar = req.file.path;
            filename = req.file.filename;
        }

        const { fullname, gender, phone, address, date_of_birth, email } = req.body;
        let data: any = { fullname, gender, phone, address, date_of_birth, email };
        const userDb = await UserRepository.updateProfile(userId, data, avatar);
        // set new value for cache
        // Cache.del(userId+"user");

        if (userDb?.status === "failed") {
            if (filename !== "") {
                cloudinary.uploader.destroy(filename)
            }
        }

        return res.json({
            status: userDb?.status,
            msg: userDb?.msg
        })
    }
};

export default userController;
