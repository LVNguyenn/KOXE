import { Request, Response, NextFunction } from 'express';

const ErrorHandler = async(err: Error,req: Request,res: Response,next: NextFunction) => {
    if(err as any){
        return res.json({
            'status': "failed",
            'message': err.message
        })
    }
    next();
}

export default ErrorHandler;