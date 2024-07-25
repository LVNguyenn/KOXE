import { getRepository, LessThan, MoreThan } from "typeorm";
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

  async findSalonIdByCarId2(data: any) {
    try {
      const carRepository = getRepository(Car);
      const carDb: Car = await carRepository.findOneOrFail({
        where: { car_id: data.carId },
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
        .innerJoinAndSelect(
          "car.salon",
          "salon",
          data?.salonId ? "salon.salon_id =:salonId" : "",
          { ...data }
        )
        .leftJoinAndSelect("warranty.maintenance", "maintenance")
        .addOrderBy("car.date_in", "DESC");

      if (data?.id) {
        carDb = await carDb.where({ car_id: data?.id });
      }
      if (data.available !== undefined && data.available !== "undefined") {
        carDb = await carDb.where({ available: data?.available });
      }
      if (data.fromDate !== undefined && data.fromDate !== "undefined" && data.toDate !== undefined && data.toDate !== "undefined" ) {
        // carDb = await carDb.where({ date_out: MoreThan(data.fromDate) && LessThan(data.toDate) });
        carDb = await carDb.where('car.date_out >= :fromDate', { fromDate: data.fromDate })
        .andWhere('car.date_out <= :toDate', { toDate: data.toDate });
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
