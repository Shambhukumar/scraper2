const { JSDOM } = require('jsdom');
// const fs = require('fs');  // Import the fs module to handle file writing
const { default: axios } = require('axios');

const express = require('express');
const app = express();

// Use Render's assigned port
const port = process.env.PORT || 3000;


const APP_BASE_URL = "https://archer-api.netlify.app/.netlify/functions/server/"
// const APP_BASE_URL = "http://localhost:4000/.netlify/functions/server/"

const newsTopicArr = ["home", "world", "politics", "business", "sports", "health", "Middle East", "Ukraine Russia", "asia", "uk"];


// Storing News Format
// {
//     image: "image of the article",
//     heading: "heading of the article",   
//     articleLink: "link of the article to the brodcaster site",
//     brodcaster: "what is the name of the news angency",
//     category: "category of the article",
//     articleText: "article text",
// }

const axiosInstance = axios.create({
    baseURL: APP_BASE_URL,
    timeout: 30000,
})

const fetchAndExtractGuardianArticles = async (url, category) => {
  try {
    // Fetch the HTML content using the native fetch API in Node.js 18+


    const gurdianCategoryUrlsObj = {
      sports: `${url}/sport`,
      home: `${url}/`,
      "Middle East": `${url}/world/middleeast`,
      "Ukraine Russia": `${url}/world/ukraine`,
      asia: `${url}/world/asia`,
  }

  let urlWithCategory = gurdianCategoryUrlsObj[category] || `${url}/${category}`;
    const res = await fetch(urlWithCategory);
    const html = await res.text();

   // Step 2: Create JSDOM instance with proper options
   const cleanedHtml = html.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');

   // Step 3: Create JSDOM instance with silent virtual console
   const virtualConsole = new (require('jsdom').VirtualConsole)();
   // Discard all output (logs, errors, warnings)
   virtualConsole.sendTo({
     log: () => {},   // Ignore console.log
     error: () => {}, // Ignore console.error
     warn: () => {},  // Ignore console.warn
     info: () => {}   // Ignore console.info
   });

   const dom = new JSDOM(cleanedHtml, {
     virtualConsole,
     runScripts: 'outside-only', // Prevent inline scripts
     pretendToBeVisual: false // Disable visual rendering
   });
    const document = dom.window.document;

    const FilteredNews = [];

    // Now you can use the document like a normal DOM
    const listItems = document.querySelectorAll('li');

    listItems.forEach((element) => {
      const anchor = element.querySelector('a');
      const img = element.querySelector('img');
      // const heading = anchor?.parentElement?.querySelector('.card-headline')?.querySelector('a')?.getAttribute('aria-label');
      const heading = anchor?.getAttribute('aria-label');
      const articleText = anchor?.parentElement?.querySelector('.show-underline')?.textContent.trim();
      const imgSource = anchor?.parentElement?.querySelector('source')?.getAttribute('srcset');
      // console.log(heading)

      if (anchor && heading && articleText && imgSource) {
        const currentNews = {
          image: imgSource,
          heading,
          articleLink: anchor.href,
          broadcaster: 'Guardian',
          category: 'International', // Or any dynamic category you have
          articleText,
        };

        FilteredNews.push(currentNews);
        console.log(currentNews);
      }
    });

    // Now save the filtered news data to a JSON file
    const filePath = './Guardian_articles.json';

    // await saveNewsApiCall(category, "Guardian", FilteredNews)
      const news = FilteredNews

      
    // Write JSON data to the file
    // fs.writeFileSync(filePath, JSON.stringify(FilteredNews, null, 2));

    await saveNewsApiCall(category, "Guardian", news)

    console.log(`✅ ${category} Request Completed`);
  } catch (error) {
    console.error('❌ Error fetching or parsing the page:', error.message);
  }
};
// Function to fetch HTML and extract articles
const fetchAndExtractBBCArticles = async (url, category) => {
  try {
    // Fetch the HTML content using the native fetch API in Node.js 18+
    const bbcCategoryUrlsObj = {
      sports: `${url}/sport`,
      home: `${url}/news`,
      "Middle East": `${url}/news/world/middle_east`,
      "Ukraine Russia": `${url}/news/war-in-ukraine`,
      asia: `${url}/news/world/asia`,
    };
    
    let urlWithCategory = bbcCategoryUrlsObj[category] || `${url}/news/${category}`;

    console.log(urlWithCategory, category)
    const res = await fetch(urlWithCategory, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
        'Connection': 'keep-alive',
        'Referer': `${url}`,
      }
    });
    const html = await res.text();
    // fs.writeFileSync('bbc.html', html);
    // Use jsdom to create a virtual DOM from the fetched HTML
    const dom = new JSDOM(html);
    const document = dom.window.document;

    


    const allDivs = document.querySelectorAll("div");
    const arrayOfDivs = Array.from(allDivs);

    const filteredElement = [];
    const uniqueKey = [];

    // Filter divs based on image and paragraph
    arrayOfDivs.forEach((element) => {
      if (element.querySelector("img") && element.querySelector("p")) {
        const title = element.querySelector('span[role="text"]') ?? element.querySelector("h2");
        if (title.textContent.length > 25 && !uniqueKey.includes(title.textContent)) {
          uniqueKey.push(title.textContent);
          filteredElement.push(element);
        }
      }
    });

    


    // Scroll through the filtered elements (for visualization, if needed)
    // await scrollListIntoViewSequentially(filteredElement);

    // Collect article details
    const articleWithDetails = [];

    filteredElement.forEach((element) => {
    //   element.scrollIntoView(); // Scroll into view (for visualization purposes)
    //   const srcset = element.querySelector("img").getAttribute('srcset');
      const srcset = Array.from(element.querySelectorAll("img")).find(img => img.hasAttribute("srcset"))?.getAttribute("srcset");;
      const articleHeadline = element.querySelector('span[role="text"]') ?? element.querySelector("h2");
      const articleLink = element.querySelector("a").href;
      const articleParagraph = element.querySelector("p").textContent;

    //   console.log(element.outerHTML); // Log the outer HTML of the element

      if (srcset) {
        articleWithDetails.push({
          image: srcset.split(",")[0].split(" ")[0],  // Get the first image source
          heading: articleHeadline.textContent,
          articleLink: articleLink,
          broadcaster: "BBC",
          category: category,
          articleText: articleParagraph,
        });
      }
    });

    // Remove the first element if needed (as per your code)
    if (articleWithDetails.length) articleWithDetails.shift();

    // Log the result (optional)
    // console.log(articleWithDetails);

    // Save the article details to a JSON file

   
      saveNewsApiCall(category, "BBC", articleWithDetails)
      const filePath = './BBC_articles.json';
      // fs.writeFileSync(filePath, JSON.stringify(articleWithDetails, null, 2));
  
      console.log(`✅ ${category} Request Completed`);
  
 

   
   
  } catch (error) {
    console.error('❌ Error fetching or parsing the page:', error.message);
  }
};

const fetchAndExtractCNNArticles = async (url, category) => {
  try {
    const CNNCategoryUrlsObj = {
      home: `${url}/`,
      'Middle East': `${url}/world/middleeast`,
      'Ukraine Russia': `${url}/world/europe/ukraine`,
  }
  let urlWithCategory = CNNCategoryUrlsObj[category] || `${url}/${category}`;
    const res = await fetch(urlWithCategory, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; MyScraper/1.0)'
      }
    });
    const html = await res.text();
    // fs.writeFileSync('cnn.html', html); // Save the HTML for debugging

    const dom = new JSDOM(html);
    const document = dom.window.document;

    const list = document.querySelectorAll('.card');
    const arrayList = Array.from(list);
    const filteredNews = [];

    arrayList.forEach((element) => {
      const img = element.querySelector("img");
      const anchor = element.querySelector("a");
      const headingEl = element.querySelector('span');

      if (img && anchor && headingEl) {
        const imge = img.src;
        const heading = headingEl.textContent.trim();
        const articleLink = anchor.href;

        if (heading.length > 10) {
          filteredNews.push({
            image: imge,
            heading,
            articleLink,
            broadcaster: "CNN",
            category,
            articleText: null,
          });
        }
      }
    });

    await saveNewsApiCall(category, "CNN", filteredNews)

    const filePath = './cnn_articles.json';
    // fs.writeFileSync(filePath, JSON.stringify(filteredNews, null, 2));
    console.log(`✅ CNN ${category} Request Completed`);

    return filteredNews;

  } catch (error) {
    console.error('❌ Error fetching or parsing the page:', error.message);
  }
};

const fetchAndExtractTOIrticles = async (url, category) => {
  try {

    const TOICategoryUrlsObj = {
      home: `${url}/`,
      'politics': `${url}/elections`,
      'sports': `${url}/sports`,
      'health': `${url}/topic/health`,
      'Middle East': `${url}/world/middle-east/2`,
      'Ukraine Russia': `${url}/topic/ukraine/news`,
      'asia': `${url}/topic/asia/news`,
      'uk': `${url}/topic/uk/news`,
  }
  let urlWithCategory = TOICategoryUrlsObj[category] || `${url}/${category}`;
    const res = await fetch(urlWithCategory, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; MyScraper/1.0)'
      }
    });
    const html = await res.text();
    // fs.writeFileSync('TOI.html', html); // Save the HTML for debugging

    const dom = new JSDOM(html);
    const document = dom.window.document;

    
    const filteredNews = [];

    function getImageUrlWithArticleNumber(articleUrl) {
      // Step 1: Extract the number from the article URL
      const articleRegex = /\/(\d+)\.cms$/; // Matches the number before ".cms" at the end
      const articleMatch = articleUrl.match(articleRegex);
      if (!articleMatch) return null; // Return null if no number is found
    
      const articleNumber = articleMatch[1]; // Extracted number (e.g., "120414107")
    
      // Step 2: Hardcode the image URL with the extracted number
      const imageUrl = `https://static.toiimg.com/thumb/imgsize-38014,msid-${articleNumber},width-600,resizemode-4/${articleNumber}.jpg`;
    
      return imageUrl;
    }

    const selectedArcticleContainerWithClass = document.querySelectorAll('a');
    const arrayList = Array.from(selectedArcticleContainerWithClass);

    arrayList.forEach((element)=> {

      const img =  element.querySelector("img")?.getAttribute('data-src') || element.querySelector("img")?.src
      const anchor = element?.href;
      const headingEl = element?.textContent;

      if (img && anchor && headingEl) {
          // const imge = img;
          const heading = headingEl
          const articleLink = anchor;
  
          if (heading.length > 10) {
            filteredNews.push({
              image: getImageUrlWithArticleNumber(articleLink),
              heading,
              articleLink,
              broadcaster: "TOI",
              category,
              articleText: null,
            });
          }
        }
    
    })
   

    await saveNewsApiCall(category, "TOI", filteredNews)

    
    const filePath = './TOI_articles.json';
    // fs.writeFileSync(filePath, JSON.stringify(filteredNews, null, 2));
    console.log(`✅ TOI ${category} Request Completed`);

    return filteredNews;

  } catch (error) {
    console.error('❌ Error fetching or parsing the page:', error.message);
  }
};


const fetchAndExtractReutersrticles = async (url, category) => {

  const ReutersCategoryUrlsObj = {
    home: `${url}/world/`,
    'politics': `${url}/legal/government/`,
    'health': `${url}/business/healthcare-pharmaceuticals/`,
    'Middle East': `${url}/world/middle-east/`,
    'Ukraine Russia': `${url}/world/ukraine-russia-war/`,
    'asia': `${url}/world/asia-pacific/`,
    'uk': `${url}/world/uk/`,
}

let urlWithCategory = ReutersCategoryUrlsObj[category] || `${url}/${category}`;

  try {
    const res = await fetch(urlWithCategory, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
        'Connection': 'keep-alive',
        'Referer': `${url}`,
      },
      timeout: 10000, // 10s timeout
    });

    const html = await res.text();
    console.log(`Reuters Status: ${res.status} ${res.statusText}`);
    // fs.writeFileSync('Reuters.html', html); // Save the HTML for debugging

    const dom = new JSDOM(html);
    const document = dom.window.document;

    const Li = document.querySelectorAll('li');
    const arrayList = Array.from(Li);

    const filteredNews = [];

    arrayList.forEach((element)=> {
      const headingEl = element.querySelector('[data-testid="Heading"]')?.textContent || element.querySelector('[data-testid="TitleHeading"]')?.textContent;
      const image = element.querySelector('img')?.src || element.querySelector('[data-testid="Image"]')?.querySelector('img')?.src;
      const description = element.querySelector('[data-testid="Description"]')?.textContent;
      const articleLink = element.querySelector('[data-testid="Heading"]')?.href || element.querySelector('[data-testid="TitleLink"]')?.href;   
      // console.log(headingEl)
      if (image && headingEl) {
      
        if (headingEl.length > 10) {
          filteredNews.push({
            image,
            heading: headingEl,
            articleLink,
            broadcaster: "Reuters",
            category,
            articleText: description || null,
          });
        }
      }

    })
    await saveNewsApiCall(category, 'Reuters', filteredNews)

    const filePath = './Reuters_articles.json';
    // fs.writeFileSync(filePath, JSON.stringify(filteredNews, null, 2));
    console.log(`✅ TOI ${category} Request Completed`);

    return filteredNews;

  } catch (error) {
    console.error('❌ Error fetching or parsing the page:', error.message);
  }
};

// const fetchAndExtractEconomistArticles = async (url, category) => {
//   try {
//     const EconomistCategoryUrlsObj = {
//       home: `${url}/`,
//       Asia: `${url}/topics/asia`,
//       'world': `${url}/topics/economy`,
//       'politics': `${url}/topics/geopolitics`,
//       'business': `${url}/weeklyedition/`,
//       'sports': `${url}/topics/culture`,
//       'health': `${url}/topics/artificial-intelligence`,
//       'Middle East': `${url}/topics/war-in-the-middle-east`,
//       'Ukraine Russia': `${url}/topics/ukraine-at-war`,
//       'uk': `${url}/topics/britain`,
//     };
//     let urlWithCategory = EconomistCategoryUrlsObj[category] || `${url}/${category.toLowerCase()}`;
//     console.log(`Fetching URL: ${urlWithCategory}`);

//     const res = await fetch(urlWithCategory, {
//       headers: {
//         'User-Agent': 'Mozilla/5.0 (compatible; MyScraper/1.0)',
//         'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
//       },
//     });
//     if (!res.ok) {
//       throw new Error(`HTTP error: ${res.status} ${res.statusText}`);
//     }
//     const html = await res.text();

//     // Initialize JSDOM with error handling
//     const dom = new JSDOM(html);
//     const document = dom.window.document;

//     // Find all divs with an h3 containing an <a> (indicating a potential article)
//     let potentialArticles = document.querySelectorAll('div h3 a');
//     console.log(`Found ${potentialArticles.length} potential articles with div h3 a`);

//     const filteredNews = [];
//     potentialArticles.forEach((anchor) => {
//       // Get the parent div that likely contains the article
//       // const articleDiv = anchor.closest('div');
//       // if (!articleDiv) return;

//       // Check for img and description within the article div

//        // Get the outer div containing both h3 a and figure img
//        let articleDiv = anchor.closest('div:has(figure img)') || anchor.closest('div');
//        if (!articleDiv) {
//          console.log(`No articleDiv for "${anchor.textContent.trim().slice(0, 20)}..."`);
//          return;
//        }
 
//        // If closest('div:has(figure img)') fails, try parent traversal
//        if (!articleDiv.querySelector('figure img')) {
//          const parentDiv = articleDiv.parentElement;
//          articleDiv = parentDiv?.querySelector('div:has(figure img)') || articleDiv;
//        }
  
//        // Check for img within a figure
//        const img = articleDiv.querySelector('figure img');
//       //  console.log(`Image for "${anchor.textContent.trim().slice(0, 20)}...": ${img ? img.src : 'null'}`);
//       const descriptionEl = articleDiv.querySelector('p');
//       const heading = anchor.textContent.trim();

//       // console.log('ArticleDiv HTML:', articleDiv.outerHTML);

//       // Ensure the article has a valid headline and link
//       if (heading.length > 10 && anchor.href) {
//         const articleLink = anchor.href.startsWith('http')
//           ? anchor.href
//           : new URL(anchor.href, url).href;
//         const imge = img ? img.src : null;
//         const description = descriptionEl ? descriptionEl.textContent.trim() : null;

//         filteredNews.push({
//           image: imge,
//           heading,
//           articleLink,
//           broadcaster: 'The Economist',
//           category,
//           articleText: description,
//         });

//         console.log('image:', imge);
//       }
//     });

//     // console.log(`Extracted ${filteredNews.length} articles:`, filteredNews.map(n => n.heading));

//     // Save to API (assuming saveNewsApiCall is defined elsewhere)
//     // await saveNewsApiCall(category, 'Economist', filteredNews);

//     return filteredNews;
//   } catch (error) {
//     console.error('❌ Error fetching or parsing the page:', error.message);
//     return [];
//   }
// };


const fetchAndExtractEconomistArticles = async (url, category) => {
  try {
    const EconomistCategoryUrlsObj = {
      home: `${url}/`,
      Asia: `${url}/topics/asia`,
      world: `${url}/topics/economy`,
      politics: `${url}/topics/geopolitics`,
      business: `${url}/weeklyedition/`,
      sports: `${url}/topics/culture`,
      health: `${url}/topics/artificial-intelligence`,
      'Middle East': `${url}/topics/war-in-the-middle-east`,
      'Ukraine Russia': `${url}/topics/ukraine-at-war`,
      uk: `${url}/topics/britain`,
    };
    let urlWithCategory = EconomistCategoryUrlsObj[category] || `${url}/${category.toLowerCase()}`;
    console.log(`Fetching URL: ${urlWithCategory}`);

    const res = await fetch(urlWithCategory, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; MyScraper/1.0)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      },
    });
    if (!res.ok) {
      throw new Error(`HTTP error: ${res.status} ${res.statusText}`);
    }
    const html = await res.text();

    // Initialize JSDOM
    const { JSDOM } = require('jsdom');
    const dom = new JSDOM(html);
    const document = dom.window.document;

    // Find all potential article headlines
    let potentialArticles = document.querySelectorAll('h3 a');
    console.log(`Found ${potentialArticles.length} potential articles with h3 a`);

    const filteredNews = [];
    const usedImages = new Set(); // Track used image URLs

    potentialArticles.forEach((anchor, index) => {
      // Log the article being processed
      const heading = anchor.textContent.trim();
      // console.log(`Processing article ${index + 1}: "${heading.slice(0, 20)}..."`);

      // Get the closest article container (try broader selectors)
      let articleDiv = anchor.closest('div:has(figure img)') || anchor.closest('div')
      if (!articleDiv) {
        // console.log(`Skipped: No article container found for "${heading.slice(0, 20)}..."`);
        return;
      }

      // Find the image within the article container
      const img = articleDiv.querySelector('figure img');
      
      const descriptionEl = articleDiv.querySelector('p');
      const imgSrc = img ? img.src : null;

      // Validate headline and link
      if (heading.length > 10 && anchor.href) {
        const articleLink = anchor.href.startsWith('http')
          ? anchor.href
          : new URL(anchor.href, url).href;

        // Check for duplicate image (optional: comment out to allow duplicates)
        if (imgSrc && usedImages.has(imgSrc)) {
          // console.log(`Skipped: Duplicate image "${imgSrc}" for "${heading.slice(0, 20)}..."`);
          return;
        }

        // Add image to usedImages if present
        if (imgSrc) {
          usedImages.add(imgSrc);
        }

        const description = descriptionEl ? descriptionEl.textContent.trim() : null;

        // Include article even if no image (set null or default image)
        if(imgSrc){
          filteredNews.push({
            image: imgSrc, // Or use a default: imgSrc || 'https://example.com/default.jpg'
            heading,
            articleLink,
            broadcaster: "The Economist",
            category,
            articleText: description,
          });
        }
      } else {
        // console.log(`Skipped: Invalid headline or link for "${heading.slice(0, 20)}..."`);
      }
    });

    console.log(`Extracted ${filteredNews.length} articles`);

    // Optional: Save to API
    await saveNewsApiCall(category, 'Economist', filteredNews);

    return filteredNews;
  } catch (error) {
    console.error('❌ Error fetching or parsing the page:', error.message);
    return [];
  }
};

const saveNewsApiCall = async (category, brodcaster, news) => {
  try {
    if(news.length >= 9 ){
     const response = await axiosInstance.post(`saveNews`, {
       data: {
         Category: category,
         brodcaster,
         news,
       },
     });
     console.log('News saved successfully:', response.data);
    }
    console.log(brodcaster, category, news.length)
   } catch (error) {
     console.error('Error saving news:', error.message);
   }
 }


//  fetchAndExtractTOIrticles('https://timesofindia.indiatimes.com', 'newsTopicArr[i]')
// fetchAndExtractGuardianArticles('https://www.theguardian.com', 'Middle East')
// fetchAndExtractEconomistArticles('https://www.economist.com', 'home')


const init = async () => {
  for (let i = 0; i < newsTopicArr.length; i++) {
  await fetchAndExtractGuardianArticles('https://www.theguardian.com', newsTopicArr[i])
  await fetchAndExtractBBCArticles('https://www.bbc.com', newsTopicArr[i]);
  await fetchAndExtractCNNArticles('https://edition.cnn.com', newsTopicArr[i])
  await fetchAndExtractTOIrticles('https://timesofindia.indiatimes.com', newsTopicArr[i]) // gett all the data but heading and article link have to defrentiate
  await fetchAndExtractReutersrticles('http://api.scrape.do?token=ca19519a8d84466e940c8ce35a702a0aa192a7d6e07&url=https://www.reuters.com', newsTopicArr[i])
  await fetchAndExtractEconomistArticles('https://www.economist.com', newsTopicArr[i]);
}

}


  
// init()



// Endpoint to trigger runScript and init
app.get('/run', (req, res) => {
  try {
      init()
      res.json({
          status: 'success',
      });
  } catch (error) {
      res.status(500).json({
          status: 'error',
          message: error.message
      });
  }
});

// Health check endpoint for Render
app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

// Start the server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});