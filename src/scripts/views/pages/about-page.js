const AboutPage = {
  async render() {
    return `
      <div class="form-container">
        <h2 class="form-title">About Dicoding Story</h2>
        
        <div class="about-content">
          <p>Dicoding Story is a platform where Dicoding members can share their experiences, achievements, and knowledge with the community.</p>
          
          <p>This application was built as a final project for the Dicoding Front-End Web Development Expert class, showcasing the implementation of Single-Page Application architecture and other modern web development practices.</p>
          
          <h3>Features</h3>
          <ul>
            <li>Share your stories with the Dicoding community</li>
            <li>Add photos to your stories using camera</li>
            <li>Add location to your stories using interactive map</li>
            <li>View stories from other Dicoding members</li>
            <li>Receive push notifications for new stories</li>
          </ul>
          
          <h3>Technologies Used</h3>
          <ul>
            <li>JavaScript ES6+</li>
            <li>Webpack as module bundler</li>
            <li>Progressive Web App features</li>
            <li>Leaflet.js for maps</li>
            <li>View Transitions API for smooth page transitions</li>
          </ul>
        </div>
      </div>
    `;
  },

  async afterRender() {
    // No specific logic needed for about page
  },
};

export default AboutPage;