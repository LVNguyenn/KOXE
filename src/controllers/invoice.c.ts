import { Request, Response } from "express";
import { Car } from "../entities/Car";
import { Any, MoreThan, getConnection, getRepository } from "typeorm";
import { Car_User_Legals, Invoice, Purchase, Salon, User } from '../entities';
import statistics, { averageEachMonth, getTopSeller } from '../helper/statistics';
import Year from "../utils/year";
import legalsController from "./legals.c";
import LegalsRepository from "../repository/legals";
import CarRepository from "../repository/car";
import createNotification from "../helper/createNotification";
import UserRepository from "../repository/user";
import pagination from "../helper/pagination";
import search from "../helper/search";
import PurchaseRepository from "../repository/purchase";
import InvoiceRepository from "../repository/invoice";
import NotificationRepository from "../repository/notification";
import { getUserInfo } from "../helper/mInvoice";
import PackageRepository from "../repository/package";
import FeatureRepository from "../repository/feature";
import CarUserLegalRepository from "../repository/car_user_legal";
import moment from 'moment-timezone';

const invoiceController = {

  printInvoiceBuyCar: async (req: Request, res: Response) => {
    const { carId, salonId, note, fullname, email, phone, expense, processId, employeeId, licensePlate } = req.body;
    let delInvoice = "";
    let flagCondition = 0;
    let msg = "";

    if (!employeeId || !expense || !phone || !processId || !carId) {
      return res.json({
        status: "failed",
        msg: "Input is invalid."
      });
    }

    const connection = await getConnection();
    const queryRunner = connection.createQueryRunner();

    try {
      const invoiceRepository = queryRunner.manager.getRepository(Invoice);
      const carRepository = queryRunner.manager.getRepository(Car);

      const carDb: Car = await carRepository.findOneOrFail({
        where: { car_id: carId, available: MoreThan(0) },
        relations: ["salon", "warranties"],
      });

      if (carDb.salon?.salon_id !== salonId) {
        msg = "Error car.";
        throw new Error(msg);
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
        employee_id: employeeId,
        licensePlate
      };

      const invoiceDb = await invoiceRepository.save(saveInvoice);
      await queryRunner.startTransaction();
      flagCondition += 1;
      delInvoice = invoiceDb;
      console.log(invoiceDb)

      // set status for car is sold.
      await carRepository.save({ ...carDb, available: Number(carDb.available) - 1 });

      // add legal for customer
      const legalUserRp = await legalsController.addLegalForUser({ carId, salonId, phone, invoice: invoiceDb, processId });

      // get userId by phone
      const userRp = await UserRepository.getProfileByOther({ phone });
      if (!legalUserRp?.data || !invoiceDb) {
        msg = legalUserRp?.msg || "Can not create invoice.";
        throw new Error(msg);
      }
      // send notification
      createNotification({
        to: userRp?.data?.user_id || "",
        description: `Salon ${carDb?.salon?.name} vừa thêm tiến trình giấy tờ hoàn tất mua xe cho bạn`,
        types: "process",
        data: "",
        avatar: carDb?.salon?.image,
        isUser: false
      });

      await queryRunner.commitTransaction();

      return res.json({
        status: "success",
        msg: "Create invoice successfully!",
        invoice: { ...saveInvoice, warranty: carDb?.warranties },
      });

    } catch (error: any) {
      if (flagCondition != 0) await queryRunner.rollbackTransaction();
      // delete invoice 
      await InvoiceRepository.delete(delInvoice);

      return res.json({
        status: "failed",
        msg: msg || "Error with create invoice."
      });
    } finally {
      if (flagCondition != 0) await queryRunner.release();
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
    const { salonId, done, employeeId, page, per_page, q, payment_done } = req.body;

    try {
      const invoiceRepository = getRepository(Invoice);
      let invoiceDb;
      let queryBuilder: any = await invoiceRepository
        .createQueryBuilder('invoice')
        .innerJoinAndSelect('invoice.seller', 'salon', 'salon.salon_id = :salonId', { salonId })
        .leftJoinAndSelect('invoice.legals_user', 'car_user_legals')
        // .leftJoinAndSelect('user', 'user', 'invoice.employee_id = user.user_id')
        .where({ type: "buy car" })

      if (done !== undefined && done !== "undefined") {
        queryBuilder = await queryBuilder.where({ done: done })
      }

      if (employeeId !== undefined && employeeId !== "undefined") {
        queryBuilder = await queryBuilder.where({ employee_id: employeeId })
      }

      if (payment_done !== undefined && payment_done !== "undefined") {
        queryBuilder = await queryBuilder.where({ payment_done })
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
      if (q) {
        invoiceDb = await search({ data: invoiceDb, q, fieldname: "fullname" })
      }

      const rs = await pagination({ data: invoiceDb, page, per_page });

      return res.json({
        status: "success",
        invoices: rs?.data,
        total_page: rs?.total_page
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
    let { salonId, fromDate } = req.body;
    let rsQuater = [0, 0, 0, 0];
    let year = new Year().months;
    if (!fromDate) fromDate = "2024-01-01";

    try {
      const MTinvoiceDb: any = await statistics({ salonId, type: "maintenance", fromDate, year });
      const BCinvoiceDb: any = await statistics({ salonId, type: "buy car", fromDate, year });
      const BAinvoiceDb: any = await statistics({ salonId, type: "buy accessory", fromDate, year });
      const avg = averageEachMonth(year);

      for (const key in year) {
        if (year[key].value <= 3) rsQuater[0] += year[key].total;
        else if (year[key].value <= 6) rsQuater[1] += year[key].total;
        else if (year[key].value <= 9) rsQuater[2] += year[key].total;
        else rsQuater[0] += year[key].total;
      }

      return res.json({
        status: "success",
        maintenances: MTinvoiceDb,
        buyCars: BCinvoiceDb,
        total: MTinvoiceDb?.total + BCinvoiceDb?.total,
        buyAccessory: BAinvoiceDb,
        year,
        rsQuater,
        avg,
        totalCarSold: BCinvoiceDb.invoiceDb.length
      })




    } catch (error) {
      console.log(error)
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
      let purchaseDb: any = await statistics({ salonId: "", type: "package", fromDate, year });
      const rs = await pagination({ data: purchaseDb.purchases, per_page: 10 });
      purchaseDb.purchases = rs.data || "";
      const getTopPackage = await PurchaseRepository.getAllPurchase({});
      const avg = averageEachMonth(year);

      // get package and features
      const packageRp = await PackageRepository.getAll({});
      let featureRp: any = await FeatureRepository.getAll({});
      let topFeature: any = featureRp.data;

      // init count = 0
      for (let f of topFeature) {
        f.count = 0;
      }

      for (let pkg of getTopPackage.data)
        // find featureId of pkg
        for (let p of packageRp.data)
          if (pkg.packageId === p.package_id)
            for (let fp of p.features)
              // find same and update new cout
              for (let f of topFeature)
                //feature_id existed
                if (f.feature_id === fp.feature_id)
                  f.count += +pkg.count;

      // arrage rs
      topFeature.sort((a: any, b: any) => b.count - a.count);

      return res.json({
        status: "success",
        purchases: purchaseDb,
        months: year,
        avg,
        topPackages: getTopPackage?.data,
        topFeature
      })
    } catch (error) {
      console.log(error);
      return res.json({
        status: "failed",
        msg: "error revenue statistics."
      })
    }
  },

  getTopThingBestSeller: async (req: Request, res: Response) => {
    let { salonId, year, quater, months } = req.body;

    if (!year) year = 2024;
    if (!quater && !months) months = 1;
    let toMonth = quater ? 3 * quater : months;

    let fromDate: any = `${year}-${months}-01`;
    let toDate: any = `${year}-${toMonth}-28`;

    try {
      const BCTopDb = await getTopSeller({ salonId, type: "buy car", fromDate, toDate });
      let totalBuyCar = 0;

      for (const bc of BCTopDb) {
        totalBuyCar += bc.quantitySold;
      }
      const MTTopDb = await getTopSeller({ salonId, type: "maintenance", fromDate, toDate });
      const ATopDb = await getTopSeller({ salonId, type: "accessory", fromDate, toDate });

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
    const { q, page, per_page } = req.body;
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

      let invoiceDb = await invoiceRepository.find({
        where: { phone: phone, type: "buy car" },
        relations: ['seller', 'legals_user']
      })

      if (q) {
        invoiceDb = await search({ data: invoiceDb, q, fieldname: "fullname" })
      }

      const rs = await pagination({ data: invoiceDb, page, per_page });

      return res.json({
        status: "success",
        invoices: rs?.data,
        total_page: rs?.total_page
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
      const invoiceRepository = getRepository(Invoice);
      const invoiceDb = await invoiceRepository.findOneOrFail({
        where: { invoice_id: invoiceId },
        relations: ['seller']
      })

      // find carId
      const userLegalRp = await CarUserLegalRepository.getByInvoieId({invoiceId});
      if (!userLegalRp.data.car_id) throw new Error("Error carId");
      // update date_output of car
      const dateOutput = moment().tz('Asia/Saigon').toDate();
      const carRp = await CarRepository.findCarByCarIdSalonId({salonId, carId: userLegalRp.data.car_id});
      const carRs = await CarRepository.updateCar({...carRp?.data, date_out: dateOutput});
      if (!carRs?.data) throw new Error("Error update date out of car.")
 
      if (invoiceDb.seller.salon_id !== salonId) {
        return res.json({
          status: "failed",
          msg: "You dont have the permission."
        })
      }

      await invoiceRepository.save({ ...invoiceDb, done: true });

      return res.json({
        status: "success",
        msg: "Tick done for invoice successfully!"
      })
    } catch (error) {
      console.log(error)
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
  },

}

export default invoiceController;
