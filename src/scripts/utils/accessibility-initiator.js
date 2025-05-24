// File: src/scripts/utils/accessibility-initiator.js

const AccessibilityInitiator = {
  init() {
    this._initSkipToContent();
    this._addFocusIndicators();
  },

  _initSkipToContent() {
    // Critical fix: Gunakan pencarian ID yang tepat dan cek keberadaan elemen
    const mainContent = document.querySelector("#mainContent");
    const skipLink = document.querySelector(".skip-link");
    
    // Pastikan elemen ada sebelum menambahkan event listener
    if (skipLink && mainContent) {
      // Gunakan event listener sekali saja untuk mencegah multiple handlers
      skipLink.removeEventListener("click", this._skipLinkClickHandler);
      skipLink.addEventListener("click", this._skipLinkClickHandler);
      
      // Pastikan mainContent bisa mendapatkan fokus
      if (!mainContent.hasAttribute("tabindex")) {
        mainContent.setAttribute("tabindex", "-1");
      }
      
      console.log('Skip to content accessibility initialized successfully');
    } else {
      console.error('Skip link or main content elements not found');
    }
  },
  
  // Definisikan handler sebagai metode terpisah untuk bisa dihapus jika diperlukan
  _skipLinkClickHandler(event) {
    event.preventDefault();
    
    // Temukan mainContent di dalam handler untuk memastikan referensi terbaru
    const mainContent = document.querySelector("#mainContent");
    if (!mainContent) return;
    
    // Hapus fokus dari skip link
    this.blur();
    
    // Fokus ke konten utama dengan timeout kecil untuk mencegah race condition
    setTimeout(() => {
      mainContent.focus();
      mainContent.scrollIntoView({ behavior: 'smooth' });
    }, 50);
  },
  
  _addFocusIndicators() {
    // Pastikan kita tidak menambahkan style yang sama berulang kali
    if (document.getElementById('accessibility-focus-styles')) return;
    
    const style = document.createElement('style');
    style.id = 'accessibility-focus-styles';
    style.textContent = `
      a:focus, button:focus, input:focus, textarea:focus, select:focus {
        outline: 3px solid #0d6efd !important;
        outline-offset: 2px !important;
      }
    `;
    document.head.appendChild(style);
  }
};

export default AccessibilityInitiator;