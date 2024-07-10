import { Request, Response } from "express";
import { getRepository } from "typeorm";
import { Post, User, Salon, Connection } from "../entities";
import { getUserInfo } from "../helper/mInvoice";
import createNotification from "../helper/createNotification";
import search from "../helper/search";
import pagination from "../helper/pagination";

const cloudinary = require("cloudinary").v2;

interface MulterFile {
  path: string;
  filename: string;
}

interface MulterFileRequest extends Request {
  files?: MulterFile[];
}

const postController = {
  createPost: async (req: Request | MulterFileRequest, res: Response) => {
    const postRepository = getRepository(Post);
    const salonRepository = getRepository(Salon);
    const userId: any = req.headers["userId"] || "";
    const user = await getUserInfo(userId);
    const {
      title,
      text,
      salons,
      brand,
      type,
      mfg,
      version,
      gear,
      fuel,
      origin,
      design,
      seat,
      color,
      licensePlate,
      ownerNumber,
      accessory,
      kilometer,
      price,
      registrationDeadline,
      address,
    } = req.body;

    let image = [""],
      filename = [""];
    if ("files" in req && req.files) {
      const arrayImages = req.files;
      image = arrayImages.map((obj) => obj.path);
      filename = arrayImages.map((obj) => obj.filename);
    }

    try {
      const maxLength = 500;
      if (text?.length > maxLength) {
        return res
          .status(400)
          .json({ error: `Text must be less than ${maxLength} characters` });
      }

      const newPost: any = {
        text,
        postedBy: { user_id: userId },
        //createdAt: moment().format("YYYY-MM-DDTHH:mm:ss"),
        image,
        title,
        brand,
        type,
        mfg,
        version,
        gear,
        fuel,
        origin,
        design,
        seat,
        color,
        licensePlate,
        ownerNumber,
        accessory,
        kilometer,
        price,
        registrationDeadline,
        address,
      };

      if (salons !== null) newPost.salons = salons;

      const savedPost = await postRepository.save(newPost);

      // Send notification
      if (salons === undefined) {
        const salonList = await salonRepository.find({
          select: ["salon_id"],
        });
        for (const salon of salonList) {
          createNotification({
            to: salon.salon_id,
            description: `${user?.fullname} vừa gửi yêu cầu bán xe đến salon của bạn.`,
            types: "request",
            data: savedPost.post_id,
            avatar: user?.avatar,
            isUser: true,
          });
        }
      } else if (salons.length !== 36) {
        for (const salon of salons) {
          createNotification({
            to: salon,
            description: `${user?.fullname} vừa gửi yêu cầu bán xe đến salon của bạn.`,
            types: "request",
            data: savedPost.post_id,
            avatar: user?.avatar,
            isUser: true,
          });
        }
      } else {
        createNotification({
          to: salons,
          description: `${user?.fullname} vừa gửi yêu cầu bán xe đến salon của bạn.`,
          types: "request",
          data: savedPost.post_id,
          avatar: user?.avatar,
          isUser: true,
        });
      }

      return res.status(201).json({
        status: "success",
        msg: "Create successfully!",
        post: savedPost,
      });
    } catch (error) {
      console.log(error);
      if (filename.length !== 0) {
        filename.forEach(async (url) => {
          cloudinary.uploader.destroy(url);
        });
      }
      return res
        .status(500)
        .json({ status: "failed", msg: "Internal server error" });
    }
  },
  getFeedPosts: async (req: Request, res: Response) => {
    const { page, per_page, q }: any = req.query;
    const postRepository = getRepository(Post);
    const connectionRepository = getRepository(Connection);
    const userId: any = req.headers["userId"] || "";
    const user = await getRepository(User).findOne({
      where: [{ user_id: userId }],
      relations: ["salonId"],
    });
    const salonId = user?.salonId.salon_id;
    let formatPosts: any;

    try {
      if (!salonId) {
        const post = await postRepository.findOne({
          where: { postedBy: { user_id: userId } },
          relations: ["postedBy"],
        });

        formatPosts = {
          ...post,
          postedBy: {
            user_id: post?.postedBy.user_id,
            fullname: post?.postedBy.fullname,
            avatar: post?.postedBy.avatar,
          },
        };
      } else {
        // Fetch the salon to get the blocked user IDs
        const salon = await getRepository(Salon).findOne({
          where: { salon_id: salonId },
          select: ["blockUsers"],
        });

        const blockedIds = salon?.blockUsers || [];

        const connectedPostIds = await connectionRepository
          .createQueryBuilder("connection")
          .select("connection.postPostId")
          .where("connection.salonSalonId = :salonId", { salonId })
          .getRawMany();

        const connectedIds = connectedPostIds.map((item) => item.postPostId);

        let query = postRepository
          .createQueryBuilder("post")
          .leftJoinAndSelect("post.postedBy", "user")
          .where("(post.salons LIKE :salonId OR post.salons LIKE :all)", {
            salonId: `%${salonId}%`,
            all: "%All%",
          })
          .orderBy("post.createdAt", "DESC");

        if (connectedIds.length > 0) {
          query = query.andWhere("post.post_id NOT IN (:...connectedIds)", {
            connectedIds,
          });
        }

        if (blockedIds.length > 0) {
          query = query.andWhere(
            "post.postedByUserId NOT IN (:...blockedIds)",
            {
              blockedIds,
            }
          );
        }

        const posts = await query.getMany();

        formatPosts = {
          posts: posts.map((post) => ({
            ...post,
            postedBy: {
              user_id: post.postedBy.user_id,
              fullname: post.postedBy.fullname,
              avatar: post.postedBy.avatar,
            },
          })),
        };
      }

      // search and pagination
      if (q) {
        formatPosts.posts = await search({
          data: formatPosts?.posts,
          q,
          fieldname: "postedBy",
          fieldname2: "fullname",
        });
      }

      const rs = await pagination({ data: formatPosts?.posts, page, per_page });
      formatPosts.posts = rs?.data;

      res.status(200).json({
        status: "success",
        posts: formatPosts,
        total_page: rs?.total_page,
      });
    } catch (error) {
      console.error("Error retrieving salon posts:", error);
      res.status(500).json({
        status: "failed",
        msg: "Internal server error",
      });
    }
  },
  getPostById: async (req: Request, res: Response) => {
    const postRepository = getRepository(Post);
    const { id } = req.params;

    try {
      const post = await postRepository.findOne({
        where: { post_id: id },
        relations: ["postedBy"],
      });

      if (!post) {
        return res
          .status(200)
          .json({ status: "failed", msg: `No post with id: ${id}` });
      }

      const formatPost = {
        ...post,
        postedBy: {
          user_id: post.postedBy.user_id,
          fullname: post.postedBy.fullname,
          avatar: post.postedBy.avatar,
          avgRating: post.postedBy.avgRating,
          completedTransactions: post.postedBy.completedTransactions,
        },
      };

      return res.status(200).json({
        status: "success",
        post: formatPost,
      });
    } catch (error) {
      return res
        .status(500)
        .json({ status: "failed", msg: "Internal server error" });
    }
  },
};

export default postController;
