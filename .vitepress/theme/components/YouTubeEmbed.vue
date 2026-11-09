<template>
  <div class="youtube-embed-section">
    <div class="youtube-embed-header">                                                                                         
      <p class="youtube-embed-eyebrow">See it in action</p>                                                                    
      <h2 class="youtube-embed-title">Watch the Open Source Summit Talk</h2>                                                    
      <p class="youtube-embed-subtitle">See how Platform Mesh enables teams to orchestrate any service</p>                                                                                                        
    </div>                                                                                                  
    <div class="youtube-embed-container">
      <iframe
        src="https://www.youtube.com/embed/k7U2KT-rw7o"
        title="Platform Mesh Video"
        frameborder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowfullscreen
      ></iframe>
    </div>
  </div>
</template>

<style scoped>
.youtube-embed-section {
  max-width: 900px;
  margin: 48px auto;
  padding: 0 24px;
}

.youtube-embed-header {
  text-align: center;
}

.youtube-embed-eyebrow {
  font-size: 0.85rem;
  font-weight: 600;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--teal-6);
  margin: 0 0 12px 0;
}

.youtube-embed-subtitle {
  font-size: 1.05rem;
  color: var(--ifm-color-emphasis-700);
  line-height: 1.6;
  margin: 0 0 40px 0;
}

.youtube-embed-title {
  font-size: 2.2rem;
  font-weight: 800;
  letter-spacing: -0.5px;
  color: var(--ifm-font-color-base);
  margin: 0 0 16px 0;
}

.youtube-embed-container {
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 9;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.12);
}

.youtube-embed-container iframe {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}
</style>
