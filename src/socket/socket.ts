import { Server, Socket } from "socket.io";
import http from "http";
import express from "express";

const app = express();

const server = http.createServer(app);
const io: any = new Server(server, {
  cors: {
    origin: ["http://localhost:3000", "https://fe-salon-oto.vercel.app"],
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  },
});

export const getReceiverSocketId = (receiverId: string) => {
  return userSocketMap[receiverId];
};

const userSocketMap: { [userId: string]: string } = {}; // {userId: socketId}

io.on("connection", (socket: Socket) => {
  console.log("a user connected", socket.id);

  const userId: string | undefined =
    typeof socket.handshake.query.userId === "string"
      ? socket.handshake.query.userId
      : undefined;
  const salonId: string | undefined =
    typeof socket.handshake.query.salonId === "string"
      ? socket.handshake.query.salonId
      : undefined;

  if (userId !== undefined) userSocketMap[userId] = socket.id;
  if (salonId !== undefined) userSocketMap[salonId] = socket.id;

  io.emit("getOnlineUsers", Object.keys(userSocketMap));

  socket.on("callVideo", (data: any) => {
    const receiverId = data.receiverId;
    const receiverSocketId = getReceiverSocketId(receiverId);
    if (receiverSocketId) {
      socket.to(receiverSocketId).emit("receiveCallVideo", data);
    }
  });

  socket.on("answerCallVideo", (data: any) => {
    const receiverId = data.receiverId;
    const receiverSocketId = getReceiverSocketId(receiverId);
    if (receiverSocketId) {
      socket.to(receiverSocketId).emit("receiveAnswerCallVideo", data);
    }
  });

  socket.on("refuseCallVideo", (data: any) => {
    const receiverId = data.receiverId;
    const receiverSocketId = getReceiverSocketId(receiverId);
    if (receiverSocketId) {
      socket.to(receiverSocketId).emit("receiveRefuseCallVideo", data);
    }
  });

  socket.on("endCallVideo", (data: any) => {
    const receiverId = data.receiverId;
    const receiverSocketId = getReceiverSocketId(receiverId);
    if (receiverSocketId) {
      socket.to(receiverSocketId).emit("receiveEndCallVideo");
    }
  });

  // socket.on() is used to listen to the events. Can be used both on client and server side
  socket.on("disconnect", () => {
    console.log("user disconnected", socket.id);

    if (userId !== undefined) delete userSocketMap[userId];
    if (salonId !== undefined) delete userSocketMap[salonId];

    io.emit("getOnlineUsers", Object.keys(userSocketMap));
  });
});

export { app, io, server };
