import { Request, Response } from "express";
import { getRepository } from "typeorm";
import { Invoice, AInvoiceDetail } from "../entities";
import {
  getUserInfo,
  getAccessoryInvoice,
  getAccessoryInvoiceListBySalonId,
  getAccessoryInvoiceListByPhone,
  formatAccessoryInvoice,
  formatAccessoryInvoiceList,
  getAccessoryList,
  calculateAExpense,
  saveAInvoiceDetails,
  getAccessoryInvoiceDetails,
  getAccessoryInvoiceDetailsList,
  processAccessory,
} from "../helper/mInvoice";
import moment from "moment";
import search from "../helper/search";
import pagination from "../helper/pagination";

const accessoryController = {
  getAllAccessoryInvoices: async (req: Request, res: Response) => {
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

      let aInvoices;

      if (user?.salonId) {
        checkSalon = true;
        const salonId = user.salonId.salon_id;
        aInvoices = await getAccessoryInvoiceListBySalonId(salonId);
      } else {
        const phone = user.phone;
        aInvoices = await getAccessoryInvoiceListByPhone(phone);
      }

      // Tìm các phụ tùng đã mua
      const accessoryCodes = aInvoices
        .map((invoice) => invoice.accessories)
        .flat();

      // Tìm vật dụng đó bao gồm tên và giá
      const aServices = await getAccessoryList(accessoryCodes);

      const aInvoiceIds = aInvoices.map((invoice) => invoice.invoice_id);
      const aInvoiceDetails = await getAccessoryInvoiceDetailsList(aInvoiceIds);

      let aInvoicesWithServices = formatAccessoryInvoiceList(
        aInvoices,
        aServices,
        aInvoiceDetails
      );

      // search and pagination
      if (q && checkSalon === true) {
        aInvoicesWithServices = await search({
          data: aInvoicesWithServices,
          q,
          fieldname: "fullname",
        });
      } else if (q && checkSalon === false) {
        aInvoicesWithServices = await search({
          data: aInvoicesWithServices,
          q,
          fieldname: "salon",
          fieldname2: "salon_name",
        });
      }

      const rs = await pagination({
        data: aInvoicesWithServices,
        page,
        per_page,
      });

      return res.status(200).json({
        status: "success",
        invoices: rs?.data,
        total_page: rs?.total_page,
      });
    } catch (error) {
      return res.status(500).json({
        status: "failed",
        msg: "Internal server error",
      });
    }
  },
  getAccessoryInvoiceById: async (req: Request, res: Response) => {
    const { id } = req.params;

    try {
      const aInvoice = await getAccessoryInvoice(id);

      if (!aInvoice) {
        return res.status(404).json({
          status: "failed",
          msg: `No accessory invoices with id: ${id}`,
        });
      }

      const accessoryCodes = aInvoice.accessories;
      const aServices = await getAccessoryList(accessoryCodes);

      const aInvoiceDetails = await getAccessoryInvoiceDetails(id);

      const formattedInvoice = formatAccessoryInvoice(
        aInvoice,
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
  createAccessoryInvoices: async (req: Request, res: Response) => {
    const userId: any = req.headers["userId"] || "";
    const aInvoicesRepository = getRepository(Invoice);
    const { accessories, note, fullname, email, phone } = req.body;
    let salonId = "";

    try {
      let accessoryIds = [];
      if (accessories && accessories.length !== 0) {
        accessoryIds = accessories.map(
          (accessory: any) => accessory.accessory_id
        );
      }

      const aServices = await getAccessoryList(accessoryIds);
      let expense = 0;

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

      const newBuyAccessory = {
        create_at: moment().format("YYYY-MM-DDTHH:mm:ss"),
        seller: { salon_id: salonId },
        accessories: accessoryIds,
        expense,
        note,
        type: "buy accessory",
        fullname,
        email,
        phone,
      };

      const savedAccessoryInvoice = await aInvoicesRepository.save(
        newBuyAccessory
      );

      if (accessories && accessories.length !== 0) {
        await saveAInvoiceDetails(accessories, savedAccessoryInvoice);
      }

      return res.status(201).json({
        status: "success",
        msg: "Create successfully!",
        accessoryInvoice: savedAccessoryInvoice,
      });
    } catch (error) {
      console.log(error);
      return res.status(500).json({
        status: "failed",
        msg: "Internal server error",
      });
    }
  },
  updateAccessoryInvoices: async (req: Request, res: Response) => {
    const { id } = req.params;
    const { accessories, note, fullname, email, phone } = req.body;
    const InvoicesRepository = getRepository(Invoice);
    const aInvoiceDetailRepository = getRepository(AInvoiceDetail);
    let total = 0;

    try {
      let aserviceIds: any = [];
      if (accessories && accessories.length !== 0) {
        aserviceIds = accessories.map((service: any) => service.accessory_id);
      }

      const Invoice = await InvoicesRepository.findOne({
        where: { invoice_id: id, type: "buy accessory" },
      });

      if (!Invoice) {
        return res.status(404).json({
          status: "failed",
          msg: `No accessory invoice with id: ${id}`,
        });
      }

      Invoice.note = note;
      Invoice.fullname = fullname;
      Invoice.email = email;
      Invoice.phone = phone;

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

      if (accessories && accessories.length !== 0) {
        const aExpense = await processAccessory(id, accessories);
        total += aExpense;
      }

      if (accessories && accessories.length !== 0) {
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
        accessoryInvoice: result,
      });
    } catch (error) {
      console.log(error);
      return res
        .status(500)
        .json({ status: "failed", msg: "Internal server error" });
    }
  },
  deleteAccessoryInvoices: async (req: Request, res: Response) => {
    const { id } = req.params;
    const aInvoicesRepository = getRepository(Invoice);
    const aInvoiceDetailRepository = getRepository(AInvoiceDetail);
    try {
      const aInvoice = await aInvoicesRepository.findOne({
        where: { invoice_id: id, type: "buy accessory" },
      });

      if (!aInvoice) {
        return res.status(404).json({
          status: "failed",
          msg: `No accessory invoices with id: ${id}`,
        });
      }

      await aInvoicesRepository.delete(id);

      if (aInvoice.accessories && aInvoice.accessories.length !== 0)
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

export default accessoryController;
