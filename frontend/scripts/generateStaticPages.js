const fs = require('fs');
const path = require('path');

/**
 * Generate static HTML pages for each activity for SEO purposes
 * These pages will be crawled by search engines and provide better social sharing
 */
async function generateStaticPages() {
  console.log('🚀 Starting static page generation...');
  
  try {
    // Load activities data
    const dataPath = path.join(__dirname, '../public/data/activities_real.json');
    let activitiesData;
    
    try {
      console.log('📊 Loading activities data from:', dataPath);
      const rawData = fs.readFileSync(dataPath, 'utf8');
      activitiesData = JSON.parse(rawData);
    } catch (err) {
      console.warn('⚠️  Could not load real data, using sample data');
      // Fallback to sample data
      activitiesData = {
        activities: [
          {
            id: 1,
            title: "Středoškolská odborná činnost",
            tags: ["soutěž", "student sš", "celá čr/online"],
            short_description: "SOČ je prestižní soutěž pro středoškolské studenty. Ti nejlepší mají možnost pokračovat na zahraniční soutěže.",
            long_description: "SOČ je prestižní soutěž pro středoškolské studenty. Ti nejlepší mají možnost pokračovat na zahraniční soutěže. Pro řadu účastníků je soutěž počátkem jejich vědecké kariéry.",
            thumbnail_url: "https://avatars.githubusercontent.com/u/7677243?s=48&v=4",
            location: "Česká republika"
          },
          {
            id: 2,
            title: "AIESEC stáže",
            tags: ["výjezd do zahraničí", "stáž"],
            short_description: "S AIESEC máš možnost vyjet na dobrovolnickou stáž nehledě na to, zda jsi už na vysoké nebo už ne.",
            long_description: "S AIESEC máš možnost vyjet na dobrovolnickou stáž nehledě na to, zda jsi už na vysoké nebo už ne, jako student můžeš vyjet na stáže ve startupech.",
            thumbnail_url: "https://avatars.githubusercontent.com/u/7677243?s=48&v=4",
            location: "Česká republika"
          },
          {
            id: 3,
            title: "Erasmus+ projekty",
            tags: ["výjezd do zahraničí", "vzdělávání", "student vš"],
            short_description: "Erasmus+ nabízí možnosti studia a stáží v zahraničí pro studenty vysokých škol.",
            long_description: "Erasmus+ je program Evropské unie pro vzdělávání, odbornou přípravu, mládež a sport. Nabízí možnosti studia a stáží v zahraničí.",
            thumbnail_url: "https://avatars.githubusercontent.com/u/7677243?s=48&v=4",
            location: "Evropa"
          }
        ]
      };
    }
    
    // Create activities directory
    const staticDir = path.join(__dirname, '../build/activities');
    if (!fs.existsSync(staticDir)) {
      fs.mkdirSync(staticDir, { recursive: true });
      console.log('📁 Created activities directory:', staticDir);
    }
    
    // Generate static page for each activity
    for (const activity of activitiesData.activities) {
      const html = generateActivityHTML(activity);
      const filePath = path.join(staticDir, `${activity.id}.html`);
      fs.writeFileSync(filePath, html);
      console.log(`✅ Generated: /activities/${activity.id}.html`);
    }
    
    // Generate sitemap for better SEO
    await generateSitemap(activitiesData.activities);
    
    console.log(`🎉 Successfully generated ${activitiesData.activities.length} static pages`);
    
  } catch (error) {
    console.error('❌ Error generating static pages:', error);
    process.exit(1);
  }
}

function generateActivityHTML(activity) {
  // Handle different tag structures
  let allTags = [];
  if (activity.location && Array.isArray(activity.location)) {
    allTags = [
      ...(activity.location || []),
      ...(activity.tags || []),
      ...(activity.education_level || [])
    ];
  } else if (activity.tags && Array.isArray(activity.tags)) {
    allTags = activity.tags;
  }

  // Clean description for meta tags
  const cleanDescription = activity.short_description
    ?.replace(/<[^>]*>/g, '')
    ?.substring(0, 160) || '';

  return `<!DOCTYPE html>
<html lang="cs">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${activity.title} | Buď aktivní</title>
  <meta name="description" content="${cleanDescription}">
  <meta name="keywords" content="${allTags.join(', ')}">
  
  <!-- Open Graph / Facebook -->
  <meta property="og:type" content="website">
  <meta property="og:url" content="https://your-domain.com/activities/${activity.id}">
  <meta property="og:title" content="${activity.title}">
  <meta property="og:description" content="${cleanDescription}">
  <meta property="og:image" content="${activity.thumbnail_url}">
  
  <!-- Twitter -->
  <meta property="twitter:card" content="summary_large_image">
  <meta property="twitter:url" content="https://your-domain.com/activities/${activity.id}">
  <meta property="twitter:title" content="${activity.title}">
  <meta property="twitter:description" content="${cleanDescription}">
  <meta property="twitter:image" content="${activity.thumbnail_url}">
  
  <!-- Canonical URL points to React page for better UX -->
  <link rel="canonical" href="https://your-domain.com/activity/${activity.id}">
  
  <!-- Redirect to React app after page is indexed (SEO-friendly) -->
  <script>
    // Redirect to React app after 3 seconds if JavaScript is enabled
    // This allows crawlers to index the content while users get the better UX
    setTimeout(() => {
      if (window.location.pathname.includes('.html')) {
        window.location.href = '/activity/${activity.id}';
      }
    }, 3000);
  </script>
  
  <!-- Structured Data for Rich Snippets -->
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "Event",
    "name": "${activity.title}",
    "description": "${cleanDescription}",
    "location": {
      "@type": "Place",
      "name": "${activity.location || 'Česká republika'}"
    },
    "image": "${activity.thumbnail_url}",
    "keywords": "${allTags.join(', ')}",
    "url": "https://your-domain.com/activity/${activity.id}",
    "organizer": {
      "@type": "Organization",
      "name": "Buď aktivní",
      "url": "https://your-domain.com"
    }
  }
  </script>
  
  <style>
    body { 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
      max-width: 800px; 
      margin: 0 auto; 
      padding: 20px; 
      line-height: 1.6;
      color: #333;
      background: #f8f9fa;
    }
    .static-container {
      background: white;
      border-radius: 12px;
      padding: 2rem;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }
    .activity-header { 
      display: flex; 
      gap: 20px; 
      margin-bottom: 30px; 
      align-items: flex-start;
    }
    .activity-thumbnail { 
      width: 150px; 
      height: 150px; 
      object-fit: cover; 
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    .activity-title {
      font-size: 2rem;
      margin: 0 0 0.5rem 0;
      color: #2c3e50;
    }
    .activity-location {
      color: #6c757d;
      font-size: 1.1rem;
      margin: 0;
    }
    .activity-description {
      font-size: 1.1rem;
      line-height: 1.7;
      margin-bottom: 2rem;
    }
    .activity-tags { 
      margin: 2rem 0; 
    }
    .activity-tag { 
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 6px 12px; 
      margin: 4px 6px 4px 0; 
      border-radius: 20px; 
      font-size: 14px;
      display: inline-block;
      font-weight: 500;
    }
    .react-links {
      display: flex;
      gap: 1rem;
      justify-content: center;
      margin-top: 2rem;
      padding-top: 2rem;
      border-top: 1px solid #e9ecef;
    }
    .react-link { 
      background: #007bff;
      color: white; 
      padding: 12px 24px; 
      text-decoration: none; 
      border-radius: 8px; 
      display: inline-flex;
      align-items: center;
      gap: 8px;
      font-weight: 500;
      transition: all 0.2s ease;
    }
    .react-link:hover {
      background: #0056b3;
      transform: translateY(-1px);
      color: white;
    }
    .back-link { 
      color: #6c757d; 
      text-decoration: none; 
      margin-bottom: 20px; 
      display: inline-block;
      font-weight: 500;
    }
    .back-link:hover {
      color: #007bff;
    }
    
    /* Loading message for when redirecting */
    .redirect-notice {
      background: #e3f2fd;
      border: 1px solid #2196f3;
      border-radius: 8px;
      padding: 1rem;
      margin-bottom: 1rem;
      text-align: center;
      color: #1976d2;
    }
    
    @media (max-width: 768px) {
      body { padding: 10px; }
      .static-container { padding: 1rem; }
      .activity-header { flex-direction: column; text-align: center; }
      .activity-thumbnail { width: 120px; height: 120px; margin: 0 auto; }
      .activity-title { font-size: 1.5rem; }
      .react-links { flex-direction: column; }
    }
  </style>
</head>
<body>
  <div class="static-container">
    <div class="redirect-notice">
      📱 Pro lepší zážitek vás přesměrováváme na interaktivní verzi...
    </div>
    
    <a href="/" class="back-link">← Zpět na všechny aktivity</a>
    
    <div class="activity-header">
      <img src="${activity.thumbnail_url}" alt="${activity.title}" class="activity-thumbnail" 
           onerror="this.src='https://avatars.githubusercontent.com/u/7677243?s=48&v=4'">
      <div>
        <h1 class="activity-title">${activity.title}</h1>
        <p class="activity-location"><strong>📍 Lokace:</strong> ${activity.location || 'Česká republika'}</p>
      </div>
    </div>
    
    <div class="activity-description">
      ${activity.long_description || activity.short_description}
    </div>
    
    <div class="activity-tags">
      <strong>🏷️ Kategorie:</strong><br><br>
      ${allTags.map(tag => `<span class="activity-tag">${tag}</span>`).join('')}
    </div>
    
    <div class="react-links">
      <a href="/activity/${activity.id}" class="react-link">
        🚀 Interaktivní verze
      </a>
      <a href="/" class="react-link">
        🔍 Najít podobné aktivity
      </a>
    </div>
  </div>
</body>
</html>`;
}

async function generateSitemap(activities) {
  const sitemapPath = path.join(__dirname, '../build/sitemap.xml');
  
  const urls = [
    'https://your-domain.com/',
    ...activities.map(activity => `https://your-domain.com/activity/${activity.id}`),
    ...activities.map(activity => `https://your-domain.com/activities/${activity.id}.html`)
  ];
  
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(url => `  <url>
    <loc>${url}</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>${url.includes('/activity/') ? '0.8' : '1.0'}</priority>
  </url>`).join('\n')}
</urlset>`;

  fs.writeFileSync(sitemapPath, sitemap);
  console.log('🗺️  Generated sitemap.xml');
}

// Run the generator
if (require.main === module) {
  generateStaticPages();
}

module.exports = { generateStaticPages };