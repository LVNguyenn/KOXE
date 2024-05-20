import { Request, Response } from "express";
import { Car, User, Salon } from "../entities";
import { getRepository } from "typeorm";
const cloudinary = require("cloudinary").v2;
import jwt from "jsonwebtoken";
import { getFileName } from "../utils/index";
import { newLogs } from "../helper/createLogs";
import { sendMail } from "../config/nodemailer";
import createNotification from "../helper/createNotification";
import parsePermission from "../helper/parsePermission";
import authController from "./auth.c";
import UserRepository from "../repository/user";
// import Cache from "../config/node-cache";

const { v4: uuidv4 } = require("uuid");

interface MulterFileRequest extends Request {
  files: {
    [fieldname: string]: { path: string; filename: string }[];
  };
}

const salonController = {
  getAllSalons: async (req: Request, res: Response) => {
    // get value cache
    // const valueCache = Cache.get("salon");
    // if (valueCache) {
    //   return res.status(200).json({
    //     status: "success",
    //     salons: valueCache,
    //   });
    // }
    const salonRepository = getRepository(Salon);
    try {
      const salons = await salonRepository.find({});

      // const salons = await salonRepository.find({
      //     select: [
      //         "salon_id",
      //         "name",
      //         "image",
      //         "address",
      //     ]
      // });
      const saveSalon = {
        salons,
        nbHits: salons.length,
      };
      // Cache.set("salon", saveSalon);

      return res.status(200).json({
        status: "success",
        salons: saveSalon,
      });
    } catch (error) {
      return res
        .status(500)
        .json({ status: "failed", msg: "Internal server error" });
    }
  },
  getAllSalonsNoBlock: async (req: Request, res: Response) => {
    const userId: any = req.headers["userId"] || "";
    const salonRepository = getRepository(Salon);
    try {
      const salons = await salonRepository
        .createQueryBuilder("salon")
        .leftJoinAndSelect("salon.user", "user")
        .where(
          `'${userId}' NOT IN (salon.blockUsers) OR salon.blockUsers IS NULL`
        )
        .getMany();

      const formattedSalons = salons.map((salon) => ({
        salon_id: salon.salon_id,
        name: salon.name,
      }));

      return res.status(200).json({
        status: "success",
        salons: formattedSalons,
      });
    } catch (error) {
      console.log(error);
      return res
        .status(500)
        .json({ status: "failed", msg: "Internal server error" });
    }
  },
  getSalonIdForUser: async (req: Request, res: Response) => {
    try {
      const user_id: any = req.headers["userId"] || "";

      const salon = await getRepository(Salon).findOne({
        where: {
          user_id: user_id,
        },
      });

      if (!salon) {
        return res.status(200).json({
          status: "success",
          salonId: null,
          msg: "Salon not found for the given userId",
        });
      }

      return res
        .status(200)
        .json({ status: "success", salonId: salon.salon_id });
    } catch (error) {
      return res
        .status(500)
        .json({ status: "failed", msg: "Internal Server Error" });
    }
  },
  getSalonByUserId: async (req: Request, res: Response) => {
    const salonRepository = getRepository(Salon);
    const user_id: any = req.headers["userId"] || "";

    try {
      const salon = await salonRepository.findOne({
        where: [{ user_id: user_id }, { employees: { user_id: user_id } }],
        relations: ["cars"],
      });

      if (!salon) {
        return res.status(200).json({
          status: "failed",
          msg: `No salon found for user with id: ${user_id}`,
        });
      }
      return res.status(200).json({
        status: "success",
        salon: salon,
      });
    } catch (error) {
      return res
        .status(500)
        .json({ status: "failed", msg: "Internal server error" });
    }
  },
  getAllUsersBlocked: async (req: Request, res: Response) => {
    const userId: any = req.headers["userId"] || "";
    const userRepository = getRepository(User);
    const salonRepository = getRepository(Salon);
    let result = [];
    try {
      const salon = await salonRepository.findOne({
        where: [{ user_id: userId }],
        select: ["blockUsers"],
      });

      if (salon?.blockUsers) {
        for (const userId of salon.blockUsers) {
          const user = await userRepository.findOne({
            where: [{ user_id: userId }],
            select: ["user_id", "fullname"],
          });
          if (user) result.push(user);
        }
      } else {
        result = [];
      }

      return res.status(200).json({
        status: "success",
        blockedUsers: result,
      });
    } catch (error) {
      console.log(error);
      return res
        .status(500)
        .json({ status: "failed", msg: "Internal server error" });
    }
  },
  getSalonById: async (req: Request, res: Response) => {
    const salonRepository = getRepository(Salon);
    const { id } = req.params;

    // get value from cache
    // const valueCache = Cache.get(id+"salon");

    // if (valueCache) {
    //   return res.status(200).json({
    //     status: "success",
    //     salon: valueCache,
    //   });
    // }

    try {
      const salon = await salonRepository.findOne({
        where: {
          salon_id: id,
        },
        relations: ["cars"],
      });

      if (!salon) {
        return res
          .status(404)
          .json({ status: "failed", msg: `No salon with id: ${id}` });
      }
      // Cache.set(id+"salon", salon);

      return res.status(200).json({
        status: "success",
        salon: salon,
      });
    } catch (error) {
      return res
        .status(500)
        .json({ status: "failed", msg: "Internal server error" });
    }
  },
  createSalon: async (req: Request | MulterFileRequest, res: Response) => {
    const salonRepository = getRepository(Salon);
    const {
      name,
      address,
      email,
      phoneNumber,
      introductionHtml,
      introductionMarkdown,
    } = req.body;
    const user_id: any = req.headers["userId"] || "";

    let image = "",
      filenameImage = "";
    let banner = [""],
      filenameBanner = [""];

    if ("files" in req && req.files) {
      if (req.files["image"] && req.files["image"][0]) {
        const imageData = req.files["image"][0];
        image = imageData.path;
        filenameImage = imageData.filename;
      }

      if (req.files["banner"]) {
        const arrayImagesBanner = req.files["banner"];
        banner = arrayImagesBanner.map((obj) => obj.path);
        filenameBanner = arrayImagesBanner.map((obj) => obj.filename);
      }
    }

    try {
      const newSalon = {
        name,
        address,
        image,
        email,
        phoneNumber,
        banner,
        introductionHtml,
        introductionMarkdown,
        user_id,
      };
      // console.log(newSalon);
      const savedSalon = await salonRepository.save(newSalon);

      // Fix by CDQ - 050424 - Add perrmission admin salon.
      // set owner permission for the user.
      const userRepository = getRepository(User);
      let userDb = await userRepository.findOneOrFail({
        where: { user_id: user_id },
      });
      userDb.permissions = ["OWNER"];
      userDb.salonId = savedSalon;
      await userRepository.save(userDb);
      // end fix by CDQ.
      // Init new logs for this salon.
      newLogs(savedSalon.salon_id);
      // Cache.del("salon");

      res.status(201).json({
        tatus: "success",
        msg: "Create successfully!",
        salon: savedSalon,
      });
    } catch (error) {
      console.log(error);
      if (filenameImage !== "") {
        cloudinary.uploader.destroy(filenameImage);
      }
      if (filenameBanner.length !== 0) {
        filenameBanner.forEach(async (url) => {
          cloudinary.uploader.destroy(url);
        });
      }
      return res
        .status(500)
        .json({ status: "failed", msg: "Internal server error" });
    }
  },
  updateSalon: async (req: Request | MulterFileRequest, res: Response) => {
    const { id } = req.params;
    const {
      name,
      address,
      email,
      phoneNumber,
      introductionHtml,
      introductionMarkdown,
    } = req.body;
    const salonRepository = getRepository(Salon);

    let image = "",
      filenameImage = "";
    let banner = null,
      filenameBanner = null;
    if ("files" in req && req.files) {
      if (req.files["image"] && req.files["image"][0]) {
        const imageData = req.files["image"][0];
        image = imageData.path;
        filenameImage = imageData.filename;
      }

      if (req.files["banner"]) {
        const arrayImagesBanner = req.files["banner"];
        banner = arrayImagesBanner.map((obj) => obj.path);
        filenameBanner = arrayImagesBanner.map((obj) => obj.filename);
      }
    }

    let newSalon: any = {
      name,
      address,
      email,
      phoneNumber,
      introductionHtml,
      introductionMarkdown,
    };
    if (image !== "") newSalon.image = image;
    if (Array.isArray(banner) && banner.length > 0) newSalon.banner = banner;
    const { salon_id, user_id, ...other } = newSalon;

    const oldSalon = await salonRepository.findOne({
      where: {
        salon_id: id,
      },
    });

    if (!oldSalon) {
      if (filenameImage !== "") {
        cloudinary.uploader.destroy(filenameImage);
      }
      if (filenameBanner && filenameBanner.length !== 0) {
        filenameBanner.forEach(async (url) => {
          cloudinary.uploader.destroy(url);
        });
      }
      return res
        .status(404)
        .json({ status: "failed", msg: `No salon with id: ${id}` });
    }

    if (image !== "" && oldSalon.image) {
      cloudinary.uploader.destroy(getFileName(oldSalon.image));
    }

    if (
      banner &&
      banner.length !== 0 &&
      Array.isArray(oldSalon.banner) &&
      oldSalon.banner.length > 0
    ) {
      oldSalon.banner.forEach((banner) => {
        cloudinary.uploader.destroy(getFileName(banner));
      });
    }

    try {
      const saveSalon = { ...oldSalon, ...other };
      const salon = await salonRepository.save(saveSalon);
      // Cache.del(["salon", id+"salon"]);

      return res.status(200).json({
        status: "success",
        msg: "Update successfully!",
        salon: salon,
      });
    } catch (error) {
      if (filenameImage !== "") {
        cloudinary.uploader.destroy(filenameImage);
      }
      if (filenameBanner && filenameBanner.length !== 0) {
        filenameBanner.forEach(async (url) => {
          cloudinary.uploader.destroy(url);
        });
      }
      return res
        .status(500)
        .json({ status: "failed", msg: "Internal server error" });
    }
  },
  deleteSalon: async (req: Request, res: Response) => {
    const { id } = req.params;
    const salonRepository = getRepository(Salon);
    const carRepository = getRepository(Car);

    try {
      const salon = await salonRepository.findOne({
        where: {
          salon_id: id,
        },
      });

      if (!salon) {
        return res
          .status(404)
          .json({ status: "failed", msg: `No salon with id: ${id}` });
      }

      if (salon.image) {
        cloudinary.uploader.destroy(getFileName(salon.image));
      }

      if (Array.isArray(salon.banner) && salon.banner.length > 0) {
        salon.banner.forEach((banner) => {
          cloudinary.uploader.destroy(getFileName(banner));
        });
      }

      // Xóa các car tham chiếu đến salon
      await carRepository.delete({ salon: salon });
      await salonRepository.delete(id);
      // Cache.del(["salon", id+"salon"]);

      return res.status(200).json({
        status: "success",
        msg: "Delete successfully!",
      });
    } catch (error) {
      return res
        .status(500)
        .json({ status: "failed", msg: "Internal server error" });
    }
  },

  verifyInviteFromNotification: async (req: Request, res: Response) => {
    const { token } = req.body;
    const userId: any = req.headers["userId"];
    let salonId = "";

    if (!token) {
      return res.json({
        status: "failed",
        msg: "Token is invalid.",
      });
    }

    jwt.verify(
      token,
      process.env.JWT_SECRETKEY_MAIL || "jwt_key_mail",
      async (err: any, decoded: any) => {
        if (err) {
          return res.json({
            status: "failed",
            msg: "error token.",
          });
        }

        salonId = decoded.salonId;
      }
    );

    try {
      // join salon.
      const salonRepository = getRepository(Salon);
      let salonDb: Salon | undefined = await salonRepository.findOneOrFail({
        where: { salon_id: salonId },
        relations: ["employees"],
      });

      const userRepository = getRepository(User);
      let userDb: any = await userRepository.findOneOrFail({
        where: { user_id: userId },
      });
      userDb.password = ""; // error is delete here - CDQ.

      salonDb?.employees.push(userDb);
      await salonRepository.save(salonDb);

      // notification to salon
      createNotification({
        to: salonId,
        description: `${userDb.fullname} has accepted your invitation to your salon.`,
        types: "invite",
        avatar: userDb.avatar,
        isUser: true,
      });

      return res.json({
        status: "success",
        msg: "join salon successfully!",
      });
    } catch (error) {
      console.log(error);
      return res.json({
        status: "failed",
        msg: "error with join salon.",
      });
    }
  },

  getEmployees: async (req: Request, res: Response) => {
    const { salonId, userId } = req.body;
    const salonRepository = getRepository(Salon);

    try {
      let salonDb: any = await salonRepository.findOne({
        select: ["salon_id", "name"],
        where: { salon_id: salonId },
        relations: ["employees"],
      });

      for (let i in salonDb.employees) {
        let per = salonDb.employees[i].permissions;
        salonDb.employees[i].permissions = per && (await parsePermission(per));
      }

      return res.json({
        status: "success",
        salonDb: salonDb,
      });
    } catch (error) {
      console.log(error);
      return res.json({
        status: "failed",
        msg: "error find salon.",
      });
    }
  },

  handlePermission: async (req: Request, res: Response) => {
    const { permission, userId } = req.body;
    const userRepository = getRepository(User);
    try {
      let userDb: User = await userRepository.findOneOrFail({
        where: { user_id: userId },
      });

      await userRepository.save({ ...userDb, permissions: permission });

      // notification to user
      const fromUser = await userRepository.findOneOrFail({
        where: { user_id: req.user as string },
      });

      createNotification({
        to: userDb.user_id,
        description: `Chủ salon đã thay đổi quyền của bạn.`,
        types: "permission",
        avatar: fromUser.avatar,
        isUser: false,
      });

      return res.json({
        status: "success",
        msg: "add permission successfully!",
        permissions: await parsePermission(userDb.permissions),
      });
    } catch (error) {
      console.log(error);
      return res.json({
        status: "failed",
        msg: "error with add permission.",
      });
    }
  },

  inviteByEmail: async (req: Request, res: Response) => {
    // check if email exists
    const { email, salonId } = req.body;
    const userId: any = req.user;

    if (email === undefined || typeof email !== "string") {
      return res.status(400).json({
        status: "failed",
        msg: "Error with input email.",
      });
    }

    try {
      const token = jwt.sign(
        { email, salonId: salonId },
        process.env.JWT_SECRETKEY_MAIL || "jwt_key_mail",
        {
          expiresIn: "7d",
        }
      );

      // check email is existed yet.
      const userRepository = getRepository(User);
      const userDb: any = await userRepository.findOne({
        where: { email: email },
      });

      if (userDb) {
        // get info of from user
        const fromUser = await userRepository.findOneOrFail({
          where: { user_id: userId },
        });
        // user is existed already => send notification to this user
        createNotification({
          to: userDb.user_id,
          description: `${fromUser.fullname} invited you to join their salon.`,
          types: "invite",
          data: token,
          avatar: fromUser.avatar,
          isUser: false,
        });

        return res.status(200).json({
          status: "success",
          msg: "Invited successfully!",
        });
      }

      // user is existed yet => send mail.
      const content = `<div dir="ltr"> Hi! There, you have recently visited our website and entered your email. Please follow the given link to join in the salon:<a target="_blank" href="${process.env.URL_CLIENT}/auth/verify-token-email/${token}">Click here</a> </div>`;

      let rs: any = await sendMail(content, email);

      if (!rs) {
        return res.json({
          status: "failed",
          msg: "Server is error now",
        });
      }

      return res.json({
        status: "success",
        msg: "Sent mail successfully!",
      });
    } catch (error) {
      return res.json({
        status: "failed",
        msg: "Error invite, please check information again.",
      });
    }
  },

  // [GET] /verify-invite/token
  verifyInviteFromMail: async (req: Request, res: Response) => {
    const token: string | undefined = req.params.token;
    let email: any, salonId;
    const userRepository = getRepository(User);

    if (!token) {
      return res.json({
        status: "failed",
        msg: "Token is invalid.",
      });
    }

    jwt.verify(
      token,
      process.env.JWT_SECRETKEY_MAIL || "jwt_key_mail",
      async (err, decoded: any) => {
        if (!err) {
          email = decoded.email;
          salonId = decoded.salonId;
        } else {
          return res.json({
            status: "failed",
            msg: "Token is not valid or expired",
          });
        }
      }
    );

    try {
      await userRepository.findOneOrFail({
        where: { email: email },
      });

      // user joined the salon before.
      return res.json({
        status: "failed",
        msg: "You are in the salon here aldready.",
      });
    } catch (error) { }

    try {
      // create new account.
      let userDb: User = new User();
      userDb.user_id = uuidv4();
      userDb.username = email;
      // userDb.password = password;
      userDb.email = email;
      await userRepository.save(userDb);

      // join salon.
      const salonRepository = getRepository(Salon);
      let salonDb: Salon | undefined = await salonRepository.findOneOrFail({
        where: { salon_id: salonId },
        relations: ["employees"],
      });
      userDb.password = ""; // error is delete here - CDQ.
      salonDb?.employees.push(userDb);
      await salonRepository.save(salonDb);

      // send new password for user.
      // const content = "Your password is 123abc@. Please change it, thank you.";
      // const rs: any = await sendMail(content, email);

      // if (!rs) {
      //   return res.json({
      //     status: "failed",
      //     msg: "Server is error now",
      //   });
      // }

      // gen new token for the user.
      const { accessToken, refreshToken } = await authController.genToken(
        userDb
      );

      // notification to salon
      createNotification({
        to: salonId,
        description: `${userDb.username} has accepted your invitation to your salon.`,
        types: "invite",
        avatar: userDb.avatar,
        isUser: true,
      });

      // set cookie and return data
      res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: true,
        path: "/",
        sameSite: "none",
      });

      return res.json({
        status: "success",
        msg: "Join salon successfully!",
        accessToken,
        refreshToken,
        user: userDb,
      });
    } catch (error) {
      res.json({
        status: "failed",
        msg: "Join salon failed.",
      });
    }
  },

  getAllEmployeesBySalon: async (req: Request, res: Response) => {
    const { salonId } = req.body;

    const userRp = await UserRepository.getAllEmployeesBySalonId({ salonId });

    return res.json({...userRp});
  }
};

export default salonController;
