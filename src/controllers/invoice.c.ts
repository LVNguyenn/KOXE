import { Request, Response } from "express";
import { Car } from "../entities/Car";
import { MoreThan, getRepository } from "typeorm";
import { Invoice, Salon, User } from '../entities';
import statistics, { averageEachMonth, getTopSeller } from '../helper/statistics';
import Year from "../utils/year";
import legalsController from "./legals.c";
import LegalsRepository from "../repository/legals";
import CarRepository from "../repository/car";
import createNotification from "../helper/createNotification";
import UserRepository from "../repository/user";


const invoiceController = {
  printInvoiceBuyCar: async (req: Request, res: Response) => {
    const { carId, salonId, note, fullname, email, phone, expense, processId, employeeId } = req.body;

    if (!employeeId) {
      return res.json({
        status: "failed",
        msg: "Employee must be not null."
      })
    }

    try {
      const invoiceRepository = getRepository(Invoice);
      const carRepository = getRepository(Car);
      const carDb: Car = await carRepository.findOneOrFail({
        where: { car_id: carId, available: MoreThan(0) },
        relations: ["salon", "warranties"],
      });

      if (carDb.salon?.salon_id !== salonId) {
        return res.json({
          status: "failed",
          msg: "Error information.",
        });
      }
      let limit_kilometer = carDb?.warranties?.limit_kilometer;
      let months = carDb?.warranties?.months;
      let policy = carDb?.warranties?.policy;

      let saveInvoice: any = new Invoice();
      saveInvoice.seller = carDb.salon;
      saveInvoice = {
        ...saveInvoice,
        expense,
        note,
        fullname,
        email,
        phone,
        carName: carDb.name,
        limit_kilometer,
        months,
        policy,
        employee_id: employeeId
      };
      const invoiceDb = await invoiceRepository.save(saveInvoice);

      // set status for car is selled.
      await carRepository.save({ ...carDb, available: Number(carDb.available) - 1 });

      // add legal for custormer
      await legalsController.addLegalForUser({ carId, salonId, phone, invoice: invoiceDb, processId })

      // get userId by phone
      const userRp = await UserRepository.getProfileByOther({ phone });
      // send notification
      createNotification({
        to: userRp?.data?.user_id,
        description: `Salon ${carDb?.salon?.name} vừa thêm tiến trình giấy tờ hoàn tất mua xe cho bạn`,
        types: "process",
        data: "",
        avatar: carDb?.salon?.image,
        isUser: false
      })

      return res.json({
        status: "success",
        msg: "Create invoice successfully!",
        invoice: { ...saveInvoice, warranty: carDb?.warranties },
      });
    } catch (error) {
      console.log(error);
      return res.json({
        status: "failed",
        msg: "Can not create the invoice.",
      });
    }
  },

  lookupInvoiceByInvoiceId: async (req: Request, res: Response) => {
    const { salonId, invoiceId, phone: phone, licensePlate, type } = req.body;

    try {
      const invoiceRepository = getRepository(Invoice);
      let invoiceDb: any = await invoiceRepository.find({
        where: { invoice_id: invoiceId, phone, licensePlate, type },
        relations: ["seller", "legals_user"],
      });

      invoiceDb = invoiceDb.filter(
        (invoice: any) => invoice?.seller?.salon_id === salonId
      );

      return res.json({
        status: "success",
        msg: "Look up successfully!",
        invoice: invoiceDb,
      });
    } catch (error) {
      console.log(error);
      return res.json({
        status: "failed",
        msg: "Error look up invoice.",
      });
    }
  },

  getAllInvoiceOfSalon: async (req: Request, res: Response) => {
    const { salonId, done, employeeId } = req.body;

    try {
      const invoiceRepository = getRepository(Invoice);
      let invoiceDb;
      let queryBuilder: any = await invoiceRepository
        .createQueryBuilder('invoice')
        .innerJoinAndSelect('invoice.seller', 'salon', 'salon.salon_id = :salonId', { salonId })
        .leftJoinAndSelect('invoice.legals_user', 'car_user_legals')
        // .leftJoinAndSelect('user', 'user', 'invoice.employee_id = user.user_id')

      if (done !== undefined && done !== "undefined") {
        queryBuilder = await queryBuilder.where({ done: done })
      }

      if (employeeId !== undefined && employeeId !== "undefined") {
        queryBuilder = await queryBuilder.where({ employee_id: employeeId })
      }

      invoiceDb = await queryBuilder.getMany();

      for (let iv of invoiceDb) {
        let rs = await UserRepository.getProfileById(iv.employee_id);
        iv.employee_id = rs?.data;
      }

      // // get process
      // let index = 0;
      // for (let iv of invoiceDb) {
      //   if (iv?.legals_user?.car_id) {
      //     const carDb = await CarRepository.getProcessByCarId({ carId: iv.legals_user.car_id })
      //     invoiceDb[index].car = carDb?.data;
      //     index++;
      //   }

      // }

      return res.json({
        status: "success",
        invoices: invoiceDb
      })
    } catch (error) {
      console.log(error)
      return res.json({
        status: "failed",
        msg: "Error get all invoice for salon."
      })
    }
  },

  revenueStatistics: async (req: Request, res: Response) => {
    const { salonId, fromDate } = req.body;
    let year = new Year().months;

    try {
      const MTinvoiceDb: any = await statistics({ salonId, type: "maintenance", fromDate, year });
      const BCinvoiceDb: any = await statistics({ salonId, type: "buy car", fromDate, year });
      const avg = averageEachMonth(year);


      return res.json({
        status: "success",
        maintenances: MTinvoiceDb,
        buyCars: BCinvoiceDb,
        total: MTinvoiceDb?.total + BCinvoiceDb?.total,
        year,
        avg
      })
    } catch (error) {
      return res.json({
        status: "failed",
        msg: "error revenue statistics."
      })
    }
  },

  revenueStatisticsAdmin: async (req: Request, res: Response) => {
    const { fromDate } = req.body;
    let year = new Year().months;
    try {
      const purchaseDb: any = await statistics({ salonId: "", type: "package", fromDate, year });

      const avg = averageEachMonth(year)

      return res.json({
        status: "success",
        purchases: purchaseDb,
        months: year,
        avg
      })
    } catch (error) {
      return res.json({
        status: "failed",
        msg: "error revenue statistics."
      })
    }
  },

  getTopThingBestSeller: async (req: Request, res: Response) => {
    const { salonId, fromDate } = req.body;

    try {
      const BCTopDb = await getTopSeller({ salonId, type: "buy car", fromDate });
      let totalBuyCar = 0;

      for (const bc of BCTopDb) {
        totalBuyCar += bc.quantitySold;
      }
      const MTTopDb = await getTopSeller({ salonId, type: "maintenance", fromDate });
      const ATopDb = await getTopSeller({ salonId, type: "accessory", fromDate });

      return res.json({
        status: "success",
        totalBuyCar,
        buyCarTop: BCTopDb,
        MTTopDb,
        accessoriesTop: ATopDb
      })
    } catch (error) {
      return res.json({
        status: "failed",
        msg: "Error get top."
      })
    }
  },

  getInvoiceByPhone: async (req: Request, res: Response) => {
    // const {phone} = req.body;
    const userId: any = req.user;
    let phone;

    try {
      const userRepository = getRepository(User);
      const userDb = await userRepository.findOneOrFail({
        where: { user_id: userId }
      })
      phone = userDb?.phone;

      if (!phone) {
        return res.json({
          status: "failed",
          msg: "You need to update phone in your profile."
        });
      }
    } catch (error) {
      return res.json({
        status: "failed",
        msg: "error information."
      })
    }

    try {
      const invoiceRepository = getRepository(Invoice);

      const invoiceDb = await invoiceRepository.find({
        where: { phone: phone, type: "buy car" },
        relations: ['seller', 'legals_user']
      })

      return res.json({
        status: "success",
        invoices: invoiceDb
      })
    } catch (error) {
      return res.json({
        status: "failed",
        msg: "Error information."
      })
    }
  },

  tickDoneInvoice: async (req: Request, res: Response) => {
    try {
      const { salonId, invoiceId } = req.body;
      console.log(salonId, invoiceId)
      const invoiceRepository = getRepository(Invoice);
      const invoiceDb = await invoiceRepository.findOneOrFail({
        where: { invoice_id: invoiceId },
        relations: ['seller']
      })

      if (invoiceDb.seller.salon_id !== salonId) {
        return res.json({
          status: "failed",
          msg: "You dont have the permission."
        })
      }

      console.log(invoiceDb)

      await invoiceRepository.save({ ...invoiceDb, done: true });

      return res.json({
        status: "success",
        msg: "Tick done for invoice successfully!"
      })
    } catch (error) {
      return res.json({
        status: "failed",
        msg: "Error tick."
      })
    }
  },

  removeInvoice: async (req: Request, res: Response) => {
    try {
      const { salonId, invoiceId } = req.body;
      const invoiceRepository = getRepository(Invoice);
      const invoiceDb = await invoiceRepository.findOneOrFail({
        where: { invoice_id: invoiceId },
        relations: ['seller']
      })

      if (invoiceDb.seller.salon_id !== salonId) {
        return res.json({
          status: "failed",
          msg: "You dont have the permission."
        })
      }

      const removeDb = await invoiceRepository.remove(invoiceDb);

      return res.json({
        status: "success",
        msg: "Removed invoice successfully!",
        invoice: removeDb
      })
    } catch (error) {
      console.log(error)
      return res.json({
        status: "failed",
        msg: "Error remove invoice."
      })
    }
  }

}

export default invoiceController;
