import { Request, Response } from "express";
import { getRepository } from "typeorm";
import { User } from "../entities/User";
import { Connection } from "../entities/Connection";
import { Salon } from "../entities/Salon";
import { Procedure } from "../entities/Procedure";
import { Stage } from "../entities/Stage";
import createNotification from "../helper/createNotification";
import moment from "moment";
import { Transaction } from "../entities";

const connectionController = {
  getAllConnections: async (req: Request, res: Response) => {
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
      let connections;
      let formatConnection;
      if (salonId !== "") {
        connections = await connectionRepository.find({
          where: { salon: { salon_id: salonId } },
          relations: ["user", "post"],
        });
        formatConnection = connections.map((connection) => ({
          ...connection,
          post: {
            postId: connection.post.post_id,
          },
          user: {
            userId: connection.user.user_id,
            fullname: connection.user.fullname,
            avatar: connection.user.avatar,
          },
        }));
      } else {
        connections = await connectionRepository.find({
          where: { user: { user_id: userId } },
          relations: ["salon", "post"],
        });
        formatConnection = connections.map((connection) => ({
          ...connection,
          post: {
            postId: connection.post.post_id,
          },
          salon: {
            salon_id: connection.salon.salon_id,
            name: connection.salon.name,
          },
        }));
      }

      return res.status(200).json({
        status: "success",
        connections: formatConnection,
      });
    } catch (error) {
      return res
        .status(500)
        .json({ status: "failed", msg: "Internal server error" });
    }
  },
  getConnectionById: async (req: Request, res: Response) => {
    const connectionRepository = getRepository(Connection);
    const procedureRepository = getRepository(Procedure);
    const stageRepository = getRepository(Stage);
    const { id } = req.params;

    try {
      const connection = await connectionRepository.findOne({
        where: { connection_id: id },
        relations: ["salon", "user", "post", "procedure"],
      });

      const procedure = await procedureRepository.findOne({
        where: { procedure_id: connection?.procedure.procedure_id },
        relations: ["stages"],
      });

      let stageList = [];
      if (procedure) {
        for (const stage of procedure?.stages) {
          const detail = await stageRepository.findOne({
            where: { stage_id: stage.stage_id },
            relations: ["commissionDetails"],
          });
          stageList.push(detail);
        }
      }

      if (!connection) {
        return res
          .status(404)
          .json({ status: "failed", msg: `No connection with id: ${id}` });
      }

      const formatConnection = {
        ...connection,
        salon: {
          salonId: connection?.salon.salon_id,
          name: connection?.salon.name,
        },
        user: {
          userId: connection?.user.user_id,
          fullname: connection?.user.fullname,
          avatar: connection?.user.avatar,
        },
        procedure: {
          ...procedure,
          stages: stageList,
        },
      };

      return res.status(200).json({
        status: "success",
        connection: formatConnection,
      });
    } catch (error) {
      return res
        .status(500)
        .json({ status: "failed", msg: "Internal server error" });
    }
  },
  createConnection: async (req: Request, res: Response) => {
    const connectionRepository = getRepository(Connection);
    const salonRepository = getRepository(Salon);
    const userId: any = req.headers["userId"] || "";
    const user = await getRepository(User).findOne({
      where: [{ user_id: userId }],
      relations: ["salonId"],
    });
    const salonId = user?.salonId.salon_id;
    const { postId, procedureId } = req.body;

    try {
      const newConnection = {
        user: { user_id: userId },
        salon: { salon_id: salonId },
        post: { post_id: postId },
        procedure: { procedure_id: procedureId },
        createdAt: moment().format("YYYY-MM-DDTHH:mm:ss"),
      };

      const savedConnection = await connectionRepository.save(newConnection);

      const salon = await salonRepository.findOne({
        where: { salon_id: savedConnection.salon.salon_id },
        select: ["name"],
      });

      createNotification({
        to: savedConnection.user.user_id,
        description: `${salon?.name} đã đồng ý yêu cầu kết nối của bạn. Click vào đây để cập nhật lại trạng thái`,
        types: "request",
        data: savedConnection.connection_id,
        avatar: savedConnection.salon.image,
        isUser: false,
      });

      return res.status(201).json({
        status: "success",
        msg: "Create successfully!",
        connection: savedConnection,
      });
    } catch (error) {
      return res
        .status(500)
        .json({ status: "failed", msg: "Internal server error" });
    }
  },
  updateConnection: async (req: Request, res: Response) => {
    const { id } = req.params;
    const { status } = req.body;
    const connectionRepository = getRepository(Connection);
    const procedureRepository = getRepository(Procedure);

    try {
      const connection = await connectionRepository.update(id, {
        status,
      });
      if (connection.affected === 0) {
        return res
          .status(404)
          .json({ status: "failed", msg: `No connection with id: ${id}` });
      }
      const result = await connectionRepository.findOne({
        where: { connection_id: id },
        relations: ["user", "salon", "procedure"],
      });

      if (status === "accepted") {
        createNotification({
          to: result?.salon.salon_id,
          description: `${result?.user.fullname} đã chấp nhận yêu cầu kết nối của bạn`,
          types: "request",
          data: result?.connection_id,
          avatar: result?.user.fullname,
          isUser: true,
        });

        const process = await procedureRepository.findOne({
          where: { procedure_id: result?.procedure.procedure_id },
          relations: ["stages"],
        });

        const newTransaction = {
          user: { user_id: result?.user.user_id },
          salon: { salon_id: result?.salon.salon_id },
          connection: { connection_id: result?.connection_id },
          procedure: { procedure_id: result?.procedure.procedure_id },
          stage: { stage_id: process?.stages[0].stage_id },
          checked: [],
          commissionAmount: [],
        };

        const transactionRepository = getRepository(Transaction);
        await transactionRepository.save(newTransaction);
      } else if (status === "rejected") {
        createNotification({
          to: result?.salon.salon_id,
          description: `${result?.user.fullname} đã từ chối yêu cầu kết nối của bạn`,
          types: "request",
          data: result?.connection_id,
          avatar: result?.user.fullname,
          isUser: true,
        });
      }
      return res.status(200).json({
        status: "success",
        msg: "Update successfully!",
        connection: result,
      });
    } catch (error) {
      console.log(error);
      return res
        .status(500)
        .json({ status: "failed", msg: "Internal server error" });
    }
  },
};
export default connectionController;
