const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../../.env') });

const WardrobeItem = require('../models/WardrobeItem');
const Outfit = require('../models/Outfit');
const WearRecord = require('../models/WearRecord');
const User = require('../models/User');

const demoItems = [
  {
    name: 'Blue Ethnic Kurti',
    category: 'kurti',
    color: 'blue',
    pattern: 'Printed',
    season: 'Summer / All Season',
    notes: 'Soft breathable cotton, perfect for work',
    imageUrl: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=600&auto=format&fit=crop&q=80',
  },
  {
    name: 'Green Embroidered Kurti',
    category: 'kurti',
    color: 'green',
    pattern: 'Embroidered',
    season: 'Festive / All Season',
    notes: 'Silk blend straight kurti',
    imageUrl: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=600&auto=format&fit=crop&q=80',
  },
  {
    name: 'Classic Black Linen Shirt',
    category: 'shirt',
    color: 'black',
    pattern: 'Solid',
    season: 'All Season',
    notes: 'Formal button-down linen shirt',
    imageUrl: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=600&auto=format&fit=crop&q=80',
  },
  {
    name: 'Crisp White Oxford Shirt',
    category: 'shirt',
    color: 'white',
    pattern: 'Solid',
    season: 'All Season',
    notes: 'Essential white button up shirt',
    imageUrl: 'https://images.unsplash.com/photo-1598033129183-c4f50c736f10?w=600&auto=format&fit=crop&q=80',
  },
  {
    name: 'Dusty Pink Satin Top',
    category: 'top',
    color: 'pink',
    pattern: 'Solid',
    season: 'Spring / Summer',
    notes: 'V-neck satin finish top',
    imageUrl: 'https://images.unsplash.com/photo-1564257631407-4deb1f99d992?w=600&auto=format&fit=crop&q=80',
  },
  {
    name: 'Tailored Beige Trousers',
    category: 'pants',
    color: 'beige',
    pattern: 'Solid',
    season: 'All Season',
    notes: 'High-waisted office pants',
    imageUrl: 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=600&auto=format&fit=crop&q=80',
  },
  {
    name: 'Slim Fit Black Pants',
    category: 'pants',
    color: 'black',
    pattern: 'Solid',
    season: 'All Season',
    notes: 'Comfortable stretch cotton trousers',
    imageUrl: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=600&auto=format&fit=crop&q=80',
  },
  {
    name: 'Straight White Wide Pants',
    category: 'pants',
    color: 'white',
    pattern: 'Solid',
    season: 'Summer',
    notes: 'Wide leg relaxed fit pants',
    imageUrl: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=600&auto=format&fit=crop&q=80',
  },
  {
    name: 'Classic Blue Denim Jeans',
    category: 'jeans',
    color: 'blue',
    pattern: 'Solid',
    season: 'All Season',
    notes: 'High rise straight fit denim',
    imageUrl: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=600&auto=format&fit=crop&q=80',
  },
  {
    name: 'Silk Floral Printed Scarf',
    category: 'scarf',
    color: 'pink',
    pattern: 'Floral',
    season: 'All Season',
    notes: 'Soft lightweight silk printed scarf / dupatta',
    imageUrl: 'https://images.unsplash.com/photo-1601924994987-69e26d50dc26?w=600&auto=format&fit=crop&q=80',
  },
];

const seedData = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/wardrobedetect';
    console.log(`Connecting to ${mongoUri}...`);
    await mongoose.connect(mongoUri);

    console.log('Clearing old sample data...');
    await WardrobeItem.deleteMany({ userId: 'default-user' });
    await Outfit.deleteMany({ userId: 'default-user' });
    await WearRecord.deleteMany({ userId: 'default-user' });
    await User.deleteMany({});

    console.log('Creating demo user...');
    await User.create({ name: 'Fashion User', email: 'fashion@example.com' });

    console.log('Inserting wardrobe items...');
    const insertedItems = await WardrobeItem.insertMany(
      demoItems.map((item) => ({ ...item, userId: 'default-user' }))
    );

    console.log(`✓ Inserted ${insertedItems.length} wardrobe items.`);

    // Create sample wear history (for past dates)
    const blueKurti = insertedItems.find((i) => i.name.includes('Blue Ethnic'));
    const blackPants = insertedItems.find((i) => i.name.includes('Black Pants'));
    const greenKurti = insertedItems.find((i) => i.name.includes('Green Embroidered'));
    const whitePants = insertedItems.find((i) => i.name.includes('White Wide'));
    const whiteShirt = insertedItems.find((i) => i.name.includes('White Oxford'));
    const jeans = insertedItems.find((i) => i.name.includes('Blue Denim'));

    const pastDates = [
      { date: '2026-09-08', items: [blueKurti._id, blackPants._id] },
      { date: '2026-09-05', items: [greenKurti._id, whitePants._id] },
      { date: '2026-09-01', items: [whiteShirt._id, jeans._id] },
      { date: '2026-08-25', items: [blueKurti._id, whitePants._id] },
    ];

    for (const record of pastDates) {
      const outfit = await Outfit.create({
        userId: 'default-user',
        date: record.date,
        itemIds: record.items,
        source: 'manual',
      });

      for (const itemId of record.items) {
        await WearRecord.create({
          userId: 'default-user',
          wardrobeItemId: itemId,
          outfitId: outfit._id,
          wornDate: record.date,
        });

        // Update item total wear count
        const count = await WearRecord.countDocuments({ wardrobeItemId: itemId });
        await WardrobeItem.findByIdAndUpdate(itemId, {
          wearCount: count,
          lastWornAt: new Date(record.date),
        });
      }
    }

    console.log('✓ Seeded historical wear records.');
    console.log('🎉 Seed complete! Database ready.');
    process.exit(0);
  } catch (err) {
    console.error('Error seeding data:', err);
    process.exit(1);
  }
};

seedData();
