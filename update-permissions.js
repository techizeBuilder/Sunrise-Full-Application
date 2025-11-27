const mongoose = require('mongoose');
require('dotenv').config();

import { updatePermissionStructure } from './server/utils/updatePermissionStructure.js';

const runUpdate = async () => {
  try {
    console.log('Connecting to database...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to database');
    
    console.log('Running permission structure update...');
    const result = await updatePermissionStructure();
    
    console.log('Update result:', result);
    
    console.log('Closing database connection...');
    await mongoose.connection.close();
    console.log('Update completed');
    
  } catch (error) {
    console.error('Update failed:', error);
    process.exit(1);
  }
};

runUpdate();