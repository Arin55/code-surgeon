require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('./config/db');
const User = require('./models/User');
const Hospital = require('./models/Hospital');
const Medicine = require('./models/Medicine');

(async () => {
  try {
    await connectDB();

    // Create default admin
    const adminEmail = process.env.SEED_ADMIN_EMAIL || 'admin@hospital.com';
    const adminPass = process.env.SEED_ADMIN_PASS || 'Admin@12345';
    let admin = await User.findOne({ email: adminEmail });
    if (!admin) {
      admin = await User.create({
        name: process.env.SEED_ADMIN_NAME || 'Admin User',
        email: adminEmail,
        password: adminPass,
        role: 'admin',
        phone: '+91-90000-00000',
      });
      console.log(`Created admin: ${adminEmail} / ${adminPass}`);
    } else {
      console.log('Admin already exists:', adminEmail);
    }

    // Detailed Mumbai hospitals (upsert to avoid duplicates)
    const detailedMumbai = [
      {
        name: 'Lilavati Hospital',
        description: 'Bandra West, Mumbai | Cardiology, Neurology, Oncology | Rating 4.6 | Emergency 24×7',
        address: { city: 'Mumbai', state: 'Maharashtra', pincode: '400050' },
        contact: { phone: '+91 22 2675 1000', email: 'lilavati@example.com' },
        services: ['Doctor consultation', 'Medical tests', 'General visit', 'Cardiology', 'Neurology', 'Oncology'],
        image: 'https://images.unsplash.com/photo-1576765608637-3f7a0046f112?q=80&w=1200&auto=format&fit=crop'
      },
      {
        name: 'Kokilaben Dhirubhai Ambani Hospital',
        description: 'Andheri West, Mumbai | Multi-specialty, Robotic Surgery | Rating 4.5 | Emergency 24×7',
        address: { city: 'Mumbai', state: 'Maharashtra', pincode: '400053' },
        contact: { phone: '+91 22 4269 6969', email: 'kokilaben@example.com' },
        services: ['Doctor consultation', 'Medical tests', 'General visit', 'Robotic Surgery'],
        image: 'https://images.unsplash.com/photo-1584982751601-97dcc096659c?q=80&w=1200&auto=format&fit=crop'
      },
      {
        name: 'Hinduja Hospital',
        description: 'Mahim, Mumbai | Neurology, Orthopedics, ICU | Rating 4.4 | Emergency 24×7',
        address: { city: 'Mumbai', state: 'Maharashtra', pincode: '400016' },
        contact: { phone: '+91 22 2445 2222', email: 'hinduja@example.com' },
        services: ['Doctor consultation', 'Medical tests', 'General visit', 'Neurology', 'Orthopedics', 'ICU'],
        image: 'https://images.unsplash.com/photo-1585421514738-01798e348b17?q=80&w=1200&auto=format&fit=crop'
      },
      {
        name: 'Saifee Hospital',
        description: 'Charni Road, Mumbai | Cardiac Care, Surgery | Rating 4.3 | Emergency 24×7',
        address: { city: 'Mumbai', state: 'Maharashtra', pincode: '400004' },
        contact: { phone: '+91 22 6757 0111', email: 'saifee@example.com' },
        services: ['Doctor consultation', 'Medical tests', 'General visit', 'Cardiac Care', 'Surgery'],
        image: 'https://images.unsplash.com/photo-1578496781985-452f3c5a9d5b?q=80&w=1200&auto=format&fit=crop'
      },
      {
        name: 'Nanavati Max Super Speciality Hospital',
        description: 'Vile Parle West, Mumbai | Cancer Care, Neurosciences | Rating 4.4 | Emergency 24×7',
        address: { city: 'Mumbai', state: 'Maharashtra', pincode: '400056' },
        contact: { phone: '+91 22 2626 7500', email: 'nanavati@example.com' },
        services: ['Doctor consultation', 'Medical tests', 'General visit', 'Cancer Care', 'Neurosciences'],
        image: 'https://images.unsplash.com/photo-1584982551263-8551f1ef38c3?q=80&w=1200&auto=format&fit=crop'
      },
      {
        name: 'Jaslok Hospital',
        description: 'Pedder Road, Mumbai | General Medicine, Surgery | Rating 4.2 | Emergency 24×7',
        address: { city: 'Mumbai', state: 'Maharashtra', pincode: '400026' },
        contact: { phone: '+91 22 6657 3333', email: 'jaslok@example.com' },
        services: ['Doctor consultation', 'Medical tests', 'General visit', 'General Medicine', 'Surgery'],
        image: 'https://images.unsplash.com/photo-1583912267550-5fe6c4f71f3a?q=80&w=1200&auto=format&fit=crop'
      },
      {
        name: 'SevenHills Hospital',
        description: 'Andheri East, Mumbai | Emergency Care, Trauma | Rating 4.1 | Emergency 24×7',
        address: { city: 'Mumbai', state: 'Maharashtra', pincode: '400059' },
        contact: { phone: '+91 22 6767 6767', email: 'sevenhills@example.com' },
        services: ['Doctor consultation', 'Medical tests', 'General visit', 'Emergency Care', 'Trauma'],
        image: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?q=80&w=1200&auto=format&fit=crop'
      },
      {
        name: 'Bombay Hospital',
        description: 'Marine Lines, Mumbai | Cardiology, Oncology | Rating 4.3 | Emergency 24×7',
        address: { city: 'Mumbai', state: 'Maharashtra', pincode: '400020' },
        contact: { phone: '+91 22 2206 7676', email: 'bombayhospital@example.com' },
        services: ['Doctor consultation', 'Medical tests', 'General visit', 'Cardiology', 'Oncology'],
        image: 'https://images.unsplash.com/photo-1584982563207-54f43b66f1dd?q=80&w=1200&auto=format&fit=crop'
      },
      {
        name: 'Breach Candy Hospital',
        description: 'Breach Candy, Mumbai | Orthopedics, Diagnostics | Rating 4.5 | Emergency 24×7',
        address: { city: 'Mumbai', state: 'Maharashtra', pincode: '400026' },
        contact: { phone: '+91 22 2366 7777', email: 'breachcandy@example.com' },
        services: ['Doctor consultation', 'Medical tests', 'General visit', 'Orthopedics', 'Diagnostics'],
        image: 'https://images.unsplash.com/photo-1584982749377-4f4695b59a5b?q=80&w=1200&auto=format&fit=crop'
      },
      {
        name: 'Rajawadi Hospital',
        description: 'Ghatkopar East, Mumbai | General & Emergency Care | Rating 4.0 | Emergency 24×7',
        address: { city: 'Mumbai', state: 'Maharashtra', pincode: '400077' },
        contact: { phone: '+91 22 2511 1111', email: 'rajawadi@example.com' },
        services: ['Doctor consultation', 'Medical tests', 'General visit', 'Emergency Care'],
        image: 'https://images.unsplash.com/photo-1584433144859-1fc3ab64a957?q=80&w=1200&auto=format&fit=crop'
      },
    ];

    for (const h of detailedMumbai) {
      await Hospital.updateOne(
        { name: h.name },
        { $set: h },
        { upsert: true }
      );
    }
    console.log('Upserted detailed Mumbai hospitals (10).');

    // Sample medicines
    const medCount = await Medicine.countDocuments();
    if (medCount < 10) {
      await Medicine.insertMany([
        { name: 'Paracetamol 500mg', description: 'Pain reliever / fever reducer', price: 25, unit: 'strip', stock: 500 },
        { name: 'Ibuprofen 200mg', description: 'NSAID for pain and inflammation', price: 40, unit: 'strip', stock: 300 },
        { name: 'Cetirizine 10mg', description: 'Antihistamine for allergies', price: 30, unit: 'strip', stock: 400 },
        { name: 'Amoxicillin 500mg', description: 'Antibiotic', price: 85, unit: 'strip', stock: 200 },
        { name: 'Azithromycin 500mg', description: 'Antibiotic', price: 120, unit: 'strip', stock: 150 },
        { name: 'Omeprazole 20mg', description: 'Acidity/GERD', price: 50, unit: 'strip', stock: 350 },
        { name: 'ORS Pack', description: 'Oral rehydration salts', price: 15, unit: 'pack', stock: 600 },
        { name: 'Vitamin C 500mg', description: 'Supplement', price: 60, unit: 'strip', stock: 250 },
        { name: 'Zinc 50mg', description: 'Supplement', price: 55, unit: 'strip', stock: 240 },
        { name: 'Cough Syrup 100ml', description: 'Cough suppressant', price: 75, unit: 'bottle', stock: 180 },
      ]);
      console.log('Inserted 10 medicines.');
    } else {
      console.log('Medicines already present:', medCount);
    }
  } catch (e) {
    console.error('Seed error', e);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
})();
