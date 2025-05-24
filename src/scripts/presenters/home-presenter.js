// src/scripts/presenters/home-presenter.js

import StoryModel from '../models/story-model';
import Auth from '../utils/auth';
import FavoriteStoryIdb from '../utils/favorite-story-idb';

class HomePresenter {
  constructor({ view }) {
    this._view = view;
    this._storyModel = StoryModel;
    this._stories = [];
  }
  
  async getAllStories() {
    try {
      // Memberi tahu view untuk menampilkan loading
      this._view.showLoading();
      
      // PERBAIKAN: Cek status login terlebih dahulu
      if (!Auth.isLoggedIn()) {
        // Jika tidak login, tampilkan welcome page dan sembunyikan loading
        console.log('User not logged in, showing welcome message');
        this._view.showLoginMessage();
        return;
      }
      
      console.log('User logged in, fetching stories');
      
      // Ambil data dari model
      const response = await this._storyModel.getAllStories(1, 10, 1);
      
      // Debug response
      console.log('API Response:', response);
      
      // Proses response dan beri instruksi ke view untuk menampilkan
      if (response.error) {
        console.error('Error from API:', response.message);
        this._view.showError(response.message);
        return;
      }
      
      if (!response.listStory || response.listStory.length === 0) {
        console.log('No stories found');
        this._view.showEmptyStories();
        return;
      }
      
      console.log(`Found ${response.listStory.length} stories`);
      
      // Simpan stories di presenter
      this._stories = response.listStory;
      
      // Cek status favorit untuk setiap cerita
      await this._checkFavoriteStatus();
      
      // Tampilkan stories melalui view
      this._view.showStories(this._stories);
      
      // Persiapkan data lokasi untuk peta dan serahkan ke view untuk ditampilkan
      const storyLocations = this._stories
        .filter((story) => story.lat && story.lon)
        .map((story) => ({
          lat: story.lat,
          lng: story.lon,
          name: story.name,
          description: story.description,
          photoUrl: story.photoUrl,
        }));
      
      console.log(`Found ${storyLocations.length} stories with locations`);
      
      if (storyLocations.length > 0) {
        this._view.showMap(storyLocations);
      }
      
    } catch (error) {
      console.error('Error in getAllStories:', error);
      this._view.showError(error.message);
    } finally {
      this._view.hideLoading();
    }
  }
  
  async _checkFavoriteStatus() {
    try {
      const favoriteStories = await FavoriteStoryIdb.getAllStories();
      const favoriteIds = favoriteStories.map(story => story.id);
      
      this._stories = this._stories.map(story => ({
        ...story,
        isFavorite: favoriteIds.includes(story.id)
      }));
    } catch (error) {
      console.error('Error checking favorite status:', error);
    }
  }
  
  async toggleFavorite(id) {
    try {
      const story = this._stories.find(s => s.id === id);
      if (!story) return;
      
      const existingFavorite = await FavoriteStoryIdb.getStory(id);
      
      if (existingFavorite) {
        // Hapus dari favorit
        await FavoriteStoryIdb.deleteStory(id);
        this._view.showToast('Cerita dihapus dari favorit');
      } else {
        // Tambahkan ke favorit
        await FavoriteStoryIdb.putStory(story);
        this._view.showToast('Cerita ditambahkan ke favorit');
      }
      
      // Update data dan UI
      await this._checkFavoriteStatus();
      this._view.showStories(this._stories);
      
    } catch (error) {
      console.error('Error toggling favorite:', error);
      this._view.showError(`Gagal mengubah status favorit: ${error.message}`);
    }
  }
}

export default HomePresenter;