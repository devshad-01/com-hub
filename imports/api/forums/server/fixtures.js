import { Meteor } from 'meteor/meteor';
import { ForumCategories, ForumPosts, ForumReplies, ForumTags } from '../collections';

Meteor.startup(async () => {
  // Create default forum categories if none exist
  const categoryCount = await ForumCategories.countDocuments();
  
  if (categoryCount === 0) {
    console.log('Creating default forum categories...');
    
    const defaultCategories = [
      {
        name: 'Announcements',
        description: 'Official announcements and important updates from the community leadership',
        icon: '📢',
        color: '#3B82F6',
        slug: 'announcements',
        order: 1,
        postCount: 0,
        lastPostAt: null,
        lastPostId: null,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Faith & Life',
        description: 'Discussions about faith, spiritual growth, and Christian living',
        icon: '✝️',
        color: '#10B981',
        slug: 'faith-life',
        order: 2,
        postCount: 0,
        lastPostAt: null,
        lastPostId: null,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Prayer Requests',
        description: 'Share your prayer requests and pray for others in our community',
        icon: '🙏',
        color: '#8B5CF6',
        slug: 'prayer',
        order: 3,
        postCount: 0,
        lastPostAt: null,
        lastPostId: null,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Event Discussions',
        description: 'Talk about upcoming events, share experiences, and coordinate activities',
        icon: '📅',
        color: '#F59E0B',
        slug: 'events',
        order: 4,
        postCount: 0,
        lastPostAt: null,
        lastPostId: null,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Support & Encouragement',
        description: 'Find support, encouragement, and fellowship in times of need',
        icon: '🤝',
        color: '#EC4899',
        slug: 'support',
        order: 5,
        postCount: 0,
        lastPostAt: null,
        lastPostId: null,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'General Discussion',
        description: 'General topics and conversations that don\'t fit other categories',
        icon: '💭',
        color: '#06B6D4',
        slug: 'general',
        order: 6,
        postCount: 0,
        lastPostAt: null,
        lastPostId: null,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    for (const category of defaultCategories) {
      await ForumCategories.insertAsync(category);
    }
    
    console.log('Default forum categories created successfully!');
  }

  // Create some default tags if none exist
  const tagCount = await ForumTags.countDocuments();
  
  if (tagCount === 0) {
    console.log('Creating default forum tags...');
    
    const defaultTags = [
      { name: 'welcome', usageCount: 0, color: '#3B82F6', createdAt: new Date(), updatedAt: new Date() },
      { name: 'community', usageCount: 0, color: '#10B981', createdAt: new Date(), updatedAt: new Date() },
      { name: 'prayer', usageCount: 0, color: '#8B5CF6', createdAt: new Date(), updatedAt: new Date() },
      { name: 'sermon', usageCount: 0, color: '#F59E0B', createdAt: new Date(), updatedAt: new Date() },
      { name: 'bible-study', usageCount: 0, color: '#EC4899', createdAt: new Date(), updatedAt: new Date() },
      { name: 'fellowship', usageCount: 0, color: '#06B6D4', createdAt: new Date(), updatedAt: new Date() },
      { name: 'service', usageCount: 0, color: '#84CC16', createdAt: new Date(), updatedAt: new Date() },
      { name: 'testimony', usageCount: 0, color: '#F97316', createdAt: new Date(), updatedAt: new Date() },
      { name: 'youth', usageCount: 0, color: '#6366F1', createdAt: new Date(), updatedAt: new Date() },
      { name: 'family', usageCount: 0, color: '#14B8A6', createdAt: new Date(), updatedAt: new Date() }
    ];

    for (const tag of defaultTags) {
      await ForumTags.insertAsync(tag);
    }
    
    console.log('Default forum tags created successfully!');
  }

  // Create sample posts with images if no posts exist
  const postCount = await ForumPosts.countDocuments();
  
  if (postCount === 0) {
    console.log('Creating sample forum posts with images...');
    
    // Get the first user (admin) to use as author
    const adminUser = await Meteor.users.findOneAsync();
    if (!adminUser) {
      console.log('No users found, skipping sample posts creation');
      return;
    }
    
    // Get categories for sample posts
    const announcementCategory = await ForumCategories.findOneAsync({ slug: 'announcements' });
    const faithCategory = await ForumCategories.findOneAsync({ slug: 'faith-life' });
    const generalCategory = await ForumCategories.findOneAsync({ slug: 'general' });
    
    const samplePosts = [
      {
        title: 'Welcome to Our Community Forum!',
        content: 'We\'re excited to launch our new community forum! This is a place where we can connect, share, and grow together. Feel free to introduce yourself and share what brings you joy in your faith journey.',
        categoryId: announcementCategory._id,
        authorId: adminUser._id,
        tags: ['welcome', 'community', 'announcement'],
        images: [
          'https://images.unsplash.com/photo-1529070538774-1843cb3265df?w=800&h=400&fit=crop&crop=center',
          'https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=800&h=400&fit=crop&crop=center'
        ],
        pinned: true,
        locked: false,
        replyCount: 0,
        views: 0,
        likes: [],
        dislikes: [],
        lastReplyAt: new Date(),
        lastReplyId: null,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        title: 'Sunday Service Highlights',
        content: 'What an amazing service we had today! Pastor John\'s message on faith and community really touched my heart. Here are some photos from today\'s service and fellowship time.',
        categoryId: faithCategory._id,
        authorId: adminUser._id,
        tags: ['service', 'fellowship', 'community'],
        images: [
          'https://images.unsplash.com/photo-1438032005730-c779502df39b?w=800&h=400&fit=crop&crop=center'
        ],
        pinned: false,
        locked: false,
        replyCount: 3,
        views: 24,
        likes: [adminUser._id],
        dislikes: [],
        lastReplyAt: new Date(),
        lastReplyId: null,
        createdAt: new Date(Date.now() - 86400000), // 1 day ago
        updatedAt: new Date(Date.now() - 86400000)
      },
      {
        title: 'Youth Group Adventure Photos',
        content: 'Our youth group had an incredible time at the adventure park last weekend! Check out these amazing photos from our day of fun, fellowship, and team building. Can\'t wait for our next adventure!',
        categoryId: generalCategory._id,
        authorId: adminUser._id,
        tags: ['youth', 'fellowship', 'adventure'],
        images: [
          'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=800&h=400&fit=crop&crop=center',
          'https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=800&h=400&fit=crop&crop=center',
          'https://images.unsplash.com/photo-1529070538774-1843cb3265df?w=800&h=400&fit=crop&crop=center',
          'https://images.unsplash.com/photo-1438032005730-c779502df39b?w=800&h=400&fit=crop&crop=center'
        ],
        pinned: false,
        locked: false,
        replyCount: 8,
        views: 45,
        likes: [adminUser._id],
        dislikes: [],
        lastReplyAt: new Date(Date.now() - 3600000), // 1 hour ago
        lastReplyId: null,
        createdAt: new Date(Date.now() - 172800000), // 2 days ago
        updatedAt: new Date(Date.now() - 172800000)
      },
      {
        title: 'Bible Study Group Photos',
        content: 'Our weekly Bible study group continues to grow! Here are some wonderful moments from last night\'s study on Romans. Such deep discussions and meaningful fellowship.',
        categoryId: faithCategory._id,
        authorId: adminUser._id,
        tags: ['bible-study', 'fellowship', 'growth'],
        images: [
          'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=400&fit=crop&crop=center',
          'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=800&h=400&fit=crop&crop=center',
          'https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=800&h=400&fit=crop&crop=center'
        ],
        pinned: false,
        locked: false,
        replyCount: 5,
        views: 32,
        likes: [],
        dislikes: [],
        lastReplyAt: new Date(Date.now() - 7200000), // 2 hours ago
        lastReplyId: null,
        createdAt: new Date(Date.now() - 259200000), // 3 days ago
        updatedAt: new Date(Date.now() - 259200000)
      }
    ];

    for (const post of samplePosts) {
      const postId = await ForumPosts.insertAsync(post);
      
      // Update category post count
      await ForumCategories.updateAsync(post.categoryId, {
        $inc: { postCount: 1 },
        $set: {
          lastPostAt: post.createdAt,
          lastPostId: postId
        }
      });
      
      // Update tag usage count
      for (const tagName of post.tags) {
        await ForumTags.updateAsync(
          { name: tagName },
          { $inc: { usageCount: 1 } }
        );
      }
    }
    
    console.log('Sample forum posts with images created successfully!');
  }
});
