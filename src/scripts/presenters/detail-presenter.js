import StoryModel from '../models/story-model';

class DetailPresenter {
  constructor({ view, id }) {
    this._view = view;
    this._id = id;
    this._storyModel = StoryModel;
  }
  
  async getStoryDetail() {
    // Beritahu view untuk menampilkan loading
    this._view.showLoading();
    
    try {
      // Validasi ID
      if (!this._id) {
        this._view.showError('ID story tidak valid');
        return;
      }
      
      // Ambil data dari model
      const response = await this._storyModel.getStoryDetail(this._id);
      
      // Proses response
      if (response.error) {
        this._view.showError(response.message || 'Gagal memuat detail story');
        return;
      }
      
      if (!response.story) {
        this._view.showError('Data story tidak ditemukan');
        return;
      }
      
      // Instruksikan view untuk menampilkan detail story
      this._view.showStoryDetail(response.story);
      
      // Jika story memiliki lokasi, tampilkan peta
      if (response.story.lat && response.story.lon) {
        this._view.showMap(response.story);
      }
    } catch (error) {
      this._view.showError(error.message);
    } finally {
      this._view.hideLoading();
    }
  }
}

export default DetailPresenter;