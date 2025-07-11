import { useTracker } from 'meteor/react-meteor-data';
import { Meteor } from 'meteor/meteor';
import { useState } from 'react';
import { MessagesCollection } from '../../api/messages';

export const useMembers = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [limit, setLimit] = useState(20);

  const result = useTracker(() => {
    const user = Meteor.user();
    
    if (!user) {
      return {
        user: null,
        members: [],
        loading: false,
        conversations: new Map()
      };
    }
    
    // Subscribe to members list
    const membersHandle = Meteor.subscribe('membersList', {
      search: searchTerm,
      limit: limit
    });

    // Subscribe to user conversations
    const conversationsHandle = Meteor.subscribe('userConversations');

    const loading = !membersHandle.ready() || !conversationsHandle.ready();

    if (loading) {
      return {
        user,
        members: [],
        loading: true,
        conversations: new Map()
      };
    }

    // Get members
    let membersSelector = {};
    
    // Apply filters
    if (selectedFilter === 'online') {
      membersSelector['status.online'] = true;
    } else if (selectedFilter === 'admins') {
      // Use the roleAssignment collection instead of profile.role
      // We'll handle the admin filtering after fetching
      // This is a client-side operation as roleAssignment collection is published
    }

    // Fetch members based on the selector
    let members = Meteor.users.find(membersSelector, {
      sort: { 
        'status.online': -1,
        'status.lastActivity': -1,
        createdAt: -1 
      }
    }).fetch().filter(member => member._id !== user._id);
    
    // If admin filter is applied, filter by role assignments
    if (selectedFilter === 'admins') {
      // Get all role assignments for 'admin' role
      const adminAssignments = Meteor.roleAssignment.find({ 
        'role._id': 'admin' 
      }).fetch();
      
      // Get user IDs who have admin role
      const adminUserIds = adminAssignments.map(assignment => assignment.user._id);
      
      // Filter members to only those with admin role
      members = members.filter(member => adminUserIds.includes(member._id));
    }

    // Get conversations data
    const conversationsMap = new Map();
    
    try {
      const allDirectMessages = MessagesCollection.find({
        type: 'direct',
        $or: [
          { senderId: user._id },
          { recipientId: user._id }
        ]
      }, { sort: { createdAt: -1 } }).fetch();

      // Build conversations map
      allDirectMessages.forEach(msg => {
        const otherUserId = msg.senderId === user._id ? msg.recipientId : msg.senderId;
        if (!conversationsMap.has(otherUserId)) {
          const unreadCount = allDirectMessages.filter(m => 
            m.senderId === otherUserId && 
            m.recipientId === user._id && 
            !m.read
          ).length;
          
          conversationsMap.set(otherUserId, {
            lastMessage: msg,
            unreadCount
          });
        }
      });
    } catch (error) {
      console.warn('Error loading conversations:', error);
    }

    return {
      user,
      members,
      loading: false,
      conversations: conversationsMap
    };
  }, [searchTerm, selectedFilter, limit]);

  return {
    ...result,
    searchTerm,
    setSearchTerm,
    selectedFilter,
    setSelectedFilter,
    limit,
    setLimit
  };
};
