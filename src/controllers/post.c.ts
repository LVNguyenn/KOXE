import { Request, Response } from "express";
import { getRepository, Not } from "typeorm";
import moment from "moment";
import { Post } from "../entities/Post";
import { User } from "../entities/User";
import { Connection } from "../entities/Connection";

const postController = {
  createPost: async (req: Request, res: Response) => {
    const postRepository = getRepository(Post);
    const userId: any = req.headers["userId"] || "";
    const { text, salons } = req.body;

    try {
      const maxLength = 500;
      if (text.length > maxLength) {
        return res
          .status(400)
          .json({ error: `Text must be less than ${maxLength} characters` });
      }

      const newPost: any = {
        text,
        postedBy: { user_id: userId },
        createdAt: moment().format("YYYY-MM-DDTHH:mm:ss"),
      };

      if (Array.isArray(salons) && salons.length > 0) {
        newPost.salons = salons;
      }

      const savedPost = await postRepository.save(newPost);

      return res.status(201).json({
        status: "success",
        msg: "Create successfully!",
        post: savedPost,
      });
    } catch (error) {
      return res
        .status(500)
        .json({ status: "failed", msg: "Internal server error" });
    }
  },
  getFeedPosts: async (req: Request, res: Response) => {
    const postRepository = getRepository(Post);
    const connectionRepository = getRepository(Connection);
    const userId: any = req.headers["userId"] || "";
    const user = await getRepository(User).findOne({
      where: [{ user_id: userId }],
      relations: ["salonId"],
    });
    const salonId = user?.salonId.salon_id;

    try {
      const connectedPostIds = await connectionRepository
        .createQueryBuilder("connection")
        .select("connection.postPostId")
        .where("connection.salonSalonId = :salonId", { salonId })
        .getRawMany();

      const connectedIds = connectedPostIds.map((item) => item.postPostId);

      let posts;
      if (connectedIds.length > 0) {
        posts = await postRepository
          .createQueryBuilder("post")
          .leftJoinAndSelect("post.postedBy", "user")
          .where("post.salons LIKE :salonId OR post.salons LIKE :all", {
            salonId: `%${salonId}%`,
            all: "%All%",
          })
          .andWhere("post.post_id NOT IN (:...connectedIds)", {
            connectedIds,
          })
          .orderBy("post.createdAt", "DESC")
          .getMany();
      } else {
        posts = await postRepository
          .createQueryBuilder("post")
          .leftJoinAndSelect("post.postedBy", "user")
          .where("post.salons LIKE :salonId OR post.salons LIKE :all", {
            salonId: `%${salonId}%`,
            all: "%All%",
          })
          .orderBy("post.createdAt", "DESC")
          .getMany();
      }

      const formatPosts = {
        posts: posts.map((post) => ({
          ...post,
          postedBy: {
            user_id: post.postedBy.user_id,
            fullname: post.postedBy.fullname,
            avatar: post.postedBy.avatar,
          },
        })),
      };

      res.status(200).json({
        status: "success",
        posts: formatPosts,
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
          .status(404)
          .json({ status: "failed", msg: `No post with id: ${id}` });
      }

      const formatPost = {
        ...post,
        postedBy: {
          user_id: post.postedBy.user_id,
          fullname: post.postedBy.fullname,
          avatar: post.postedBy.avatar,
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
