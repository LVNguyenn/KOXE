import { Request, Response } from "express";
import { Invoice, MInvoiceDetail, AInvoiceDetail } from "../entities";
import { getRepository } from "typeorm";
import moment from "moment";
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

const maintainController = {
  getAllMaintenanceInvoices: async (req: Request, res: Response) => {
    const userId: any = req.headers["userId"] || "";

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

      const mInvoicesWithServices = formatMaintenanceInvoiceList(
        mInvoices,
        mServices,
        mInvoiceDetails,
        aServices,
        aInvoiceDetails
      );

      return res.status(200).json({
        status: "success",
        invoices: mInvoicesWithServices,
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
        return res.status(404).json({
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
        return res.status(404).json({
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

      const mInvoicesWithServices = formatMaintenanceInvoiceList(
        mInvoices,
        mServices,
        mInvoiceDetails,
        aServices,
        aInvoiceDetails
      );

      return res.status(200).json({
        status: "success",
        invoices: mInvoicesWithServices,
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
        create_at: moment().format("YYYY-MM-DDTHH:mm:ss"),
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
        return res.status(404).json({
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
        return res.status(404).json({
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
