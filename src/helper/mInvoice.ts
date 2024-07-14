import {
  User,
  Invoice,
  Maintenance,
  MInvoiceDetail,
  AInvoiceDetail,
  Accessory,
  Transaction,
} from "../entities";
import { getRepository, In } from "typeorm";
import { formatDate } from "../utils";
import CarUserLegalRepository from "../repository/car_user_legal";
import CarRepository from "../repository/car";

export const getUserInfo = async (userId: string) => {
  try {
    const user = await getRepository(User).findOne({
      where: { user_id: userId },
      relations: ["salonId"],
    });

    return user;
  } catch (error) {
    throw error;
  }
};

export const getMaintenanceServiceList = async (serviceCodes: string[]) => {
  const maintainRepository = getRepository(Maintenance);
  let services: any = [];
  if (serviceCodes && serviceCodes.length !== 0) {
    services = await maintainRepository.find({
      where: { maintenance_id: In(serviceCodes) },
    });
  }

  return services;
};

export const getAccessoryList = async (accessoryCodes: string[]) => {
  const accessoryRepository = getRepository(Accessory);
  let accessories: any = [];
  if (accessoryCodes && accessoryCodes.length !== 0) {
    accessories = await accessoryRepository.find({
      where: { accessory_id: In(accessoryCodes) },
    });
  }

  return accessories;
};

export const getMaintenanceInvoice = async (invoiceId: string) => {
  try {
    const mInvoicesRepository = getRepository(Invoice);
    const mInvoice = await mInvoicesRepository.findOne({
      where: { invoice_id: invoiceId, type: "maintenance" },
      relations: ["seller"],
    });
    return mInvoice;
  } catch (error) {
    throw error;
  }
};

export const getMaintenanceInvoiceListBySalonId = async (salonId: string) => {
  try {
    const mInvoicesRepository = getRepository(Invoice);
    const mInvoices = await mInvoicesRepository.find({
      where: { type: "maintenance", seller: { salon_id: salonId } },
      relations: ["seller"],
    });

    return mInvoices;
  } catch (error) {
    throw error;
  }
};

export const getMaintenanceInvoiceListByPhone = async (phone: string) => {
  try {
    const mInvoicesRepository = getRepository(Invoice);
    const mInvoices = await mInvoicesRepository.find({
      where: { type: "maintenance", phone: phone },
      relations: ["seller"],
    });

    return mInvoices;
  } catch (error) {
    throw error;
  }
};

export const getMaintenanceInvoiceDetails = async (invoiceId: string) => {
  const mInvoiceDetailRepository = getRepository(MInvoiceDetail);
  const invoiceDetails = await mInvoiceDetailRepository.find({
    where: { invoice_id: invoiceId },
  });
  return invoiceDetails;
};

export const getAccessoryInvoiceDetails = async (invoiceId: string) => {
  const mInvoiceDetailRepository = getRepository(AInvoiceDetail);
  const invoiceDetails = await mInvoiceDetailRepository.find({
    where: { invoice_id: invoiceId },
  });
  return invoiceDetails;
};

export const getMaintenanceInvoiceDetailsList = async (
  invoiceIds: string[]
) => {
  try {
    const mInvoiceDetailRepository = getRepository(MInvoiceDetail);
    const invoiceDetails = await mInvoiceDetailRepository.find({
      where: { invoice_id: In(invoiceIds) },
    });

    return invoiceDetails;
  } catch (error) {
    throw error;
  }
};

export const getAccessoryInvoiceDetailsList = async (invoiceIds: string[]) => {
  try {
    const aInvoiceDetailRepository = getRepository(AInvoiceDetail);
    const invoiceDetails = await aInvoiceDetailRepository.find({
      where: { invoice_id: In(invoiceIds) },
    });

    return invoiceDetails;
  } catch (error) {
    throw error;
  }
};

export const calculateMExpense = async (
  invoiceId: string,
  services: any,
  mServices: Maintenance[],
  state: any
): Promise<number> => {
  if (invoiceId === "") {
    let expense = 0;
    for (const service of services) {
      const quantity = service.quantity || 1;
      const dbService = mServices.find(
        (s) => s.maintenance_id === service.maintenance_id
      );
      if (dbService) {
        expense += dbService.cost * quantity;
      }
    }
    return expense;
  } else {
    const userLegalRp = await CarUserLegalRepository.getByInvoieId({
      invoiceId,
    });
    if (!userLegalRp.data) {
      let expense = 0;
      for (const service of services) {
        const quantity = service.quantity || 1;
        const dbService = mServices.find(
          (s) => s.maintenance_id === service.maintenance_id
        );
        if (dbService) {
          expense += dbService.cost * quantity;
        }
      }
      return expense;
    } else {
      const carId = userLegalRp.data.car_id;
      const carRp = await CarRepository.getAllCar({ id: carId });
      if (carRp?.data[0].warranties === null) {
        let expense = 0;
        for (const service of services) {
          const quantity = service.quantity || 1;
          const dbService = mServices.find(
            (s) => s.maintenance_id === service.maintenance_id
          );
          if (dbService) {
            expense += dbService.cost * quantity;
          }
        }
        return expense;
      } else {
        state.check = true;
        const maintenanceList = carRp?.data[0].warranties.maintenance;
        let mServiceIds = [];
        mServiceIds = maintenanceList.map(
          (service: any) => service.maintenance_id
        );
        let expense = 0;
        for (const service of services) {
          const quantity = service.quantity || 1;
          const dbService = mServices.find(
            (s) => s.maintenance_id === service.maintenance_id
          );
          if (dbService && mServiceIds.includes(dbService.maintenance_id)) {
            expense += 0;
          } else if (
            dbService &&
            !mServiceIds.includes(dbService.maintenance_id)
          ) {
            expense += dbService.cost * quantity;
          }
        }
        return expense;
      }
    }
  }
};

export const calculateAExpense = (
  accessories: any,
  aServices: Accessory[]
): number => {
  let expense = 0;
  for (const accessory of accessories) {
    const quantity = accessory.quantity || 1;
    const aService = aServices.find(
      (s: any) => s.accessory_id === accessory.accessory_id
    );
    if (aService) {
      expense += aService.price * quantity;
    }
  }
  return expense;
};

export const saveMInvoiceDetails = async (
  check: boolean,
  invoiceId: string,
  services: any,
  savedMaintenanceInvoice: Invoice
) => {
  const mInvoiceDetailRepository = getRepository(MInvoiceDetail);
  if (check) {
    const userLegalRp = await CarUserLegalRepository.getByInvoieId({
      invoiceId,
    });
    const carId = userLegalRp.data.car_id;
    const carRp = await CarRepository.getAllCar({ id: carId });
    const maintenanceList = carRp?.data[0].warranties.maintenance;
    let mServiceIds = [];
    mServiceIds = maintenanceList.map((service: any) => service.maintenance_id);
    for (const service of services) {
      const quantity = service.quantity || 1;
      const mInvoiceDetail = new MInvoiceDetail();

      mInvoiceDetail.invoice_id = savedMaintenanceInvoice.invoice_id;
      mInvoiceDetail.maintenance_id = service.maintenance_id;

      // Lấy chi tiết dịch vụ từ bảng Maintenance
      const mService = await getRepository(Maintenance).findOne({
        where: { maintenance_id: service.maintenance_id },
      });

      mInvoiceDetail.quantity = quantity;
      if (mService && mServiceIds.includes(mService.maintenance_id)) {
        mInvoiceDetail.price = 0;
      } else {
        mInvoiceDetail.price = mService?.cost || 1; // Nếu không tìm thấy mService thì giá là 1
      }

      await mInvoiceDetailRepository.save(mInvoiceDetail);
    }
  } else {
    for (const service of services) {
      const quantity = service.quantity || 1;
      const mInvoiceDetail = new MInvoiceDetail();

      mInvoiceDetail.invoice_id = savedMaintenanceInvoice.invoice_id;
      mInvoiceDetail.maintenance_id = service.maintenance_id;

      // Lấy chi tiết dịch vụ từ bảng Maintenance
      const mService = await getRepository(Maintenance).findOne({
        where: { maintenance_id: service.maintenance_id },
      });

      mInvoiceDetail.quantity = quantity;
      mInvoiceDetail.price = mService?.cost || 1; // Nếu không tìm thấy mService thì giá là 1

      await mInvoiceDetailRepository.save(mInvoiceDetail);
    }
  }
};

export const saveAInvoiceDetails = async (
  accessories: any,
  savedMaintenanceInvoice: Invoice
) => {
  const aInvoiceDetailRepository = getRepository(AInvoiceDetail);
  for (const accessory of accessories) {
    const quantity = accessory.quantity || 1;
    const aInvoiceDetail = new AInvoiceDetail();

    aInvoiceDetail.invoice_id = savedMaintenanceInvoice.invoice_id;
    aInvoiceDetail.accessory_id = accessory.accessory_id;
    const aService = await getRepository(Accessory).findOne({
      where: { accessory_id: accessory.accessory_id },
    });
    aInvoiceDetail.quantity = quantity;
    aInvoiceDetail.price = aService?.price || 1;

    await aInvoiceDetailRepository.save(aInvoiceDetail);
  }
};

export const processServices = async (id: string, services: any) => {
  const userLegalRp = await CarUserLegalRepository.getByInvoieId({
    id,
  });
  const carId = userLegalRp.data.car_id;
  const carRp = await CarRepository.getAllCar({ id: carId });
  if (carRp?.data[0].warranties === null) {
    let total = 0;

    for (const service of services) {
      const { maintenance_id, quantity } = service;
      const mInvoiceDetailRepository = getRepository(MInvoiceDetail);
      const mInvoiceDetail = new MInvoiceDetail();
      mInvoiceDetail.invoice_id = id;
      mInvoiceDetail.maintenance_id = maintenance_id;
      const mService = await getRepository(Maintenance).findOne({
        where: { maintenance_id: service.maintenance_id },
      });
      mInvoiceDetail.quantity = quantity || 1;
      mInvoiceDetail.price = mService?.cost || 1;
      await mInvoiceDetailRepository.save(mInvoiceDetail);

      const dbService = await getRepository(Maintenance).findOne({
        where: { maintenance_id: maintenance_id },
      });
      if (dbService) {
        total += dbService.cost * (quantity || 1);
      }
    }
    return total;
  } else {
    const maintenanceList = carRp?.data[0].warranties.maintenance;
    let mServiceIds = [];
    mServiceIds = maintenanceList.map((service: any) => service.maintenance_id);
    let total = 0;

    for (const service of services) {
      const { maintenance_id, quantity } = service;
      const mInvoiceDetailRepository = getRepository(MInvoiceDetail);
      const mInvoiceDetail = new MInvoiceDetail();
      mInvoiceDetail.invoice_id = id;
      mInvoiceDetail.maintenance_id = maintenance_id;
      const mService = await getRepository(Maintenance).findOne({
        where: { maintenance_id: service.maintenance_id },
      });
      mInvoiceDetail.quantity = quantity || 1;
      if (mService && mServiceIds.includes(mService.maintenance_id)) {
        mInvoiceDetail.price = 0;
      } else {
        mInvoiceDetail.price = mService?.cost || 1;
      }
      await mInvoiceDetailRepository.save(mInvoiceDetail);

      const dbService = await getRepository(Maintenance).findOne({
        where: { maintenance_id: maintenance_id },
      });

      if (dbService && mServiceIds.includes(dbService.maintenance_id)) {
        total += 0;
      } else if (dbService && !mServiceIds.includes(dbService.maintenance_id)) {
        total += dbService.cost * quantity;
      }
    }
    return total;
  }
};

export const processAccessory = async (id: string, accessories: any) => {
  let total = 0;

  for (const accessory of accessories) {
    const { accessory_id, quantity } = accessory;
    const aInvoiceDetailRepository = getRepository(AInvoiceDetail);
    const aInvoiceDetail = new AInvoiceDetail();
    aInvoiceDetail.invoice_id = id;
    aInvoiceDetail.accessory_id = accessory_id;
    const aService = await getRepository(Accessory).findOne({
      where: { accessory_id: accessory.accessory_id },
    });
    aInvoiceDetail.quantity = quantity || 1;
    aInvoiceDetail.price = aService?.price || 1;
    await aInvoiceDetailRepository.save(aInvoiceDetail);

    const dbService = await getRepository(Accessory).findOne({
      where: { accessory_id: accessory_id },
    });
    if (dbService) {
      total += dbService.price * (quantity || 1);
    }
  }
  return total;
};

export const formatMaintenanceInvoice = (
  mInvoice: Invoice,
  mServices: Maintenance[],
  mInvoiceDetails: MInvoiceDetail[],
  aServices: Accessory[],
  aInvoiceDetails: AInvoiceDetail[]
) => {
  const mDetailedServices = mServices.map((service) => {
    const invoiceDetail = mInvoiceDetails.find(
      (detail) => detail.maintenance_id === service.maintenance_id
    );
    if (invoiceDetail) {
      return {
        name: service.name,
        cost: invoiceDetail.price,
        quantity: invoiceDetail.quantity,
      };
    }
  });

  const aDetailedServices = aServices.map((service) => {
    const invoiceDetail = aInvoiceDetails.find(
      (detail) => detail.accessory_id === service.accessory_id
    );
    if (invoiceDetail) {
      return {
        name: service.name,
        price: invoiceDetail.price,
        quantity: invoiceDetail.quantity,
      };
    }
  });

  const formattedInvoice = {
    invoice_id: mInvoice.invoice_id,
    fullname: mInvoice.fullname,
    email: mInvoice.email,
    phone: mInvoice.phone,
    licensePlate: mInvoice.licensePlate,
    carName: mInvoice.carName,
    invoiceDate: formatDate(mInvoice.create_at),
    total: mInvoice.expense,
    salon: {
      salon_id: mInvoice.seller.salon_id,
      name: mInvoice.seller.name,
    },
    note: mInvoice.note,
    maintenanceServices: mDetailedServices,
    accessories: aDetailedServices,
  };

  return formattedInvoice;
};

export const formatMaintenanceInvoiceList = (
  mInvoices: Invoice[],
  mServices: Maintenance[],
  mInvoiceDetails: MInvoiceDetail[],
  aServices: Accessory[],
  aInvoiceDetails: AInvoiceDetail[]
) => {
  const formattedInvoices = mInvoices.map((invoice) => {
    let mdetailedServices: any = [];
    if (
      invoice.maintenanceServices &&
      invoice.maintenanceServices.length !== 0
    ) {
      mdetailedServices = invoice.maintenanceServices.map((code) => {
        const service = mServices.find((s) => s.maintenance_id === code);
        const invoiceDetail = mInvoiceDetails.find(
          (detail) =>
            detail.invoice_id === invoice.invoice_id &&
            detail.maintenance_id === code
        );

        if (service && invoiceDetail) {
          return {
            name: service.name,
            cost: invoiceDetail.price,
            quantity: invoiceDetail.quantity,
          };
        }
      });
    }

    let aDetailedServices: any = [];
    if (invoice.accessories && invoice.accessories.length !== 0) {
      aDetailedServices = invoice.accessories.map((code) => {
        const service = aServices.find((s) => s.accessory_id === code);
        const invoiceDetail = aInvoiceDetails.find(
          (detail) =>
            detail.invoice_id === invoice.invoice_id &&
            detail.accessory_id === code
        );

        if (service && invoiceDetail) {
          return {
            name: service.name,
            price: invoiceDetail.price,
            quantity: invoiceDetail.quantity,
          };
        }
      });
    }

    return {
      invoice_id: invoice.invoice_id,
      salon: {
        salon_id: invoice.seller.salon_id,
        salon_name: invoice.seller.name,
      },
      fullname: invoice.fullname,
      email: invoice.email,
      phone: invoice.phone,
      licensePlate: invoice.licensePlate,
      carName: invoice.carName,
      invoiceDate: formatDate(invoice.create_at),
      total: invoice.expense,
      note: invoice.note,
      maintenanceServices: mdetailedServices,
      accessories: aDetailedServices,
    };
  });

  return formattedInvoices;
};

//---------------------------------------------------------------------------------

export const getAccessoryInvoiceListBySalonId = async (salonId: string) => {
  try {
    const aInvoicesRepository = getRepository(Invoice);
    const aInvoices = await aInvoicesRepository.find({
      where: { type: "buy accessory", seller: { salon_id: salonId } },
      relations: ["seller"],
    });

    return aInvoices;
  } catch (error) {
    throw error;
  }
};

export const getAccessoryInvoiceListByPhone = async (phone: string) => {
  try {
    const aInvoicesRepository = getRepository(Invoice);
    const aInvoices = await aInvoicesRepository.find({
      where: { type: "buy accessory", phone: phone },
      relations: ["seller"],
    });

    return aInvoices;
  } catch (error) {
    throw error;
  }
};

export const getAccessoryInvoice = async (invoiceId: string) => {
  try {
    const aInvoicesRepository = getRepository(Invoice);
    const aInvoice = await aInvoicesRepository.findOne({
      where: { invoice_id: invoiceId, type: "buy accessory" },
      relations: ["seller"],
    });
    return aInvoice;
  } catch (error) {
    throw error;
  }
};

export const formatAccessoryInvoice = (
  aInvoice: Invoice,
  aServices: Accessory[],
  aInvoiceDetails: AInvoiceDetail[]
) => {
  const aDetailedServices = aServices.map((service) => {
    const invoiceDetail = aInvoiceDetails.find(
      (detail) => detail.accessory_id === service.accessory_id
    );
    if (invoiceDetail) {
      return {
        name: service.name,
        price: invoiceDetail.price,
        quantity: invoiceDetail.quantity,
      };
    }
  });

  const formattedInvoice = {
    invoice_id: aInvoice.invoice_id,
    fullname: aInvoice.fullname,
    email: aInvoice.email,
    phone: aInvoice.phone,
    invoiceDate: formatDate(aInvoice.create_at),
    total: aInvoice.expense,
    salon: {
      salon_id: aInvoice.seller.salon_id,
      name: aInvoice.seller.name,
    },
    note: aInvoice.note,
    accessories: aDetailedServices,
  };

  return formattedInvoice;
};

export const formatAccessoryInvoiceList = (
  aInvoices: Invoice[],
  aServices: Accessory[],
  aInvoiceDetails: AInvoiceDetail[]
) => {
  const formattedInvoices = aInvoices.map((invoice) => {
    let aDetailedServices: any = [];
    if (invoice.accessories && invoice.accessories.length !== 0) {
      aDetailedServices = invoice.accessories.map((code) => {
        const service = aServices.find((s) => s.accessory_id === code);
        const invoiceDetail = aInvoiceDetails.find(
          (detail) =>
            detail.invoice_id === invoice.invoice_id &&
            detail.accessory_id === code
        );

        if (service && invoiceDetail) {
          return {
            name: service.name,
            price: invoiceDetail.price,
            quantity: invoiceDetail.quantity,
          };
        }
      });
    }

    return {
      invoice_id: invoice.invoice_id,
      salon: {
        salon_id: invoice.seller.salon_id,
        salon_name: invoice.seller.name,
      },
      fullname: invoice.fullname,
      email: invoice.email,
      phone: invoice.phone,
      invoiceDate: formatDate(invoice.create_at),
      total: invoice.expense,
      note: invoice.note,
      accessories: aDetailedServices,
    };
  });

  return formattedInvoices;
};

export const getCompletedTransactionsCount = async (
  userId?: string,
  salonId?: string
) => {
  const transactionRepository = getRepository(Transaction);
  let queryBuilder = transactionRepository.createQueryBuilder("transaction");

  if (userId) {
    queryBuilder = queryBuilder.innerJoin(
      "transaction.user",
      "user",
      "user.user_id = :userId",
      { userId }
    );
  }

  if (salonId) {
    queryBuilder = queryBuilder.innerJoin(
      "transaction.salon",
      "salon",
      "salon.salon_id = :salonId",
      { salonId }
    );
  }

  queryBuilder = queryBuilder.andWhere("transaction.status = :status", {
    status: "success",
  });

  const count = await queryBuilder.getCount();
  return count;
};
