// src/scripts/utils/favorite-story-idb.js

// Import idb dari package yang sudah diinstall
import { openDB } from 'idb';

const DATABASE_NAME = 'dicoding-story-db';
const DATABASE_VERSION = 1;
const OBJECT_STORE_NAME = 'favorite-stories';

// Gunakan openDB dari idb package
const dbPromise = openDB(DATABASE_NAME, DATABASE_VERSION, {
  upgrade(database) {
    if (!database.objectStoreNames.contains(OBJECT_STORE_NAME)) {
      database.createObjectStore(OBJECT_STORE_NAME, { keyPath: 'id' });
    }
  },
});

const FavoriteStoryIdb = {
  async getStory(id) {
    if (!id) {
      return null;
    }
    return (await dbPromise).get(OBJECT_STORE_NAME, id);
  },

  async getAllStories() {
    return (await dbPromise).getAll(OBJECT_STORE_NAME);
  },

  async putStory(story) {
    if (!story.id) {
      return;
    }
    return (await dbPromise).put(OBJECT_STORE_NAME, story);
  },

  async deleteStory(id) {
    return (await dbPromise).delete(OBJECT_STORE_NAME, id);
  },

  async searchStories(query) {
    const allStories = await this.getAllStories();
    const lowerQuery = query.toLowerCase();
    
    return allStories.filter((story) => {
      const lowerName = story.name?.toLowerCase() || '';
      const lowerDescription = story.description?.toLowerCase() || '';
      
      return lowerName.includes(lowerQuery) || lowerDescription.includes(lowerQuery);
    });
  },
};

export default FavoriteStoryIdb;