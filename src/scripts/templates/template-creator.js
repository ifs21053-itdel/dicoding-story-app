// src/scripts/templates/template-creator.js

const createStoryItemTemplate = (story, isFavorite = false) => `
  <article class="story-item">
    <div class="story-item__header">
      <img class="story-item__header-image" src="${story.photoUrl}" alt="${story.name}'s story" loading="lazy">
      <div class="story-item__header-creator">${story.name}</div>
    </div>
    <div class="story-item__content">
      <p class="story-item__date">${new Date(story.createdAt).toLocaleDateString('id-ID', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      })}</p>
      <p class="story-item__description">${story.description}</p>
      <div class="story-item__action">
        <button class="favorite-button" data-id="${story.id}">
          <i class="fa-heart ${isFavorite ? 'fas' : 'far'}"></i>
        </button>
        <a href="#/detail/${story.id}" class="story-item__action-button">See Details</a>
      </div>
    </div>
  </article>
`;

const createStoryDetailTemplate = (story) => `
  <div class="story-detail-container">
    <div class="story-detail-card">
      <div class="story-detail__header">
        <img class="story-detail__image" src="${story.photoUrl}" alt="${story.name}'s story" onerror="this.onerror=null;this.src='https://via.placeholder.com/800x400?text=Gambar+Tidak+Tersedia';">
      </div>
      
      <div class="story-detail__content">
        <h2 class="story-detail__title">Story by ${story.name}</h2>
        <p class="story-detail__date">${new Date(story.createdAt).toLocaleDateString('id-ID', { 
          weekday: 'long', 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })}</p>
        <p class="story-detail__description">${story.description}</p>
        
        ${story.lat && story.lon ? `
          <div class="story-detail__location">
            <h3>Lokasi Story</h3>
            <div id="storyMap" class="story-detail__map"></div>
          </div>
        ` : ''}
      </div>
      
      <div class="story-detail-footer">
        <a href="#/home" class="primary-button">Kembali ke Home</a>
      </div>
    </div>
  </div>
`;

const createEmptyFavoritesTemplate = () => `
  <div class="empty-favorites">
    <h3>Belum ada cerita favorit</h3>
    <p>Tambahkan cerita ke favorit dengan menekan ikon hati pada cerita yang Anda sukai</p>
    <a href="#/home" class="story-item__action-button">Kembali ke Beranda</a>
  </div>
`;

export {
  createStoryItemTemplate,
  createStoryDetailTemplate,
  createEmptyFavoritesTemplate,
};