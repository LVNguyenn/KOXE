import { Request, Response } from "express";
import SalonPaymentRepository from "../repository/salonpayment";
import SalonRepository from "../repository/salon";
import UserRepository from "../repository/user";
import createNotification from "../helper/createNotification";
import search from "../helper/search";
import pagination from "../helper/pagination";
import InvoiceRepository from "../repository/invoice";

const apidocController = {
    createPayment: async (req: Request, res: Response) => {
        let { cusPhone, cusFullname, reason, amount, salonId, invoiceId, methodPaymentId } = req.body;
        const creator = req.user;
        let errorMsg = "";
        let payment_method = "";

        try {
            if (!methodPaymentId) {
                errorMsg = "Missing method payment";
                throw new Error(errorMsg);
            }
            
            // get infor payment method
            const paymentRp = await SalonPaymentRepository.getAllMethod({id: methodPaymentId, salonId});

            if (!paymentRp?.data[0]) {
                errorMsg = "Error method payment";
                throw new Error(errorMsg);
            }

            payment_method = paymentRp?.data[0].type + " " + paymentRp?.data[0].content + " " + paymentRp?.data[0].fullname

            const salon = await SalonRepository.findSalonById({ salonId });

            if (invoiceId) {
                // get invoice infor
                const invoiceRp = await InvoiceRepository.findById({invoiceId});

                if (!invoiceRp.data) {
                    errorMsg = "Invalid invoiceId.";
                    throw new Error(errorMsg);
                }

                amount = invoiceRp?.data?.expense;
                if (invoiceRp?.data?.type === "buy car") reason = "Thanh toán hóa đơn mua xe";
                if (invoiceRp?.data?.type === "maintenance") reason = "Thanh toán hóa đơn bảo dưỡng";
                if (invoiceRp?.data?.type === "buy accessory") reason = "Thanh toán hóa đơn phụ tùng";
                cusPhone = invoiceRp?.data?.phone;
                cusFullname = invoiceRp?.data?.fullname;
            }
            const payRp = await SalonPaymentRepository.create({
                custormer_phone: cusPhone, custormer_fullname: cusFullname,
                reason, creator, amount, salon: salon?.data, payment_method, invoice_id: invoiceId
            });

            if (payRp?.data) {
                // get userId by phone
                const userRp = await UserRepository.getProfileByOther({ phone: cusPhone });
                createNotification({
                    to: userRp?.data?.user_id,
                    description: `Bạn có một yêu cầu thanh toán mới từ salon ${payRp.data.salon.name || "no name"}`,
                    types: "salon-payment",
                    data: payRp?.data?.id || "",
                    avatar: payRp.data.salon?.image,
                    isUser: false
                });
            }

            return res.json({ ...payRp });
        } catch (error) {
            console.log(error);
            return res.json({
                status: "failed",
                msg: errorMsg || "Error creating."
            })
        }
    },

    get: async (req: Request, res: Response) => {
        const { id, page, per_page, q, creator }: any = req.query;
        const userId: any = req.user;
        let phone = req.query.phone;

        try {
            // get salonId
            const salonRp = await UserRepository.getSalonIdByUserId({ userId });

            if (!salonRp.data) {
                const userRp = await UserRepository.getProfileById(userId);

                if (!userRp?.data?.phone) {
                    return res.json({
                        status: "failed",
                        msg: "Please update your phone."
                    })
                }

                phone = userRp?.data?.phone;
            }

            let rs = await SalonPaymentRepository.getAll({ salonId: salonRp.data, phone, id, creator })

            for (let e of rs.data) {
                // get information of creator
                const creatorRp = await UserRepository.getProfileById(e.creator);
                e.creator = creatorRp.data.fullname || "No name";
            }

            if (q && rs.data) {
                if (salonRp.data) {
                    rs.data = await search({ data: rs.data, q, fieldname: "custormer_phone"})
                } else {
                    rs.data = await search({ data: rs?.data, q, fieldname: "salon", fieldname2: "name" })
                }
              }
        
              rs.data = await pagination({ data: rs.data, page, per_page });

            return res.json({ ...rs });
        } catch (error) {
            return res.json({
                status: "failed",
                msg: "Error getting."
            })
        }
    },

    confirmPaidFromUser: async (req: Request, res: Response) => {
        const { id } = req.body;
        const userId: any = req.user;

        try {
            if (!id) throw new Error("Missing input.");
            // get phone of user.
            const userRp = await UserRepository.getProfileById(userId);
            if (!userRp.data.phone) throw new Error("Error phone.")
            const payRp = await SalonPaymentRepository.getAll({ id, phone: userRp.data.phone });
            if (!payRp.data) throw new Error("Error payment.")

            createNotification({
                to: payRp?.data[0]?.salon.salon_id,
                description: `${userRp?.data?.fullname} vừa xác nhận đã hoàn tất thanh toán. Vui lòng kiểm tra lại và xác nhận.`,
                types: "salon-payment",
                data: id,
                avatar: userRp?.data?.avatar || "https://haycafe.vn/wp-content/uploads/2022/02/Avatar-trang.jpg",
                isUser: true
            });

            return res.json({
                status: "success",
                msg: "Successful confirmation, please wait for a response from the salon."
            })

        } catch (error) {
            console.log(error)
            return res.json({
                status: "failed",
                msg: "Error confirmed, please try again."
            })
        }

    },

    confirmPaidFromSalon: async (req: Request, res: Response) => {
        const { salonId, id } = req.body;

        try {
            if (!id) throw new Error();
            const payRp = await SalonPaymentRepository.getAll({salonId, id});
            if (!payRp.data[0]) throw new Error("Error payment.");
            // update status
            const rs = await SalonPaymentRepository.updateStatus({...payRp.data[0]});
            if (!rs?.data) throw new Error("Update failed.");
            // update payment_done in invoice
            if (rs.data?.invoice_id) {
                const invoiceRp = await InvoiceRepository.findById({invoiceId: rs.data?.invoice_id});
                await InvoiceRepository.update({...invoiceRp?.data, payment_done: true});
            }
            // get userId by phone
            const userRp = await UserRepository.getProfileByOther({ phone: payRp.data[0]?.custormer_phone });
            createNotification({
                to: userRp?.data?.user_id,
                description: `Salon ${payRp.data[0].salon.name} đã xác nhận hoàn tất thanh toán. Giao dịch thành công.`,
                types: "salon-payment",
                data: id,
                avatar: payRp.data[0].salon?.image || "",
                isUser: false
            });

            return res.json({ ...rs });

        } catch (error) {
            console.log(error)
            return res.json({
                status: "failed",
                msg: "Error confirm, please try again."
            })
        }
    },

    delete: async (req: Request, res: Response) => {
        try {
            const userId = req.user;
            const {id} = req.params;
            if (!userId || !id) throw new Error("Missing input.");
            // get salonId
            const salonRp = await UserRepository.getSalonIdByUserId({ userId })
            const rs = await SalonPaymentRepository.getAll({ salonId: salonRp.data, id })
            if (!rs?.data[0]) throw new Error("Error find.");
            
            const delPay = await SalonPaymentRepository.delete(rs?.data[0]);

            return res.json({...delPay});
        } catch (error) {
            console.log(error)
            return res.json({
                status: "failed", 
                msg: "Error delete."
            })
        }
    }
};

export default apidocController;
