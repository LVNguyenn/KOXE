import { IsNull, Like, Not, getRepository } from "typeorm";
import { FormatData } from '../utils/index';
import { Role, Salon } from "../entities";

const RoleRepository = {

    async getAllBySalon(data: any) {
        try {
            const roleRepository = getRepository(Role);
            let rs;
            let roleDb = roleRepository
            .createQueryBuilder("role")
            .innerJoinAndSelect('role.salon', 'Salon', 'Salon.salon_id = :salonId', { ...data })

            if (data?.id) {
                rs = await roleDb
                .where('id = :id', { ...data })
                .getMany()
            } else {
                rs = await roleDb.getMany()
            }

            return FormatData("success", "find successfully!", rs);
        } catch (error) {
            console.log(error)
            return FormatData("failed", "Can not find role.");
        }
    },

    async createNewRole(data: any) {
        try {
            const roleRepository = getRepository(Role);
            const roleDb = await roleRepository.save(data);

            return FormatData("success", "create new role successfully!", roleDb);
        } catch (error) {
            return FormatData("failed", "Error create new role.");
        }
    },

    async updatePermissionForRole(data: any) {
        try {
            const roleRepository = getRepository(Role);
            const oldRole = await this.getAllBySalon(data);
            const newRole = await roleRepository.save({...oldRole?.data[0], permissions: data?.permissions, ...data})
            
            return FormatData("success", "update permission for role successfully!", newRole);
        } catch (error) {
            return FormatData("failed", "Error update permissions for role.");
        }
    },

    async delete(data: any) {
        try {
            const roleRepository = getRepository(Role);
            const oldRole = await this.getAllBySalon(data);
            const delRole = await roleRepository.remove(oldRole?.data[0])

            return FormatData("success", "deleted the role successfully!", delRole);
            
        } catch (error) {
            return FormatData("failed", "delete the role failed.");
        }
    }

    
}

export default RoleRepository;
