<template>
  <div class="youtube-embed-section">
    <div class="youtube-embed-container">
      <iframe
        src="https://www.youtube.com/embed/wQMCH-zZ2So"
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
