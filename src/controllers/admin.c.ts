import { Request, Response } from 'express';
import { getRepository } from "typeorm";
import { User, Permission } from '../entities';
import parsePermission from '../helper/parsePermission';
import path from 'path';
import UserRepository from '../repository/user';
import search from '../helper/search';
import pagination from '../helper/pagination';
import bcrypt from "bcrypt";
const { v4: uuidv4 } = require("uuid");
// import Cache from '../config/node-cache';

const adminController = {
    getPermission: async (req: Request, res: Response) => {

        // find in cache
        // const valueCache = await Cache.get(process.env.USER_ID_ADMIN_TEAM as string + "admin");
        // if (valueCache) {
        //     return res.json({
        //         status: "success",
        //         rs: valueCache
        //     })
        // }

        const adminRepository = getRepository(User);
        try {
            const adminDb = await adminRepository.findOneOrFail({
                where: { user_id: process.env.USER_ID_ADMIN_TEAM, role: "admin" },
                select: ['permissions']
            })
            const rs: any = await parsePermission(adminDb?.permissions);

            // set new value for cache
            // Cache.set(process.env.USER_ID_ADMIN_TEAM as string+"admin", rs);

            return res.json({
                status: "success",
                rs
            })
        } catch (error) {
            console.log(error)
            return res.json({
                status: "failed",
                msg: "error with find permissions array."
            })
        }
    }, 

    updatePermission: async (req: Request, res: Response) => {
        const {key, name, method} = req.body;
        const adminRepository = getRepository(User);

        if (!key || !name || !method)
            return res.json({
                status: "failed",
                msg: "Input invalid."
            })

        try {
            // save key - name for permission.
            let newPermission = new Permission()
            const permissionRepository = getRepository(Permission);
            newPermission.key = key;
            newPermission.name = name;
            await permissionRepository.save(newPermission);
            let adminDb: User = await adminRepository.findOneOrFail({
                where: { user_id: process.env.USER_ID_ADMIN_TEAM, role: "admin" }
            });

            // delete all method in permission.
            for (let m of ["C", "R", "U", "D"])
                adminDb.permissions = adminDb.permissions.filter((p) => p!= `${m}_${key}`);

            // add new method belong to key permission
            for (let m of method)
                adminDb.permissions.push(`${m}_${key}`);
                        
            await adminRepository.save(adminDb);

            // del old value cache
            // Cache.del(process.env.USER_ID_ADMIN_TEAM as string+"admin");

            return res.json({
                status: "success",
                msg: "Update permission sucessfully!",
                permissions: await parsePermission(adminDb.permissions)
            });
            
        } catch (error) {
            return res.json({
                status: "failed",
                msg: "error with update permisison."
            })
        }
    },

    getLogs: async (req: Request, res: Response) => {
        const salonId = req.body.salonId;
        const filePath = path.join(__dirname, `../logs/${salonId}.txt`);

        return res.sendFile(filePath);
    },

    getUsers: async (req: Request, res: Response) => {
        let userRp = await UserRepository.getAllUsers();
        const { page, per_page, q }: any = req.query;
        
        if (q) {
            userRp.data = await search({data: userRp?.data, q, fieldname: "fullname"});
          }
    
          const rs = await pagination({data: userRp?.data, page, per_page});
          userRp.data = rs?.data;

        return res.json({...userRp, total_page: rs?.total_page});
    },

    createUser: async (req: Request, res: Response) => {
        const {fullname, role, username, password} = req.body;
        
        if (!username || !password) {
            return res.json({
                status: "failed",
                msg: "Missing username or password."
            })
        }

        const userRp = await UserRepository.getProfileByUsername(username);

        if (userRp?.data) {
            return res.json({
                status: "failed",
                msg: "Username already exists."
            })
        }

        let user = new User();
        user.user_id = await uuidv4();
        const salt = await bcrypt.genSalt(11);
        const hashPassword = await bcrypt.hash(password, salt);
        const userRs = await UserRepository.registerUser({...user, username, password: hashPassword, fullname, role});
        
        return res.json({...userRs});
    },

    deleteUser: async (req: Request, res: Response) => {
        const {userId} = req.params;

        if (!userId) {
            return res.json({
                status: "failed",
                msg: "Missing userid"
            })
        }
        const userRp = await UserRepository.getProfileById(userId);

        if (userId === process.env.USER_ID_ADMIN_TEAM) {
            return res.json({
                status: "failed",
                msg: "Can not delete this user."
            })
        }

        let userRs = await UserRepository.delete(userRp?.data);
        if (!userRs?.data) {
            // block this user => can not login.
            userRs = await UserRepository.blockUser(userRp?.data)
        }
        

        return res.json({...userRs});
    }
}

export default adminController;
