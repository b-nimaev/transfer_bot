import mongoose, { Schema, model, ObjectId } from "mongoose";
import { User } from "telegraf/typings/core/types/typegram";
import { vote } from "./ISentence";

interface IUser extends User {
    _id?: ObjectId;
    phone?: number;
    is_admin?: boolean;
}

const userSchema: Schema<IUser> = new Schema<IUser>({
    id: { type: Number, required: true },
    username: { type: String, required: false },
    first_name: { type: String, required: false },
    last_name: { type: String, required: false },
    is_admin: { type: Boolean, required: false},
    phone: { type: Number, required: false },
}, {
    timestamps: true
});

const User = model<IUser>('User', userSchema);
export { User, IUser }
