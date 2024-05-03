import { User } from "../entities/User";
import { getRepository } from "typeorm";
import { FormatData } from '../utils/index';
const cloudinary = require("cloudinary").v2;
import { getFileName } from "../utils/index"


const UserRepository = {

    async getAllUsers() {
        const userRepository = getRepository(User);
        const rs = await userRepository.find({});

        return FormatData("success", null, rs, 200);
    },

    async getUserById(user_id: string) {
        const userRepository = getRepository(User);

        try {
            const userDb = await userRepository.find({ where: { user_id: user_id } });

            if (!userDb) {
                return FormatData("failed", "User not found", null, 404);
            }

            const { password, ...user } = userDb[0];

            return FormatData("success", null, user, 200);
        } catch (error) {
            return FormatData("failed", "Internal server error", null, 500);
        }
    },

    async getProfileById (userId: string) {
        const userRepository = getRepository(User);

        try {
            const userDb = await userRepository.findOneOrFail({ where: { user_id: userId } });
            const { password, ...others } = userDb;

            return FormatData("success", null, others);
        } catch (error) {
            return FormatData("failed", "Invalid information.");
        }
    },

    async getProfileByUsername (username: string) {
        const userRepository = getRepository(User);

        try {
            const userDb = await userRepository.findOneOrFail({ where: { username: username } });
            const { password, ...others } = userDb;

            return FormatData("success", null, others);
        } catch (error) {
            return FormatData("failed", "Invalid information.");
        }
    },

    async updateProfile (userId: string, data: any, avatar: any) {
        const userRepository = getRepository(User);
        
        let newProfile: any = data
        if(avatar !== "") newProfile.avatar = avatar;
        const {user_id, username, password, google, facebook, role, aso, ...other} = newProfile;

        try {
            const userDb = await userRepository.findOneOrFail({where: {user_id: userId}});

            if(avatar !== "" && userDb.avatar){
                if(!getFileName(userDb.avatar).includes('default')){
                    cloudinary.uploader.destroy(getFileName(userDb.avatar));
                }
            }
            const saveProfile = {...userDb, ...other};
            await userRepository.save(saveProfile);

            // set new value for cache
            // Cache.del(userId+"user");

            return FormatData("success", "Update successfully!")

        } catch (error) {
            return FormatData("failed", "Invalid information.")
        }
    },

    async registerUser (data: any) {
        try {
            const userRepository = getRepository(User);
            await userRepository.save(data);

            return FormatData("success", "Register successfully!")
        } catch (error) {
            return FormatData("failed", "Server error, please try later.")
        }
    },

    async getProfileByOther (data: any) {
        const userRepository = getRepository(User);

        try {
            const userDb = await userRepository.findOneOrFail({ where: { phone: data?.phone }});

            return FormatData("success", null, userDb);
        } catch (error) {
            return FormatData("failed", "Invalid information.");
        }
    },
};

export default UserRepository;
