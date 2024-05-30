import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as FacebookStrategy } from 'passport-facebook';
import dotenv from 'dotenv';
import { User } from '../entities/User';
import { getRepository } from "typeorm";

dotenv.config({ path: "./server" });

// login
passport.serializeUser(function (user, done) {
    done(null, user);
});

passport.deserializeUser(async function (user: any, done) {
    const userRepository = getRepository(User);
    const infoUser = await userRepository.findOne({
        where: { email: user.email }
    });
    if (infoUser) {
        const { password, ...infoUserWithoutPassword } = infoUser;
        done(null, infoUserWithoutPassword)
    }
});

// login

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID || "clientId",
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || "clientSecret",
    callbackURL: process.env.GOOGLE_CALLBACK_URL || "http://localhost:3000/auth/google/callback"
},
    async (accessToken, refreshToken, profile: any, done) => {
        let user = new User();
        user.user_id = profile.id;
        // user.email = profile.emails[0].value;
        user.fullname = profile.displayName;

        try {
            // Check if the user exists in the database, if not, add them
            const userRepository = getRepository(User);
            let userDb: User | null = await userRepository.findOne({
                where: { google: profile.emails[0].value }
            });

            if (!userDb) {
                // user does not exist yet => add account to user db
                user.google = profile.emails[0].value;
                user.aso = 0;
                // await userRepository.save(user);

                return done(null, user);
            }
            const { password, ...others } = userDb;

            // console.log("Others: ", others);
            if (userDb?.blocked) {
                return done("This account is blocked");
            }
            

            return done(null, others);
        } catch (error: any) {
            return done(error);
        }
    }
));

passport.use(new FacebookStrategy({
    clientID: process.env.CLIENT_ID || "clientId",
    clientSecret: process.env.CLIENT_SECRET || "clientSecret",
    callbackURL: process.env.CALL_BACK_URL || "http://localhost:3000/auth/facebook/callback",
    profileFields: ['email', 'photos', 'id', 'displayName']
},
    async (accessToken, refreshToken, profile: any, done) => {
        let user = new User();
        user.user_id = profile.id;
        // user.email = profile.emails[0].value;
        user.fullname = profile.displayName;

        try {
            // Check if the user exists in the database, if not, add them
            const userRepository = getRepository(User);
            let userDb: User | null = await userRepository.findOne({
                where: { facebook: profile.emails[0].value }
            });

            if (!userDb) {
                // user does not exist yet => add account to user db
                user.facebook = profile.emails[0].value;
                user.aso = 0;
                // await userRepository.save(user);

                return done(null, user);
            }
            const { password, ...others } = userDb;
            if (userDb?.blocked) {
                return done("This account is blocked");
            }

            return done(null, others);
        } catch (error: any) {
            return done(error);
        }
    }
));


export default passport;
