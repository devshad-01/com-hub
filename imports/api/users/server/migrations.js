// imports/api/users/server/migrations.js
import { Meteor } from 'meteor/meteor';
import { Roles } from 'meteor/alanning:roles';
import { ROLES } from '../roles';

// Migration for converting profile.role to proper roles
export const migrateUserRoles = async () => {
  if (!Meteor.isServer) return;
  
  // Check if migration has already run by checking for a migration marker in the database
  const migrationMarker = await Meteor.users.findOneAsync({ 
    'services.migration.userRolesMigrationCompleted': true 
  });
  
  if (migrationMarker) {
    console.log('✅ User role migration already completed, skipping...');
    return;
  }
  
  console.log('Starting user role migration...');
  
  try {
    // Get users created before the last few minutes (to avoid new users still being processed)
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const users = await Meteor.users.find({
      createdAt: { $lt: fiveMinutesAgo }
    }).fetchAsync();
    console.log(`Found ${users.length} users to migrate (excluding recent users)`);
    
    // Track success/failures
    let successes = 0;
    let failures = 0;
    
    // Process each user
    for (const user of users) {
      try {
        // Get the existing role from profile
        const oldRole = user.profile?.role;
        
        if (!oldRole) {
          console.log(`User ${user._id} has no role, adding default member role`);
          await Roles.addUsersToRolesAsync(user._id, ROLES.MEMBER);
          successes++;
          continue;
        }
        
        // Map old roles to new roles
        const roleMapping = {
          'admin': ROLES.ADMIN,
          'moderator': ROLES.MODERATOR,
          'member': ROLES.MEMBER
        };
        
        const newRole = roleMapping[oldRole] || ROLES.MEMBER;
        
        // Get user's current roles - use async version
        const currentRoles = await Roles.getRolesForUserAsync(user._id);
        
        // Only add the role if they don't already have it
        if (!currentRoles.includes(newRole)) {
          await Roles.addUsersToRolesAsync(user._id, newRole);
          console.log(`Migrated user ${user._id} from profile.role=${oldRole} to Roles=${newRole}`);
        } else {
          console.log(`User ${user._id} already has role ${newRole}, skipping`);
        }
        
        // Increment success counter
        successes++;
      } catch (error) {
        console.error(`Error migrating user ${user._id}:`, error);
        failures++;
      }
    }
    
    console.log(`User role migration complete. Successes: ${successes}, Failures: ${failures}`);
    
    // Mark migration as completed by adding a marker to the first admin user or creating a system record
    const firstUser = await Meteor.users.findOneAsync({});
    if (firstUser) {
      await Meteor.users.updateAsync(firstUser._id, {
        $set: {
          'services.migration.userRolesMigrationCompleted': true,
          'services.migration.migrationDate': new Date()
        }
      });
      console.log('✅ Migration completion marker added');
    }
  } catch (error) {
    console.error('Error in user role migration:', error);
  }
};
