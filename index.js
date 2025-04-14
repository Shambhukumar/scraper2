const { JSDOM } = require('jsdom');
// const fs = require('fs');  // Import the fs module to handle file writing
const { default: axios } = require('axios');


const APP_BASE_URL = "https://archer-api.netlify.app/.netlify/functions/server/"

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

    // Use jsdom to create a virtual DOM from the fetched HTML
    const dom = new JSDOM(html);
    const document = dom.window.document;

    const FilteredNews = [];

    // Now you can use the document like a normal DOM
    const listItems = document.querySelectorAll('li');

    listItems.forEach((element) => {
      const anchor = element.querySelector('a');
      const img = element.querySelector('img');
      const heading = anchor?.parentElement?.querySelector('.card-headline')?.textContent.trim();
      const articleText = anchor?.parentElement?.querySelector('.show-underline')?.textContent.trim();
      const imgSource = anchor?.parentElement?.querySelector('source')?.getAttribute('srcset');

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
      }
    });

    // Now save the filtered news data to a JSON file
    const filePath = './Guardian_articles.json';

    // await saveNewsApiCall(category, "Guardian", FilteredNews)
      const news = FilteredNews

      
    // Write JSON data to the file
    // fs.writeFileSync(filePath, JSON.stringify(FilteredNews, null, 2));

    await saveNewsApiCall(category, "Guardian", news)

    console.log(`✅ JSON file saved at ${filePath}`);
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
  
      console.log(`✅ JSON file saved at ${filePath}`);
  
 

   
   
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
    console.log(`✅ CNN JSON file saved at ${filePath}`);

    return filteredNews;

  } catch (error) {
    console.error('❌ Error fetching or parsing the page:', error.message);
  }
};

const fetchAndExtractTOIrticles = async (url, category) => {
  try {

    const TOICategoryUrlsObj = {
      home: `${url}/`,
      'politics': `${url}/politics/news`,
      'sports': `${url}//sports/cricket`,
      'health': `${url}/topic/health`,
      'Middle East': `${url}/topic/middle-east-war/news`,
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

    const figures = document.querySelectorAll('figure');
    const arrayList = Array.from(figures);

    const filteredNews = [];

    arrayList.forEach((element)=> {
      const img = element.querySelector("img")?.getAttribute('data-src');
      const anchor = element.querySelector("a")?.href;
      const headingEl = element.querySelector('figcaption')?.textContent;

    
      if (img && anchor && headingEl) {
        const imge = img;
        const heading = headingEl
        const articleLink = anchor;

        if (heading.length > 10) {
          filteredNews.push({
            image: imge,
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
    console.log(`✅ TOI JSON file saved at ${filePath}`);

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
    const res = await fetch(urlWithCategory,
      {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept-Language': 'en-US,en;q=0.9',
          'Connection': 'keep-alive',
          'Referer': `${url}`,
        }
      }
    );
    const html = await res.text();
    // fs.writeFileSync('Reuters.html', html); // Save the HTML for debugging

    const dom = new JSDOM(html);
    const document = dom.window.document;

    const Li = document.querySelectorAll('li');
    const arrayList = Array.from(Li);

    const filteredNews = [];

    arrayList.forEach((element)=> {
      const headingEl = element.querySelector('[data-testid="Heading"]')?.textContent;
      const image = element.querySelector('img')?.src;
      const description = element.querySelector('[data-testid="Description"]')?.textContent;
      const articleLink = element.querySelector('[data-testid="Heading"]')?.href;    
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
    console.log(`✅ TOI JSON file saved at ${filePath}`);

    return filteredNews;

  } catch (error) {
    console.error('❌ Error fetching or parsing the page:', error.message);
  }
};



const saveNewsApiCall = async (category, brodcaster, news) => {
  try {
    if(news.length > 9 ){
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





const init = async () => {
  for (let i = 0; i < newsTopicArr.length; i++) {
  await fetchAndExtractGuardianArticles('https://www.theguardian.com', newsTopicArr[i])
  await fetchAndExtractBBCArticles('https://www.bbc.com', newsTopicArr[i]);
  await fetchAndExtractCNNArticles('https://edition.cnn.com', newsTopicArr[i])
  await fetchAndExtractTOIrticles('https://timesofindia.indiatimes.com', newsTopicArr[i])
  await fetchAndExtractReutersrticles('https://www.reuters.com', newsTopicArr[i])
  }

}

  
init()

