import mongoose, { Schema, model, ObjectId } from "mongoose";

interface ICar {
    _id?: ObjectId;
    name: string;
}

const carSchema: Schema<ICar> = new Schema<ICar>({
    name: { type: String, required: true },
}, {
    timestamps: true
});

const CarModel = model<ICar>('cars', carSchema);
export { ICar, CarModel }
