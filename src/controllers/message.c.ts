import moment from "moment";
import { getRepository } from "typeorm";
import { Request, Response } from "express";
import { Message } from "../entities/Message";
import { User } from "../entities/User";
import { Salon } from "../entities/Salon";
import { Conversation } from "../entities/Conversation";
import { getReceiverSocketId, io } from "../socket/socket";
import { getUserInfo } from "../helper/mInvoice";
const cloudinary = require("cloudinary").v2;
import search from "../helper/search";

interface MulterFile {
  path: string;
  filename: string;
}

interface MulterFileRequest extends Request {
  files?: MulterFile[];
}

const messageController = {
  getChattingUsers: async (req: Request, res: Response) => {
    try {
      let userId: any = req.headers["userId"] || "";
      const salon = await getRepository(Salon).findOne({
        where: { user_id: userId },
      });

      const conversations = await getRepository(Conversation)
        .createQueryBuilder("conversation")
        .where("conversation.participants LIKE :userId", {
          userId: `%${userId}%`,
        })
        .orWhere("conversation.participants LIKE :salonId", {
          salonId: `%${salon?.salon_id}%`,
        })
        .getMany();

      if (conversations.length === 0) return res.status(200).json([]);

      const chattingUsers: string[] = [];
      const messageList: Message[] = [];

      async function processConversations(conversations: any) {
        for (const conversation of conversations) {
          for (const participant of conversation.participants) {
            if (
              participant !== userId &&
              participant !== salon?.salon_id &&
              !chattingUsers.includes(participant)
            ) {
              chattingUsers.push(participant);
              const lastIdMessage =
                conversation.messages[conversation.messages.length - 1];
              const message = await getRepository(Message).findOne({
                where: { message_id: lastIdMessage },
              });
              if (message !== null) messageList.push(message);
            }
          }
        }
      }
      await processConversations(conversations);

      const userDetails = await getRepository(User)
        .createQueryBuilder("user")
        .select([
          "user_id AS id ",
          "fullname AS name",
          "CASE WHEN username IS NOT NULL THEN username ELSE '' END AS username",
          "avatar AS image",
        ])
        .where("user_id IN (:...userIds)", { userIds: chattingUsers })
        .getRawMany();

      const salonDetails = await getRepository(Salon)
        .createQueryBuilder("salon")
        .select(["salon_id AS id", "name", "image"])
        .where("salon_id IN (:...salonIds)", { salonIds: chattingUsers })
        .getRawMany();

      async function processMessages(details: any) {
        for (const detail of details) {
          for (const message of messageList) {
            if (
              detail.id === message.senderId ||
              detail.id === message.receiverId
            ) {
              const conversation = await getRepository(Conversation)
                .createQueryBuilder("conversation")
                .where("conversation.messages LIKE :messageId", {
                  messageId: `%${message.message_id}%`,
                })
                .getOne();
              detail.message = {
                sender: detail.id === message.receiverId ? "Bạn" : "",
                message:
                  message.message === ""
                    ? detail.id === message.receiverId
                      ? "Bạn đã gửi 1 ảnh"
                      : `${detail.name} đã gửi 1 ảnh`
                    : message.message,

                //time: extractTime(message.createdAt),
                time: moment(message.createdAt).format("DD-MM-YYYY HH:mm:ss"),
                conversation_status: conversation?.status,
              };
              break;
            }
          }
        }
      }

      await processMessages(userDetails);
      await processMessages(salonDetails);

      const chattingUsersAndSalons = userDetails.concat(salonDetails);

      res.status(200).json({
        status: "success",
        chattingUsers: chattingUsersAndSalons,
      });
    } catch (error: any) {
      console.log(error);
      return res
        .status(500)
        .json({ status: "failed", msg: "Internal Server Error" });
    }
  },
  getMessages: async (req: Request, res: Response) => {
    try {
      const userToChatId: string = req.params.id;
      const userId: any = req.headers["userId"] || "";
      const salon = await getRepository(Salon).findOne({
        where: { user_id: userId },
      });
      const salonReceive = await getRepository(Salon).findOne({
        where: { salon_id: userToChatId },
      });

      let participants: string[];

      if (salon?.salon_id !== undefined) {
        if (salonReceive === null) {
          participants = [salon.salon_id, userToChatId];
        } else {
          participants = [userId, userToChatId];
        }
      } else {
        participants = [userId, userToChatId];
      }

      const conversation = await getRepository(Conversation)
        .createQueryBuilder("conversation")
        .where("conversation.participants LIKE :participants", {
          participants: `%${participants.join(",")}%`,
        })
        .orWhere("conversation.participants LIKE :participants_reverse", {
          participants_reverse: `%${participants.reverse().join(",")}%`,
        })
        .getOne();

      if (!conversation) return res.status(200).json([]);

      // Read
      conversation.status = true;
      const conversationRepository = getRepository(Conversation);
      await conversationRepository.save(conversation);

      const messageIds = conversation.messages;

      const messages = await getRepository(Message)
        .createQueryBuilder("message")
        .where("message.message_id IN (:...messageIds)", { messageIds })
        .getMany();

      const formattedMessages = messages.map((message) => {
        return {
          ...message,
          createdAt: moment(message.createdAt).format("DD-MM-YYYY HH:mm:ss"),
          updatedAt: moment(message.updatedAt).format("DD-MM-YYYY HH:mm:ss"),
        };
      });

      //const messageContents = messages.map(message => message.message);

      res.status(200).json({
        status: "success",
        messages: formattedMessages,
      });
    } catch (error: any) {
      console.log(error.message);
      return res
        .status(500)
        .json({ status: "failed", msg: "Internal Server Error" });
    }
  },
  sendMessage: async (req: Request | MulterFileRequest, res: Response) => {
    let senderId: any = req.headers["userId"] || "";
    const receiverId: string = req.params.id;
    const { message } = req.body;
    let image = [""],
      filename = [""];

    try {
      const salon = await getRepository(Salon).findOne({
        where: { user_id: senderId },
      });
      const salonReceive = await getRepository(Salon).findOne({
        where: { salon_id: receiverId },
      });

      let participants: string[];

      if (salon?.salon_id !== undefined) {
        if (salonReceive === null) {
          senderId = salon?.salon_id;
          participants = [salon.salon_id, receiverId];
        } else {
          participants = [senderId, receiverId];
        }
      } else {
        participants = [senderId, receiverId];
      }

      let conversation = await getRepository(Conversation)
        .createQueryBuilder("conversation")
        .where("conversation.participants LIKE :participants", {
          participants: `%${participants.join(",")}%`,
        })
        .orWhere("conversation.participants LIKE :participants_reverse", {
          participants_reverse: `%${participants.reverse().join(",")}%`,
        })
        .getOne();

      if (!conversation) {
        // Create new conversation if not exist
        const conversationRepository = getRepository(Conversation);
        conversation = await conversationRepository.save({
          participants: participants,
          messages: [],
          //createdAt: moment().format("YYYY-MM-DDTHH:mm:ss"),
          //updatedAt: moment().format("YYYY-MM-DDTHH:mm:ss"),
        });
      }

      // Upload image to cloudinary
      if ("files" in req && req.files) {
        const arrayImages = req.files;
        image = arrayImages.map((obj) => obj.path);
        filename = arrayImages.map((obj) => obj.filename);
      }

      // Create new message
      const messageRepository = getRepository(Message);
      const savedMessage = await messageRepository.save({
        senderId: senderId,
        receiverId: receiverId,
        message: message || "",
        image: image,
        //createdAt: moment().format("YYYY-MM-DDTHH:mm:ss"),
        //updatedAt: moment().format("YYYY-MM-DDTHH:mm:ss"),
      });

      // Add message to conversation
      conversation.messages.push(savedMessage.message_id);
      // Unread
      conversation.status = false;

      const conversationRepository = getRepository(Conversation);
      await conversationRepository.save(conversation);

      // SOCKET IO FUNCTIONALITY WILL GO HERE
      const receiverSocketId = getReceiverSocketId(receiverId);
      if (receiverSocketId) {
        // io.to(<socket_id>).emit() used to send events to specific client
        io.to(receiverSocketId).emit("newMessage", savedMessage);
      }

      return res.status(201).json({
        status: "success",
        message: savedMessage,
      });
    } catch (error) {
      if (filename.length !== 0) {
        filename.forEach(async (url) => {
          cloudinary.uploader.destroy(url);
        });
      }
      return res
        .status(500)
        .json({ status: "failed", msg: "Internal Server Error" });
    }
  },
  searchChattingUsers: async (req: Request, res: Response) => {
    const { q }: any = req.query;
    const userId: any = req.headers["userId"] || "";
    const userRepository = getRepository(User);
    let results;
    const user = await getUserInfo(userId);
    if (user?.salonId) {
      const salonId = user.salonId.salon_id;
      const messageRepository = getRepository(Message);
      results = await messageRepository
        .createQueryBuilder("message")
        .select("DISTINCT(message.senderId)", "userId")
        .where("message.receiverId = :salonId", { salonId })
        .getRawMany();
      results = await Promise.all(
        results.map(async (result) => {
          const user = await userRepository.findOne({
            where: {
              user_id: result.userId,
            },
          });
          return {
            user_id: user?.user_id,
            name: user?.fullname,
          };
        })
      );
      if (q) {
        results = await search({ data: results, q, fieldname: "name" });
      }
    } else {
      const salonRepository = getRepository(Salon);
      results = await salonRepository
        .createQueryBuilder("salon")
        .select(["salon.salon_id", "salon.name"])
        .where("salon.name LIKE :q", { q: `%${q}%` })
        .getMany();
    }

    return res.json(results);
  },
};

export default messageController;
