// src/scripts/views/pages/favorites-page.js

import { createStoryItemTemplate, createEmptyFavoritesTemplate } from '../../templates/template-creator';
import FavoriteStoryIdb from '../../utils/favorite-story-idb';
import LoadingInitiator from '../../utils/loading-initiator';
import NotificationHelper from '../../utils/notification-helper';

const FavoritesPage = {
  async render() {
    return `
      <div class="content">
        <h1>Cerita Favorit</h1>
        <div id="favorites" class="story-list"></div>
      </div>
    `;
  },

  async afterRender() {
    this._showLoading();
    try {
      const favorites = await FavoriteStoryIdb.getAllStories();
      this._hideLoading();
      
      const favoritesContainer = document.getElementById('favorites');
      
      if (favorites.length === 0) {
        favoritesContainer.innerHTML = createEmptyFavoritesTemplate();
        return;
      }
      
      favoritesContainer.innerHTML = '';
      favorites.forEach((story) => {
        favoritesContainer.innerHTML += createStoryItemTemplate(story, true);
      });
      
      this._initFavoriteButtons();
    } catch (error) {
      this._hideLoading();
      this._showError(error.message);
    }
  },
  
  _initFavoriteButtons() {
    const favoriteButtons = document.querySelectorAll('.favorite-button');
    favoriteButtons.forEach((button) => {
      button.addEventListener('click', async (event) => {
        event.stopPropagation();
        const id = event.currentTarget.dataset.id;
        
        try {
          await FavoriteStoryIdb.deleteStory(id);
          NotificationHelper.showToast('Cerita berhasil dihapus dari favorit');
          this.afterRender();
        } catch (error) {
          NotificationHelper.showToast(`Gagal menghapus dari favorit: ${error.message}`);
        }
      });
    });
  },
  
  _showLoading() {
    LoadingInitiator.showLoading();
  },
  
  _hideLoading() {
    LoadingInitiator.hideLoading();
  },
  
  _showError(message) {
    const favoritesContainer = document.getElementById('favorites');
    favoritesContainer.innerHTML = `
      <div class="error-container">
        <h3>Error</h3>
        <p>${message}</p>
        <button id="retryButton" class="btn-primary">Coba Lagi</button>
      </div>
    `;
    
    document.getElementById('retryButton')?.addEventListener('click', () => {
      this.afterRender();
    });
  }
};

export default FavoritesPage;