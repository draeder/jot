export default function JsonLd() {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "Jot",
    "description": "Visual note-taking workspace with infinite canvas, rich text editing, and complete privacy. Create connected visual notes with drag-and-drop cards and seamless connections.",
    "url": "https://jot-app.com",
    "applicationCategory": "ProductivityApplication",
    "operatingSystem": "Web Browser",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD",
      "availability": "https://schema.org/InStock"
    },
    "author": {
      "@type": "Organization",
      "name": "Jot Team"
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "5.0",
      "ratingCount": "1"
    },
    "features": [
      "Infinite Canvas",
      "Rich Text Editing",
      "Visual Connections",
      "Local Storage",
      "Privacy First",
      "No Signup Required",
      "Global Search",
      "Code Highlighting",
      "Task Lists",
      "Drag and Drop"
    ]
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  )
}
