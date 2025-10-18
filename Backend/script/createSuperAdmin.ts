import mongoose from 'mongoose';
import { User } from '../src/models/User';
import { Category } from '../src/models/Category';
import connectDB from '../src/config/mongodb';

async function createSuperAdmin() {
  try {
    await connectDB();
    
    // Create super admin (your existing code)
    const existingAdmin = await User.findOne({ 
      role: 'admin',
      'adminProfile.adminLevel': 'super'
    });
    
    if (!existingAdmin) {
      const superAdmin = new User({
        fullName: 'System Administrator',
        email: 'admin@college.edu',
        username: 'superadmin',
        password: 'SuperAdmin123!',
        role: 'admin',
        collegeName: 'ABC University',
        department: 'Administration',
        adminProfile: {
          adminLevel: 'super',
          permissions: [
            'manage_users',
            'manage_admins', 
            'manage_clubs',
            'moderate_posts',
            'system_settings',
            'create_categories'
          ],
          canModerate: true,
          canManageClubs: true
        },
        isActive: true,
        isVerified: true
      });
      
      await superAdmin.save();
      console.log('✅ Super admin created successfully!');
    } else {
      console.log('✅ Super admin already exists:', existingAdmin.email);
    }

    // ✅ ADD: Create default categories
    const categories = [
      { name: 'General', slug: 'general', description: 'General announcements and discussions' },
      { name: 'Academic', slug: 'academic', description: 'Academic related content' },
      { name: 'Events', slug: 'events', description: 'Events and activities' },
      { name: 'Technical', slug: 'technical', description: 'Technical discussions and workshops' },
      { name: 'Cultural', slug: 'cultural', description: 'Cultural events and activities' },
      { name: 'Sports', slug: 'sports', description: 'Sports and fitness activities' }
    ];

    for (const catData of categories) {
      const existing = await Category.findOne({ slug: catData.slug });
      if (!existing) {
        const category = new Category({
          ...catData,
          isActive: true,
          displayOrder: categories.indexOf(catData)
        });
        await category.save();
        console.log(`✅ Created category: ${category.name} (ID: ${category._id})`);
      } else {
        console.log(`📝 Category exists: ${existing.name} (ID: ${existing._id})`);
      }
    }
    
  } catch (error) {
    console.error('❌ Failed to create super admin/categories:', error);
  } finally {
    await mongoose.connection.close();
  }
}

createSuperAdmin();
