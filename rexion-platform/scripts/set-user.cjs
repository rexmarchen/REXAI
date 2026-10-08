const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const uri = 'mongodb+srv://anshuar9065_db_user:Anshu_90-@cluster0.ytzioe4.mongodb.net/rexion?appName=Cluster0';

async function run() {
  try {
    await mongoose.connect(uri);
    const db = mongoose.connection.db;
    const usersColl = db.collection('users');
    
    const email = 'anshuar9065@gmail.com';
    const user = await usersColl.findOne({ email });
    console.log('Current user in MongoDB:', user ? { _id: user._id, email: user.email, name: user.name, hasPassword: !!user.password } : 'NOT FOUND');
    
    const hash = await bcrypt.hash('password123', 10);
    if (user) {
      await usersColl.updateOne({ _id: user._id }, { $set: { password: hash } });
      console.log(`Updated password for ${email} -> password123`);
    } else {
      await usersColl.insertOne({
        name: 'Anshu Pal',
        email: email,
        password: hash,
        role: 'admin',
        plan: 'elite',
        createdAt: new Date(),
        updatedAt: new Date()
      });
      console.log(`Created new account for ${email} with password -> password123`);
    }
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await mongoose.disconnect();
    console.log('Done.');
  }
}

run();
