import { Request, Response } from "express";
import { getRepository, In } from "typeorm";
import { Transaction } from "../entities/Transaction";
import { User } from "../entities/User";
import { Connection } from "../entities/Connection";
import { Process } from "../entities/Process";
import { Stage } from "../entities/Stage";
import { getUserInfo } from "../helper/mInvoice";
import { getNextElement, isArraySubset } from "../utils/index";
import { formatDate } from "../utils";

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
          fullname: transaction.user.fullname,
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
    const userId: any = req.headers["userId"] || "";

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
      let formatTransactions;
      if (salonId !== "") {
        transactionList = await transactionRepository.find({
          where: { salon: { salon_id: salonId } },
          relations: ["user", "connection", "process"],
        });

        formatTransactions = transactionList.map((transaction) => ({
          ...transaction,
          user: {
            user_id: transaction.user.user_id,
            name: transaction.user.fullname,
          },
          connection: {
            connection_id: transaction.connection.connection_id,
            created_at: formatDate(transaction.connection.createdAt),
          },
        }));
      } else {
        transactionList = await transactionRepository.find({
          where: { user: { user_id: userId } },
          relations: ["salon", "connection", "process"],
        });

        formatTransactions = transactionList.map((transaction) => ({
          ...transaction,
          salon: {
            salon_id: transaction.salon.salon_id,
            name: transaction.salon.name,
          },
          connection: {
            connection_id: transaction.connection.connection_id,
            created_at: transaction.connection.createdAt,
          },
        }));
      }

      // if (!transactionList) {
      //   return res.status(404).json({
      //     status: "failed",
      //     msg: `No transaction with salonId: ${salonId}`,
      //   });
      // }

      return res.status(200).json({
        status: "success",
        transaction: formatTransactions,
      });
    } catch (error) {
      return res
        .status(500)
        .json({ status: "failed", msg: "Internal server error" });
    }
  },
  updateTransaction: async (req: Request, res: Response) => {
    const transactionRepository = getRepository(Transaction);
    const { id } = req.params;
    const { checked } = req.body;

    try {
      const transaction = await transactionRepository.findOne({
        where: { transaction_id: id },
      });

      if (!transaction) {
        return res
          .status(404)
          .json({ status: "failed", msg: "Transaction not found" });
      }

      if (Array.isArray(checked) && checked.length > 0) {
        transaction.checked = checked;
      }

      await transactionRepository.save(transaction);

      return res.status(200).json({
        status: "success",
        msg: "Transaction updated successfully",
        transaction,
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
    const { id } = req.params;
    const { commission } = req.body;

    try {
      const transaction = await transactionRepository.findOne({
        where: { transaction_id: id },
        relations: ["stage", "process"],
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
          transaction.commissionAmount.push(commission);
        } else {
          transaction.commissionAmount.push(0);
        }

        if (nextElement !== null) {
          //transaction.checked = [];
          transaction.stage.stage_id = nextElement;
          await transactionRepository.save(transaction);
          return res.status(200).json({
            status: "success",
            msg: "Next stage successfully",
          });
        } else {
          transaction.status = "success";
          await transactionRepository.save(transaction);
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
  backStage: async (req: Request, res: Response) => {
    const { id } = req.params;
    const { stageId } = req.body;
    const transactionRepository = getRepository(Transaction);

    try {
      const transaction = await transactionRepository.update(id, {
        stage: { stage_id: stageId },
      });
      if (transaction.affected === 0) {
        return res
          .status(404)
          .json({ status: "failed", msg: `No transaction with id: ${id}` });
      }
      const result = await transactionRepository.findOne({
        where: { transaction_id: id },
        relations: ["user", "process", "stage"],
      });

      return res.status(200).json({
        status: "success",
        msg: "Update successfully!",
        transaction: result,
      });
    } catch (error) {
      return res
        .status(500)
        .json({ status: "failed", msg: "Internal server error" });
    }
  },
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
