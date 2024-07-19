import { getRepository } from "typeorm";
import { FormatData } from "../utils/index";
import {
  Car,
  Car_User_Legals,
  LegalDetails,
  LegalDocuments,
  Process,
} from "../entities";
import momenttz from "moment-timezone";

const LegalsRepository = {
  async createProcess(data: any) {
    try {
      const processRepository = getRepository(Process);
      const processDb = await processRepository.save(data);

      return FormatData("success", "create new process successfully!", processDb);
    } catch (error) {
      return FormatData("failed", "Error create new process.");
    }
  },

  async createLegalDocuments(data: any) {
    try {
      const legalsRepository = getRepository(LegalDocuments);
      const documentDb = await legalsRepository.save(data);

      return FormatData(
        "success",
        "create legal documents successfully!",
        documentDb
      );
    } catch (error) {
      return FormatData("failed", "Error create new legal documents.");
    }
  },

  async createLegalDetails(data: any) {
    try {
      const legalsRepository = getRepository(LegalDetails);
      await legalsRepository.save(data);

      return FormatData("success", "create legal details successfully!", data);
    } catch (error) {
      console.log(error);
      return FormatData("failed", "Error create new legal details.");
    }
  },

  async findProcessByIdSalonId(data: any) {
    try {
      const processRepository = getRepository(Process);
      const processDb = await processRepository.findOneOrFail({
        where: { id: data.processId },
        relations: ["salon"],
      });

      if (processDb.salon?.salon_id !== data?.salonId)
        return FormatData("failed", "Error find the process");

      return FormatData("success", "find successfully!", processDb);
    } catch (error) {
      return FormatData("failed", "Error find the process");
    }
  },

  async getAllProcessBySalonId(data: any) {
    try {
      const processRepository = getRepository(Process);
      let processDb;
      const queryBuilder: any = await processRepository
        .createQueryBuilder("Process")
        .innerJoinAndSelect(
          "Process.salon",
          "salon",
          "salon.salon_id = :salonId",
          { ...data }
        )
        .leftJoinAndSelect("Process.documents", "legalDocuments")
        .leftJoinAndSelect("legalDocuments.details", "legalDetails")
        .orderBy("legalDocuments.order", "ASC");

      if (data?.processId) {
        processDb = await queryBuilder.where({ id: data?.processId }).getOne();
        if (!processDb) throw new Error("Data is null");

        return FormatData("success", "find successfully!", processDb);
      } else {
        processDb = await queryBuilder.getMany();
        const dataRs = processDb.filter((pr: any) => pr?.salon != null);
        if (!dataRs[0]) throw new Error("Data is null");

        return FormatData("success", "find successfully!", dataRs);
      }
    } catch (error) {
      console.log(error);
      return FormatData("failed", "Error find the legal documents.");
    }
  },

  async findLegalDocumentSalonId(data: any) {
    try {
      const legalRepository = getRepository(LegalDocuments);
      const queryBuilder: any = await legalRepository
        .createQueryBuilder("legalDocuments")
        .leftJoinAndSelect("legalDocuments.details", "legalDetails")
        .orderBy("legalDocuments.order", "ASC");

      if (data?.period) {
        queryBuilder.where({ period: data.period });
      }

      if (data?.carId) {
        queryBuilder.innerJoinAndSelect(
          "legalDocuments.car",
          "car",
          "car.car_id = :carId",
          { ...data }
        );
      }

      const legalDb: any = await queryBuilder.getMany();

      return FormatData("success", "find successfully!", legalDb);
    } catch (error) {
      console.log(error);
      return FormatData("failed", "Error find the legal documents.");
    }
  },

  async findLegalDetailsByPeriodId(data: any) {
    try {
      const legalRepository = getRepository(LegalDetails);
      const queryBuilder = await legalRepository
        .createQueryBuilder("LegalDetails")
        // .leftJoinAndSelect('LegalDetails.document', 'legalDocuments', 'LegalDetails.document = :period', { ...data })
        .leftJoinAndSelect("LegalDetails.document", "legalDocuments");

      if (data?.id) {
        const legalDb = await queryBuilder
          .where({
            id: data.id,
          })
          .getOne();

        return FormatData("success", "find successfully!", legalDb);
      }

      queryBuilder.getMany();

      return FormatData("success", "find successfully!", queryBuilder);
    } catch (error) {
      console.log(error);
      return FormatData("failed", "Error find the legal documents.");
    }
  },

  async findLegalUserByPhone(data: any) {
    try {
      const carUserRepository = getRepository(Car_User_Legals);
      let carUserDb: any = await carUserRepository.find({
        where: { phone: data?.phone, car_id: data?.carId },
      });

      // get documents by period
      // for (const carUser of carUserDb) {
      //     const documentDb = await this.findDocumentById({ data });
      //     carUser.documents = documentDb;
      // }

      return FormatData("success", "find successfully!", carUserDb);
    } catch (error) {
      return FormatData(
        "failed",
        "Error find the legals for the user by phone."
      );
    }
  },

  async findDocumentById(data: any) {
    try {
      const documentRepository = getRepository(LegalDocuments);
      const documentDb = await documentRepository.findOneOrFail({
        where: { period: data?.period },
        relations: ["details"],
      });

      return FormatData("success", "find successfully!", documentDb);
    } catch (error) {
      return FormatData("failed", "Error find the legals for the documents.");
    }
  },

  // async getFirstDocumentsByCar(data: any) {
  //     try {
  //         const carRepository = getRepository(Car);
  //         const documentDb = await carRepository
  //             .createQueryBuilder('Car')
  //             .leftJoinAndSelect('Car.process', 'process')
  //             .where({ car_id: data?.carId })
  //             .getOne()

  //         return FormatData("success", "find successfully!", documentDb);
  //     } catch (error) {
  //         console.log(error)
  //         return FormatData("failed", "Error find the legal documents.");
  //     }
  // },

  async getPeriodCurrentByCarUser(data: any) {
    try {
      const carUserRepository = getRepository(Car_User_Legals);
      const carUserDb = await carUserRepository.findOneOrFail({
        where: { car_id: data?.carId, phone: data?.phone },
      });

      return FormatData("success", "find successfully!", carUserDb);
    } catch (error) {
      return FormatData("failed", "Error find the legal documents.");
    }
  },

  // need to review
  async getAllLegalsUserForSalon(data: any) {
    try {
      const carUserRepository = getRepository(Car_User_Legals);
      const queryBuilder = await carUserRepository
        .createQueryBuilder("Car_User_Legals")
        .leftJoinAndSelect("Car_User_Legals.car", "Car");
      // .leftJoin("Car", "car", "car.car_id = Car_User_Legals.car_id")
      // .leftJoinAndSelect('car.salon', 'salon', 'salon.salon_id = :salonId', {...data})

      // if (data?.done !== undefined && data?.done !== "undefined") {
      //     const carUserDb = queryBuilder.where({done: data?.done}).getMany()
      //     console.log("here")
      //     return FormatData("success", "find successfully!", carUserDb);
      // }
      const carUserDb = queryBuilder.getMany();

      return FormatData("success", "find successfully!", carUserDb);
    } catch (error) {
      console.log(error);
      return FormatData("failed", "Error find the legal documents.");
    }
  },

  // async getAllLegalsUserForSalon2(data: any) {
  //     try {
  //         let carUserDb;
  //         const carUserRepository = getRepository(Car_User_Legals);
  //         if (data?.done !== undefined && data?.done !== "undefined") {
  //             carUserDb = await carUserRepository.find({ })
  //         } else {
  //             carUserDb = await carUserRepository.find({ where: { done: data?.done }})
  //         }

  //         // let dataRs = carUserDb.filter((carUser) => carUser.)

  //     } catch (error) {
  //         return FormatData("failed", "Error find the legal documents.");
  //     }

  // },

  async updateProcessById(data: any) {
    try {
      const processRepository = getRepository(Process);
      const processDb = await this.findProcessByIdSalonId(data);
      const newProcess = await processRepository.save({
        ...processDb?.data,
        name: data?.name,
        description: data?.description,
        type: data?.type,
      });

      return FormatData(
        "success",
        "Updated the process successfully!",
        newProcess
      );
    } catch (error) {
      console.log(error);
      return FormatData("failed", "Error update the process.");
    }
  },

  async updateNameLegalDocuments(data: any) {
    try {
      const legalRepository = getRepository(LegalDocuments);
      let legalDb = await this.findLegalDocumentSalonId(data);

      if (!legalDb?.data[0])
        return FormatData("failed", "Error update the legal documents");

      const dataDb = await legalRepository.save({
        ...legalDb?.data[0],
        name: data?.name,
        order: data?.order,
      });

      return FormatData(
        "success",
        "Updated the legal documents successfully!",
        dataDb
      );
    } catch (error) {
      console.log(error);
      return FormatData("failed", "Error update the legal documents.");
    }
  },

  async updateLegalDetailsOfDocuments(data: any) {
    try {
      const legalRepository = getRepository(LegalDetails);
      let legalDb = await this.findLegalDetailsByPeriodId(data);
      await legalRepository.save({
        ...legalDb?.data,
        name: data?.name,
        update_date: momenttz().tz("Asia/Saigon").format(),
      });

      return FormatData(
        "success",
        "Updated the legal details successfully!",
        legalDb
      );
    } catch (error) {
      console.log(error);
      return FormatData("failed", "Error update the legal details.");
    }
  },

  async removeProcess(data: any) {
    try {
      const processRepository = getRepository(Process);
      const processDb = await this.findProcessByIdSalonId(data);
      await processRepository.remove(processDb?.data);

      return FormatData(
        "success",
        "delete legal details successfully!",
        processDb?.data
      );
    } catch (error) {
      console.log(error);
      return FormatData("failed", "Error delete the legal details.");
    }
  },

  async removeLegalDocuments(data: any) {
    try {
      const legalRepository = getRepository(LegalDocuments);
      const legalDb = await this.findLegalDocumentSalonId(data);
      await legalRepository.remove(legalDb?.data[0]);

      return FormatData(
        "success",
        "delete legal documents successfully!",
        legalDb?.data
      );
    } catch (error) {
      console.log(error);
      return FormatData("failed", "Error delete the legal documents.");
    }
  },

  async removeLegalDetails(data: any) {
    try {
      const legalRepository = getRepository(LegalDetails);
      const legalDb = await this.findLegalDetailsByPeriodId(data);
      const rmObject: any = {
        id: legalDb?.data?.id,
        name: legalDb?.data?.name,
        update_date: legalDb?.data?.update_date,
      };
      await legalRepository.remove(rmObject);

      return FormatData(
        "success",
        "delete legal details successfully!",
        legalDb?.data
      );
    } catch (error) {
      console.log(error);
      return FormatData("failed", "Error delete the legal details.");
    }
  },

  async removeAllLegalDetails(data: any) {
    try {
      const legalRepository = getRepository(LegalDetails);
      const legalDb = await legalRepository.delete({ document: data?.period });

      return FormatData(
        "success",
        "delete legal details successfully!",
        legalDb
      );
    } catch (error) {
      console.log(error);
      return FormatData("failed", "Error delete the legal details.");
    }
  },

  async addLegalForUser(data: any) {
    try {
      const carUserRepository = getRepository(Car_User_Legals);
      // console.log({...data[0]?.data, details: data?.details})
      const carUserDb = await carUserRepository.save(data);

      return FormatData(
        "success",
        "add legal documents for the user successfully!",
        carUserDb
      );
    } catch (error) {
      console.log(error);
      return FormatData("failed", "Error add documents for the user.");
    }
  },

  async removeLegalDetailsForUser(data: any) {},

  async getAllCarNotDoneBySalon(data: any) {},

  async getProcessDocumentsById(data: any) {
    try {
      const processRepository = getRepository(Process);
      const processDb = await processRepository
        .createQueryBuilder("Process")
        .leftJoin("Process.salon", "salon", "salon.salon_id = :salonId", {
          ...data,
        })
        .leftJoinAndSelect("Process.documents", "legalDocuments")
        .where({ id: data?.processId })
        .orderBy("legalDocuments.order", "ASC")
        .getOne();

      return FormatData("success", "find successfully!", processDb);
    } catch (error) {
      return FormatData("success", "find error");
    }
  },
};

export default LegalsRepository;
