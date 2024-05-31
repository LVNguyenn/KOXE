import { Request, Response } from "express";
import { getRepository } from "typeorm";
import { User } from "../entities/User";
import { Connection } from "../entities/Connection";
import { Salon } from "../entities/Salon";
import { Process } from "../entities/Process";
import { Stage } from "../entities/Stage";
import { Post } from "../entities/Post";
import createNotification from "../helper/createNotification";
import moment from "moment";
import { Transaction } from "../entities";
import { formatDate } from "../utils";
import search from "../helper/search";
import pagination from "../helper/pagination";

const connectionController = {
  getAllConnections: async (req: Request, res: Response) => {
    const { page, per_page, q }: any = req.query;
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
          createdAt: formatDate(connection.createdAt),
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

      // search and pagination
      // if (q) {
      //   formatConnection = await search({ data: formatConnection, q, fieldname: "name" })
      // }

      const rs = await pagination({ data: formatConnection, page, per_page });

      return res.status(200).json({
        status: "success",
        connections: rs?.data,
        total_page: rs?.total_page,
      });
    } catch (error) {
      return res
        .status(500)
        .json({ status: "failed", msg: "Internal server error" });
    }
  },
  getConnectionById: async (req: Request, res: Response) => {
    const connectionRepository = getRepository(Connection);
    const processRepository = getRepository(Process);
    const stageRepository = getRepository(Stage);
    const { id } = req.params;

    try {
      const connection = await connectionRepository.findOne({
        where: { connection_id: id },
        relations: ["salon", "user", "post", "process"],
      });

      const process = await processRepository.findOne({
        where: { id: connection?.process.id },
        relations: ["stages"],
      });

      let stageList = [];
      if (process) {
        process.stages.sort((a, b) => a.order - b.order);
        for (const stage of process?.stages) {
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
        process: {
          ...process,
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
    const postRepository = getRepository(Post);
    const userId: any = req.headers["userId"] || "";
    const user = await getRepository(User).findOne({
      where: [{ user_id: userId }],
      relations: ["salonId"],
    });
    const salonId = user?.salonId.salon_id;
    const { postId, processId } = req.body;

    try {
      const post = await postRepository.findOne({
        where: { post_id: postId },
        relations: ["postedBy"],
      });

      const checkConnection = await connectionRepository.findOne({
        where: {
          user: { user_id: post?.postedBy.user_id },
          salon: { salon_id: salonId },
          post: { post_id: postId },
        },
      });

      if (checkConnection) {
        return res.status(400).json({
          status: "failed",
          msg: "This connection already exists",
          connection: checkConnection.connection_id,
        });
      }

      const newConnection = {
        user: { user_id: post?.postedBy.user_id },
        salon: { salon_id: salonId },
        post: { post_id: postId },
        process: { id: processId },
        //createdAt: moment().format("YYYY-MM-DDTHH:mm:ss"),
      };

      const savedConnection = await connectionRepository.save(newConnection);

      const salon = await salonRepository.findOne({
        where: { salon_id: savedConnection.salon.salon_id },
        select: ["name", "image"],
      });

      createNotification({
        to: savedConnection.user.user_id,
        description: `${salon?.name} đã đồng ý yêu cầu kết nối của bạn. Xác nhận kết nối với salon ngay`,
        types: "connection",
        data: savedConnection.connection_id,
        avatar: salon?.image,
        isUser: false,
      });

      return res.status(201).json({
        status: "success",
        msg: "Create successfully!",
        connection: savedConnection,
      });
    } catch (error) {
      console.log(error);
      return res
        .status(500)
        .json({ status: "failed", msg: "Internal server error" });
    }
  },
  updateConnection: async (req: Request, res: Response) => {
    const { id } = req.params;
    const { status } = req.body;
    const connectionRepository = getRepository(Connection);
    const processRepository = getRepository(Process);

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
        relations: ["user", "salon", "process"],
      });

      const formatResult = {
        ...result,
        user: {
          user_id: result?.user.user_id,
          name: result?.user.fullname,
        },
        salon: {
          salon_id: result?.salon.salon_id,
          name: result?.salon.name,
        },
      };

      if (status === "accepted") {
        const process = await processRepository.findOne({
          where: { id: result?.process.id },
          relations: ["stages"],
        });

        if (process?.stages.length === 0) {
          return res
            .status(400)
            .json({ status: "failed", msg: "This process has no stages" });
        }

        process?.stages.sort((a, b) => a.order - b.order);

        const newTransaction = {
          user: { user_id: result?.user.user_id },
          salon: { salon_id: result?.salon.salon_id },
          connection: { connection_id: result?.connection_id },
          process: { id: result?.process.id },
          stage: { stage_id: process?.stages[0].stage_id },
          checked: [],
          commissionList: [],
          ratingList: [],
        };

        const transactionRepository = getRepository(Transaction);
        await transactionRepository.save(newTransaction);

        createNotification({
          to: result?.salon.salon_id,
          description: `${result?.user.fullname} đã chấp nhận yêu cầu kết nối của bạn`,
          types: "connection",
          data: result?.connection_id,
          avatar: result?.user.fullname,
          isUser: true,
        });
      } else if (status === "rejected") {
        createNotification({
          to: result?.salon.salon_id,
          description: `${result?.user.fullname} đã từ chối yêu cầu kết nối của bạn`,
          types: "connection",
          data: result?.connection_id,
          avatar: result?.user.fullname,
          isUser: true,
        });
      }
      return res.status(200).json({
        status: "success",
        msg: "Update successfully!",
        connection: formatResult,
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
