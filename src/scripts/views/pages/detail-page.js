import UrlParser from '../../routes/url-parser';
import { createStoryDetailTemplate } from '../../templates/template-creator';
import LoadingInitiator from '../../utils/loading-initiator';
import MapInitiator from '../../utils/map-initiator';
import NotificationHelper from '../../utils/notification-helper';
import DetailPresenter from '../../presenters/detail-presenter';

const DetailPage = {
  async render() {
    return `
      <div id="story" class="story-detail"></div>
    `;
  },

  async afterRender() {
    // Dapatkan id story dari URL
    const url = UrlParser.parseActiveUrlWithoutCombiner();
    const { id } = url;
    
    // Inisialisasi presenter dengan id story
    this._presenter = new DetailPresenter({
      view: this,
      id,
    });
    
    // Minta detail story dari presenter
    await this._presenter.getStoryDetail();
  },
  
  // View methods
  showLoading() {
    LoadingInitiator.showLoading();
  },
  
  hideLoading() {
    LoadingInitiator.hideLoading();
  },
  
  showStoryDetail(story) {
    const storyContainer = document.querySelector('#story');
    storyContainer.innerHTML = createStoryDetailTemplate(story);
  },
  
  showError(message) {
    const storyContainer = document.querySelector('#story');
    storyContainer.innerHTML = `
      <div class="error-container">
        <h3>Error</h3>
        <p>${message}</p>
        <a href="#/home" class="story-item__action-button">Kembali ke Home</a>
      </div>
    `;
    LoadingInitiator.hideLoading();
    NotificationHelper.showToast(`Error: ${message}`);
  },
  
  async showMap(story) {
    try {
      const mapElement = document.querySelector('#storyMap');
      if (!mapElement) {
        console.error('Elemen peta tidak ditemukan');
        return;
      }
      
      const mapInitiator = new MapInitiator({ mapElement });
      await mapInitiator.init();
      
      // Tambahkan marker untuk lokasi story
      mapInitiator.addMarker(
        story.lat, 
        story.lon, 
        `<strong>${story.name}</strong><p>${story.description.substring(0, 50)}...</p>`
      );
    } catch (error) {
      console.error('Error initializing map:', error);
    }
  }
};

export default DetailPage;