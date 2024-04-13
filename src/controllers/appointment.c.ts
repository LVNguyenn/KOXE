import { Request, Response } from 'express';
import { getRepository } from 'typeorm';
import { Appointment, Car, Salon, User } from '../entities';
import createNotification from '../helper/createNotification';
import { newLogs } from '../helper/createLogs';
import Cache from '../config/node-cache';

const appointmentController = {
  createAppointment: async (req: Request, res: Response) => {
    const userId: any = req.headers['userId'];
    const { salonId, date, description, carId }: any = req.body;

    try {
      //Check the car and no one has made an appointment at that time frame
      const appointRepository = getRepository(Appointment);
      await appointRepository.findOneOrFail({
        where: { car_id: carId, date: date }
      })

      return res.json({
        status: "failed",
        msg: "Unfortunately, the car was scheduled for that time frame."
      })

    } catch (error) { }


    try {
      // get fullname of user
      const userRepository = getRepository(User);
      const userDb = await userRepository.findOneOrFail({
        where: { user_id: userId }
      })
      const appointmentRepository = getRepository(Appointment);
      let appoint = new Appointment();
      appoint.salon_id = salonId;
      appoint.user_id = userId;
      appoint.date = date;
      appoint.description = description;
      appoint.car_id = carId;
      const saveAppoint = await appointmentRepository.save(appoint);

      createNotification({
        to: salonId,
        description: `${userDb?.fullname} vừa đặt lịch hẹn với salon của bạn.`,
        types: "appointment",
        data: saveAppoint.id,
        avatar: userDb.avatar,
        isUser: true
      })

      // add logs
      newLogs(salonId, `${userId} created appointment with your salon.`)

      // del old value cache
      Cache.del(salonId + "apm");

      return res.status(201).json({
        status: "success",
        msg: "Create appointment successfully!",
        appoint
      });
    } catch (error) {
      console.log(error)
      return res.status(400).json({
        status: "failed",
        msg: "Invalid informations."
      })
    }
  },

  get: async (req: Request, res: Response) => {
    const userId: any = req.headers['userId'] || req.body.userId;
    const { salonId, status, id, carId }: any = req.body;
    const appointmentRepository = getRepository(Appointment)
    // get value from cache
    const cacheValue = (!userId && !id) ? await Cache.get(salonId + "apm"): "";
    if (cacheValue) {
      return res.status(200).json({
        status: "success",
        appointments: cacheValue
      })
    }

    try {
      let appointDb: any = await appointmentRepository.find({
        where: { salon_id: salonId, status: status, id: id, user_id: userId, car_id: carId },
        relations: ['user', 'salon'],
        select: ['id', 'date', 'description', 'status', 'user', 'salon', 'car_id'],
        order: { create_at: 'DESC' }
      })

      for (let app in appointDb) {
        appointDb[app].user = { fullname: appointDb[app].user.fullname, phone: appointDb[app].user.phone };
        appointDb[app].salon = appointDb[app].salon.name;
        try {
          const carRepository = getRepository(Car);
          appointDb[app].car = await carRepository.findOneOrFail({
            where: { car_id: appointDb[app].car_id }
          })
        } catch (error) {
          return res.json({
            status: "failed",
            msg: "error information car."
          })
        }

      }

      // set new value for cache
      (!userId && !id) ? Cache.set(salonId + "apm", appointDb): 1;

      return res.status(200).json({
        status: "success",
        appointments: appointDb
      })
    } catch (error) {
      console.log(error)
      return res.status(400).json({
        status: "failed",
        msg: "invaid information."
      })
    }

  },

  // if user => login, salon => is admin of salon.
  updateOne: async (req: Request, res: Response) => {
    const userId: any = req.headers['userId'];
    // console.log(userId)
    const { salonId, id }: any = req.body;
    let description: any = !userId ? undefined : req.body.description;
    let status: any = !userId ? req.body.status : undefined;
    const updateObject: Object = { id: id, user_id: userId, salon_id: salonId }
    const filteredObject: any = Object.fromEntries(Object.entries(updateObject).filter(([key, value]) => value !== undefined));
    const appointmentRepository = getRepository(Appointment)

    try {
      // get fullname of user
      const userRepository = getRepository(User);
      const salonRepository = getRepository(Salon);
      let userDb: User | undefined;
      let salonDb: Salon | undefined;

      if (userId) {
        userDb = await userRepository.findOneOrFail({
          where: { user_id: userId }
        });
      }

      if (salonId) {
        salonDb = await salonRepository.findOneOrFail({
          where: { salon_id: salonId },
          relations: ['user']
        });
      }

      const appointDb = await appointmentRepository.findOneOrFail({
        where: filteredObject
      });
      await appointmentRepository.save({ ...appointDb, status, description });
      const responeSalon: string = (status == 1) ? `${salonDb?.name} đã chấp thuận lịch hẹn của bạn.` : `${salonDb?.name} đã từ chối lịch hẹn của bạn.`
      createNotification({
        to: salonId ? appointDb.user_id : appointDb.salon_id,
        description: salonId ? responeSalon : `${userDb?.fullname} đã chỉnh sửa thông tin mô tả của lịch hẹn với salon của bạn.`,
        types: "appointment",
        data: id,
        avatar: salonId ? salonDb?.image : userDb?.avatar,
        isUser: !salonId
      })

      // console.log("AVATAR: ", userDb, salonDb, salonId? salonDb?.image: userDb?.avatar)

      // add logs
      if (salonId)
        newLogs(salonId, `Employee ${req.user} updated appointment with id ${id} `)

      // del old value from cache
      Cache.del(salonId + "apm");

      return res.status(200).json({
        status: "success",
        msg: "Updated successfully!"
      })

    } catch (error) {
      // console.log(error)
      return res.status(404).json({
        status: "failed",
        msg: "Update error."
      })
    }
  },

  delete: async (req: Request, res: Response) => {
    const userId: any = req.headers['userId'] || req.body.userId;
    const { salonId, status, id }: any = req.body;
    const deleteObject: Object = { id: id, user_id: userId, salon_id: salonId, status: status }
    const filteredObject = Object.fromEntries(Object.entries(deleteObject).filter(([key, value]) => value !== undefined));
    const notifiRepository = getRepository(Appointment)
    try {
      const recordToDelete: any = await notifiRepository.findOne({
        where: { id: id },
        relations: ['salon', 'user']
      });
      await notifiRepository.delete(filteredObject);
      // console.log(filteredObject)
      // check date to send notification
      const currentDate = new Date();

      if (recordToDelete?.date >= currentDate) {
        createNotification({
          to: salonId ? recordToDelete?.user_id : recordToDelete?.salon_id,
          description: salonId ? `Salon ${recordToDelete?.salon.name} đã hủy lịch hẹn với bạn.` : `User ${recordToDelete?.user.fullname} đã hủy lịch hẹn với salon của bạn.`,
          types: "appointment",
          avatar: salonId ? recordToDelete.salon.image : recordToDelete.user.avatar,
          isUser: !salonId
        })

        // console.log("Delete: ", salonId ? recordToDelete.salon.image: recordToDelete.user.avatar)
      }

      if (salonId)
        newLogs(salonId, `Employee deleted appointment with custormer ${recordToDelete.user?.fullname} - ${recordToDelete.user?.user_id}`)

      // del old value from cache
      Cache.del(salonId + "apm");

      return res.status(200).json({
        status: "success",
        msg: "delete successfully!"
      })
    } catch (error) {
      return res.status(404).json({
        status: "failed",
        msg: "delete error."
      })
    }
  },

};

export default appointmentController;
