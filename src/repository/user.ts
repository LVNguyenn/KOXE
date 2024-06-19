import { User } from "../entities/User";
import { getRepository } from "typeorm";
import { FormatData } from '../utils/index';
const cloudinary = require("cloudinary").v2;
import { getFileName } from "../utils/index"


const UserRepository = {

    async getAllUsers() {
        const userRepository = getRepository(User);
        const rs = await userRepository.find({
            select: ["user_id", "fullname", "gender", "phone", "email", "address", 
            "date_of_birth", "avatar", "role", "role", "avgRating"],
            where: {blocked: false}
        });

        return FormatData("success", null, rs, 200);
    },

    async getUserById(user_id: string) {
        const userRepository = getRepository(User);

        try {
            const userDb = await userRepository.find({ where: { user_id: user_id, blocked: false } });

            if (!userDb) {
                return FormatData("failed", "User not found", null, 404);
            }

            const { password, ...user } = userDb[0];

            return FormatData("success", null, user, 200);
        } catch (error) {
            return FormatData("failed", "Internal server error", null, 500);
        }
    },

    async getProfileById(userId: string) {
        if (!userId)
            return FormatData("failed", "Invalid information.");

        const userRepository = getRepository(User);

        try {
            const userDb = await userRepository.findOneOrFail({ where: { user_id: userId, blocked: false } });
            const { password, ...others } = userDb;

            return FormatData("success", null, others);
        } catch (error) {
            return FormatData("failed", "Invalid information.");
        }
    },

    async getProfileByUsername(username: string) {
        const userRepository = getRepository(User);

        try {
            const userDb = await userRepository.findOneOrFail({ where: { username: username, blocked: false } });
            const { password, ...others } = userDb;

            return FormatData("success", null, others);
        } catch (error) {
            return FormatData("failed", "Invalid information.");
        }
    },

    async updateProfile(userId: string, data: any, avatar: any) {
        const userRepository = getRepository(User);

        let newProfile: any = data
        if (avatar !== "") newProfile.avatar = avatar;
        const { user_id, username, password, google, facebook, role, aso, ...other } = newProfile;

        try {
            const userDb = await userRepository.findOneOrFail({ where: { user_id: userId, blocked: false } });

            if (avatar !== "" && userDb.avatar) {
                if (!getFileName(userDb.avatar).includes('default')) {
                    cloudinary.uploader.destroy(getFileName(userDb.avatar));
                }
            }
            const saveProfile = { ...userDb, ...other };
            await userRepository.save(saveProfile);

            // set new value for cache
            // Cache.del(userId+"user");

            return FormatData("success", "Update successfully!")

        } catch (error) {
            return FormatData("failed", "Invalid information.")
        }
    },

    async registerUser(data: any) {
        try {
            const userRepository = getRepository(User);
            await userRepository.save(data);

            return FormatData("success", "Register successfully!")
        } catch (error) {
            return FormatData("failed", "Server error, please try later.")
        }
    },

    async getProfileByOther(data: any) {
        const userRepository = getRepository(User);

        try {
            const userDb = await userRepository.findOneOrFail({ where: { phone: data?.phone } });

            return FormatData("success", null, userDb);
        } catch (error) {
            return FormatData("failed", "Invalid information.");
        }
    },

    async getAllEmployeesBySalonId(data: any) {
        try {
            const userRepository = getRepository(User);
            const userDb = await userRepository
                .createQueryBuilder('user')
                .innerJoin('user.salonId', 'salon', 'salon.salon_id = :salonId', { ...data })
                .select(['user.user_id', 'user.fullname', 'user.gender', 'user.phone', 'user.address', 'user.role'])
                .getMany()

            return FormatData("success", "find successfully!", userDb);
        } catch (error) {
            console.log(error)
            return FormatData("failed", "Invalid information.");
        }
    },

    async delete(data: any) {
        try {
            const userRepository = getRepository(User);
            const userDb = await userRepository.remove(data);

            return FormatData("success", "deleted successfully!", userDb); 
        } catch (error) {
            return FormatData("failed", "Invalid information.");
        }
    },

    async blockUser(data: any) {
        try {
            const userRepository = getRepository(User);
            const userDb = await userRepository.save({...data, blocked: true});
            
            return FormatData("success", "This user is blocked successfully!", userDb);
        } catch (error) {
            return FormatData("failed", "Blocking faiked.");
        }
    },

    async setPermissionNull(data: any) {
        try {
            const userRepository = getRepository(User);
            const userDb = await userRepository.save({...data, permissions: null});
            
            return FormatData("success", "deleted permission successfully!", userDb);
        } catch (error) {
            return FormatData("failed", "delete permission failed.");
        }
    },

    async getSalonIdByUserId(data: any) {
        try {
            const userRepository = getRepository(User);
            const userDb = await userRepository.findOneOrFail({
                where: {user_id: data?.userId},
                relations: ['salonId']
            })
            
            return FormatData("success", "finded successfully!", userDb?.salonId?.salon_id);
        } catch (error) {
            return FormatData("failed", "find failed.", "");
        }
    },

    async getEmployeeBySalonUserId(data: any) {
        try {
            const userRepository = getRepository(User);
            const userDb = await userRepository
                .createQueryBuilder('user')
                .innerJoin('user.salonId', 'salon', 'salon.salon_id = :salonId', { ...data })
                .where({ user_id: data?.userId})
                .getOne()
            
            return FormatData("success", "finded successfully!", userDb);
        } catch (error) {
            return FormatData("failed", "find failed.", "");
        }
    },

    async setPermissionAndRole(data: any) {
        try {
            const userRepository = getRepository(User);
            const userDb = await userRepository.save({...data});
            
            return FormatData("success", "set permission successfully!", userDb);
        } catch (error) {
            return FormatData("failed", "set permission failed.");
        }
    }
};

export default UserRepository;
