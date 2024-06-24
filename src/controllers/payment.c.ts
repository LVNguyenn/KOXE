import { Request, Response } from "express";
import * as CryptoJS from "crypto-js";
import axios from "axios";
import querystring from "qs";
import * as crypto from "crypto";
import { getRepository } from "typeorm";
import { Package, Purchase } from "../entities";
import { calExpiryDate } from "../utils";

const config = {
  appid: 2554,
  key1: "sdngKKJmqEMzvh5QQcdD2A9XBSKUNaYn",
  key2: "trMrHtvjo6myautxDUiAcYsVtaeQ8nhf",
};

const headers = {
  "Content-Type": "application/json",
};

// Hàm để lấy ngày hiện tại theo múi giờ Việt Nam (GMT+7)
function getCurrentDateInVNTimeZone() {
  const now = new Date();
  const utcOffset = 7; // Múi giờ Việt Nam (GMT+7)
  const vnTime = new Date(now.getTime() + utcOffset * 60 * 60 * 1000);
  return vnTime;
}

function generateRandomNumber(min: number, max: number): number {
  const range = max - min + 1;
  const bytesNeeded = Math.ceil(Math.log2(range) / 8);
  const randomBytesBuffer = crypto.randomBytes(bytesNeeded);

  let randomNumber = 0;
  for (let i = 0; i < bytesNeeded; i++) {
    randomNumber = (randomNumber << 8) + randomBytesBuffer[i];
  }

  return min + (randomNumber % range);
}

// Hàm để format ngày thành dạng yymmdd
function formatDateToYYMMDD(date: Date) {
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const day = date.getDate().toString().padStart(2, "0");
  return year + month + day;
}

// Tạo mã giao dịch
function generateAppTransId(orderId: string | number) {
  const currentDate = getCurrentDateInVNTimeZone();
  const datePart = formatDateToYYMMDD(currentDate);
  return datePart + "_" + orderId;
}

const config_vn = {
  vnp_Url: "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html",
  vnp_HashSecret: "BFMLNCHNKMQDFZVJAKCUJULATTDTAMKQ",
  vnp_TmnCode: "DRQT53YH",
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

const apidocController = {
  // ------------------- ZALOPAY------------------------//
  createOrder: (req: Request, res: Response) => {
    let appTransId = generateAppTransId(Math.floor(Math.random() * 1000000));
    let order = {
      app_id: config.appid,
      app_trans_id: appTransId,
      app_user: "ZaloPayDemo",
      app_time: Date.now(),
      item: req.body.item || "[]",
      embed_data: "{}",
      amount: req.body.amount || 1,
      description:
        req.body.description || "Demo thanh toan don hang #" + appTransId,
      bank_code: req.body.bank_code || "zalopayapp",
      // "bank_code": "CC",
      mac: "",
    };

    const data =
      order.app_id +
      "|" +
      order.app_trans_id +
      "|" +
      order.app_user +
      "|" +
      order.amount +
      "|" +
      order.app_time +
      "|" +
      order.embed_data +
      "|" +
      order.item;

    order.mac = CryptoJS.HmacSHA256(data, config.key1).toString();

    axios
      .post("https://sb-openapi.zalopay.vn/v2/create", order, { headers })
      .then((response: { data: any }) => {
        return res.json({ data: response.data, appTransId });
      })
      .catch((error: any) => {
        return res.json(error);
      });
  },

  queryOrder: (req: Request, res: Response) => {
    const order = {
      app_id: config.appid,
      app_trans_id: req.body.app_trans_id || "",
      mac: "",
    };

    const data = order.app_id + "|" + order.app_trans_id + "|" + config.key1;
    order.mac = CryptoJS.HmacSHA256(data, config.key1).toString();

    axios
      .post("https://sb-openapi.zalopay.vn/v2/query", order, { headers })
      .then((response: { data: any }) => {
        return res.json({ data: response.data });
      })
      .catch((error: any) => {
        return res.json(error);
      });
  },
  // ------------------- VNPAY------------------------//

  createPaymentUrl: async (req: Request, res: Response) => {
    const userId: any = req.headers["userId"] || "u-test";
    const packageId: any = req.body.package_id;
    const months: any = req.body.months;

    try {
      const packageRepository = getRepository(Package);
      const userPackageRepository = getRepository(Purchase);
      const packageDb = await packageRepository.findOneOrFail({
        where: { package_id: packageId },
      });

      const userPkgDb = await userPackageRepository.findOne({
        where: { userId: userId, packageId: packageId },
      });

      if (userPkgDb) {
        return res.json({
          status: "failed",
          msg: "This user is registerThis user has already registered for this service package.",
        });
      }

      const orderInfor = {
        user_id: userId,
        package_id: packageId,
        months,
      };

      const date = new Date();

      date.setHours(date.getHours() + 7); // GMT+7

      // Lấy các thành phần của ngày giờ (năm, tháng, ngày, giờ, phút, giây)
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0"); // Thêm số 0 đằng trước nếu cần
      const day = String(date.getDate()).padStart(2, "0");
      const hours = String(date.getHours()).padStart(2, "0");
      const minutes = String(date.getMinutes()).padStart(2, "0");
      const seconds = String(date.getSeconds()).padStart(2, "0");

      var vnp_Params: any = {};

      vnp_Params["vnp_Version"] = "2.1.0";
      vnp_Params["vnp_Command"] = "pay";
      vnp_Params["vnp_TmnCode"] = "DRQT53YH";
      // vnp_Params['vnp_Merchant'] = ''
      vnp_Params["vnp_Locale"] = "vn";
      vnp_Params["vnp_CurrCode"] = "VND";
      vnp_Params["vnp_TxnRef"] = Math.floor(Math.random() * 100) + 1;
      vnp_Params["vnp_OrderInfo"] =
        JSON.stringify(orderInfor) || "Demo thanh toan VN Pay";
      vnp_Params["vnp_OrderType"] = "other";
      vnp_Params["vnp_Amount"] = packageDb.price * Number(months) * 100;
      vnp_Params[
        "vnp_ReturnUrl"
      ] = `${process.env.URLSEVER}/payment/vnpay_return`;
      vnp_Params["vnp_IpAddr"] = "127.0.0.1";
      vnp_Params[
        "vnp_CreateDate"
      ] = `${year}${month}${day}${hours}${minutes}${seconds}`;
      vnp_Params["vnp_BankCode"] = "NCB";

      let vnpUrl = config_vn.vnp_Url;
      let secretKey = config_vn.vnp_HashSecret;

      vnp_Params = sortObject(vnp_Params);

      var signData = querystring.stringify(vnp_Params, { encode: false });
      var hmac = crypto.createHmac("sha512", secretKey);
      var signed = hmac.update(new Buffer(signData, "utf-8")).digest("hex");
      vnp_Params["vnp_SecureHash"] = signed;
      vnpUrl += "?" + querystring.stringify(vnp_Params, { encode: false });

      return res.json({ vnpUrl });
    } catch (error) {
      return res.redirect(
        (process.env.URL_CLIENT || "url_client") +
          "/payment/vnpay?rs=error&msg=invalid+information"
      );
    }
  },

  vnpayIPN: (req: Request, res: Response) => {
    var vnp_Params = req.query;
    var secureHash = vnp_Params["vnp_SecureHash"];
    // console.log("PARAMS: ", vnp_Params);

    delete vnp_Params["vnp_SecureHash"];
    delete vnp_Params["vnp_SecureHashType"];
    vnp_Params = sortObject(vnp_Params);

    var secretKey = config_vn.vnp_HashSecret;
    var signData = querystring.stringify(vnp_Params, { encode: false });
    var hmac = crypto.createHmac("sha512", secretKey);
    var signed = hmac.update(new Buffer(signData, "utf-8")).digest("hex");

    if (secureHash === signed) {
      var orderId = vnp_Params["vnp_TxnRef"];
      var rspCode = vnp_Params["vnp_ResponseCode"];
      //Kiem tra du lieu co hop le khong, cap nhat trang thai don hang va gui ket qua cho VNPAY theo dinh dang duoi
      return res.status(200).json({ RspCode: "00", Message: "success" });
    }

    return res.status(200).json({ RspCode: "97", Message: "Fail checksum" });
  },

  vnpayReturn: async (req: Request, res: Response) => {
    var vnp_Params = req.query;
    var secureHash = vnp_Params["vnp_SecureHash"];

    const orderInfor = JSON.parse(
      decodeURIComponent(vnp_Params.vnp_OrderInfo as any)
    );
    const userId: any = orderInfor.user_id;
    const package_id: any = orderInfor.package_id;
    const months: any = orderInfor.months;

    // console.log("PARAM VNPAY RETURN: ", vnp_Params);

    delete vnp_Params["vnp_SecureHash"];
    delete vnp_Params["vnp_SecureHashType"];

    vnp_Params = sortObject(vnp_Params);

    var tmnCode = config_vn.vnp_TmnCode;
    var secretKey = config_vn.vnp_HashSecret;
    var signData = querystring.stringify(vnp_Params, { encode: false });
    var hmac = crypto.createHmac("sha512", secretKey);
    var signed = hmac.update(new Buffer(signData, "utf-8")).digest("hex");

    // find information for orderid
    try {
      const packageRepository = getRepository(Package);
      const packageDb = await packageRepository.findOneOrFail({
        where: { package_id: package_id },
      });

      if (secureHash === signed && vnp_Params.vnp_ResponseCode == "00") {
        // Khong luu du lieu o day nhung day la test o localhost nen luu tam o day
        //let today: Date = new Date();
        //let expirationDate = new Date(today);
        const userPackageRepository = getRepository(Purchase);
        const saveInfo = new Purchase();
        // add package for user
        saveInfo.userId = userId;
        saveInfo.packageId = package_id;
        //saveInfo.purchaseDate = today;
        //expirationDate.setMonth(expirationDate.getMonth() + Number(months));
        saveInfo.expirationDate = calExpiryDate(
          saveInfo.purchaseDate,
          Number(months)
        );
        saveInfo.total = Number(vnp_Params.vnp_Amount) / 100;
        await userPackageRepository.save(saveInfo);

        // should be find permission of package id. And update permission for customer
        // find permission of each feature.
        // here

        return res.redirect(
          (process.env.URL_CLIENT || "url_client") +
            `/payment/vnpay?rs=success&amount=${
              Number(vnp_Params.vnp_Amount) / 100
            }&item=${packageDb.name}`
        );
      }

      // console.log("OrderInfor: ", orderInfor, orderInfor.orderId, orderInfor.userId);
      return res.redirect(
        (process.env.URL_CLIENT || "url_client") + "/payment/vnpay?rs=failed"
      );
    } catch (error) {
      console.log(error);
      return res.redirect(
        (process.env.URL_CLIENT || "url_client") +
          "/payment/vnpay?rs=error&msg=invalid+information"
      );
    }
  },
};

export default apidocController;
