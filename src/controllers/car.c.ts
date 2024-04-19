import { Request, Response } from 'express';
import { Car } from "../entities/Car";
import { getRepository } from "typeorm";
const cloudinary = require("cloudinary").v2;
import { getFileName } from "../utils/index"
import { newLogs } from '../helper/createLogs';
import Cache from '../config/node-cache';
import { Invoice, Salon } from '../entities';

interface MulterFile {
    path: string;
    filename: string;
}

interface MulterFileRequest extends Request {
    files?: MulterFile[];
}

const carController = {
    getAllCars: async (req: Request, res: Response) => {
        // get value from cache
        const valueCache = await Cache.get("cars");
        if (valueCache) {
            return res.status(200).json({
                status: "success",
                cars: valueCache
            });
        }

        const carRepository = getRepository(Car);
        try {
            const cars = await carRepository.find({
                relations: ['salon'], 
                select: [
                    'car_id', 'name', 'description', 'origin', 'price', 'brand', 
                    'model', 'type', 'capacity', 'door', 'seat', 'kilometer', 
                    'gear', 'mfg', 'inColor', 'outColor', 'image',
                ]
            });

            const formattedCars = cars.map(car => ({
                ...car,
                salon: {
                    salon_id: car.salon.salon_id,
                    name: car.salon.name,
                    address: car.salon.address
                }
            }));

            // const cars = await carRepository.find({
            //     select: [
            //         "name",
            //         "price",
            //         "image",
            //         "origin",
            //         "type",
            //         "capacity"
            //     ]
            // });
    
            // cars.forEach(car => {
            //     if (car.image && car.image.length > 0) {
            //         car.image = [car.image[0]];
            //     }
            // });
            // set new value for cache
            Cache.set("cars", {
                car: formattedCars,
                nbHits: formattedCars.length,
            });

            return res.status(200).json({
                status: "success",
                cars: {
                    car: formattedCars,
                    nbHits: formattedCars.length,
                },
            });
        } catch (error) {
            console.log(error);
            return res.status(500).json({ status: "failed", msg: "Internal server error" });
        }
    },
    getCarById: async (req: Request, res: Response) => {
        const carRepository = getRepository(Car);
        const { id } = req.params;
        // get value from car
        const valueCache = await Cache.get(id+"car");
        if (valueCache) {
            return res.status(200).json({
                status: "success",
                car: valueCache
            });
        }

        try {
            const car = await carRepository.findOne({
                where: {
                    car_id: id,
                },
                relations: ['salon', 'warranties'],
            })
            if (!car) {
                return res.status(404).json({ status: "failed", msg: `No car with id: ${id}` });
            }
            const { salon_id, name, address } = car.salon;

            // set new value for cache
            Cache.set(id+"car", {
                ...car,
                salon: {
                    salon_id,
                    name,
                    address
                }
            });

            return res.status(200).json({
                status: "success",
                car: {
                    ...car,
                    salon: {
                        salon_id,
                        name,
                        address
                    }
                }
            });
        } catch (error) {
            return res.status(500).json({ status: "failed", msg: "Internal server error" });
        }
    },
    getAllCarsByBrandOfSalon: async (req: Request, res: Response) => {
        const { brand, salon_id } = req.params;
        const carRepository = getRepository(Car);
        // get value from cache
        const valueCache = Cache.get(salon_id+brand);
        if (valueCache) {
            return res.status(200).json({
                status: "success",
                data: valueCache,
            });
        }

        try {
            const cars = await carRepository.find({
                where: {
                    brand: brand,
                    salon: { salon_id: salon_id }
                },
                //relations: ['salon'],
                //select: [
                //    'car_id', 'name', 'description', 'origin', 'price', 'brand', 
                //    'model', 'type', 'capacity', 'door', 'seat', 'kilometer', 
                //    'gear', 'mfg', 'inColor', 'outColor', 'image',
                //]
            });

            // const formattedCars = cars.map(car => ({
            //     ...car,
            //     salon: {
            //         salon_id: car.salon.salon_id,
            //         name: car.salon.name,
            //         address: car.salon.address
            //     }
            // }));
            const saveCar = {
                cars: cars,
                nbHits: cars.length,
            }
            // set new value for cache
            Cache.set(salon_id+brand, saveCar);

            return res.status(200).json({
                status: "success",
                data: saveCar
            });
        } catch (error) {
            return res.status(500).json({ status: "failed", msg: "Internal server error" });
        }
    },
    createCar: async (req: Request | MulterFileRequest, res: Response) => {
        const carRepository = getRepository(Car);
        const { name, description, origin, price, brand, 
            model, type, capacity, door, seat, kilometer,
            gear, mfg, inColor, outColor, salonSalonId} = req.body;
            console.log("Name car: ", name);

        let image = [""], filename = [""]
        if ('files' in req && req.files) {
            const arrayImages = req.files;
            image = arrayImages.map((obj) => obj.path);
            filename = arrayImages.map((obj) => obj.filename);
        }

        try {
            if (price < 0) {
                if(filename.length !== 0){
                    filename.forEach(async (url) => {
                        cloudinary.uploader.destroy(url)
                    })
                }
                return res.status(400).json({ status: "failed", msg: "Price must be greater than or equal to 0" });
            }

            const newCar = { name, description, origin, price, brand, 
            model, type, capacity, door, seat, kilometer,
            gear, mfg, inColor, outColor, salon: { salon_id: salonSalonId }, image };
            const savedCar = await carRepository.save(newCar);

            newLogs(salonSalonId, `${req.user} created car ${savedCar.car_id}.`)
            
            // del old value cache
            Cache.del(["cars", salonSalonId+brand]);

            return res.status(201).json({
                status: "success",
                msg: "Create successfully!",
                car: savedCar
            });
        } catch (error) {
            if(filename.length !== 0){
                filename.forEach(async (url) => {
                    cloudinary.uploader.destroy(url)
                })
            }
            return res.status(500).json({ status: "failed", msg: "Internal server error" });
        }
    },
    updateCar: async (req: Request | MulterFileRequest, res: Response) => {
        const { id } = req.params;
        const { name, description, origin, price, brand, 
            model, type, capacity, door, seat, kilometer,
            gear, mfg, inColor, outColor, salonSalonId} = req.body;
        const carRepository = getRepository(Car);

        let image = null, filename = null
        if ('files' in req && req.files) {
            const arrayImages = req.files;
            image = arrayImages.map((obj) => obj.path);
            filename = arrayImages.map((obj) => obj.filename);
        }

        let newCar: any = {name, description, origin, price, brand, 
            model, type, capacity, door, seat, kilometer,
            gear, mfg, inColor, outColor, salon: { salon_id: salonSalonId } }
        if(Array.isArray(image) && image.length > 0) newCar.image = image;
        const {car_id, ...other} = newCar;

        const oldCar = await carRepository.findOne({
            where: {
                car_id: id,
            },
        })

        if(!oldCar){
            if(filename && filename.length !== 0){
                filename.forEach(async (url) => {
                    cloudinary.uploader.destroy(url)
                })
            }
            return res.status(404).json({ status: "failed", msg: `No car with id: ${id}` });
        }

        if (image && image.length !== 0 && Array.isArray(oldCar.image) && oldCar.image.length > 0) {
            oldCar.image.forEach(image => {
                cloudinary.uploader.destroy(getFileName(image));
            });
        }
        
        try {
            if (price < 0) {
                if(filename && filename.length !== 0){
                    filename.forEach(async (url) => {
                        cloudinary.uploader.destroy(url)
                    })
                }
                return res.status(400).json({ status: "failed", msg: "Price must be greater than or equal to 0" });
            }

            const saveCar = {...oldCar, ...other};
            const car = await carRepository.save(saveCar);

            newLogs(salonSalonId, `${req.user} updated car ${car?.car_id}.`)
            Cache.del(["cars", id+"car", salonSalonId+brand]);

            return res.status(200).json({
                status: "success",
                msg: "Update successfully!",
                car: car
            });
        } catch (error) {
            if(filename && filename.length !== 0){
                filename.forEach(async (url) => {
                    cloudinary.uploader.destroy(url)
                })
            }
            return res.status(500).json({ status: "failed", msg: "Internal server error" });
        }
    },
    deleteCar: async (req: Request, res: Response) => {
        const { id } = req.params;
        const carRepository = getRepository(Car);
        try {
            const car = await carRepository.findOne({
                where: {
                    car_id: id,
                }})
            if (!car) {
                return res.status(404).json({ status: "failed", msg: `No car with id: ${id}` });
            }

            if (Array.isArray(car.image) && car.image.length > 0) {
                car.image.forEach(image => {
                    cloudinary.uploader.destroy(getFileName(image));
                });
            }

            await carRepository.delete(id);
            newLogs(req.body.salonId, `${req.user} deleted car ${car.name}- ${car.price}.`)
            Cache.del(["cars", id+"car", req.body.salonId+car.brand]);

            return res.status(200).json({
                status: "success",
                msg: "Delete successfully!"
            });
        } catch (error) {
            return res.status(500).json({ status: "failed", msg: "Internal server error" });
        }
    },

    printInvoiceBuyCar: async (req: Request, res: Response) => {
        const {carId, salonId, note, fullname, email, phone} = req.body;

        try {
            const invoiceRepository = getRepository(Invoice);
            const carRepository = getRepository(Car);
            const carDb: Car = await carRepository.findOneOrFail({
                where: {car_id: carId},
                relations: ['salon']
            })

            if (carDb.salon?.salon_id !== salonId) {
                return res.json({
                    status: "failed",
                    msg: "Error information."
                })
            }

            let saveInvoice: any = new Invoice();
            saveInvoice.seller = carDb.salon;
            saveInvoice = {...saveInvoice, expense: carDb.price, note, fullname, email, phone, carName: carDb.name};
            await invoiceRepository.save(saveInvoice);

            return res.json({
                status: "success",
                msg: "Create invoice successfully!",
                invoice: saveInvoice
            })

        } catch (error) {
            console.log(error)
            return res.json({
                status: "failed",
                msg: "Can not create the invoice."
            })
        }
    }
}

export default carController;