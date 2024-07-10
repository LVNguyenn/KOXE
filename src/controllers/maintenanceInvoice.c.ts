import { Request, Response } from "express";
import { getRepository } from "typeorm";
import { User, Invoice, MInvoiceDetail, AInvoiceDetail } from "../entities";
import {
  getUserInfo,
  getMaintenanceServiceList,
  getMaintenanceInvoice,
  getMaintenanceInvoiceListBySalonId,
  getMaintenanceInvoiceListByPhone,
  getMaintenanceInvoiceDetails,
  getMaintenanceInvoiceDetailsList,
  formatMaintenanceInvoice,
  formatMaintenanceInvoiceList,
  getAccessoryList,
  calculateMExpense,
  calculateAExpense,
  saveMInvoiceDetails,
  saveAInvoiceDetails,
  getAccessoryInvoiceDetails,
  getAccessoryInvoiceDetailsList,
  processServices,
  processAccessory,
} from "../helper/mInvoice";
import search from "../helper/search";
import pagination from "../helper/pagination";
import { formatDate, buildWhereCondition, calcTotal } from "../utils";

const maintainController = {
  getAllInvoices: async (req: Request, res: Response) => {
    const userId: any = req.headers["userId"] || "";
    const userRepository = getRepository(User);
    const invoiceRepository = getRepository(Invoice);
    let { page, per_page, year, quarter, month }: any = req.query;
    let totalExpenseBuyCar;
    let totalExpenseBuyAccessory;
    let totalExpenseMaintenance;
    let totalExpense;
    try {
      const user = await userRepository.findOne({ where: { user_id: userId } });
      if (!user?.phone) {
        return res.status(200).json({
          status: "success",
          invoices: [],
          total_expense: 0,
        });
      }

      const whereCondition = buildWhereCondition(
        user.phone,
        year,
        quarter,
        month
      );

      let invoices = await invoiceRepository.find({
        where: whereCondition,
        relations: ["seller"],
        order: { create_at: "DESC" },
      });

      let formattedInvoices = invoices.map((invoice) => ({
        invoiceId: invoice.invoice_id,
        licensePlate: invoice.licensePlate,
        carName: invoice.carName,
        salonName: invoice.seller.name,
        phone: invoice.phone,
        createdAt: formatDate(invoice.create_at),
        expense: invoice.expense,
        type: invoice.type,
      }));
      if (formattedInvoices.length === 0) {
        totalExpenseBuyCar = 0;
        totalExpenseBuyAccessory = 0;
        totalExpenseMaintenance = 0;
        totalExpense = 0;
      } else {
        totalExpenseBuyCar = calcTotal(
          formattedInvoices,
          formattedInvoices[0].phone,
          "buy car"
        );
        totalExpenseBuyAccessory = calcTotal(
          formattedInvoices,
          formattedInvoices[0].phone,
          "buy accessory"
        );
        totalExpenseMaintenance = calcTotal(
          formattedInvoices,
          formattedInvoices[0].phone,
          "maintenance"
        );

        totalExpense =
          totalExpenseBuyCar +
          totalExpenseBuyAccessory +
          totalExpenseMaintenance;
      }

      // if (q) {
      //   formattedInvoices = await search({
      //     data: formattedInvoices,
      //     q,
      //     fieldname: "type",
      //   });
      // }

      const rs = await pagination({ data: formattedInvoices, page, per_page });

      // const a: any = rs.data;
      // if (a) {
      //   totalExpense = a.reduce(
      //     (acc: number, invoice: any) => acc + invoice.expense,
      //     0
      //   );
      // }

      return res.status(200).json({
        status: "success",
        invoices: rs?.data,
        totalExpenseBuyCar: totalExpenseBuyCar,
        totalExpenseBuyAccessory: totalExpenseBuyAccessory,
        totalExpenseMaintenance: totalExpenseMaintenance,
        totalExpense: totalExpense,
        total_page: rs?.total_page,
      });
    } catch (error) {
      console.log(error);
      return res.status(500).json({
        status: "failed",
        msg: "Internal server error",
      });
    }
  },
  getAllMaintenanceInvoices: async (req: Request, res: Response) => {
    const userId: any = req.headers["userId"] || "";
    const { page, per_page, q }: any = req.query;
    let checkSalon = false;

    try {
      const user = await getUserInfo(userId);

      if (!user?.salonId && !user?.phone) {
        return res.status(403).json({
          status: "failed",
          msg: "You do not have sufficient permissions",
        });
      }

      let mInvoices;

      if (user?.salonId) {
        checkSalon = true;
        const salonId = user.salonId.salon_id;
        mInvoices = await getMaintenanceInvoiceListBySalonId(salonId);
      } else {
        const phone = user.phone;
        mInvoices = await getMaintenanceInvoiceListByPhone(phone);
      }

      // Tình danh sách các dịch vụ đã dùng
      const mServiceCodes = mInvoices
        .map((invoice) => invoice.maintenanceServices)
        .flat();

      // Tìm các phụ tùng đã dùng
      const accessoryCodes = mInvoices
        .map((invoice) => invoice.accessories)
        .flat();

      // Tìm dịch vụ đó bao gồm tên và giá
      const mServices = await getMaintenanceServiceList(mServiceCodes);

      // Tìm vật dụng đó bao gồm tên và giá
      const aServices = await getAccessoryList(accessoryCodes);

      const mInvoiceIds = mInvoices.map((invoice) => invoice.invoice_id);
      const mInvoiceDetails = await getMaintenanceInvoiceDetailsList(
        mInvoiceIds
      );

      const aInvoiceIds = mInvoices.map((invoice) => invoice.invoice_id);
      const aInvoiceDetails = await getAccessoryInvoiceDetailsList(aInvoiceIds);

      let mInvoicesWithServices = formatMaintenanceInvoiceList(
        mInvoices,
        mServices,
        mInvoiceDetails,
        aServices,
        aInvoiceDetails
      );

      // search and pagination
      if (q && checkSalon === true) {
        mInvoicesWithServices = await search({
          data: mInvoicesWithServices,
          q,
          fieldname: "fullname",
        });
      } else if (q && checkSalon === false) {
        mInvoicesWithServices = await search({
          data: mInvoicesWithServices,
          q,
          fieldname: "salon",
          fieldname2: "salon_name",
        });
      }

      const rs = await pagination({
        data: mInvoicesWithServices,
        page,
        per_page,
      });

      return res.status(200).json({
        status: "success",
        invoices: rs?.data,
        total_page: rs?.total_page,
      });
    } catch (error) {
      console.log(error);
      return res.status(500).json({
        status: "failed",
        msg: "Internal server error",
      });
    }
  },
  getMaintenanceInvoiceById: async (req: Request, res: Response) => {
    const { id } = req.params;

    try {
      const mInvoice = await getMaintenanceInvoice(id);

      if (!mInvoice) {
        return res.status(200).json({
          status: "failed",
          msg: `No maintenance invoices with id: ${id}`,
        });
      }

      const mServiceCodes = mInvoice.maintenanceServices;
      const mServices = await getMaintenanceServiceList(mServiceCodes);

      const accessoryCodes = mInvoice.accessories;
      const aServices = await getAccessoryList(accessoryCodes);

      const mInvoiceDetails = await getMaintenanceInvoiceDetails(id);
      const aInvoiceDetails = await getAccessoryInvoiceDetails(id);

      const formattedInvoice = formatMaintenanceInvoice(
        mInvoice,
        mServices,
        mInvoiceDetails,
        aServices,
        aInvoiceDetails
      );

      return res.status(200).json({
        status: "success",
        invoice: formattedInvoice,
      });
    } catch (error) {
      console.log(error);
      return res
        .status(500)
        .json({ status: "failed", msg: "Internal server error" });
    }
  },
  findMaintenanceInvoicesByLicensePlate: async (
    req: Request,
    res: Response
  ) => {
    const userId: any = req.headers["userId"] || "";
    const { licensePlate } = req.params;
    const mInvoiceRepository = getRepository(Invoice);
    const { page, per_page, q }: any = req.query;

    try {
      const user = await getUserInfo(userId);

      if (!user?.salonId && !user?.phone) {
        return res.status(403).json({
          status: "failed",
          msg: "You do not have sufficient permissions",
        });
      }

      let mInvoices;

      if (user?.salonId) {
        const salonId = user.salonId.salon_id;
        mInvoices = await mInvoiceRepository.find({
          where: {
            licensePlate,
            type: "maintenance",
            seller: { salon_id: salonId },
          },
          relations: ["seller"],
        });
      } else {
        const phone = user.phone;
        mInvoices = await getRepository(Invoice).find({
          where: { licensePlate, type: "maintenance", phone: phone },
          relations: ["seller"],
        });
      }

      if (mInvoices.length === 0) {
        return res.status(200).json({
          status: "failed",
          msg: "No maintenance invoices found for this license plate",
        });
      }

      const mServiceCodes = mInvoices
        .map((invoice) => invoice.maintenanceServices)
        .flat();
      const mServices = await getMaintenanceServiceList(mServiceCodes);

      const accessoryCodes = mInvoices
        .map((invoice) => invoice.accessories)
        .flat();
      const aServices = await getAccessoryList(accessoryCodes);

      const mInvoiceIds = mInvoices.map((invoice) => invoice.invoice_id);
      const mInvoiceDetails = await getMaintenanceInvoiceDetailsList(
        mInvoiceIds
      );

      const aInvoiceIds = mInvoices.map((invoice) => invoice.invoice_id);
      const aInvoiceDetails = await getAccessoryInvoiceDetailsList(aInvoiceIds);

      let mInvoicesWithServices = formatMaintenanceInvoiceList(
        mInvoices,
        mServices,
        mInvoiceDetails,
        aServices,
        aInvoiceDetails
      );

      // search and pagination
      // if (q) {
      //   mInvoicesWithServices = await search({ data: mInvoicesWithServices, q, fieldname: "name" })
      // }

      const rs = await pagination({
        data: mInvoicesWithServices,
        page,
        per_page,
      });

      return res.status(200).json({
        status: "success",
        invoices: rs?.data,
        total_page: rs?.total_page,
      });
    } catch (error) {
      console.log(error);
      return res.status(500).json({
        status: "failed",
        msg: "Internal server error",
      });
    }
  },
  createMaintenanceInvoices: async (req: Request, res: Response) => {
    const userId: any = req.headers["userId"] || "";
    const mInvoicesRepository = getRepository(Invoice);
    const {
      licensePlate,
      carName,
      services,
      accessories,
      note,
      fullname,
      email,
      phone,
    } = req.body;
    let salonId = "";

    try {
      let mServiceIds = [];
      if (services && services.length !== 0) {
        mServiceIds = services.map((service: any) => service.maintenance_id);
      }

      let accessoryIds = [];
      if (accessories && accessories.length !== 0) {
        accessoryIds = accessories.map(
          (accessory: any) => accessory.accessory_id
        );
      }

      const mServices = await getMaintenanceServiceList(mServiceIds);

      const aServices = await getAccessoryList(accessoryIds);
      let expense = 0;

      if (services && services.length !== 0) {
        const mExpense = calculateMExpense(services, mServices);
        expense += mExpense;
      }

      if (accessories && accessories.length !== 0) {
        const aExpense = calculateAExpense(accessories, aServices);
        expense += aExpense;
      }

      const user = await getUserInfo(userId);

      if (!user?.salonId && !user?.phone) {
        return res.status(403).json({
          status: "failed",
          msg: "You do not have sufficient permissions",
        });
      }

      salonId = user.salonId.salon_id;

      const newMaintain = {
        licensePlate,
        carName,
        //create_at: moment().format("YYYY-MM-DDTHH:mm:ss"),
        seller: { salon_id: salonId },
        maintenanceServices: mServiceIds,
        accessories: accessoryIds,
        expense,
        note,
        type: "maintenance",
        fullname,
        email,
        phone,
      };

      const savedMaintenanceInvoice = await mInvoicesRepository.save(
        newMaintain
      );

      if (services && services.length !== 0)
        await saveMInvoiceDetails(services, savedMaintenanceInvoice);
      if (accessories && accessories.length !== 0) {
        await saveAInvoiceDetails(accessories, savedMaintenanceInvoice);
      }

      return res.status(201).json({
        status: "success",
        msg: "Create successfully!",
        maintain: savedMaintenanceInvoice,
      });
    } catch (error) {
      console.log(error);
      return res.status(500).json({
        status: "failed",
        msg: "Internal server error",
      });
    }
  },
  updateMaintenanceInvoices: async (req: Request, res: Response) => {
    const { id } = req.params;
    const {
      licensePlate,
      carName,
      services,
      accessories,
      note,
      fullname,
      email,
      phone,
    } = req.body;
    const InvoicesRepository = getRepository(Invoice);
    const mInvoiceDetailRepository = getRepository(MInvoiceDetail);
    const aInvoiceDetailRepository = getRepository(AInvoiceDetail);
    let total = 0;

    try {
      let mserviceIds: any = [];
      if (services && services.length !== 0) {
        mserviceIds = services.map((service: any) => service.maintenance_id);
      }

      let aserviceIds: any = [];
      if (accessories && accessories.length !== 0) {
        aserviceIds = accessories.map((service: any) => service.accessory_id);
      }

      const Invoice = await InvoicesRepository.findOne({
        where: { invoice_id: id, type: "maintenance" },
      });

      if (!Invoice) {
        return res.status(200).json({
          status: "failed",
          msg: `No maintenance invoice with id: ${id}`,
        });
      }

      Invoice.licensePlate = licensePlate;
      Invoice.carName = carName;
      Invoice.note = note;
      Invoice.fullname = fullname;
      Invoice.email = email;
      Invoice.phone = phone;

      if (mserviceIds && mserviceIds.length !== 0) {
        Invoice.maintenanceServices = mserviceIds;
        await mInvoiceDetailRepository.delete({ invoice_id: id });
      } else {
        const mInvoiceDetail = await mInvoiceDetailRepository.find({
          where: { invoice_id: id },
        });
        if (mInvoiceDetail) {
          mInvoiceDetail.map((detail) => {
            total += detail.quantity * detail.price;
          });
        }
      }

      if (aserviceIds && aserviceIds.length !== 0) {
        Invoice.accessories = aserviceIds;
        await aInvoiceDetailRepository.delete({ invoice_id: id });
      } else {
        const aInvoiceDetail = await aInvoiceDetailRepository.find({
          where: { invoice_id: id },
        });
        if (aInvoiceDetail) {
          aInvoiceDetail.map((detail) => {
            total += detail.quantity * detail.price;
          });
        }
      }

      if (services && services.length !== 0) {
        const mExpense = await processServices(id, services);
        total += mExpense;
      }

      if (accessories && accessories.length !== 0) {
        const aExpense = await processAccessory(id, accessories);
        total += aExpense;
      }

      if (
        (services && services.length !== 0) ||
        (accessories && accessories.length !== 0)
      ) {
        Invoice.expense = total;
        await InvoicesRepository.save(Invoice);
      }

      const result = await InvoicesRepository.findOne({
        where: {
          invoice_id: id,
        },
      });

      return res.status(200).json({
        status: "success",
        msg: "Update successfully!",
        maintain: result,
      });
    } catch (error) {
      console.log(error);
      return res
        .status(500)
        .json({ status: "failed", msg: "Internal server error" });
    }
  },
  deleteMaintenanceInvoices: async (req: Request, res: Response) => {
    const { id } = req.params;
    const mInvoicesRepository = getRepository(Invoice);
    const mInvoiceDetailRepository = getRepository(MInvoiceDetail);
    const aInvoiceDetailRepository = getRepository(AInvoiceDetail);
    try {
      const mInvoice = await mInvoicesRepository.findOne({
        where: { invoice_id: id, type: "maintenance" },
      });

      if (!mInvoice) {
        return res.status(200).json({
          status: "failed",
          msg: `No maintenance invoices with id: ${id}`,
        });
      }

      await mInvoicesRepository.delete(id);

      if (
        mInvoice.maintenanceServices &&
        mInvoice.maintenanceServices.length !== 0
      )
        await mInvoiceDetailRepository.delete({ invoice_id: id });
      if (mInvoice.accessories && mInvoice.accessories.length !== 0)
        await aInvoiceDetailRepository.delete({ invoice_id: id });

      res.status(200).json({
        status: "success",
        msg: "Delete successfully!",
      });
    } catch (error) {
      return res
        .status(500)
        .json({ status: "failed", msg: "Internal server error" });
    }
  },
};

export default maintainController;
