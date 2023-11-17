import mongoose from 'mongoose';

// @ts-ignore
const username = encodeURIComponent("alexandr")
const password = encodeURIComponent(<string>process.env.password?.replace(/"/g, ''))

mongoose.connect(`mongodb://${username}:${password}@65.21.153.43:27017/transfer?authSource=admin`, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
} as any).catch(error => { console.error(error) });

mongoose.connection.on('connected', () => {
    console.log('Connected to MongoDB!');
});