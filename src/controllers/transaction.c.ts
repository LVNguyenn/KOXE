import { Request, Response } from "express";
import { getRepository, In } from "typeorm";
import { Transaction } from "../entities/Transaction";
import { User } from "../entities/User";
import { Connection } from "../entities/Connection";

const transactionController = {
  getAllTransactions: async (req: Request, res: Response) => {
    const transactionRepository = getRepository(Transaction);
    const connectionRepository = getRepository(Connection);

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
      let connectionList;
      if (salonId !== "") {
        connectionList = await connectionRepository.find({
          where: { salon: { salon_id: salonId } },
          select: ["connection_id"],
        });
      } else {
        connectionList = await connectionRepository.find({
          where: { user: { user_id: userId } },
          select: ["connection_id"],
        });
      }

      const connectionIds = connectionList.map(
        (connection) => connection.connection_id
      );

      const transactions = await transactionRepository.find({
        where: { connection: { connection_id: In(connectionIds) } },
        relations: ["connection"],
      });

      return res.status(200).json({
        status: "success",
        transactions: transactions,
      });
    } catch (error) {
      return res
        .status(500)
        .json({ status: "failed", msg: "Internal server error" });
    }
  },
  getTransactionByConnectionId: async (req: Request, res: Response) => {
    const transactionRepository = getRepository(Transaction);
    const { id } = req.params;

    try {
      const transaction = await transactionRepository.find({
        where: { connection: { connection_id: id } },
      });

      if (!transaction) {
        return res.status(404).json({
          status: "failed",
          msg: `No transaction with connection id: ${id}`,
        });
      }

      return res.status(200).json({
        status: "success",
        transaction: transaction,
      });
    } catch (error) {
      return res
        .status(500)
        .json({ status: "failed", msg: "Internal server error" });
    }
  },
  createTransaction: async (req: Request, res: Response) => {
    const transactionRepository = getRepository(Transaction);
    const { connectionId } = req.body;

    try {
      const newTransaction1 = {
        connection: { connection_id: connectionId },
        stage: 1,
      };
      await transactionRepository.save(newTransaction1);

      const newTransaction2 = {
        connection: { connection_id: connectionId },
        stage: 2,
      };
      await transactionRepository.save(newTransaction2);

      return res.status(201).json({
        status: "success",
        msg: "Create successfully!",
      });
    } catch (error) {
      return res
        .status(500)
        .json({ status: "failed", msg: "Internal server error" });
    }
  },
  updateTransaction: async (req: Request, res: Response) => {
    const { connectionId, stage, status, commissionAmount } = req.body;
    const transactionRepository = getRepository(Transaction);
    const connectionRepository = getRepository(Connection);

    try {
      const connection = await connectionRepository.findOne({
        where: { connection_id: connectionId },
      });

      if (!connection) {
        return res
          .status(404)
          .json({ status: "failed", msg: "Connection not found" });
      }

      const transaction = await transactionRepository.findOne({
        where: { connection, stage },
      });

      if (!transaction) {
        return res
          .status(404)
          .json({ status: "failed", msg: "Transaction not found" });
      }

      if (status !== undefined) {
        transaction.status = status;
      }

      if (commissionAmount !== undefined) {
        transaction.commissionAmount = commissionAmount;
      }

      if (status === false) {
        connection.status = "failure";
        await connectionRepository.save(connection);
      }

      if (stage === 2 && status === true) {
        connection.status = "success";
        await connectionRepository.save(connection);
      }

      await transactionRepository.save(transaction);

      return res.status(200).json({
        status: "success",
        mgs: "Transaction updated successfully",
        transaction,
      });
    } catch (error) {
      console.log(error);
      return res
        .status(500)
        .json({ status: "failed", msg: "Internal server error" });
    }
  },
};
export default transactionController;
