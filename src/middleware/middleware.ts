import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { getRepository } from "typeorm";
import { Salon, User } from "../entities";
import UserRepository from "../repository/user";

const middlewareController = {
  // verify token
  verifyToken: (req: Request, res: Response, next: NextFunction) => {
    const token = req.headers.authorization || req.headers["authorization"];
    if (token) {
      const accessToken = token.split(" ")[1];
      // console.log("accessToken1: ", accessToken);
      jwt.verify(
        accessToken,
        process.env.JWT_ACCESS_KEY as string,
        (err: any, decoded: any) => {
          if (err) {
            return res
              .status(401)
              .json({ status: "failed", msg: "Token isn't valid!" });
          }
          req.user = decoded.userId; // add by cdq 050424 - simple for set permission later.
          (req as Request).headers.userId = decoded.userId;
          delete req.body.salonId;
          next();
        }
      );
    } else {
      return res.json({ status: "failed", msg: "You're not authenticated!" });
    }
  },

  // no delete salonId
  verifyToken2: (req: Request, res: Response, next: NextFunction) => {
    const token = req.headers.authorization || req.headers["authorization"];
    if (token) {
      const accessToken = token.split(" ")[1];
      // console.log("accessToken1: ", accessToken);
      jwt.verify(
        accessToken,
        process.env.JWT_ACCESS_KEY as string,
        (err: any, decoded: any) => {
          if (err) {
            return res
              .status(401)
              .json({ status: "failed", msg: "Token isn't valid!" });
          }
          req.user = decoded.userId; // add by cdq 050424 - simple for set permission later.
          (req as Request).headers.userId = decoded.userId;
          // delete req.body.salonId;
          next();
        }
      );
    } else {
      return res.json({ status: "failed", msg: "You're not authenticated!" });
    }
  },

  verifyRefreshToken: (req: Request, res: Response, next: NextFunction) => {
    const refreshToken: string | undefined =
      req.cookies.refreshToken || req.headers["authorization"];

    if (refreshToken) {
      jwt.verify(
        refreshToken,
        process.env.JWT_REFRESH_KEY as string,
        (err: any, user: any) => {
          if (err) {
            return res
              .status(401)
              .json({ status: "failed", msg: "Token isn't valid!" });
          }
          (req as Request).headers.userId = user.userId;
          next();
        }
      );
    } else {
      return res.json({ status: "failed", msg: "You're not authenticated!" });
    }
  },

  getUserId: (req: Request, res: Response, next: NextFunction) => {
    // get token from header
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];
    // check token is null
    if (token) {
      // token is not null, we verify and get userId
      jwt.verify(
        token,
        process.env.JWT_ACCESS_KEY as string,
        (err, decoded: any) => {
          if (err) {
            return res.status(403).json({ msg: "Forbidden" });
          }
          // get userid
          (req as Request).headers.userId = decoded.userId;
        }
      );
    }

    next();
  },

  isAdminOfSalon: async (req: Request, res: Response, next: NextFunction) => {
    const token = req.headers.authorization || req.headers["authorization"];
    let userId: any = req.user||"";
    const salonRp = await UserRepository.getSalonIdByUserId({ userId });
    const salonId = salonRp?.data;

    if (!salonId) {
      return res.status(400).json({
        status: "failed",
        msg: "Invalid information.",
      });
    }

    req.body.salonId = salonId;

    if (token) {
      const accessToken = token.split(" ")[1];
      jwt.verify(
        accessToken,
        process.env.JWT_ACCESS_KEY as string,
        (err: any, decoded: any) => {
          if (err) {
            return res
              .status(401)
              .json({ status: "failed", msg: "Token isn't valid!" });
          }
          userId = decoded.userId;
          delete (req as Request).headers.userId;
        }
      );
    } else {
      return res.json({ status: "failed", msg: "You're not authenticated!" });
    }
    try {
      const salonRepository = getRepository(Salon);
      await salonRepository.findOneOrFail({
        where: { user_id: userId, salon_id: salonId },
      });

      next();
    } catch (error) {
      return res.status(403).json({
        status: "failed",
        msg: "Unauthorized",
      });
    }
  },

  isEmployeeOfSalon: async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    const { userId, salonId } = req.body;
    const userRepository = getRepository(User);

    try {
      
      const userDb = await userRepository.findOneOrFail({
        where: { user_id: userId },
        relations: ["salonId"],
      });

      if (userDb?.salonId?.salon_id === salonId) {
        next();
      } else {
        return res.json({
          status: "failed",
          msg: "This user is not in the salon.",
        });
      }
    } catch (error) {
      console.log(error);
      return res.json({
        status: "failed",
        msg: "Permission error. ",
      });
    }
  },

  havePermission: (permission: any) => {
    return async (req: Request, res: Response, next: NextFunction) => {
      const roleAdmin: string[] = ["OWNER"];
      const userId: any = req.user;
      // find salonId
      const salonRp = await UserRepository.getSalonIdByUserId({ userId });
      const salonId = salonRp?.data;
      req.body.salonId = salonId;

      //console.log("salonId: ", salonId);

      // delete userId from verify login. Because this action is for employees, not user.
      delete (req as Request).headers.userId;

      const userRepository = getRepository(User);
      try {
        const userDb = await userRepository.findOneOrFail({
          where: { user_id: userId },
          relations: ["salonId"],
        });

        if (userDb?.role === "admin") return next();

        // check user in salon.
        if (userDb?.salonId.salon_id !== salonId) throw new Error();

        // check the user is admin the salon.
        const salonRepository = getRepository(Salon);
        await salonRepository.findOneOrFail({
          where: { user_id: userId, salon_id: salonId },
        });

        if (
          userDb?.permissions.includes(permission) ||
          userDb?.permissions[0] == roleAdmin[0]
        )
          next();
        else
          return res.json({
            status: "failed",
            msg: "You dont have this permission",
          });
      } catch (error) {
        console.log(error);
        return res.json({
          status: "failed",
          msg: "You dont have this permission.",
        });
      }
    };
  },

  isAdminTeam: (req: Request, res: Response, next: NextFunction) => {
    const userId: any = req.user;

    if (userId === process.env.USER_ID_ADMIN_TEAM) return next();

    return res.json({
      status: "failed",
      msg: "You dont have the permission.",
    });
  },
};

export default middlewareController;
