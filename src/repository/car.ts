import { getRepository } from "typeorm";
import { FormatData } from "../utils/index";
import { Car } from "../entities";

const CarRepository = {
  async findCarByCarIdSalonId(data: any) {
    try {
      const carRepository = getRepository(Car);
      const carDb: Car = await carRepository.findOneOrFail({
        where: { car_id: data.carId },
        relations: ["salon"],
      });

      if (carDb.salon?.salon_id !== data.salonId) {
        return FormatData("failed", "Error information.");
      }

      return FormatData("success", "find successfully!", carDb);
    } catch (error) {
      return FormatData("failed", "Error find the car.");
    }
  },

  async findSalonIdByCarId(data: any) {
    try {
      const carRepository = getRepository(Car);
      const carDb: Car = await carRepository.findOneOrFail({
        where: { car_id: data.carId, available: 1 },
        relations: ["salon"],
      });

      return FormatData("success", "find successfully!", carDb);
    } catch (error) {
      return FormatData("failed", "Error find the car.");
    }
  },

  async findLegalByCar(data: any) {
    try {
      const carRepository = getRepository(Car);
      const carDb: any = await carRepository
        .createQueryBuilder("car")
        .leftJoinAndSelect("car.process", "Process")
        .leftJoinAndSelect("Process.documents", "LegalDocuments")
        .leftJoinAndSelect("LegalDocuments.details", "LegalDetails")
        .leftJoinAndSelect("car.salon", "salon", "salon.salon_id = :salonId", {
          ...data,
        })
        .addOrderBy("LegalDocuments.order", "ASC")
        .where({
          car_id: data?.carId,
        })
        .getOne();

      return FormatData("success", "find successfully!", carDb);
    } catch (error) {
      console.log(error);
      return FormatData("failed", "Error find the legal documents.");
    }
  },

  async getProcessByCarId(data: any) {
    try {
      const carRepository = getRepository(Car);
      const carDb = await carRepository.findOneOrFail({
        where: { car_id: data?.carId },
        relations: ["process"],
      });

      return FormatData("success", "find successfully!", carDb);
    } catch (error) {
      console.log(error);
      return FormatData("failed", "Error find the legal documents.");
    }
  },

  async updateCar(data: any) {
    try {
      const carRepository = getRepository(Car);
      const carDb = await carRepository.save({ ...data });

      return FormatData("success", "updated successfully!", carDb);
    } catch (error) {
      return FormatData("failed", "Error update car.");
    }
  },

  async getAllCar(data: any) {
    try {
      const carRepository = getRepository(Car);
      let rs = "";
      let carDb: any = await carRepository
        .createQueryBuilder("car")
        .leftJoinAndSelect("car.warranties", "warranty")
        .leftJoinAndSelect("car.salon", "salon")
        .leftJoinAndSelect("warranty.maintenance", "maintenance");
      if (data?.id) {
        carDb = await carDb.where({ car_id: data?.id });
      }
      rs = await carDb.getMany();

      //console.log(rs)

      return FormatData("success", "find successfully!", rs);
    } catch (error) {
      console.log(error);
      return FormatData("failed", "Can not find the salon.");
    }
  },
};

export default CarRepository;
