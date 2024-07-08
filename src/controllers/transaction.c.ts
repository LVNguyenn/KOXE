import { Request, Response } from "express";
import { getRepository, In } from "typeorm";
import { Transaction } from "../entities/Transaction";
import { User } from "../entities/User";
import { Connection } from "../entities/Connection";
import { Process } from "../entities/Process";
import { Stage } from "../entities/Stage";
import { Revenue } from "../entities/Revenue";
import { getUserInfo, getCompletedTransactionsCount } from "../helper/mInvoice";
import {
  getNextElement,
  isArraySubset,
  calculateAverageRating,
  calcTotalNumOfCompletedTran,
} from "../utils/index";
import { formatDate } from "../utils";
import createNotification from "../helper/createNotification";
import search from "../helper/search";
import pagination from "../helper/pagination";

const transactionController = {
  getTransactionById: async (req: Request, res: Response) => {
    const transactionRepository = getRepository(Transaction);
    const { id } = req.params;

    try {
      const transaction = await transactionRepository.findOne({
        where: { transaction_id: id },
        relations: ["user", "process", "stage"],
      });

      if (!transaction) {
        return res.status(404).json({
          status: "failed",
          msg: `No transaction with transactionId: ${id}`,
        });
      }

      const formatTransaction = {
        ...transaction,
        user: {
          user_id: transaction.user.user_id,
          name: transaction.user.fullname,
        },
      };

      return res.status(200).json({
        status: "success",
        transaction: formatTransaction,
      });
    } catch (error) {
      return res
        .status(500)
        .json({ status: "failed", msg: "Internal server error" });
    }
  },
  getAllTransactions: async (req: Request, res: Response) => {
    const transactionRepository = getRepository(Transaction);
    const revenueRepository = getRepository(Revenue);
    const userRepository = getRepository(User);
    const userId: any = req.headers["userId"] || "";
    const { page, per_page, q }: any = req.query;
    let checkSalon = false;
    let totalRevenue = 0;
    let completedTran = 0;
    let revenue: any;

    const user = await getRepository(User).findOne({
      where: [{ user_id: userId }],
      relations: ["salonId"],
    });

    let salonId = "";
    if (user?.salonId) {
      salonId = user.salonId.salon_id;
    }

    try {
      let transactionList;
      let formatTransactions: any;
      if (salonId !== "") {
        // checkSalon = true;
        // transactionList = await transactionRepository.find({
        //   where: { salon: { salon_id: salonId } },
        //   relations: ["user", "connection", "process", "stage"],
        // });

        // formatTransactions = transactionList.map((transaction) => ({
        //   ...transaction,
        //   user: {
        //     user_id: transaction.user.user_id,
        //     name: transaction.user.fullname,
        //   },
        //   connection: {
        //     connection_id: transaction.connection.connection_id,
        //     created_at: formatDate(transaction.connection.createdAt),
        //   },
        // }));
        const abc = await revenueRepository.find({
          where: {
            salon: { salon_id: salonId },
          },
          relations: ["user"],
        });
        const xyz = await Promise.all(
          abc.map(async (x) => ({
            amount: x.amount,
            user: {
              phone: x.user.user_id,
              name: x.user.fullname,
            },
            numOfCompletedTran: await calcTotalNumOfCompletedTran(
              x.user.user_id,
              salonId
            ),
          }))
        );
        const totals = xyz.reduce(
          (acc, curr) => {
            acc.totalAmount = Number(acc.totalAmount) + Number(curr.amount);
            acc.totalNumOfCompletedTran =
              Number(acc.totalNumOfCompletedTran) +
              Number(curr.numOfCompletedTran);
            return acc;
          },
          { totalAmount: 0, totalNumOfCompletedTran: 0 }
        );

        return res.status(200).json({
          status: "success",
          transaction: { data: xyz, totals },
        });
      } else {
        // transactionList = await transactionRepository.find({
        //   where: { user: { user_id: userId } },
        //   relations: ["salon", "connection", "process", "stage"],
        // });

        // formatTransactions = transactionList.map((transaction) => ({
        //   //...transaction,
        //   transaction_id: transaction.transaction_id,
        //   salon: {
        //     salon_id: transaction.salon.salon_id,
        //     name: transaction.salon.name,
        //   },
        //   //connection: {
        //   //  connection_id: transaction.connection.connection_id,
        //   //  created_at: formatDate(transaction.connection.createdAt),
        //   //},
        // }));
        const abc = await revenueRepository.find({
          where: {
            user: { user_id: userId },
          },
          relations: ["salon"],
        });
        const xyz = await Promise.all(
          abc.map(async (x) => ({
            amount: x.amount,
            salon: {
              salon_id: x.salon.salon_id,
              phone: x.salon.phoneNumber,
              name: x.salon.name,
            },
            numOfCompletedTran: await calcTotalNumOfCompletedTran(
              userId,
              x.salon.salon_id
            ),
          }))
        );
        const totals = xyz.reduce(
          (acc, curr) => {
            acc.totalAmount = Number(acc.totalAmount) + Number(curr.amount);
            acc.totalNumOfCompletedTran =
              Number(acc.totalNumOfCompletedTran) +
              Number(curr.numOfCompletedTran);
            return acc;
          },
          { totalAmount: 0, totalNumOfCompletedTran: 0 }
        );

        return res.status(200).json({
          status: "success",
          transaction: { data: xyz, totals },
        });
      }

      // search and pagination
      // if (q && checkSalon === true) {
      //   formatTransactions = await search({
      //     data: formatTransactions,
      //     q,
      //     fieldname: "user",
      //     fieldname2: "name",
      //   });
      //   if (formatTransactions.length === 0) {
      //     totalRevenue = 0;
      //     completedTran = 0;
      //   } else {
      //     revenue = await revenueRepository.find({
      //       where: {
      //         salon: { salon_id: salonId },
      //         user: { user_id: formatTransactions[0].user.user_id },
      //       },
      //       select: ["amount"],
      //     });

      //     totalRevenue = revenue.reduce(
      //       (accumulator: any, currentRevenue: any) =>
      //         Number(accumulator) + Number(currentRevenue.amount),
      //       0
      //     );
      //     completedTran = await getCompletedTransactionsCount(
      //       formatTransactions[0].user.user_id,
      //       salonId
      //     );
      //   }
      // } else if (q && checkSalon === false) {
      //   formatTransactions = await search({
      //     data: formatTransactions,
      //     q,
      //     fieldname: "salon",
      //     fieldname2: "name",
      //   });
      //   if (formatTransactions.length === 0) {
      //     totalRevenue = 0;
      //     completedTran = 0;
      //   } else {
      //     const revenue = await revenueRepository.find({
      //       where: {
      //         salon: { salon_id: formatTransactions[0].salon.salon_id },
      //         user: { user_id: userId },
      //       },
      //       select: ["amount"],
      //     });
      //     totalRevenue = revenue.reduce(
      //       (accumulator, currentRevenue) =>
      //         Number(accumulator) + Number(currentRevenue.amount),
      //       0
      //     );
      //     completedTran = await getCompletedTransactionsCount(
      //       userId,
      //       formatTransactions[0].salon.salon_id
      //     );
      //   }
      // } else if (!q && checkSalon === true) {
      //   const revenue = await revenueRepository.find({
      //     where: { salon: { salon_id: salonId } },
      //     select: ["amount"],
      //   });
      //   totalRevenue = revenue.reduce(
      //     (accumulator, currentRevenue) =>
      //       Number(accumulator) + Number(currentRevenue.amount),
      //     0
      //   );
      //   completedTran = await getCompletedTransactionsCount(undefined, salonId);
      // } else if (!q && checkSalon === false) {
      //   const revenue = await revenueRepository.find({
      //     where: { user: { user_id: userId } },
      //     select: ["amount"],
      //   });
      //   totalRevenue = revenue.reduce(
      //     (accumulator, currentRevenue) =>
      //       Number(accumulator) + Number(currentRevenue.amount),
      //     0
      //   );
      //   //completeTran = await getCompletedTransactionsCount(userId, undefined);
      //   const user = await userRepository.findOne({
      //     where: { user_id: userId },
      //   });
      //   if (user) completedTran = user?.completedTransactions;
      // }

      // const rs: any = await pagination({
      //   data: formatTransactions,
      //   page,
      //   per_page,
      // });

      // const result = {
      //   transaction: rs.data,
      //   revenue: totalRevenue,
      //   numOfCompletedTran: completedTran,
      // };

      // return res.status(200).json({
      //   status: "success",
      //   transaction: result,
      //   total_page: rs?.total_page,
      // });
    } catch (error) {
      console.log(error);
      return res
        .status(500)
        .json({ status: "failed", msg: "Internal server error" });
    }
  },
  updateTransaction: async (req: Request, res: Response) => {
    const transactionRepository = getRepository(Transaction);
    const { id } = req.params;
    const { checked, stageId } = req.body;

    try {
      let transaction = await transactionRepository.findOne({
        where: { transaction_id: id },
        relations: ["stage", "user", "salon"],
      });

      if (!transaction) {
        return res
          .status(404)
          .json({ status: "failed", msg: "Transaction not found" });
      }

      if (Array.isArray(checked)) {
        transaction.checked = checked;
      }

      if (stageId) transaction.stage.stage_id = stageId;

      transaction = await transactionRepository.save(transaction);
      const formatTransaction = {
        ...transaction,
        user: {
          user_id: transaction.user.user_id,
          name: transaction.user.fullname,
        },
        salon: {
          salon_id: transaction.salon.salon_id,
          name: transaction.salon.name,
          image: transaction.salon.image,
        },
      };
      // notification to user
      createNotification({
        to: formatTransaction.user.user_id,
        description: `${formatTransaction.salon.name} đã cập nhật chi tiết giai đoạn trong quy trình mua xe với bạn ✅`,
        types: "updateStage",
        data: formatTransaction.transaction_id,
        avatar: formatTransaction.salon.image,
        isUser: false,
      });

      return res.status(200).json({
        status: "success",
        msg: "Transaction updated successfully",
        transaction: formatTransaction,
      });
    } catch (error) {
      console.log(error);
      return res
        .status(500)
        .json({ status: "failed", msg: "Internal server error" });
    }
  },
  nextStage: async (req: Request, res: Response) => {
    const transactionRepository = getRepository(Transaction);
    const stageRepository = getRepository(Stage);
    const processRepository = getRepository(Process);
    const userRepository = getRepository(User);
    const revenueRepository = getRepository(Revenue);
    const { id } = req.params;
    const { commission, rating } = req.body;

    try {
      const transaction = await transactionRepository.findOne({
        where: { transaction_id: id },
        relations: ["stage", "process", "user", "salon"],
      });

      if (!transaction) {
        return res
          .status(404)
          .json({ status: "failed", msg: "Transaction not found" });
      }

      let stageList: any = [];
      const stageDetail = await processRepository.findOne({
        where: { id: transaction.process.id },
        relations: ["stages"],
      });
      stageDetail?.stages.map((stage) => {
        stageList.push(stage.stage_id);
      });

      let detailList: any = [];
      const detail = await stageRepository.findOne({
        where: { stage_id: transaction.stage.stage_id },
        relations: ["commissionDetails"],
      });
      detail?.commissionDetails.map((detail) => {
        detailList.push(detail.id);
      });

      //const details = JSON.stringify(detailList);
      //const checked = JSON.stringify(transaction.checked);

      if (isArraySubset(detailList, transaction.checked)) {
        const nextElement = getNextElement(
          stageList,
          transaction.stage.stage_id
        );

        if (commission) {
          transaction.commissionList.push(commission);
        } else {
          transaction.commissionList.push(0);
        }

        const revenue = await revenueRepository.findOne({
          where: {
            user: { user_id: transaction.user.user_id },
            salon: { salon_id: transaction.salon.salon_id },
          },
        });
        if (revenue) {
          if (commission) {
            revenue.amount = Number(revenue.amount) + Number(commission);
          }
          await revenueRepository.save(revenue);
        } else {
          const amount = commission || 0;

          const newRevenue = {
            salon: { salon_id: transaction.salon.salon_id },
            user: { user_id: transaction.user.user_id },
            amount: amount,
          };
          await revenueRepository.save(newRevenue);
        }

        if (rating) {
          transaction.ratingList.push(rating);
        } else {
          transaction.ratingList.push(-1);
        }

        if (nextElement !== null) {
          //transaction.checked = [];
          transaction.stage.stage_id = nextElement;
          await transactionRepository.save(transaction);

          // notification to user
          createNotification({
            to: transaction.user.user_id,
            description: `Quy trình bán xe của bạn với salon ${transaction.salon.name} đã được chuyển sang giai đoạn tiếp theo 🚀`,
            types: "updateStage",
            data: transaction.transaction_id,
            avatar: transaction.salon.image,
            isUser: false,
          });

          return res.status(200).json({
            status: "success",
            msg: "Next stage successfully",
          });
        } else {
          transaction.status = "success";
          await transactionRepository.save(transaction);

          // notification to user
          createNotification({
            to: transaction.user.user_id,
            description: `Quy trình bán xe của bạn với salon ${transaction.salon.name} đã hoàn tất 🎉✨`,
            types: "updateStage",
            data: transaction.transaction_id,
            avatar: transaction.salon.image,
            isUser: false,
          });

          const avgRating = calculateAverageRating(transaction.ratingList);
          console.log(avgRating);

          if (avgRating !== 0) {
            const user = await userRepository.findOne({
              where: { user_id: transaction.user.user_id },
            });
            if (user) {
              let savedAvgRating;
              if (user.avgRating === 0) {
                savedAvgRating = avgRating;
              } else {
                savedAvgRating = (avgRating + user.avgRating) / 2;
              }
              user.avgRating = savedAvgRating;
              user.completedTransactions += 1;
              await userRepository.save(user);
            }
          }

          return res.status(200).json({
            status: "completed",
            msg: "The process has been completed",
          });
        }
      } else {
        return res.status(400).json({
          status: "failed",
          msg: "Next stage failed",
        });
      }
    } catch (error) {
      console.log(error);
      return res
        .status(500)
        .json({ status: "failed", msg: "Internal server error" });
    }
  },
  // backStage: async (req: Request, res: Response) => {
  //   const { id } = req.params;
  //   const { stageId } = req.body;
  //   const transactionRepository = getRepository(Transaction);

  //   try {
  //     const transaction = await transactionRepository.update(id, {
  //       stage: { stage_id: stageId },
  //     });
  //     if (transaction.affected === 0) {
  //       return res
  //         .status(404)
  //         .json({ status: "failed", msg: `No transaction with id: ${id}` });
  //     }
  //     const result = await transactionRepository.findOne({
  //       where: { transaction_id: id },
  //       relations: ["user", "process", "stage"],
  //     });

  //     return res.status(200).json({
  //       status: "success",
  //       msg: "Update successfully!",
  //       transaction: result,
  //     });
  //   } catch (error) {
  //     return res
  //       .status(500)
  //       .json({ status: "failed", msg: "Internal server error" });
  //   }
  // },
  deleteTransaction: async (req: Request, res: Response) => {
    const { id } = req.params;
    const transactionRepository = getRepository(Transaction);
    try {
      const transaction = await transactionRepository.delete(id);
      if (transaction.affected === 0) {
        return res
          .status(404)
          .json({ status: "failed", msg: `No transaction with id: ${id}` });
      }

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
export default transactionController;
