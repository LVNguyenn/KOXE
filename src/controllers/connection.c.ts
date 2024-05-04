import { Request, Response } from "express";
import { getRepository } from "typeorm";
import { User } from "../entities/User";
import { Connection } from "../entities/Connection";
import moment from "moment";

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
    const { id } = req.params;

    try {
      const connection = await connectionRepository.findOne({
        where: { connection_id: id },
        relations: ["salon", "user"],
      });

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
    const userId: any = req.headers["userId"] || "";
    const user = await getRepository(User).findOne({
      where: [{ user_id: userId }],
      relations: ["salonId"],
    });
    const salonId = user?.salonId.salon_id;
    const { postId } = req.body;

    try {
      const newConnection = {
        user: { user_id: userId },
        salon: { salon_id: salonId },
        post: { post_id: postId },
        createdAt: moment().format("YYYY-MM-DDTHH:mm:ss"),
      };

      const savedConnection = await connectionRepository.save(newConnection);

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
      });

      return res.status(200).json({
        status: "success",
        msg: "Update successfully!",
        connection: result,
      });
    } catch (error) {
      return res
        .status(500)
        .json({ status: "failed", msg: "Internal server error" });
    }
  },
};
export default connectionController;
