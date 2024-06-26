import { Request, Response } from "express";
import { Car } from "../entities/Car";
import { Any, MoreThan, getConnection, getRepository } from "typeorm";
import { Invoice, Purchase, Salon, User } from '../entities';
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


const invoiceController = {
  printInvoiceBuyCar2: async (req: Request, res: Response) => {
    const { carId, salonId, note, fullname, email, phone, expense, processId, employeeId } = req.body;

    if (!employeeId || !expense || !phone || !processId || !carId) {
      return res.json({
        status: "failed",
        msg: "Input is invalid."
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

      createNotification({
        to: userRp?.data?.user_id,
        description: `Bạn cần thanh toán hóa đơn với salon ${carDb?.salon?.name} giao dịch mua xe chi phí ${expense} vnd. Vui lòng ấn xác nhận đã thanh toán nếu bạn đã hoàn tất.`,
        types: "invoice-paid",
        data: invoiceDb.invoice_id || "",
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

  printInvoiceBuyCar: async (req: Request, res: Response) => {
    const { carId, salonId, note, fullname, email, phone, expense, processId, employeeId } = req.body;
    let delInvoice = "";
    let flagCondition = 0;

    if (!employeeId || !expense || !phone || !processId || !carId) {
      return res.json({
        status: "failed",
        msg: "Input is invalid."
      });
    }

    const connection = await getConnection();
    const queryRunner = connection.createQueryRunner();
    flagCondition +=1;

    try {
      const invoiceRepository = queryRunner.manager.getRepository(Invoice);
      const carRepository = queryRunner.manager.getRepository(Car);

      const carDb: Car = await carRepository.findOneOrFail({
        where: { car_id: carId, available: MoreThan(0) },
        relations: ["salon", "warranties"],
      });

      if (carDb.salon?.salon_id !== salonId) {
        await queryRunner.rollbackTransaction();
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
      await queryRunner.startTransaction();
      delInvoice = invoiceDb;
      console.log(invoiceDb)

      // set status for car is sold.
      await carRepository.save({ ...carDb, available: Number(carDb.available) - 1 });

      // add legal for customer
      const legalUserRp = await legalsController.addLegalForUser({ carId, salonId, phone, invoice: invoiceDb, processId });
      // get userId by phone
      const userRp = await UserRepository.getProfileByOther({ phone });
      if (!legalUserRp?.data || !invoiceDb) throw new Error();

      // send notification
      createNotification({
        to: userRp?.data?.user_id||"",
        description: `Salon ${carDb?.salon?.name} vừa thêm tiến trình giấy tờ hoàn tất mua xe cho bạn`,
        types: "process",
        data: "",
        avatar: carDb?.salon?.image,
        isUser: false
      });

      createNotification({
        to: userRp?.data?.user_id,
        description: `Bạn cần thanh toán hóa đơn với salon ${carDb?.salon?.name} giao dịch mua xe chi phí ${expense} vnd. Vui lòng ấn xác nhận đã thanh toán nếu bạn đã hoàn tất.`,
        types: "invoice-paid",
        data: invoiceDb.invoice_id || "",
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
      if (flagCondition !=0) await queryRunner.rollbackTransaction();
      // delete invoice 
      await InvoiceRepository.delete(delInvoice);
      console.log(flagCondition)
      console.log(error)

      return res.json({
        status: "failed",
        msg: "An error occurred.",
      });
    } finally {
      if (flagCondition !=0) await queryRunner.release();
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
    const { salonId, done, employeeId, page, per_page, q } = req.body;

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
      let purchaseDb: any = await statistics({ salonId: "", type: "package", fromDate, year });
      const rs = await pagination({ data: purchaseDb.purchases, per_page: 10 });
      purchaseDb.purchases = rs.data || "";
      const getTopPackage = await PurchaseRepository.getAllPurchase({});
      const avg = averageEachMonth(year)

      return res.json({
        status: "success",
        purchases: purchaseDb,
        months: year,
        avg,
        topPackages: getTopPackage?.data
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
  },

  confirmPaidInvoiceFromUser: async (req: Request, res: Response) => {
    const { invoiceId, notificationId } = req.body;
    const userId: any = req.headers["userId"] || "";

    try {
      if (!invoiceId || !notificationId || !userId) throw new Error();
      // find notification
      const notificationRp = await NotificationRepository.findByUserNotiId({ notificationId, userId });
      // find invoice by userId and invoiceId
      const invoiceRp = await InvoiceRepository.findById({ invoiceId });
      if (!notificationRp?.data || !invoiceRp?.data) throw new Error();
      // delete notification of user
      await NotificationRepository.delete(notificationRp.data);
      // send notification to salon
      console.log("invoiceRp: ", invoiceRp)
      //get infor user 
      const user = await getUserInfo(userId);
      createNotification({
        to: invoiceRp?.data?.seller.salon_id,
        description: `${user?.fullname} vừa xác nhận đã hoàn tất thanh toán. Hãy ấn xác nhận nếu bạn đã nhận được.`,
        types: "invoice-paid",
        data: `${invoiceId}`,
        avatar: user?.avatar || "https://haycafe.vn/wp-content/uploads/2022/02/Avatar-trang.jpg",
        isUser: true
      });

      return res.json({
        status: "success",
        msg: "Bạn đã xác nhận hoàn tất thanh toán. Vui lòng đợi đợi phản hồi từ salon."
      })

    } catch (error) {
      return res.json({
        status: "failed",
        msg: "Lỗi xác nhận, vui lòng thử lại."
      })
    }

  },

}

export default invoiceController;
