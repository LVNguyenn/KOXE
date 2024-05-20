import { Request, Response } from 'express';
import { getRepository } from 'typeorm';
import { Appointment, Car, Salon, User } from '../entities';
import createNotification from '../helper/createNotification';
import { newLogs } from '../helper/createLogs';
import { isValidUUID } from '../utils';
import UserRepository from '../repository/user';
import CarRepository from '../repository/car';
// import Cache from '../config/node-cache';

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
      // Cache.del(salonId + "apm");

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
    let from = req.body.from;
    from = from ? from : "user";
    // get value from cache
    // const cacheValue = (!userId && !id) ? await Cache.get(salonId + "apm") : "";
    // if (cacheValue) {
    //   return res.status(200).json({
    //     status: "success",
    //     appointments: cacheValue
    //   })
    // }

    try {
      let appointDb: any = await appointmentRepository.find({
        where: { salon_id: salonId, status: status, id: id, user_id: userId, car_id: carId, from},
        relations: ['user', 'salon'],
        select: ['id', 'date', 'description', 'status', 'user', 'salon', 'car_id'],
        order: { create_at: 'DESC' }
      })
      
      for (let app in appointDb) {
        appointDb[app].user = { fullname: appointDb[app].user.fullname, phone: appointDb[app].user.phone};
        appointDb[app].salon = appointDb[app].salon.name;
        try {
          const carRepository = getRepository(Car);
          appointDb[app].car = await carRepository.findOneOrFail({
            where: { car_id: appointDb[app].car_id }
          })

        } catch (error) {
          return res.json({
            status: "failed",
            msg: "error information car.",
            error
          })
        }

      }

      // set new value for cache
      // (!userId && !id) ? Cache.set(salonId + "apm", appointDb) : 1;

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
        where: {...filteredObject, from: "user"}
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
      // Cache.del(salonId + "apm");

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
      // Cache.del(salonId + "apm");

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

  getTimeBusy: async (req: Request, res: Response) => {
    const {carId, salonId} = req.body;

    if (!carId || !salonId) {
      return res.json({
        status: "failed",
        msg: "Input is invalid."
      })
    }

    try {
      const appointRepository = getRepository(Appointment);
      const timeDb = await appointRepository.find({
        where: {salon_id: salonId, car_id: carId},
        select: ['date']
      })

      return res.json({
        status: "success",
        timeBusy: timeDb
      })
    } catch (error) {
      return res.json({
        status: "failed",
        msg: "Error find car."
      })
    }
  },

  // appointment for process from salon to user //

  createAppointmentBySalon: async (req: Request, res: Response) => {
    const {carId, salonId, phone, date, description } = req.body;
    const from = "salon"; 

    // check car_here
    const carRp = await CarRepository.findCarByCarIdSalonId({carId, salonId});
    if (!carRp?.data) {
      return res.json({
        status: "failed",
        msg: "Invalid car."
      })
    }

    try {
      // find user by phone;
      const userRp = await UserRepository.getProfileByOther({phone});
      const appointmentRepository = getRepository(Appointment);
      let appoint = new Appointment();
      const apmDb = await appointmentRepository.save({...appoint, date, salon_id: salonId, user_id: userRp?.data?.user_id, description, car_id: carId, from});
      // create notification to user here
      createNotification({
        to: userRp?.data?.user_id,
        description: `${carRp?.data?.salon.name} vừa đặt lịch hẹn với bạn.`,
        types: "appointment-process",
        data: apmDb.id,
        avatar: carRp?.data?.salon.image,
        isUser: false
      })

      return res.json({
        status: "success",
        msg: "Created appointment to the user, waiting the response."
      })
    } catch (error) {
      console.log(error)
      return res.json({
        status: "failed",
        msg: "Error create appointment."
      })
    }
  },

  acceptingApmByUser: async (req: Request, res: Response) => {
    const userId: any = req.headers['userId'];
    const {status, id} = req.body;

    if (!status || !id) {
      return res.json({
        status: "failed",
        msg: "invalid input."
      })
    }

    try {
      const appointmentRepository = getRepository(Appointment);
      const apmDb = await appointmentRepository.findOneOrFail({
        where: {user_id: userId, from: "salon", id}
      })

      await appointmentRepository.save({...apmDb, status});
      // find user by userId
      const userDb = await UserRepository.getProfileById(userId);
      // send notification to salon.
      createNotification({
        to: apmDb.salon_id,
        description: `${userDb?.data?.fullname} vừa phản hồi lại lịch hẹn với salon của bạn.`,
        types: "appointment-process",
        data: apmDb.id,
        avatar: userDb?.data?.avatar,
        isUser: true
      })

      return res.json({
        status: "success",
        msg: "You responsed the appoinment of salon successfully!"
      })
    } catch (error) {
      return res.json({
        status: "failed",
        msg: "Error with response."
      })
    }
  }


};

export default appointmentController;
