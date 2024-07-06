import crypto from "crypto";
import dayjs from "dayjs";
import vi from "dayjs/locale/vi";
import axios from "axios";
import { Between, Raw } from "typeorm";

dayjs.locale(vi);

function generateRandomCode(length: number): string {
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const randomBytes = crypto.randomBytes(length);
  let randomCode = "";

  for (let i = 0; i < length; i++) {
    const randomIndex = randomBytes[i] % characters.length;
    randomCode += characters.charAt(randomIndex);
  }

  return randomCode;
}

function isValidUUID(uuid: string) {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

function getFileName(url: string) {
  const parts = url.split("/");
  const fileNameWithExtension = parts.pop();
  if (fileNameWithExtension) {
    const desiredString =
      parts.slice(-1)[0] + "/" + fileNameWithExtension.replace(/\.[^.]+$/, "");
    return desiredString;
  }
  return "";
}

function getLocalDateTime() {
  const date = new Date();

  return date.toLocaleString();
}

function calExpiryDate(purchaseDate: Date, duration: number) {
  //const date = new Date(purchaseDate);
  purchaseDate.setMonth(purchaseDate.getMonth() + duration);

  return purchaseDate;
}

//function convertToTimeZone(date: any, timeZoneOffset: any) {
//  const localTime = date.getTime() + timeZoneOffset * 60 * 60 * 1000;
//  return new Date(localTime);
//}

function extractTime(dateString: Date) {
  const date = new Date(dateString);
  const hours = padZero(date.getHours());
  const minutes = padZero(date.getMinutes());
  //const timeZoneOffset = 7; // Múi giờ +7
  //const localDate = convertToTimeZone(date, timeZoneOffset);
  //const hours = padZero(localDate.getHours());
  //const minutes = padZero(localDate.getMinutes());
  return `${hours}:${minutes}`;
}

// Helper function to pad single-digit numbers with a leading zero
function padZero(number: Number) {
  return number.toString().padStart(2, "0");
}

function formatDate(date: Date) {
  const formattedDayOfWeek = dayjs(date).format("dddd");
  const formattedDate = dayjs(date).format("DD/MM/YYYY HH:mm");

  const capitalizedDayOfWeek =
    formattedDayOfWeek.charAt(0).toUpperCase() + formattedDayOfWeek.slice(1);

  const formattedPublishDate = `${capitalizedDayOfWeek}, ${formattedDate}`;

  return formattedPublishDate;
}

function isDateInMonth(inputDate: Date, monthCompare: number) {
  const date = new Date(inputDate);

  return date.getMonth() + 1 === monthCompare;
}

const FormatData = (status?: any, msg?: any, data?: any, code?: any) => {
  let result: any = {};
  if (msg) result.msg = msg;
  if (data) result.data = data;
  if (status) result.status = status;
  if (code) result.code = code;

  return result;
};

function getNextElement(array: any, element: any) {
  for (let i = 0; i < array.length - 1; i++) {
    if (array[i] === element) {
      return array[i + 1];
    }
  }
  return null;
}

function isArraySubset(subset: any, array: any) {
  return subset.every((element: any) => array.includes(element));
}

function calculateAverageRating(ratingList: Array<number>) {
  const validRatingList = ratingList.filter((rating) => rating !== -1);
  let avgRating;

  if (validRatingList.length > 0) {
    const sum = validRatingList.reduce(
      (acc, rating) => acc + Number(rating),
      0
    );
    avgRating = sum / validRatingList.length;
  } else {
    avgRating = 0;
  }

  return avgRating;
}

function subtractHoursFromStringTime(timeString: string, hours: number) {
  let givenTime = new Date(timeString);
  let timeBefore = new Date(givenTime.getTime() - hours * 60 * 60 * 1000);

  let year = timeBefore.getFullYear();
  let month = String(timeBefore.getMonth() + 1).padStart(2, "0");
  let day = String(timeBefore.getDate()).padStart(2, "0");
  let hoursStr = String(timeBefore.getHours()).padStart(2, "0");
  let minutes = String(timeBefore.getMinutes()).padStart(2, "0");
  let seconds = String(timeBefore.getSeconds()).padStart(2, "0");

  let timeBeforeStr = `${year}-${month}-${day} ${hoursStr}:${minutes}:${seconds}`;

  return timeBeforeStr;
}

export const PublishPaymentEvent = async (payload: any) => {
  const { data } = await axios.post(
    `${process.env.PAYMENT_SERVICE}app-events/`,
    {
      payload,
    }
  );

  return data;
};

export const buildWhereCondition = (
  phone: string,
  year?: number,
  quarter?: number,
  month?: number
) => {
  let whereCondition: any = { phone: phone };
  if (year) {
    if (quarter) {
      const startMonth = (quarter - 1) * 3 + 1;
      const endMonth = startMonth + 2;
      const startDate = new Date(year, startMonth - 1, 1);
      const endDate = new Date(year, endMonth - 1, 31);
      whereCondition.create_at = Between(startDate, endDate);
    } else if (month) {
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0);
      whereCondition.create_at = Between(startDate, endDate);
    } else {
      whereCondition.create_at = Between(
        new Date(`${year}-01-01`),
        new Date(`${year}-12-31`)
      );
    }
  } else if (quarter) {
    const startMonth = (quarter - 1) * 3 + 1;
    const endMonth = startMonth + 2;
    const startDate = new Date(new Date().getFullYear(), startMonth - 1, 1);
    const endDate = new Date(new Date().getFullYear(), endMonth - 1, 31);
    whereCondition.create_at = Between(startDate, endDate);
  } else if (month) {
    const startDate = new Date(new Date().getFullYear(), month - 1, 1);
    const endDate = new Date(new Date().getFullYear(), month, 0);
    whereCondition.create_at = Between(startDate, endDate);
  }

  return whereCondition;
};

export {
  generateRandomCode,
  isValidUUID,
  getFileName,
  getLocalDateTime,
  calExpiryDate,
  extractTime,
  formatDate,
  isDateInMonth,
  FormatData,
  getNextElement,
  isArraySubset,
  calculateAverageRating,
  subtractHoursFromStringTime,
};
