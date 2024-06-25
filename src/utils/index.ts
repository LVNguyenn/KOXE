import axios from "axios";

module.exports.FormateData = (data: any) => {
  if (data) {
    return { data };
  } else {
    throw new Error("Data Not found!");
  }

};

function calExpiryDate(purchaseDate: Date, duration: number) {
  const newDate = new Date(purchaseDate);
  //const date = new Date(purchaseDate);
  newDate.setMonth(purchaseDate.getMonth() + duration);

  return newDate;
}

export {calExpiryDate}