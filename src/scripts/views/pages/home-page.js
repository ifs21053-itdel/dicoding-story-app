// src/scripts/views/pages/home-page.js

import { createStoryItemTemplate } from '../../templates/template-creator';
import LoadingInitiator from '../../utils/loading-initiator';
import MapInitiator from '../../utils/map-initiator';
import HomePresenter from '../../presenters/home-presenter';
import NotificationSettings from '../components/notification-settings';
import NotificationHelper from '../../utils/notification-helper';
import Auth from '../../utils/auth';

const HomePage = {
  async render() {
    return `
      <div class="content">
        <h1>Dicoding Story</h1>
        
        <!-- Notification Settings for logged in users -->
        ${Auth.isLoggedIn() ? '<div id="notificationSettings"></div>' : ''}
        
        <div id="storyMap" class="story-detail__map"></div>
        <div id="stories" class="story-list"></div>
      </div>
    `;
  },

  async afterRender() {
    // Render notification settings for logged in users
    if (Auth.isLoggedIn()) {
      const notificationSettingsEl = document.getElementById('notificationSettings');
      if (notificationSettingsEl) {
        notificationSettingsEl.innerHTML = NotificationSettings.render();
        await NotificationSettings.afterRender();
      }
    }

    // Inisialisasi presenter
    this._presenter = new HomePresenter({
      view: this,
    });
    
    // Minta data stories dari presenter
    await this._presenter.getAllStories();
  },
  
  // View methods
  showLoading() {
    LoadingInitiator.showLoading();
  },
  
  hideLoading() {
    LoadingInitiator.hideLoading();
  },
  
  showToast(message) {
    NotificationHelper.showToast(message);
  },
  
  showLoginMessage() {
    const storiesContainer = document.querySelector('#stories');
    const mapElement = document.getElementById('storyMap');
    
    // Sembunyikan peta untuk user yang tidak login
    if (mapElement) {
      mapElement.style.display = 'none';
    }
    
    // Tampilkan welcome message dengan layout yang lebih seimbang
    storiesContainer.innerHTML = `
      <div class="welcome-container">
        <!-- Logo dan Header -->
        <div class="welcome-header">
          <div class="logo-container">
            <img src="./images/logo.png" alt="Dicoding Story Logo" class="welcome-logo">
          </div>
          <h2>Welcome to Dicoding Story</h2>
          <p>Share your Dicoding experiences with the community.</p>
          
          <!-- Login/Register di bawah deskripsi -->
          <div class="auth-buttons">
            <p>Please login or register to see stories from other members.</p>
            <div class="btn-container">
              <a href="#/login" class="btn-primary">Login</a>
              <a href="#/register" class="btn-outline">Register</a>
            </div>
          </div>
        </div>
        
        <!-- Features Section -->
        <div class="features-section">
          <h3>Why Join Dicoding Story?</h3>
          <div class="features-grid">
            <div class="feature-card">
              <div class="feature-icon">📝</div>
              <h4>Share Experiences</h4>
              <p>Share your Dicoding journey with other learners</p>
            </div>
            
            <div class="feature-card">
              <div class="feature-icon">🌍</div>
              <h4>Connect</h4>
              <p>See stories from others around the world</p>
            </div>
            
            <div class="feature-card">
              <div class="feature-icon">📸</div>
              <h4>Visual Stories</h4>
              <p>Add photos and locations to your stories</p>
            </div>
          </div>
        </div>
      </div>
    `;
  },
  
  showStories(stories) {
    const storiesContainer = document.querySelector('#stories');
    storiesContainer.innerHTML = '';
    
    stories.forEach((story) => {
      storiesContainer.innerHTML += createStoryItemTemplate(story, story.isFavorite);
    });
    
    // Tambahkan event listener untuk tombol favorit
    this._initFavoriteButtons();
  },
  
  _initFavoriteButtons() {
    const favoriteButtons = document.querySelectorAll('.favorite-button');
    favoriteButtons.forEach((button) => {
      button.addEventListener('click', async (event) => {
        event.stopPropagation();
        const id = event.currentTarget.dataset.id;
        await this._presenter.toggleFavorite(id);
      });
    });
  },
  
  showEmptyStories() {
    const storiesContainer = document.querySelector('#stories');
    storiesContainer.innerHTML = `
      <div class="empty-stories">
        <h3>No Stories Found</h3>
        <p>Be the first to share your Dicoding experience!</p>
        <a href="#/add" class="btn-primary">Add New Story</a>
      </div>
    `;
  },
  
  showError(message) {
    const storiesContainer = document.querySelector('#stories');
    storiesContainer.innerHTML = `
      <div class="error-container">
        <h3>Error</h3>
        <p>${message}</p>
        <button id="retryButton" class="btn-primary">Try Again</button>
      </div>
    `;
    
    document.getElementById('retryButton')?.addEventListener('click', () => {
      window.location.reload();
    });
  },
  
  async showMap(storyLocations) {
    try {
      const mapElement = document.getElementById('storyMap');
      if (mapElement) {
        if (storyLocations.length > 0) {
          const mapInitiator = new MapInitiator({ mapElement });
          await mapInitiator.init();
          mapInitiator.createMap(storyLocations);
        } else {
          mapElement.style.display = 'none';
        }
      }
    } catch (error) {
      console.error('Error initializing map:', error);
      const mapElement = document.getElementById('storyMap');
      if (mapElement) {
        mapElement.style.display = 'none';
      }
    }
  }
};

export default HomePage;