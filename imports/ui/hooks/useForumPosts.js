import { useState, useEffect, useCallback, useMemo } from 'react';
import { useTracker } from 'meteor/react-meteor-data';
import { Meteor } from 'meteor/meteor';
import { ForumPosts, ForumReplies, ForumPublications } from '../../api/forums';

/**
 * Custom hook for forum posts with infinite scroll pagination
 * Implements progressive loading similar to Twitter/Facebook
 */
export const useForumPosts = ({
  selectedCategory = 'all',
  searchTerm = '',
  sortBy = 'recent',
  initialLimit = 10
}) => {
  const [currentLimit, setCurrentLimit] = useState(initialLimit);
  const [allPosts, setAllPosts] = useState([]);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasReachedEnd, setHasReachedEnd] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentLimit(initialLimit);
    setAllPosts([]);
    setHasReachedEnd(false);
    setIsLoadingMore(false);
    setIsInitialLoad(true);
  }, [selectedCategory, searchTerm, sortBy, initialLimit]);

  // Main subscription with current limit
  const { posts, loading, repliesData } = useTracker(() => {
    const postSubParams = {
      categoryId: selectedCategory === 'all' ? null : selectedCategory,
      searchTerm: searchTerm || null,
      sortBy,
      limit: currentLimit,
      skip: 0
    };

    const postsHandle = Meteor.subscribe(ForumPublications.postsList, postSubParams);
    const usersHandle = Meteor.subscribe('usersBasic');

    const isLoading = !postsHandle.ready() || !usersHandle.ready();

    if (isLoading) {
      return {
        posts: [],
        loading: true,
        repliesData: []
      };
    }

    // Build query for posts
    let postQuery = {};
    if (selectedCategory !== 'all') {
      postQuery.categoryId = selectedCategory;
    }
    if (searchTerm) {
      postQuery.$or = [
        { title: { $regex: searchTerm, $options: 'i' } },
        { content: { $regex: searchTerm, $options: 'i' } },
        { tags: { $in: [new RegExp(searchTerm, 'i')] } }
      ];
    }

    // Build sort options
    let sortOptions = { createdAt: -1 };
    switch (sortBy) {
      case 'recent':
        sortOptions = { lastReplyAt: -1, createdAt: -1 };
        break;
      case 'popular':
        sortOptions = { likeCount: -1, createdAt: -1 };
        break;
      case 'replies':
        sortOptions = { replyCount: -1, createdAt: -1 };
        break;
      case 'views':
        sortOptions = { viewCount: -1, createdAt: -1 };
        break;
    }

    // Get posts from database
    const postsFromDB = ForumPosts.find(postQuery, { 
      sort: sortOptions,
      limit: currentLimit
    }).fetch();

    // Get replies for the current posts
    const postsIds = postsFromDB.map(post => post._id);
    let repliesData = [];
    
    if (postsIds.length > 0) {
      // Subscribe to replies for current posts
      const repliesHandles = postsIds.map(postId => 
        Meteor.subscribe(ForumPublications.repliesByPost, postId, {
          limit: 5, // Reduced for initial load
          sortBy: 'oldest'
        })
      );

      const repliesLoading = repliesHandles.some(handle => !handle.ready());
      
      if (!repliesLoading) {
        repliesData = ForumReplies.find({
          postId: { $in: postsIds }
        }, { sort: { createdAt: 1 } }).fetch();
      }
    }

    return {
      posts: postsFromDB,
      loading: false,
      repliesData
    };
  }, [selectedCategory, searchTerm, sortBy, currentLimit]);

  // Update accumulated posts when new data arrives
  useEffect(() => {
    if (!loading && posts.length >= 0) {
      setIsInitialLoad(false); // Mark that we've received data
      
      if (posts.length > 0) {
        setAllPosts(prevPosts => {
          // If this is the first load or filters changed, replace all posts
          if (currentLimit === initialLimit) {
            return posts;
          }
          
          // For subsequent loads, merge new posts carefully
          const existingIds = new Set(prevPosts.map(p => p && p._id).filter(Boolean));
          const newPosts = posts.filter(p => p && p._id && !existingIds.has(p._id));
          
          // Only add genuinely new posts
          const mergedPosts = [...prevPosts, ...newPosts];
          
          // Remove any duplicates as a safety measure
          const uniquePosts = mergedPosts.filter((post, index, arr) => 
            post && post._id && arr.findIndex(p => p && p._id === post._id) === index
          );
          
          return uniquePosts;
        });
      }

      // Check if we've reached the end
      if (posts.length < currentLimit) {
        setHasReachedEnd(true);
      }
      
      setIsLoadingMore(false);
    }
  }, [posts, loading, currentLimit, initialLimit]);

  // Load more posts
  const loadMore = useCallback(() => {
    if (loading || isLoadingMore || hasReachedEnd) return;
    
    setIsLoadingMore(true);
    setCurrentLimit(prev => prev + initialLimit);
  }, [loading, isLoadingMore, hasReachedEnd, initialLimit]);

  // Separate pinned and regular posts
  const { pinnedPosts, regularPosts } = useMemo(() => {
    // Filter out any undefined posts
    const validPosts = allPosts.filter(post => post && post._id);
    
    const pinned = validPosts.filter(post => post.pinned);
    const regular = validPosts.filter(post => !post.pinned);
    return { pinnedPosts: pinned, regularPosts: regular };
  }, [allPosts]);

  return {
    pinnedPosts,
    regularPosts,
    allReplies: repliesData,
    loading: loading && isInitialLoad, // Show loading spinner only for initial load
    isLoadingMore,
    hasMore: !hasReachedEnd,
    loadMore,
    totalLoaded: regularPosts.length // Count only regular posts for infinite scroll
  };
};
