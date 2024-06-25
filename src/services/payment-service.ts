import PaymentRepository from "../database/repository/payment-repository"
import * as crypto from 'crypto';
import querystring from 'qs';

require("dotenv").config({ path: "./server/.env" });

const config_vn = {
    vnp_Url: "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html",
    vnp_HashSecret: "BFMLNCHNKMQDFZVJAKCUJULATTDTAMKQ",
    vnp_TmnCode: "DRQT53YH"
};

function sortObject(obj: any) {
    var sorted: any = {};
    var str = [];
    var key;
    for (key in obj) {
        if (obj.hasOwnProperty(key)) {
            str.push(encodeURIComponent(key));
        }
    }
    str.sort();
    for (key = 0; key < str.length; key++) {
        sorted[str[key]] = encodeURIComponent(obj[str[key]]).replace(/%20/g, "+");
    }
    return sorted;
}

class PaymentService {

    async createPaymentUrl(data: any) {

        try {
            const packageDb = await PaymentRepository.findPackageById(data);
            const userPkgDb = await PaymentRepository.findUserPurchase(data);
            var renewMonths: Date| null = null;
            let oldTotal = 0;

            if (!packageDb) {
                throw new Error();
            }

            if (userPkgDb) {
                // return {
                //     status: "failed",
                //     msg: "You have already registered for this service package."
                // }
                oldTotal = userPkgDb.total;
                let today = new Date();

                // cal months and renew months
                if (userPkgDb.expirationDate > today) {
                    renewMonths = new Date(userPkgDb.expirationDate);
                    renewMonths.setMonth(userPkgDb.expirationDate.getMonth() + data?.months || 0);
                } else {
                    renewMonths = new Date(today);
                    renewMonths.setMonth(renewMonths.getMonth() + (data?.months || 0));
                }
                console.log(userPkgDb);
                console.log(renewMonths.toISOString());

            }

            const orderInfor = {
                user_id: data?.userId || "u-test",
                package_id: data?.packageId,
                months: data?.months,
                renewMonths: renewMonths?.toISOString(),
                oldTotal
            }

            const date = new Date();

            date.setHours(date.getHours() + 7); // GMT+7

            // Lấy các thành phần của ngày giờ (năm, tháng, ngày, giờ, phút, giây)
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0'); // Thêm số 0 đằng trước nếu cần
            const day = String(date.getDate()).padStart(2, '0');
            const hours = String(date.getHours()).padStart(2, '0');
            const minutes = String(date.getMinutes()).padStart(2, '0');
            const seconds = String(date.getSeconds()).padStart(2, '0');

            var vnp_Params: any = {};

            vnp_Params['vnp_Version'] = '2.1.0';
            vnp_Params['vnp_Command'] = 'pay';
            vnp_Params['vnp_TmnCode'] = "DRQT53YH";
            // vnp_Params['vnp_Merchant'] = ''
            vnp_Params['vnp_Locale'] = "vn";
            vnp_Params['vnp_CurrCode'] = 'VND';
            vnp_Params['vnp_TxnRef'] = Math.floor(Math.random() * 100) + 1;;
            vnp_Params['vnp_OrderInfo'] = JSON.stringify(orderInfor) || "Demo thanh toan VN Pay";
            vnp_Params['vnp_OrderType'] = "other";
            vnp_Params['vnp_Amount'] = packageDb.price * Number(data?.months) * 100;
            vnp_Params['vnp_ReturnUrl'] = `${process.env.GATEWAY}/payment/vnpay_return`;
            vnp_Params['vnp_IpAddr'] = "127.0.0.1";
            vnp_Params['vnp_CreateDate'] = `${year}${month}${day}${hours}${minutes}${seconds}`;
            vnp_Params['vnp_BankCode'] = "NCB";

            let vnpUrl = config_vn.vnp_Url;
            let secretKey = config_vn.vnp_HashSecret;

            vnp_Params = sortObject(vnp_Params);

            var signData = querystring.stringify(vnp_Params, { encode: false });
            var hmac = crypto.createHmac("sha512", secretKey);
            var signed = hmac.update(new Buffer(signData, 'utf-8')).digest("hex");
            vnp_Params['vnp_SecureHash'] = signed;
            vnpUrl += '?' + querystring.stringify(vnp_Params, { encode: false });

            return { vnpUrl };
        } catch (error) {
            return { url: (process.env.URL_CLIENT || "url_client") + "/payment/vnpay?rs=error&msg=invalid+information" };
        }


    }

    async vnpayIPN(data: any) {
        //     var vnp_Params = req.query;
        //     var secureHash = vnp_Params['vnp_SecureHash'];
        //     // console.log("PARAMS: ", vnp_Params);

        //     delete vnp_Params['vnp_SecureHash'];
        //     delete vnp_Params['vnp_SecureHashType'];
        //     vnp_Params = sortObject(vnp_Params);

        //     var secretKey = config_vn.vnp_HashSecret;
        //     var signData = querystring.stringify(vnp_Params, { encode: false });
        //     var hmac = crypto.createHmac("sha512", secretKey);
        //     var signed = hmac.update(new Buffer(signData, 'utf-8')).digest("hex");

        //     if (secureHash === signed) {
        //         var orderId = vnp_Params['vnp_TxnRef'];
        //         var rspCode = vnp_Params['vnp_ResponseCode'];
        //         //Kiem tra du lieu co hop le khong, cap nhat trang thai don hang va gui ket qua cho VNPAY theo dinh dang duoi
        //         return res.status(200).json({ RspCode: '00', Message: 'success' })
        //     }

        //     return res.status(200).json({ RspCode: '97', Message: 'Fail checksum' })

    }

    async vnpayReturn(data: any) {
        var vnp_Params = data;
        var secureHash = vnp_Params['vnp_SecureHash'];

        const orderInfor = JSON.parse(decodeURIComponent(vnp_Params.vnp_OrderInfo as any));
        const userId: any = orderInfor.user_id;
        const package_id: any = orderInfor.package_id;
        const months: any = orderInfor.months;
        const renewMonths: any = orderInfor.renewMonths||null;
        const oldTotal: number = orderInfor.oldTotal||0;

        delete vnp_Params['vnp_SecureHash'];
        delete vnp_Params['vnp_SecureHashType'];

        vnp_Params = sortObject(vnp_Params);

        var tmnCode = config_vn.vnp_TmnCode;
        var secretKey = config_vn.vnp_HashSecret;
        var signData = querystring.stringify(vnp_Params, { encode: false });
        var hmac = crypto.createHmac("sha512", secretKey);
        var signed = hmac.update(new Buffer(signData, 'utf-8')).digest("hex");

        // find information for orderid
        try {
            const packageDb = await PaymentRepository.findPackageById({ packageId: package_id })
            console.log("package_id: ", package_id)
            if (!packageDb) throw new Error("error finding package.");

            if (secureHash === signed && vnp_Params.vnp_ResponseCode == "00") {
                // Khong luu du lieu o day nhung day la test o localhost nen luu tam o day
                // add package for user
                const total = Number(vnp_Params.vnp_Amount) / 100;
                const rs = await PaymentRepository.savePurchase({ userId, packageId: package_id, months, total, renewMonths, oldTotal })
                if (!rs) throw new Error();
                console.log(rs)
                return { url: (process.env.URL_CLIENT || "url_client") + `/payment/vnpay?rs=success&amount=${Number(vnp_Params.vnp_Amount) / 100}&item=${packageDb.name}` };
            }

            // console.log("OrderInfor: ", orderInfor, orderInfor.orderId, orderInfor.userId);
            return { url: (process.env.URL_CLIENT || "url_client") + "/payment/vnpay?rs=failed" };

        } catch (error) {
            console.log("ERROR: ", error);
            return { url: (process.env.URL_CLIENT || "url_client") + "/payment/vnpay?rs=error&msg=invalid+information" };
        }

    }

    async getPurchase(data: any) {
        const rs = PaymentRepository.getPurchase(data);

        return rs;
    }

    async SubscribeEvents(payload: any) {

        const { event, data } = payload;
        console.log(event, data)
        switch (event) {
            case 'GET_ALL_PURCHASE':
                const rs = this.getPurchase(data)
                return rs;
            default:
                break;
        }

    }
}

export default PaymentService;